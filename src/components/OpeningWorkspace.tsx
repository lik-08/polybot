'use client';
import {useMemo,useState,type FormEvent} from 'react';
import {analyzeOpening,parseOpening,type OpeningSnapshot} from '@/lib/opening.mjs';
import {dollars} from '@/lib/demo';

const blank=():OpeningSnapshot=>({version:1,kind:'opening-snapshot',asOfDate:null,source:'Manual opening snapshot',reportedAccountValue:null,cash:null,holdings:[]});
const amount=(value:number|null)=>value===null?'Unknown':dollars(value);
const problem=(error:unknown)=>error instanceof Error?error.message:'Snapshot could not be processed.';
const optionalNumber=(value:FormDataEntryValue|null)=>value===null||String(value).trim()===''?null:Number(value);
export default function OpeningWorkspace({onExit}:{onExit:()=>void}){
 const [doc,setDoc]=useState<OpeningSnapshot>(blank),[raw,setRaw]=useState(''),[pending,setPending]=useState<OpeningSnapshot|null>(null),[notice,setNotice]=useState('');
 const report=useMemo(()=>analyzeOpening(doc),[doc]);
 function validate(next:OpeningSnapshot){return parseOpening(JSON.stringify(next))}
 function review(){try{setPending(parseOpening(raw));setNotice('Snapshot validated. Review it below before applying.')}catch(error){setPending(null);setNotice(problem(error))}}
 function updateSummary(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const data=new FormData(event.currentTarget);
  try{setDoc(validate({...doc,asOfDate:String(data.get('as-of')??'')||null,cash:optionalNumber(data.get('cash')),reportedAccountValue:optionalNumber(data.get('reported'))}));setPending(null);setNotice('Summary updated from your entries. Unknown history remains unknown.')}catch(error){setNotice(problem(error))}
 }
 function updateHolding(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget,data=new FormData(form);
  try{const symbol=String(data.get('symbol')??'').trim().toUpperCase();
   const holding={symbol,quantity:optionalNumber(data.get('quantity')),displayedValue:optionalNumber(data.get('displayed-value')),costBasis:optionalNumber(data.get('basis'))};
   setDoc(validate({...doc,holdings:[...doc.holdings.filter(row=>row.symbol!==symbol),holding]}));setPending(null);form.reset();setNotice('Snapshot holding added or replaced. This records an observation, not a trade.');
  }catch(error){setNotice(problem(error))}
 }
 function exportSnapshot(){
  const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='polybot-private-opening.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <section className="portfolio-room manual-workspace" aria-label="Opening portfolio snapshot">
  <header className="room-header"><button className="back" onClick={onExit}>← City</button><div className="brand-small">POLYBOT / OPENING SNAPSHOT</div><div className="state">ENTERED OBSERVATIONS · NOT LIVE</div></header>
  <p>An opening snapshot records the shares you can verify now without inventing past trades or cost basis. It stays separate from the complete event ledger.</p>
  <div className="metric-top"><div><div className="eyebrow">REPORTED ACCOUNT BALANCE · USD</div><div className="big-number">{amount(doc.reportedAccountValue)}</div><p>{doc.asOfDate?'Observation date: '+doc.asOfDate:'Observation date unknown'} · {doc.source}</p></div><span className={report.reconciled?'positive':'negative'}>{report.reconciled?'Dollar totals reconciled':'Reconciliation incomplete'}</span></div>
  <div className="ledger-metrics"><div><span>Listed holdings value</span><strong>{amount(report.listedHoldingsValue)}</strong></div><div><span>Confirmed brokerage cash</span><strong>{amount(doc.cash)}</strong></div><div><span>Unexplained difference · not cash</span><strong>{amount(report.unreconciled)}</strong></div><div><span>Listed positions</span><strong>{report.positionCount}</strong></div></div>
  <p className="micro-note">An unexplained difference can include missing holdings or cash. It is never automatically assigned to cash. Reconciled dollar totals do not verify quantities, cost basis, completeness of transaction history or performance.</p>
  <p className="negative">{report.missing.join(' · ')}</p>
  <div className="ledger-metrics"><div><span>Investment gain</span><strong>Unavailable</strong></div><div><span>Historical return</span><strong>Unavailable</strong></div><div><span>Account balance growth</span><strong>Unavailable</strong></div><div><span>Cost-basis history</span><strong>Not inferred</strong></div></div>
  <p>Balance growth and investment performance will be kept separate. This snapshot alone cannot calculate either historical series. Pending orders and incomplete transaction screenshots are not counted as completed ledger events.</p>
  <div className="workspace-actions"><button className="secondary" onClick={exportSnapshot}>Export private snapshot</button><span>Session only. Export a backup before closing or reloading.</span></div>
  <p role="status" aria-live="polite" className="workspace-notice">{notice}</p>
  <section className="insight-panel"><h2>Observed holdings</h2><div className="table-scroll"><table><thead><tr><th>Ticker</th><th>Exact shares</th><th>Displayed value · USD</th><th>Total cost basis · USD</th></tr></thead><tbody>{doc.holdings.map(row=><tr key={row.symbol}><th>{row.symbol}</th><td>{row.quantity===null?'Unknown':row.quantity.toString()}</td><td>{amount(row.displayedValue)}</td><td>{amount(row.costBasis)}</td></tr>)}</tbody></table></div>{!doc.holdings.length&&<p>No holdings imported. No demonstration holdings have been added.</p>}</section>
  <section className="insight-panel"><h2>Import an opening snapshot</h2><p>Only versioned opening-snapshot JSON is accepted here. Your full event-ledger backups belong in the manual-records tab. Files stay on this device; nothing is uploaded to a server.</p>
   <label className="opening-file">Choose opening snapshot<input type="file" accept=".json,application/json" onChange={async event=>{const file=event.target.files?.[0];setPending(null);if(!file)return;if(file.size>512*1024){setNotice('File exceeds 512 KB.');return}try{setRaw(await file.text());setNotice('Private file loaded locally. Review before applying.')}catch{setNotice('File could not be read.')}}}/></label>
   <label className="opening-json">Opening snapshot JSON<textarea rows={5} spellCheck={false} maxLength={512*1024} value={raw} onChange={event=>{setRaw(event.target.value);setPending(null)}}/></label>
   <button className="secondary" onClick={review}>Review opening snapshot</button>
   {pending&&<div className="review-box"><p>Replace the opening snapshot with {pending.holdings.length} listed positions from {pending.source}? Reported account balance: {amount(pending.reportedAccountValue)}. Date: {pending.asOfDate??'unknown'}. Cash: {amount(pending.cash)}. This does not change your event ledger.</p><button className="primary" onClick={()=>{setDoc(pending);setPending(null);setRaw('');setNotice('Reviewed opening snapshot applied. Missing data remains unknown. Export a private backup before closing.')}}>Apply opening snapshot</button> <button className="secondary" onClick={()=>setPending(null)}>Cancel snapshot import</button></div>}
  </section>
  <div className="insights"><section className="insight-panel"><h2>Confirm summary details</h2><p>Only enter values you can verify. Blank means unknown. Updating a summary never creates a deposit, trade or investment gain.</p><form className="ledger-form" key={JSON.stringify([doc.asOfDate,doc.cash,doc.reportedAccountValue])} onSubmit={updateSummary}><label>Observation date<input name="as-of" type="date" defaultValue={doc.asOfDate??''}/></label><label>Confirmed brokerage cash · USD<input name="cash" type="number" min="0" step="any" defaultValue={doc.cash??''}/></label><label>Reported account balance · USD<input name="reported" type="number" min="0" step="any" defaultValue={doc.reportedAccountValue??''}/></label><button className="primary" type="submit">Save confirmed summary</button></form></section>
  <section className="insight-panel"><h2>Add or correct a holding</h2><p>Entering an existing ticker replaces that row. Re-enter its known fields; blank values become unknown. GOOG and GOOGL remain different securities.</p><form className="ledger-form" onSubmit={updateHolding}><label>Ticker<input name="symbol" required maxLength={16} autoComplete="off"/></label><label>Exact shares (optional)<input name="quantity" type="number" min="0" step="any"/></label><label>Displayed holding value · USD (optional)<input name="displayed-value" type="number" min="0" step="any"/></label><label>Total cost basis · USD (optional)<input name="basis" type="number" min="0" step="any"/></label><button className="primary" type="submit">Save snapshot holding</button></form></section></div>
 </section>;
}
