'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {AreaSeries, ColorType, CrosshairMode, createChart, type UTCTimestamp} from 'lightweight-charts';
import {demoSeries,dollars,type Range} from '@/lib/demo';
export default function PortfolioChart({range,selectedIndex,onPick}:{range:Range,selectedIndex:number,onPick:(index:number)=>void}){
 const holder=useRef<HTMLDivElement>(null);
 const moveCrosshair=useRef<((index:number)=>void)|null>(null);
 const [hovered,setHovered]=useState<number|null>(null);
 const points=useMemo(()=>demoSeries(range),[range]);
 useEffect(()=>{
  if(!holder.current)return;
  const container=holder.current;
  const chart=createChart(container,{autoSize:true,height:220,
    layout:{background:{type:ColorType.Solid,color:'transparent'},textColor:'#a6d4dd',attributionLogo:true},
    grid:{vertLines:{color:'#184454'},horzLines:{color:'#184454'}},
    crosshair:{mode:CrosshairMode.Normal},
    rightPriceScale:{borderColor:'#28515e'},timeScale:{borderColor:'#28515e',timeVisible:true,secondsVisible:range==='1m'||range==='5m'},
  });
  const series=chart.addSeries(AreaSeries,{lineColor:'#35e7be',topColor:'rgba(48,232,184,.32)',bottomColor:'rgba(48,232,184,.02)',lineWidth:3,
    priceFormat:{type:'price',precision:2,minMove:.01}});
  series.setData(points.map(p=>({time:p.time as UTCTimestamp,value:p.value})));
  chart.timeScale().fitContent();
  const handler=(param:{time?:unknown})=>{
   if(typeof param.time==='number'){
    const i=points.findIndex(p=>p.time===param.time);
    if(i>=0){onPick(i);setHovered(i)}
   }
  };
  chart.subscribeCrosshairMove(handler);
  moveCrosshair.current=index=>{const point=points[index];if(point)chart.setCrosshairPosition(point.value,point.time as UTCTimestamp,series)};
  return()=>{moveCrosshair.current=null;chart.unsubscribeCrosshairMove(handler);chart.remove()};
   },[range,points,onPick]);
 return <div className="chart-shell"><div ref={holder} className="price-chart" aria-label={`Simulated portfolio chart for ${range}`}/><div className="chart-foot">{hovered===null?'Hover, touch, or drag the graph to inspect a time':'Selected '+dollars(points[selectedIndex].value)}</div><label className="keyboard-label" htmlFor="portfolio-scrubber">Keyboard/touch precise scrub</label><input id="portfolio-scrubber" type="range" min={0} max={points.length-1} value={selectedIndex} aria-valuetext={dollars(points[selectedIndex].value)} onChange={e=>{const i=Number(e.target.value);setHovered(i);onPick(i);moveCrosshair.current?.(i)}}/></div>
}
