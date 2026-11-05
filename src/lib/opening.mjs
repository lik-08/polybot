/** Offline opening observations only. No transaction, cost, cash or historical value is inferred. */
const MAX_BYTES=512*1024,MAX_HOLDINGS=100;
const own=(value,key)=>Object.hasOwn(value,key);
function fail(message){throw new Error(message)}
function record(value,label){
  if(value===null||typeof value!=='object'||(Object.getPrototypeOf(value)!==Object.prototype&&Object.getPrototypeOf(value)!==null))fail(`Invalid ${label}: expected an object`);
  if(Object.values(Object.getOwnPropertyDescriptors(value)).some(descriptor=>!own(descriptor,'value')))fail(`Invalid ${label}: accessors are unsupported`);
}
function fields(value,expected,label){
  record(value,label);
  if(Reflect.ownKeys(value).some(key=>typeof key!=='string'||!expected.includes(key))||expected.some(key=>!own(value,key)))fail(`Invalid ${label} fields`);
}
function observedNumber(value,label){
  if(value!==null&&(!Number.isFinite(value)||value<0))fail(`Invalid ${label}: use a finite nonnegative number or null`);
  return value;
}
function finite(value,label){if(!Number.isFinite(value))fail(`Opening snapshot ${label} overflow`);return value}
function ticker(value){
  if(typeof value!=='string')fail('Invalid holding symbol');
  const symbol=value.trim().toUpperCase();
  if(symbol.length>16||!(/^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)?$/).test(symbol))fail('Invalid holding symbol');
  return symbol;
}
function dateOnly(value){
  if(value===null)return null;
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))fail('Invalid as-of date: use YYYY-MM-DD or null');
  const [year,month,day]=value.split('-').map(Number);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1])fail('Invalid as-of calendar date');
  return value;
}
function boundedText(text){
  if(typeof text!=='string'||text.length>MAX_BYTES||new TextEncoder().encode(text).byteLength>MAX_BYTES)fail('Opening snapshot exceeds 512 KB or is not text');
}
function normalize(document){
  fields(document,['version','kind','asOfDate','source','reportedAccountValue','cash','holdings'],'opening snapshot');
  if(document.version!==1||document.kind!=='opening-snapshot')fail('Unsupported opening snapshot version or kind');
  if(typeof document.source!=='string'||document.source.length>256||!document.source.trim()||/[\u0000-\u001f\u007f]/.test(document.source))fail('Invalid opening source: use a label of 1–256 characters');
  if(!Array.isArray(document.holdings)||document.holdings.length>MAX_HOLDINGS)fail('Opening snapshot supports at most 100 holdings');
  for(let i=0;i<document.holdings.length;i++){
    const descriptor=Object.getOwnPropertyDescriptor(document.holdings,String(i));
    if(!descriptor||!own(descriptor,'value'))fail('Invalid sparse or accessor holdings');
  }
  const seen=new Set();
  const holdings=document.holdings.map(holding=>{
    fields(holding,['symbol','quantity','displayedValue','costBasis'],'opening holding');
    const symbol=ticker(holding.symbol);
    if(seen.has(symbol))fail('Duplicate opening holding symbol');
    seen.add(symbol);
    return {symbol,quantity:observedNumber(holding.quantity,'quantity'),displayedValue:observedNumber(holding.displayedValue,'displayed value'),costBasis:observedNumber(holding.costBasis,'cost basis')};
  });
  const result={version:1,kind:'opening-snapshot',asOfDate:dateOnly(document.asOfDate),source:document.source.trim(),reportedAccountValue:observedNumber(document.reportedAccountValue,'reported account value'),cash:observedNumber(document.cash,'cash'),holdings};
  boundedText(JSON.stringify(result));
  return result;
}
// Compare the shortest decimal representations of the supplied numbers exactly.
// This makes a one-cent boundary reliable without multiplying large USD numbers
// by 100, overflowing, or widening the tolerance at very large account values.
function decimalUnits(value){
  const [coefficient,exponentText='0']=String(value).toLowerCase().split('e');
  const [whole,fraction='']=coefficient.split('.');
  return BigInt(whole+fraction)*10n**BigInt(324+Number(exponentText)-fraction.length);
}
function withinOneCent(reported,cash,holdings){
  let difference=decimalUnits(reported)-decimalUnits(cash);
  for(const holding of holdings)difference-=decimalUnits(holding.displayedValue);
  const magnitude=difference<0n?-difference:difference;
  return magnitude<=10n**322n;
}
function observedTotal(units,label){
  const value=finite(Number(units.toString()+'e-324'),label);
  const loss=decimalUnits(Math.abs(value))-(units<0n?-units:units);
  if((loss<0n?-loss:loss)>10n**322n)fail(`Opening snapshot ${label} exceeds supported dollar precision`);
  return value;
}
function analyzeCanonical(document){
  let listedUnits=0n,allValues=true;
  for(const holding of document.holdings){
    if(holding.displayedValue===null)allValues=false;
    else listedUnits+=decimalUnits(holding.displayedValue);
  }
  const listed=observedTotal(listedUnits,'holding total');
  const subtotalUnits=listedUnits+decimalUnits(document.cash??0);
  const partialSubtotal=observedTotal(subtotalUnits,'known subtotal');
  const unreconciled=document.reportedAccountValue===null?null:observedTotal(decimalUnits(document.reportedAccountValue)-subtotalUnits,'residual');
  const missing=[];
  if(document.asOfDate===null)missing.push('Missing as-of date');
  if(document.reportedAccountValue===null)missing.push('Missing reported account value');
  if(document.cash===null)missing.push('Missing cash');
  if(!allValues)missing.push('Missing displayed holding values');
  if(document.holdings.some(holding=>holding.quantity===null))missing.push('Missing quantities');
  if(document.holdings.some(holding=>holding.costBasis===null))missing.push('Missing cost basis');
  const complete=allValues&&document.cash!==null&&document.reportedAccountValue!==null;
  return {listedHoldingsValue:allValues?listed:null,knownSubtotal:allValues&&document.cash!==null?partialSubtotal:null,unreconciled,reconciled:complete&&withinOneCent(document.reportedAccountValue,document.cash,document.holdings),missing,positionCount:document.holdings.length};
}
/** Validate and retain observations; an unknown date remains unknown. */
export function parseOpening(text){
  boundedText(text);let document;
  try{document=JSON.parse(text)}catch{fail('Invalid opening snapshot JSON')}
  const canonical=normalize(document);analyzeCanonical(canonical);return canonical;
}
/** Residual against partial observations is unexplained value, never inferred cash. */
export function analyzeOpening(document){return analyzeCanonical(normalize(document))}
