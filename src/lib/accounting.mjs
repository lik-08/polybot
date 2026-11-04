/** Pure USD arithmetic primitives. Real accounts still require ledger reconciliation. */
function record(value){
  return value!==null&&typeof value==='object'&&
    (Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
}
function finiteResult(value){
  if(!Number.isFinite(value))throw Error('Financial calculation overflow');
  return value;
}
/** @param {{quantity:number,price:number}[]} holdings @param {number} cash */
export function accountValue(holdings,cash=0){
  if(!Array.isArray(holdings)||!Number.isFinite(cash))throw Error('Invalid account inputs');
  let total=cash;
  for(let i=0;i<holdings.length;i++){
    const p=holdings[i];
    if(!Object.hasOwn(holdings,i)||!record(p)||!Number.isFinite(p.price)||!Number.isFinite(p.quantity)||p.quantity<0||p.price<0)throw Error('Invalid holding');
    total=finiteResult(total+finiteResult(p.quantity*p.price));
  }
  return total;
}
/** External cash flows only: a sale within brokerage is not a withdrawal. */
/** @param {{start:number,end:number,deposits:number,withdrawals:number}} x */
export function externalFlowAdjustedGain(x){
  const fields=['start','end','deposits','withdrawals'];
  if(!record(x)||fields.some(key=>!Object.hasOwn(x,key)||!Number.isFinite(x[key]))||x.deposits<0||x.withdrawals<0)throw Error('Invalid financial value');
  return finiteResult(x.end-x.start-x.deposits+x.withdrawals);
}
/** Per-asset market move when share counts are unchanged between two timestamps. */
export function positionPriceContribution(quantity,priceStart,priceEnd){
  if([quantity,priceStart,priceEnd].some(v=>!Number.isFinite(v))||quantity<0||priceStart<0||priceEnd<0)throw Error('Invalid contribution');
  return finiteResult(quantity*(priceEnd-priceStart));
}
/** Net cash movement: securities trades are excluded as internal asset swaps. */
export function classifyCashEvent(type,amount){
  if(!Number.isFinite(amount)||amount<0)throw Error('Invalid cash event');
  if(type==='deposit')return {external:amount,saleProceeds:0};
  if(type==='withdrawal')return {external:-amount,saleProceeds:0};
  if(type==='sale')return {external:0,saleProceeds:amount};
  if(['purchase','dividend','fee'].includes(type))return {external:0,saleProceeds:0};
  throw Error('Unsupported cash event');
}
/** ETF look-through is separate from direct groups. Uncovered weight joins explicit unclassified weight. */
export function distributeEtfExposure(etfValue,sectorWeights){
  if(!Number.isFinite(etfValue)||etfValue<0||!record(sectorWeights))throw Error('Invalid sector breakdown');
  const pairs=Object.entries(sectorWeights);
  if(pairs.some(([key,v])=>!key.trim()||!Number.isFinite(v)||v<0||v>1))throw Error('Invalid sector breakdown');
  const total=pairs.reduce((sum,[,weight])=>sum+weight,0);
  // Accept only machine-rounding excess, never materially overallocated exposure.
  if(total>1+Number.EPSILON*Math.max(1,pairs.length)*4)throw Error('Invalid sector breakdown');
  const scale=total>1?1/total:1;
  const result=Object.fromEntries(pairs.map(([key,weight])=>[key,finiteResult(etfValue*(weight*scale))]));
  result.unclassified=finiteResult((result.unclassified??0)+etfValue*Math.max(0,1-total));
  return result;
}
