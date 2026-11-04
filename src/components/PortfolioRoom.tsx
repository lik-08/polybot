'use client';
import {useMemo,useState} from 'react';
import PortfolioChart from '@/components/PortfolioChart';
import {GROUPS,RANGES,demoSeries,dollars,type Range} from '@/lib/demo';
import {ArrowLeft,Activity,Layers,ShieldCheck,Clock3} from 'lucide-react';
export default function PortfolioRoom({onExit}:{onExit:()=>void}){
 const [range,setRange]=useState<Range>('1D');const [selected,setSelected]=useState(100);
 const series=useMemo(()=>demoSeries(range),[range]);
 const pick=series[Math.min(selected,series.length-1)],start=series[0],delta=pick.value-start.value;
 const high=series.reduce((a,b)=>a.value>b.value?a:b),low=series.reduce((a,b)=>a.value<b.value?a:b);
 const stamp=(sec:number)=>new Date(sec*1000).toLocaleString('en-US',{timeZone:'America/Detroit',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 const contributions=GROUPS.map((g,i)=>({...g,contribution:pick.groups[i]})).sort((a,b)=>b.contribution-a.contribution);
 return <section className="portfolio-room" aria-label="Holographic portfolio analysis room">
  <header className="room-header"><button onClick={onExit} className="back"><ArrowLeft size={16}/> City</button><div className="brand-small">POLYBOT / PORTFOLIO ROOM</div><div className="state">● SYNTHETIC DEMO · NOT LIVE</div></header>
  <div className="metric-top"><div><div className="eyebrow">ILLUSTRATIVE ACCOUNT VALUE</div><div className="big-number">{dollars(pick.value)}</div><div className={delta>=0?'positive':'negative'}>{delta>=0?'+':''}{dollars(delta)} · selected interval</div></div><div className="mini-metrics"><div><span>Today P&amp;L</span><strong>SIMULATED</strong></div><div><span>Month P&amp;L</span><strong>SIMULATED</strong></div></div></div>
  <nav className="ranges" aria-label="Portfolio chart timeframes">{RANGES.map(r=><button key={r} className={range===r?'active':''} aria-pressed={range===r} onClick={()=>{setRange(r);setSelected(r==='1m'?60:100)}}>{r}</button>)}</nav>
  <PortfolioChart range={range} onPick={setSelected}/>
  <div className="range-extremes"><div><Clock3 size={15}/> {stamp(pick.time)} ET</div><div className="positive">HIGH {dollars(high.value)} · {stamp(high.time)}</div><div className="negative">LOW {dollars(low.value)} · {stamp(low.time)}</div></div>
  <div className="insights"><section className="insight-panel"><h3><Activity size={16}/> Simulated contribution</h3><p>Actual values require fractional shares, transaction history and verified quote snapshots.</p>{contributions.map(g=><div className="contributor" key={g.name}><span style={{color:g.color}}>{g.name}</span><strong className={g.contribution>=0?'positive':'negative'}>{g.contribution>=0?'+':''}{dollars(g.contribution)}</strong></div>)}</section><section className="insight-panel"><h3><Layers size={16}/> Diversification intelligence</h3><p>ETFs will be tracked separately from individual-stock groups. Economic-sector look-through will reveal overlaps with positions you own directly.</p><h3><ShieldCheck size={16}/> Accounting safeguards</h3><p>External deposits and withdrawals will never be presented as market returns. Sales inside an account are not cash withdrawals.</p><div className="micro-note">Live market, Step read-only sync, tax lots, and Supabase history are NOT connected.</div></section></div>
 </section>
}