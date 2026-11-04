/** Pure functions: safe to use with real data after ledger reconciliation. All numbers USD. */
/** @param {{quantity:number,price:number}[]} holdings @param {number} cash */
export function accountValue(holdings,cash=0){
  if(!Number.isFinite(cash))throw Error('Invalid cash balance');
  return cash+holdings.reduce((s,p)=>{if(!Number.isFinite(p.price)||!Number.isFinite(p.quantity)||p.quantity<0||p.price<0)throw Error('Invalid holding');return s+p.quantity*p.price},0);
}
/** External cash flows only: a sale within brokerage is not a withdrawal. */
/** @param {{start:number,end:number,deposits:number,withdrawals:number}} x */
export function externalFlowAdjustedGain(x){
  const a=Object.values(x);if(a.some(v=>!Number.isFinite(v)))throw Error('Invalid financial value');
  return x.end-x.start-x.deposits+x.withdrawals;
}
/** Per-asset market move when share counts are unchanged between two timestamps. */
export function positionPriceContribution(quantity,priceStart,priceEnd){
  if([quantity,priceStart,priceEnd].some(v=>!Number.isFinite(v))||quantity<0||priceStart<0||priceEnd<0)throw Error('Invalid contribution');
  return quantity*(priceEnd-priceStart);
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
/** ETF look-through exposure is computed separately from direct holding categories. */
export function distributeEtfExposure(etfValue,sectorWeights){
  const pairs=Object.entries(sectorWeights);
  if(!Number.isFinite(etfValue)||etfValue<0||pairs.some(([,v])=>!Number.isFinite(v)||v<0)||pairs.reduce((a,[,v])=>a+v,0)>1.000001)throw Error('Invalid sector breakdown');
  const result=Object.fromEntries(pairs.map(([k,v])=>[k,etfValue*v]));
  result.unclassified=etfValue*(1-pairs.reduce((a,[,v])=>a+v,0));
  return result;
}