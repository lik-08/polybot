'use client';
import {useState} from 'react';
import PortfolioRoom from './PortfolioRoom';
import PortfolioWorkspace from './PortfolioWorkspace';
import OpeningWorkspace from './OpeningWorkspace';

export default function PortfolioHub({onExit}:{onExit:()=>void}){
 const [mode,setMode]=useState<'opening'|'ledger'|'demo'>('opening');
 return <><nav className="workspace-mode" aria-label="Portfolio data mode">
  <button aria-pressed={mode==='opening'} onClick={()=>setMode('opening')}>Opening snapshot</button>
  <button aria-pressed={mode==='ledger'} onClick={()=>setMode('ledger')}>My portfolio · manual records</button>
  <button aria-pressed={mode==='demo'} onClick={()=>setMode('demo')}>Explore synthetic demo</button>
 </nav><div hidden={mode!=='opening'}><OpeningWorkspace onExit={onExit}/></div><div hidden={mode!=='ledger'}><PortfolioWorkspace onExit={onExit}/></div>{mode==='demo'&&<PortfolioRoom onExit={onExit}/>}</>;
}
