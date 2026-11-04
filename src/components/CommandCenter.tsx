'use client';
import {useState} from 'react';
import HolographicScene from '@/components/HolographicScene';
import PortfolioHub from '@/components/PortfolioHub';
const modules=['Command Deck','Stock Intel','Portfolio','BTC Terminal','Home Control'];
export default function CommandCenter(){
 const [module,setModule]=useState(0),[entered,setEntered]=useState(false),[lowGraphics,setLowGraphics]=useState(false);
 const enter=()=>{setEntered(true);setModule(2)};
 return <main className="command-center">
  <aside className="sidebar"><div className="brand">POLYBOT <small>HOLOGRAPHIC COMMAND CENTER</small></div>
   <nav aria-label="Command modules">{modules.map((name,index)=><button key={name} className={module===index?'active':''} aria-current={module===index?'page':undefined} onClick={()=>{setModule(index);setEntered(index===2)}}><span className="symbol">{['◈','◉','▤','⌁','◇'][index]}</span>{name}</button>)}</nav>
   <div className="side-note">Private manual portfolio records and a separate synthetic demo. Research, BTC and home integrations remain planned. Trading is disabled.</div>
  </aside>
  <section className="workspace"><header className="workspace-top"><div><div className="eyebrow">PERSONAL INTELLIGENCE SYSTEM / LOCAL WORKSPACE</div><h1>{entered?'Portfolio Analysis':'Your universe. One command center.'}</h1></div><span className="demo-tag">LOCAL WORKSPACE · LIVE FEED OFF</span></header>
   <div hidden={!entered}><PortfolioHub onExit={()=>{setEntered(false);setModule(0)}}/></div>
   {!entered&&<><section className="hero"><div className="eyebrow">3D CITY / SELECT A BUILDING</div>
    {module!==0&&<p className="module-notice">{modules[module]} is a planned integration. No account or live feed is connected. Explore the city or open your portfolio.</p>}
    {!lowGraphics?<HolographicScene onEnter={enter}/>:<div className="low-detail">Low-graphics mode enabled. Open the portfolio room from the button below.</div>}
    <div className="hero-controls"><button className="primary" onClick={enter}>Enter portfolio room</button><button className="secondary" onClick={()=>setLowGraphics(value=>!value)}>{lowGraphics?'Enable 3D city':'Low-graphics mode'}</button></div>
   </section><div className="tiles"><div><span>01</span><strong>Holographic navigation</strong><p>3D city and immersive portfolio surfaces</p></div><div><span>02</span><strong>Private portfolio ledger</strong><p>Exact shares, cash events and dated manual prices</p></div><div><span>03</span><strong>Explicit data provenance</strong><p>Manual records and synthetic demo stay separate</p></div></div></>}
  </section>
 </main>;
}
