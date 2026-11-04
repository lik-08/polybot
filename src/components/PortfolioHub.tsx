'use client';
import {useState} from 'react';
import PortfolioRoom from './PortfolioRoom';
import PortfolioWorkspace from './PortfolioWorkspace';

export default function PortfolioHub({onExit}:{onExit:()=>void}){
 const [demo,setDemo]=useState(false);
 return <><nav className="workspace-mode" aria-label="Portfolio data mode">
  <button aria-pressed={!demo} onClick={()=>setDemo(false)}>My portfolio · manual records</button>
  <button aria-pressed={demo} onClick={()=>setDemo(true)}>Explore synthetic demo</button>
 </nav><div hidden={demo}><PortfolioWorkspace onExit={onExit}/></div>{demo&&<PortfolioRoom onExit={onExit}/>}</>;
}
