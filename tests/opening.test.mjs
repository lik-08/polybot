import test from 'node:test';
import assert from 'node:assert/strict';
import {parseOpening,analyzeOpening} from '../src/lib/opening.mjs';

const holding=(symbol='AAA',extra={})=>({symbol,quantity:1,displayedValue:10,costBasis:8,...extra});
const snapshot=(extra={})=>({version:1,kind:'opening-snapshot',asOfDate:'2024-02-29',source:'Synthetic test fixture',reportedAccountValue:15,cash:5,holdings:[holding()],...extra});

test('unsupported aggregate dollar precision fails instead of displaying a zero residual',()=>{
 assert.throws(()=>analyzeOpening(snapshot({reportedAccountValue:1e16,cash:0,holdings:[holding('AAA',{displayedValue:1e16}),holding('BBB',{displayedValue:1})]})),/precision/);
});

test('complete opening observations reconcile without deriving gains or history',()=>{
  assert.deepEqual(analyzeOpening(snapshot()),{listedHoldingsValue:10,knownSubtotal:15,unreconciled:0,reconciled:true,missing:[],positionCount:1});
  assert.deepEqual(Object.keys(analyzeOpening(snapshot())).sort(),['knownSubtotal','listedHoldingsValue','missing','positionCount','reconciled','unreconciled']);
});

test('canonical tickers retain GOOG and GOOGL as separate observed holdings',()=>{
  const original=snapshot({source:'  Synthetic fixture  ',asOfDate:null,holdings:[holding(' goog '),holding('googl')],reportedAccountValue:25});
  const parsed=parseOpening(JSON.stringify(original));
  assert.deepEqual(parsed.holdings.map(item=>item.symbol),['GOOG','GOOGL']);assert.equal(parsed.asOfDate,null);assert.equal(parsed.source,'Synthetic fixture');
  parsed.holdings[0].displayedValue=1;assert.equal(original.holdings[0].displayedValue,10);
});

test('unknown quantities and basis remain visible but do not block dollar reconciliation',()=>{
  const result=analyzeOpening(snapshot({asOfDate:null,holdings:[holding('AAA',{quantity:null,costBasis:null})]}));
  assert.equal(result.reconciled,true);assert.deepEqual(result.missing,['Missing as-of date','Missing quantities','Missing cost basis']);
});

test('unknown cash is never inferred from residual',()=>{
  const result=analyzeOpening(snapshot({cash:null}));
  assert.equal(result.listedHoldingsValue,10);assert.equal(result.knownSubtotal,null);assert.equal(result.unreconciled,5);assert.equal(result.reconciled,false);assert.deepEqual(result.missing,['Missing cash']);
});

test('partial displayed coverage produces a residual against only known observations',()=>{
  const result=analyzeOpening(snapshot({reportedAccountValue:40,holdings:[holding('AAA'),holding('BBB',{displayedValue:null}),holding('CCC',{displayedValue:15})]}));
  assert.equal(result.listedHoldingsValue,null);assert.equal(result.knownSubtotal,null);assert.equal(result.unreconciled,10);assert.equal(result.reconciled,false);assert.deepEqual(result.missing,['Missing displayed holding values']);
  const noCash=analyzeOpening(snapshot({cash:null,reportedAccountValue:40,holdings:[holding('AAA'),holding('BBB',{displayedValue:null})]}));
  assert.equal(noCash.unreconciled,30);assert.equal(noCash.knownSubtotal,null);assert.equal(noCash.reconciled,false);
});

test('unknown reported value leaves residual unknown even when subtotal is complete',()=>{
  const result=analyzeOpening(snapshot({reportedAccountValue:null}));
  assert.equal(result.knownSubtotal,15);assert.equal(result.unreconciled,null);assert.equal(result.reconciled,false);assert.deepEqual(result.missing,['Missing reported account value']);
});

test('zero observations and empty cash-only snapshots are valid',()=>{
  assert.equal(analyzeOpening(snapshot({reportedAccountValue:0,cash:0,holdings:[holding('AAA',{quantity:0,displayedValue:0,costBasis:0})]})).reconciled,true);
  assert.deepEqual(analyzeOpening(snapshot({reportedAccountValue:5,cash:5,holdings:[]})),{listedHoldingsValue:0,knownSubtotal:5,unreconciled:0,reconciled:true,missing:[],positionCount:0});
});

test('one-cent boundary uses decimal observations without overflow or broad rounding tolerance',()=>{
  for(const [reported,value,expected] of [[100,99.99,true],[100,100.01,true],[100,99.989,false],[100,100.011,false],[.31,.3,true],[1e308,1e308,true],[1e308,9.999999999999998e307,false],[5e-324,0,true]]){
    assert.equal(analyzeOpening(snapshot({reportedAccountValue:reported,cash:0,holdings:[holding('AAA',{displayedValue:value})]})).reconciled,expected,`${reported} vs ${value}`);
  }
  const splitSum=snapshot({reportedAccountValue:.31,cash:0,holdings:[holding('AAA',{displayedValue:.1}),holding('BBB',{displayedValue:.2})]});
  assert.equal(analyzeOpening(splitSum).reconciled,true);
});

test('negative residual stays unexplained and does not become a negative cash balance',()=>{
  const result=analyzeOpening(snapshot({reportedAccountValue:12}));
  assert.equal(result.unreconciled,-3);assert.equal(result.reconciled,false);assert.equal(result.knownSubtotal,15);
});

test('date-only validation preserves unknown dates and rejects rollovers and timestamps',()=>{
  for(const asOfDate of ['2023-02-29','2024-02-30','2024-00-01','2024-13-01','2024-01-00','2024-01-32','2024-2-01','2024-01-01T00:00:00Z',0,''])assert.throws(()=>analyzeOpening(snapshot({asOfDate})),/date/);
  for(const asOfDate of [null,'2000-02-29','1900-02-28'])assert.equal(parseOpening(JSON.stringify(snapshot({asOfDate}))).asOfDate,asOfDate);
});

test('strict versioned schema rejects missing and unsupported fields instead of ignoring them',()=>{
  const missing=snapshot();delete missing.cash;
  for(const input of [null,[],missing,snapshot({version:2}),snapshot({kind:'ledger'}),snapshot({currency:'EUR'}),snapshot({source:''}),snapshot({source:' '.repeat(2)}),snapshot({source:'a'.repeat(257)}),snapshot({source:'label\nextra'}),snapshot({holdings:[{symbol:'AAA',quantity:1,displayedValue:10}]}),snapshot({holdings:[holding('AAA',{unitPrice:10})]})])assert.throws(()=>analyzeOpening(input));
  assert.throws(()=>parseOpening('{broken'),/JSON/);
});

test('all observed numeric fields reject negative, nonnumeric and nonfinite values',()=>{
  for(const invalid of [-1,Infinity,-Infinity,NaN,'1',undefined,{}]){
    for(const field of ['cash','reportedAccountValue'])assert.throws(()=>analyzeOpening(snapshot({[field]:invalid})));
    for(const field of ['quantity','displayedValue','costBasis'])assert.throws(()=>analyzeOpening(snapshot({holdings:[holding('AAA',{[field]:invalid})]})));
  }
});

test('symbols are unique after normalization and do not accept paths or empty names',()=>{
  assert.throws(()=>analyzeOpening(snapshot({holdings:[holding('aaa'),holding(' AAA ')]})),/Duplicate/);
  for(const symbol of ['',null,'../private','A/B','A'.repeat(17)])assert.throws(()=>analyzeOpening(snapshot({holdings:[holding(symbol)]})),/symbol/);
  assert.deepEqual(parseOpening(JSON.stringify(snapshot({holdings:[holding('brk.b'),holding('bf-b')]}))).holdings.map(item=>item.symbol),['BRK.B','BF-B']);
});

test('partial and complete sums fail closed on numerical overflow',()=>{
  for(const input of [snapshot({holdings:[holding('AAA',{displayedValue:1e308}),holding('BBB',{displayedValue:1e308})]}),snapshot({cash:1e308,holdings:[holding('AAA',{displayedValue:1e308})]}),snapshot({cash:1e308,holdings:[holding('AAA',{displayedValue:1e308}),holding('BBB',{displayedValue:null})]})])assert.throws(()=>analyzeOpening(input),/overflow/);
});

test('imports enforce holdings and UTF-8 bounds',()=>{
  const holdings=Array.from({length:100},(_,i)=>holding(`A${i}`));
  assert.equal(analyzeOpening(snapshot({holdings})).positionCount,100);
  assert.throws(()=>analyzeOpening(snapshot({holdings:[...holdings,holding('EXTRA')]})),/100 holdings/);
  const json=JSON.stringify(snapshot());
  assert.equal(parseOpening(json+' '.repeat(512*1024-json.length)).kind,'opening-snapshot');
  assert.throws(()=>parseOpening(json+' '.repeat(512*1024)),/512 KB/);
  assert.throws(()=>parseOpening('"'+'😀'.repeat(140000)+'"'),/512 KB/);
});

test('programmatic inputs revalidate sparse arrays and reject executable accessors',()=>{
  assert.throws(()=>analyzeOpening(snapshot({holdings:Array(1)})),/sparse/);
  const input=snapshot();analyzeOpening(input);input.cash=-1;assert.throws(()=>analyzeOpening(input));
  const accessor=snapshot();Object.defineProperty(accessor,'cash',{get(){throw Error('must not run')}});assert.throws(()=>analyzeOpening(accessor),/accessors/);
  const holdings=[];Object.defineProperty(holdings,'0',{get(){throw Error('must not run')},enumerable:true});assert.throws(()=>analyzeOpening(snapshot({holdings})),/accessor/);
});
