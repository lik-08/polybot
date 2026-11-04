/** Offline manual USD ledger. Average cost is an accounting estimate, not tax-lot accounting. */
const MAX_BYTES=512*1024,MAX_EVENTS=1000,MAX_VALUATIONS=500,MAX_SYMBOLS=100;
const own=(value,key)=>Object.hasOwn(value,key);
function fail(message){throw new Error(message)}
function record(value){
  return value!==null&&typeof value==='object'&&
    (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
}
function object(value,label){
  if(!record(value))fail(`Invalid ${label}: expected an object`);
  if(Object.values(Object.getOwnPropertyDescriptors(value)).some(d=>!own(d,'value')))fail(`Invalid ${label}: accessors are unsupported`);
}
function keys(value,allowed,required,label){
  object(value,label);
  if(Reflect.ownKeys(value).some(key=>typeof key!=='string'||!allowed.includes(key))||required.some(key=>!own(value,key)))fail(`Invalid ${label} fields`);
}
function finite(value,label){if(!Number.isFinite(value))fail(`Invalid or overflowing ${label}`);return value}
function nonnegative(value,label){finite(value,label);if(value<0)fail(`Invalid negative ${label}`);return value}
function positive(value,label){nonnegative(value,label);if(value===0)fail(`Invalid zero ${label}`);return value}
function add(a,b,label){return finite(a+b,label)}
function multiply(a,b,label){return finite(a*b,label)}
function roundingTolerance(a,b){return Number.EPSILON*Math.max(Math.abs(a),Math.abs(b))*8}
function subtractNonnegative(a,b,label){
  const result=finite(a-b,label);
  if(result<0){if(-result>roundingTolerance(a,b))fail(`Insufficient ${label}`);return 0}
  return result;
}
function timestamp(value){
  if(typeof value!=='string')fail('Invalid timestamp: an ISO timestamp with an explicit zone is required');
  const match=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if(!match)fail('Invalid timestamp: use ISO seconds and Z or an explicit offset');
  const [,yearText,monthText,dayText,hourText,minuteText,secondText,,zone,,offsetHour,offsetMinute]=match;
  const year=Number(yearText),month=Number(monthText),day=Number(dayText);
  const leap=year%4===0&&(year%100!==0||year%400===0);
  const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
  if(month<1||month>12||day<1||day>days[month-1]||Number(hourText)>23||Number(minuteText)>59||Number(secondText)>59||(zone!=='Z'&&(Number(offsetHour)>23||Number(offsetMinute)>59)))fail('Invalid calendar timestamp');
  const ms=Date.parse(value);
  if(!Number.isFinite(ms))fail('Invalid timestamp');
  const canonical=new Date(ms).toISOString();
  if(canonical.length!==24)fail('Timestamp is outside the supported calendar');
  return canonical;
}
function symbol(value){
  if(typeof value!=='string')fail('Invalid symbol');
  const normalized=value.trim().toUpperCase();
  if(normalized.length>16||!(/^[A-Z][A-Z0-9]*(?:[.-][A-Z0-9]+)?$/).test(normalized))fail('Invalid symbol: use a USD ticker of at most 16 characters');
  return normalized;
}
function boundedArray(value,limit,label){
  if(!Array.isArray(value)||value.length>limit)fail(`Invalid ${label}: maximum ${limit}`);
  for(let i=0;i<value.length;i++)if(!own(value,i))fail(`Invalid sparse ${label}`);
}
function boundedText(text){
  if(typeof text!=='string'||text.length>MAX_BYTES||new TextEncoder().encode(text).byteLength>MAX_BYTES)fail('Ledger file exceeds 512 KB or is not text');
}
function normalize(document){
  keys(document,['version','events','valuations'],['version','events','valuations'],'ledger');
  if(document.version!==1)fail('Unsupported ledger version');
  boundedArray(document.events,MAX_EVENTS,'events');
  boundedArray(document.valuations,MAX_VALUATIONS,'valuations');
  const ids=new Set(),symbols=new Set();
  const register=value=>{const result=symbol(value);symbols.add(result);if(symbols.size>MAX_SYMBOLS)fail('Ledger exceeds 100 symbols');return result};
  const events=document.events.map(event=>{
    object(event,'event');
    const base=['id','at','kind'];
    const fields={deposit:['amount'],withdrawal:['amount'],buy:['symbol','quantity','price','fee'],sell:['symbol','quantity','price','fee'],dividend:['amount','symbol'],fee:['amount'],split:['symbol','factor']};
    if(typeof event.kind!=='string'||!own(fields,event.kind))fail('Unsupported ledger event kind');
    const extra=fields[event.kind],required=extra.filter(key=>key!=='fee'&&!(event.kind==='dividend'&&key==='symbol'));
    keys(event,[...base,...extra],[...base,...required],'event');
    if(typeof event.id!=='string'||event.id.length<1||event.id.length>128||event.id!==event.id.trim()||/[\u0000-\u001f\u007f]/.test(event.id))fail('Invalid event ID');
    if(ids.has(event.id))fail('Duplicate event ID');
    ids.add(event.id);
    const result={id:event.id,at:timestamp(event.at),kind:event.kind};
    if(own(event,'symbol'))result.symbol=register(event.symbol);
    if(own(event,'quantity'))result.quantity=positive(event.quantity,'quantity');
    if(own(event,'price'))result.price=nonnegative(event.price,'price');
    if(own(event,'amount'))result.amount=nonnegative(event.amount,'amount');
    if(own(event,'fee'))result.fee=nonnegative(event.fee,'fee');
    if(own(event,'factor'))result.factor=positive(event.factor,'split factor');
    return result;
  }).sort((a,b)=>a.at.localeCompare(b.at));
  const valuationTimes=new Set();
  const valuations=document.valuations.map(valuation=>{
    keys(valuation,['at','prices'],['at','prices'],'valuation');
    const at=timestamp(valuation.at);
    if(valuationTimes.has(at))fail('Duplicate valuation timestamp');
    valuationTimes.add(at);
    object(valuation.prices,'valuation prices');
    if(Reflect.ownKeys(valuation.prices).length>MAX_SYMBOLS)fail('Valuation exceeds 100 symbols');
    const prices=Object.create(null);
    for(const key of Reflect.ownKeys(valuation.prices)){
      const ticker=register(key);
      if(own(prices,ticker))fail('Duplicate normalized valuation symbol');
      prices[ticker]=nonnegative(valuation.prices[key],'valuation price');
    }
    return {at,prices:Object.fromEntries(Object.entries(prices).sort(([a],[b])=>a.localeCompare(b)))};
  }).sort((a,b)=>a.at.localeCompare(b.at));
  const result={version:1,events,valuations};
  boundedText(JSON.stringify(result));
  return result;
}
function emptyState(){return {cash:0,deposits:0,withdrawals:0,saleProceeds:0,dividends:0,fees:0,realized:0,positions:new Map()}}
function apply(state,event){
  const amount=event.amount??0,fee=event.fee??0;
  if(event.kind==='deposit'){
    state.cash=add(state.cash,amount,'cash');state.deposits=add(state.deposits,amount,'deposits');
  }else if(event.kind==='withdrawal'){
    state.cash=subtractNonnegative(state.cash,amount,'cash');state.withdrawals=add(state.withdrawals,amount,'withdrawals');
  }else if(event.kind==='dividend'){
    state.cash=add(state.cash,amount,'cash');state.dividends=add(state.dividends,amount,'dividends');
  }else if(event.kind==='fee'){
    state.cash=subtractNonnegative(state.cash,amount,'cash');state.fees=add(state.fees,amount,'fees');
  }else if(event.kind==='buy'){
    const cost=add(multiply(event.quantity,event.price,'purchase value'),fee,'purchase cost');
    state.cash=subtractNonnegative(state.cash,cost,'cash');
    const old=state.positions.get(event.symbol)??{quantity:0,costBasis:0};
    state.positions.set(event.symbol,{quantity:add(old.quantity,event.quantity,'position quantity'),costBasis:add(old.costBasis,cost,'cost basis')});
    state.fees=add(state.fees,fee,'fees');
  }else if(event.kind==='sell'){
    const old=state.positions.get(event.symbol);
    if(!old)fail('Cannot sell an unheld symbol');
    const difference=old.quantity-event.quantity;
    if(difference<0&&-difference>roundingTolerance(old.quantity,event.quantity))fail('Cannot sell more shares than held');
    const closes=Math.abs(difference)<=roundingTolerance(old.quantity,event.quantity);
    const released=closes?old.costBasis:multiply(old.costBasis,event.quantity/old.quantity,'released cost basis');
    const proceeds=multiply(event.quantity,event.price,'sale proceeds');
    const net=finite(proceeds-fee,'net sale proceeds');
    state.cash=net<0?subtractNonnegative(state.cash,-net,'cash'):add(state.cash,net,'cash');
    state.realized=add(state.realized,finite(net-released,'realized gain'),'realized gains');
    state.saleProceeds=add(state.saleProceeds,proceeds,'sale proceeds');state.fees=add(state.fees,fee,'fees');
    if(closes)state.positions.delete(event.symbol);
    else state.positions.set(event.symbol,{quantity:positive(difference,'remaining quantity'),costBasis:subtractNonnegative(old.costBasis,released,'remaining cost basis')});
  }else if(event.kind==='split'){
    const old=state.positions.get(event.symbol);
    if(!old)fail('Cannot split an unheld symbol');
    state.positions.set(event.symbol,{quantity:positive(multiply(old.quantity,event.factor,'split quantity'),'split quantity'),costBasis:old.costBasis});
  }
}
function analyzeCanonical(document){
  const current=emptyState();
  for(const event of document.events)apply(current,event);
  const historical=emptyState();let eventIndex=0;
  const snapshots=document.valuations.map(valuation=>{
    while(eventIndex<document.events.length&&document.events[eventIndex].at<=valuation.at)apply(historical,document.events[eventIndex++]);
    const missing=[];let value=historical.cash,unrealized=0;
    for(const [ticker,position] of historical.positions){
      if(!own(valuation.prices,ticker)){missing.push(ticker);continue}
      const marketValue=multiply(position.quantity,valuation.prices[ticker],'position market value');
      value=add(value,marketValue,'snapshot value');
      unrealized=add(unrealized,finite(marketValue-position.costBasis,'position unrealized gain'),'unrealized gains');
    }
    missing.sort();const complete=missing.length===0;
    return {at:valuation.at,value:complete?value:null,cash:historical.cash,unrealized:complete?unrealized:null,complete,missing};
  });
  return {cash:current.cash,deposits:current.deposits,withdrawals:current.withdrawals,saleProceeds:current.saleProceeds,dividends:current.dividends,fees:current.fees,realized:current.realized,
    positions:[...current.positions].sort(([a],[b])=>a.localeCompare(b)).map(([ticker,position])=>({symbol:ticker,...position})),snapshots};
}
/** Parse, canonicalize and fully replay an untrusted manual import without storage or network access. */
export function parseLedger(text){
  boundedText(text);
  let document;
  try{document=JSON.parse(text)}catch{fail('Invalid ledger JSON')}
  const canonical=normalize(document);analyzeCanonical(canonical);return canonical;
}
/** Revalidate even programmatically supplied documents. No earlier price fills a missing valuation. */
export function analyzeLedger(document){return analyzeCanonical(normalize(document))}
