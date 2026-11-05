/** Intentionally synthetic data. NEVER label as an actual account/quote. */
export type Range = '1m'|'5m'|'15m'|'30m'|'1h'|'1D'|'1W'|'1M'|'3M'|'1Y'|'5Y'|'ALL';
export const RANGES: Range[] = ['1m','5m','15m','30m','1h','1D','1W','1M','3M','1Y','5Y','ALL'];
export type Point = { time:number; value:number; groups:[number,number,number,number] };
const durations:Record<Range,number> = {
 '1m':60_000,'5m':300_000,'15m':900_000,'30m':1_800_000,'1h':3_600_000,
 '1D':23_400_000,'1W':604_800_000,'1M':2_592_000_000,'3M':7_776_000_000,'1Y':31_536_000_000,'5Y':157_680_000_000,'ALL':189_216_000_000
};
export const GROUPS=[
 {name:'AI & technology',color:'#71c9ff'},
 {name:'ETF foundation',color:'#34e9bc'},
 {name:'Power & grid',color:'#f5b968'},
 {name:'Other holdings',color:'#bd9bff'}
];
const end=Date.parse('2026-11-04T20:00:00.000Z');
export function demoSeries(range:Range):Point[]{
 const duration=durations[range];
 const extent=range==='1m'?2:range==='5m'?4:range==='15m'?7:range==='30m'?11:range==='1h'?15:range==='1D'?31:range==='1W'?55:range==='1M'?90:range==='3M'?160:range==='1Y'?320:760;
 // Lightweight Charts uses integer-second timestamps; 1m has only 61 distinct seconds.
 const count=range==='1m'?61:101;
 return Array.from({length:count},(_,i)=>{
  const t=i/(count-1);
  const parts:[number,number,number,number]=[
   extent*(t*.52+Math.sin(t*20)*.13+Math.sin(t*47)*.035),
   extent*(t*.30+Math.cos(t*11)*.075-Math.cos(0)*.075),
   extent*(t*.18+Math.sin(t*15+1)*.09-Math.sin(1)*.09),
   extent*(-t*.15+Math.sin(t*19+2)*.06-Math.sin(2)*.06)
  ];
  return {time:Math.round((end-duration+duration*t)/1000),value:10000-extent*.72+parts.reduce((a,b)=>a+b,0),groups:parts};
 });
}
export function dollars(n:number){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n)}