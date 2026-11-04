'use client';
import {useMemo,useRef,useState,type FormEvent} from 'react';
import {analyzeLedger,parseLedger,type LedgerDocument,type LedgerEvent} from '@/lib/ledger.mjs';
import {dollars} from '@/lib/demo';

const KEY='polybot.manual-ledger.v1';
const empty=():LedgerDocument=>({version:1,events:[],valuations:[]});
const stamp=(value:string)=>new Date(value).toLocaleString('en-US',{timeZone:'America/Detroit',year:'numeric',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit'});
const enteredTime=(data:FormData,name:string)=>{const text=String(data.get(name)??'');return text?new Date(text).toISOString():new Date().toISOString()};
const message=(error:unknown)=>error instanceof Error?error.message:'The records could not be processed.';
function initialWorkspace(){
 if(typeof window==='undefined')return {doc:empty(),remember:false,stored:null as string|null,notice:''};
 try{const stored=localStorage.getItem(KEY);return stored?{doc:parseLedger(stored),remember:true,stored,notice:'Restored records saved on this device.'}:{doc:empty(),remember:false,stored:null,notice:''}}
 catch{return {doc:empty(),remember:false,stored:null,notice:'Saved records could not be loaded. The saved copy has been left untouched.'}}
}
function download(doc:LedgerDocument){
 const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='polybot-private-ledger.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function PortfolioWorkspace({onExit}:{onExit:()=>void}){
 const [initial]=useState(initialWorkspace);
 const [doc,setDoc]=useState(initial.doc),[remember,setRemember]=useState(initial.remember),[notice,setNotice]=useState(initial.notice);
 const stored=useRef(initial.stored);
 const [raw,setRaw]=useState(''),[pending,setPending]=useState<LedgerDocument|null>(null),[clearReview,setClearReview]=useState(false);
 const [kind,setKind]=useState<LedgerEvent['kind']>('deposit');
 const analysis=useMemo(()=>analyzeLedger(doc),[doc]);
 const latest=analysis.snapshots.at(-1);
 const atSnapshot=useMemo(()=>latest?analyzeLedger({...doc,events:doc.events.filter(event=>event.at<=latest.at),valuations:[]}):null,[doc,latest]);
 const calculatedGain=latest?.complete&&latest.value!==null&&atSnapshot?latest.value-atSnapshot.deposits+atSnapshot.withdrawals:null;
 const gain=calculatedGain!==null&&Number.isFinite(calculatedGain)?calculatedGain:null;
 const basisTotal=analysis.positions.reduce((sum,position)=>sum+position.costBasis,0);
 function requireUnchangedStorage(){if(localStorage.getItem(KEY)!==stored.current)throw Error('Saved records changed in another tab. Export this tab before reloading.')}
 function accept(next:LedgerDocument,label:string){
  setDoc(next);setPending(null);setClearReview(false);
  if(remember){try{
   requireUnchangedStorage();
   const text=JSON.stringify(next);localStorage.setItem(KEY,text);stored.current=text;
   setNotice(label+' Saved on this device.');
  }catch(error){setRemember(false);setNotice(label+' Current changes are in this tab only. '+message(error))}}
  else setNotice(label+' Session only; export a backup or enable device storage.');
 }
 function review(){try{setPending(parseLedger(raw));setNotice('Import validated. Review the counts below before replacing your workspace.')}catch(error){setPending(null);setNotice(message(error))}}
 function addEvent(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget,data=new FormData(form);
  try{
   const row:Record<string,unknown>={id:crypto.randomUUID(),at:enteredTime(data,'event-at'),kind};
   if(['buy','sell','split'].includes(kind))row.symbol=String(data.get('symbol')).trim();
   if(['buy','sell'].includes(kind)){row.quantity=Number(data.get('quantity'));row.price=Number(data.get('price'));row.fee=Number(data.get('fee')||0)}
   else if(kind==='split')row.factor=Number(data.get('factor'));
   else row.amount=Number(data.get('amount'));
   accept(parseLedger(JSON.stringify({...doc,events:[...doc.events,row]})),'Event recorded.');setKind('deposit');form.reset();
  }catch(error){setNotice(message(error))}
 }
 function addValuation(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const data=new FormData(event.currentTarget);
  try{
   const prices:Record<string,number>={};
   for(const position of analysis.positions){const value=String(data.get('quote-'+position.symbol)??'').trim();if(value)prices[position.symbol]=Number(value)}
   const valuation={at:enteredTime(data,'valuation-at'),prices};
   accept(parseLedger(JSON.stringify({...doc,valuations:[...doc.valuations,valuation]})),'Manual valuation recorded.');
  }catch(error){setNotice(message(error))}
 }
 const trade=kind==='buy'||kind==='sell';
 return <section className="portfolio-room manual-workspace" aria-label="Private manual portfolio workspace">
  <header className="room-header"><button className="back" onClick={onExit}>← City</button><div className="brand-small">POLYBOT / MY PORTFOLIO</div><div className="state">MANUAL RECORDS · NOT LIVE</div></header>
  <p className="workspace-explanation">Your records stay in this browser. Nothing is sent to a broker or cloud service. Start with a deposit, record your trades, then enter dated prices. Use a complete history from inception for meaningful results.</p>
  <div className="metric-top"><div><div className="eyebrow">LAST ENTERED VALUATION · USD</div><div className="big-number">{latest?.value===null||!latest?'—':dollars(latest.value)}</div><p>{latest?stamp(latest.at)+' ET':'No price observations recorded.'}</p>{latest&&!latest.complete&&<p className="negative">Prices missing for {latest.missing.join(', ')}. No total has been substituted.</p>}</div><div className="mini-metrics"><div><span>Ledger cash</span><strong>{dollars(analysis.cash)}</strong></div><div><span>Open holdings</span><strong>{analysis.positions.length}</strong></div></div></div>
  <div className="ledger-metrics">
   {Object.entries({'External deposits':analysis.deposits,'External withdrawals':analysis.withdrawals,'Gross sale proceeds':analysis.saleProceeds,'Dividends':analysis.dividends,'Fees paid':analysis.fees,'Realized result (average cost)':analysis.realized}).map(([label,value])=><div key={label}><span>{label}</span><strong>{dollars(value)}</strong></div>)}
   <div><span>Unrealized at last valuation</span><strong>{latest?.unrealized==null?'Unavailable':dollars(latest.unrealized)}</strong></div>
   <div><span>Investment result at last valuation</span><strong>{gain===null?'Unavailable':dollars(gain)}</strong></div>
  </div>
  <p className="micro-note">Totals cover imported ledger history; valuation results stop at the displayed timestamp. Sales are internal cash changes. Realized result uses weighted average cost, not tax lots. Time-weighted returns, daily/monthly returns, sectors, benchmarks and ETF look-through remain unavailable without the supporting records.</p>
  <div className="workspace-actions"><button className="secondary" onClick={()=>download(doc)}>Export private backup</button><label><input type="checkbox" checked={remember} onChange={event=>{
   try{requireUnchangedStorage();if(event.target.checked){const text=JSON.stringify(doc);localStorage.setItem(KEY,text);stored.current=text;setRemember(true);setNotice('Device storage enabled. Keep exports as backups; browser storage is unencrypted.')}else{localStorage.removeItem(KEY);stored.current=null;setRemember(false);setNotice('Saved device copy removed. Current records remain in this tab.')}}catch(error){setNotice(message(error)+' No storage preference was changed; export a backup.')}
  }}/> Remember on this device (unencrypted)</label><button className="secondary" onClick={()=>setClearReview(true)}>Clear workspace…</button></div>
  {clearReview&&<div className="review-box" role="alert"><p>Clear all events and valuations from this tab and its saved device copy? Export a backup first.</p><button className="secondary" onClick={()=>setClearReview(false)}>Cancel</button> <button className="secondary" onClick={()=>{try{requireUnchangedStorage();localStorage.removeItem(KEY);stored.current=null;setRemember(false);setDoc(empty());setPending(null);setRaw('');setClearReview(false);setNotice('Workspace cleared.')}catch(error){setNotice(message(error)+' Workspace was not cleared.')}}}>Clear this workspace</button></div>}
  <p className="workspace-notice" role="status" aria-live="polite">{notice}</p>
  <div className="insights">
   <section className="insight-panel"><h2>Record an event</h2><form className="ledger-form" onSubmit={addEvent}>
    <label>Event type<select value={kind} onChange={event=>setKind(event.target.value as LedgerEvent['kind'])}>{['deposit','withdrawal','buy','sell','dividend','fee','split'].map(value=><option key={value} value={value}>{value}</option>)}</select></label>
    <label>Event time (optional; blank = now)<input name="event-at" type="datetime-local" step="1"/></label>
    {(trade||kind==='split')&&<label>Ticker<input name="symbol" required maxLength={20} placeholder="Ticker" autoComplete="off"/></label>}
    {trade?<><label>Exact shares<input name="quantity" type="number" min="0.000000000001" step="any" required/></label><label>Execution price per share · USD<input name="price" type="number" min="0" step="any" required/></label><label>Trade fee · USD<input name="fee" type="number" min="0" step="any" defaultValue="0"/></label></>:kind==='split'?<label>Split multiplier (2 for 2:1)<input name="factor" type="number" min="0.000000000001" step="any" required/></label>:<label>Amount · USD<input name="amount" type="number" min="0" step="any" required/></label>}
    <button className="primary" type="submit">Record event</button>
   </form><p>Recording a trade here only adds a private record. It never places an order.</p></section>
   <section className="insight-panel"><h2>Record manual prices</h2><form className="ledger-form" onSubmit={addValuation}>
    <label>Observation time (optional; blank = now)<input name="valuation-at" type="datetime-local" step="1"/></label>
    {analysis.positions.map(position=><label key={position.symbol}>{position.symbol} price per share · USD<input name={'quote-'+position.symbol} type="number" min="0" step="any" placeholder="Unknown if blank"/></label>)}
    <button className="primary" type="submit">Save dated valuation</button>
   </form><p>Entered times use this device’s time zone. Enter prices from that time. Blank prices stay unknown. Historical imports can include prices for positions held at that time.</p></section>
  </div>
  <section className="insight-panel"><h2>Holdings and entered cost basis</h2><div className="table-scroll"><table><thead><tr><th>Ticker</th><th>Exact shares</th><th>Total basis · USD</th><th>Basis weight</th></tr></thead><tbody>{analysis.positions.map(position=><tr key={position.symbol}><th>{position.symbol}</th><td>{position.quantity.toString()}</td><td>{dollars(position.costBasis)}</td><td>{Number.isFinite(basisTotal)&&basisTotal>0?(position.costBasis/basisTotal*100).toFixed(1)+'%':'Unavailable'}</td></tr>)}</tbody></table></div>{!analysis.positions.length&&<p>No holdings entered. No demonstration positions have been added.</p>}<p>Cost-basis allocation excludes cash and is not market-value allocation or economic-sector exposure.</p></section>
  <section className="insight-panel"><h2>Recorded valuations</h2><div className="table-scroll"><table><thead><tr><th>Observation · ET</th><th>Account value · USD</th><th>Cash · USD</th><th>Coverage</th></tr></thead><tbody>{analysis.snapshots.map(snapshot=><tr key={snapshot.at}><td>{stamp(snapshot.at)}</td><td>{snapshot.value===null?'Unavailable':dollars(snapshot.value)}</td><td>{dollars(snapshot.cash)}</td><td>{snapshot.complete?'All held symbols priced':'Missing '+snapshot.missing.join(', ')}</td></tr>)}</tbody></table></div>{!analysis.snapshots.length&&<p>No observations. Earlier history is never inferred from current holdings.</p>}</section>
  <details className="insight-panel"><summary>Import and review a private backup</summary><p>JSON backup, up to 512 KB. Replaces the workspace only after review. <a href="/manual-ledger-format" target="_blank" rel="noreferrer">View the import format</a>.</p>
   <label>Choose private ledger file<input type="file" accept=".json,application/json" onChange={async event=>{const file=event.target.files?.[0];if(!file)return;setPending(null);if(file.size>512*1024){setNotice('File exceeds 512 KB.');return}try{setRaw(await file.text());setNotice('File loaded locally. Select Review import to validate.')}catch{setNotice('File could not be read.')}}}/></label>
   <label>Portfolio JSON<textarea value={raw} onChange={event=>{setRaw(event.target.value);setPending(null)}} maxLength={512*1024} rows={6} spellCheck={false}/></label>
   <button className="secondary" onClick={review}>Review import</button>
   {pending&&<div className="review-box"><p>Replace this workspace with {pending.events.length} events and {pending.valuations.length} valuations? Amounts and prices remain user-entered, not independently verified.</p><button className="primary" onClick={()=>{accept(pending,'Reviewed import applied.');setRaw('')}}>Apply reviewed import</button> <button className="secondary" onClick={()=>setPending(null)}>Cancel import</button></div>}
  </details>
 </section>;
}
