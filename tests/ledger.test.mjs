import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLedger,analyzeLedger} from '../src/lib/ledger.mjs';

const at='2026-11-04T15:00:00Z';
const document=(events=[],valuations=[])=>({version:1,events,valuations});
const event=(id,kind,fields={})=>({id,at,kind,...fields});
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('manual lifecycle reconciles cash, average-cost profit, fees, dividends and split basis',()=>{
  const doc=document([
    event('deposit','deposit',{amount:1000}),
    event('buy1','buy',{symbol:'AAPL',quantity:2,price:100,fee:2}),
    event('buy2','buy',{symbol:'AAPL',quantity:.5,price:120,fee:1}),
    event('sale','sell',{symbol:'AAPL',quantity:1,price:150,fee:2}),
    event('income','dividend',{symbol:'AAPL',amount:5}),
    event('withdrawal','withdrawal',{amount:100}),
    event('custody','fee',{amount:3}),
    event('split','split',{symbol:'AAPL',factor:2}),
  ],[{at,prices:{AAPL:60}}]);
  const result=analyzeLedger(doc);
  assert.equal(result.cash,787);assert.equal(result.deposits,1000);assert.equal(result.withdrawals,100);
  assert.equal(result.saleProceeds,150);assert.equal(result.dividends,5);assert.equal(result.fees,8);
  close(result.realized,42.8);assert.equal(result.positions[0].quantity,3);close(result.positions[0].costBasis,157.8);
  const snapshot=result.snapshots[0];assert.equal(snapshot.value,967);close(snapshot.unrealized,22.2);
  close(snapshot.value-result.deposits+result.withdrawals,result.realized+snapshot.unrealized+result.dividends-3);
});

test('parse returns an independent canonical document sorted by instant and symbol',()=>{
  const input=document([
    event('purchase','buy',{at:'2026-11-04T10:00:01-05:00',symbol:' brk.b ',quantity:.5,price:100}),
    event('fund','deposit',{at:'2026-11-04T15:00:00.0Z',amount:100}),
  ],[
    {at:'2026-11-04T15:00:02Z',prices:{' brk.b ':120}},
    {at:'2026-11-04T10:00:00-05:00',prices:{}},
  ]);
  const parsed=parseLedger(JSON.stringify(input));
  assert.deepEqual(parsed.events.map(x=>x.id),['fund','purchase']);
  assert.equal(parsed.events[1].at,'2026-11-04T15:00:01.000Z');assert.equal(parsed.events[1].symbol,'BRK.B');
  assert.deepEqual(parsed.valuations.map(x=>x.at),['2026-11-04T15:00:00.000Z','2026-11-04T15:00:02.000Z']);
  assert.deepEqual(parsed.valuations[1].prices,{'BRK.B':120});
  parsed.events[0].amount=1;assert.equal(input.events[1].amount,100);
});

test('same-time events preserve input order and every intermediate state must be funded',()=>{
  const deposit=event('deposit','deposit',{amount:10}),buy=event('buy','buy',{symbol:'A',quantity:1,price:10});
  assert.equal(analyzeLedger(document([deposit,buy])).cash,0);
  assert.throws(()=>analyzeLedger(document([buy,deposit])),/cash/);
  assert.throws(()=>parseLedger(JSON.stringify(document([event('w','withdrawal',{amount:1}),deposit]))),/cash/);
});

test('snapshots replay holdings only through their recorded instant including equal-time events',()=>{
  const result=analyzeLedger(document([
    event('d','deposit',{amount:100}),
    event('b','buy',{symbol:'A',quantity:1,price:50,at:'2026-11-04T15:00:01Z'}),
    event('s','sell',{symbol:'A',quantity:1,price:70,at:'2026-11-04T15:00:03Z'}),
  ],[
    {at:'2026-11-04T14:59:59Z',prices:{}},
    {at,prices:{}},
    {at:'2026-11-04T15:00:01Z',prices:{A:60}},
    {at:'2026-11-04T15:00:03Z',prices:{}},
  ]));
  assert.deepEqual(result.snapshots.map(x=>[x.value,x.cash,x.unrealized,x.complete]),[[0,0,0,true],[100,100,0,true],[110,50,10,true],[120,120,0,true]]);
  assert.deepEqual(result.positions,[]);assert.equal(result.realized,20);
});

test('missing prices stay unknown without carrying prior prices or inventing later quotes',()=>{
  const result=analyzeLedger(document([
    event('d','deposit',{amount:100}),event('a','buy',{symbol:'A',quantity:1,price:20}),event('b','buy',{symbol:'B',quantity:1,price:30}),
  ],[
    {at,prices:{A:25,B:40}},
    {at:'2026-11-04T15:01:00Z',prices:{A:26}},
    {at:'2026-11-04T15:02:00Z',prices:{}},
  ]));
  assert.equal(result.snapshots[0].value,115);
  assert.deepEqual(result.snapshots[1],{at:'2026-11-04T15:01:00.000Z',value:null,cash:50,unrealized:null,complete:false,missing:['B']});
  assert.deepEqual(result.snapshots[2].missing,['A','B']);assert.equal(result.snapshots[2].value,null);
});

test('sale proceeds remain internal and cannot oversell even when a later purchase repairs the balance',()=>{
  const first=[event('d','deposit',{amount:100}),event('b','buy',{symbol:'A',quantity:1,price:50})];
  const result=analyzeLedger(document([...first,event('s','sell',{symbol:'A',quantity:1,price:60})]));
  assert.equal(result.withdrawals,0);assert.equal(result.saleProceeds,60);assert.equal(result.cash,110);assert.deepEqual(result.positions,[]);
  assert.throws(()=>analyzeLedger(document([...first,event('s','sell',{symbol:'A',quantity:2,price:60}),event('b2','buy',{symbol:'A',quantity:1,price:50})])),/more shares/);
  assert.throws(()=>analyzeLedger(document([event('s','sell',{symbol:'A',quantity:1,price:1})])),/unheld/);
});

test('fractional arithmetic tolerates machine rounding but rejects material cash and share deficits',()=>{
  const result=analyzeLedger(document([
    event('d','deposit',{amount:.3}),event('b1','buy',{symbol:'A',quantity:.1,price:1}),event('b2','buy',{symbol:'A',quantity:.2,price:1}),event('s','sell',{symbol:'A',quantity:.3,price:1}),
  ]));
  close(result.cash,.3);close(result.realized,0);assert.deepEqual(result.positions,[]);
  assert.throws(()=>analyzeLedger(document([event('d','deposit',{amount:1}),event('b','buy',{symbol:'A',quantity:1,price:1.00000001})])),/cash/);
  assert.throws(()=>analyzeLedger(document([event('d','deposit',{amount:1}),event('b','buy',{symbol:'A',quantity:1,price:1}),event('s','sell',{symbol:'A',quantity:1.00000001,price:1})])),/more shares/);
});

test('splits and reverse splits retain total basis and create no income or realized profit',()=>{
  const result=analyzeLedger(document([
    event('d','deposit',{amount:10}),event('b','buy',{symbol:'A',quantity:.5,price:10,fee:1}),event('split','split',{symbol:'A',factor:4}),event('reverse','split',{symbol:'A',factor:.5}),
  ],[{at,prices:{A:6}}]));
  assert.deepEqual(result.positions,[{symbol:'A',quantity:1,costBasis:6}]);assert.equal(result.realized,0);assert.equal(result.dividends,0);assert.equal(result.snapshots[0].unrealized,0);
  assert.throws(()=>analyzeLedger(document([event('split','split',{symbol:'A',factor:2})])),/unheld/);
});

test('all fee sources consume actual cash and zero prices remain valid manual observations',()=>{
  const result=analyzeLedger(document([event('d','deposit',{amount:10}),event('b','buy',{symbol:'A',quantity:1,price:0,fee:1}),event('s','sell',{symbol:'A',quantity:.5,price:0,fee:1}),event('f','fee',{amount:1})],[{at,prices:{A:0}}]));
  assert.equal(result.cash,7);assert.equal(result.fees,3);assert.equal(result.realized,-1.5);assert.equal(result.snapshots[0].unrealized,-.5);
  assert.throws(()=>analyzeLedger(document([event('f','fee',{amount:1})])),/cash/);
  assert.throws(()=>analyzeLedger(document([event('b','buy',{symbol:'A',quantity:1,price:0}),event('s','sell',{symbol:'A',quantity:1,price:0,fee:1})])),/cash/);
});

test('duplicate IDs and equivalent valuation instants are rejected rather than double-counted',()=>{
  assert.throws(()=>parseLedger(JSON.stringify(document([event('x','deposit',{amount:10}),event('x','dividend',{amount:2})]))),/Duplicate event/);
  assert.throws(()=>analyzeLedger(document([],[{at,prices:{}},{at:'2026-11-04T10:00:00-05:00',prices:{}}])),/Duplicate valuation/);
  assert.throws(()=>analyzeLedger(document([],[{at,prices:{a:1,A:2}}])),/Duplicate normalized/);
});

test('timestamps require actual calendar dates, seconds and explicit zones',()=>{
  for(const invalid of ['2026-11-04','2026-11-04T15:00:00','2026-02-29T00:00:00Z','2026-02-30T00:00:00Z','2026-13-01T00:00:00Z','2026-11-04T24:00:00Z','2026-11-04T00:00:60Z','2026-11-04T00:00:00+25:00'])assert.throws(()=>analyzeLedger(document([event('d','deposit',{at:invalid,amount:1})])),/timestamp/);
  assert.equal(parseLedger(JSON.stringify(document([event('d','deposit',{at:'2000-02-29T00:00:00.1+00:00',amount:1})]))).events[0].at,'2000-02-29T00:00:00.100Z');
});

test('malformed fields, missing numbers, non-USD extras and unsupported event kinds fail closed',()=>{
  for(const input of [null,[],{version:2,events:[],valuations:[]},{version:1,events:[]},{...document(),currency:'EUR'},document([event('x','transfer',{amount:1})]),document([event('x','deposit')]),document([event('x','deposit',{amount:'1'})]),document([event('x','deposit',{amount:-1})]),document([event('x','buy',{symbol:'A',quantity:0,price:0})]),document([event('x','buy',{symbol:'A',quantity:1,price:-1})]),document([event('x','dividend',{amount:1,fee:1})]),document([],[{at,prices:{A:NaN}}]),document([],[{at,prices:[]}])])assert.throws(()=>analyzeLedger(input));
  assert.throws(()=>analyzeLedger(document(Array(1))));assert.throws(()=>analyzeLedger(document([],Array(1))));
  assert.throws(()=>analyzeLedger(document([event(' ','deposit',{amount:1})])),/ID/);
  assert.throws(()=>analyzeLedger(document([event('x','buy',{symbol:'../secret',quantity:1,price:0})])),/symbol/);
  assert.throws(()=>parseLedger('{broken'),/JSON/);
});

test('counters, purchases, sales, splits and valuation sums fail on numerical overflow',()=>{
  const big=1e308;
  for(const input of [
    document([event('d1','deposit',{amount:big}),event('d2','deposit',{amount:big})]),
    document([event('d','deposit',{amount:big}),event('b','buy',{symbol:'A',quantity:big,price:2})]),
    document([event('b','buy',{symbol:'A',quantity:big,price:0}),event('s','sell',{symbol:'A',quantity:big,price:2})]),
    document([event('b','buy',{symbol:'A',quantity:big,price:0}),event('split','split',{symbol:'A',factor:2})]),
    document([event('b1','buy',{symbol:'A',quantity:big,price:0}),event('b2','buy',{symbol:'A',quantity:big,price:0})]),
    document([event('a','buy',{symbol:'A',quantity:1,price:0}),event('b','buy',{symbol:'B',quantity:1,price:0})],[{at,prices:{A:big,B:big}}]),
  ])assert.throws(()=>analyzeLedger(input),/overflow/);
  assert.throws(()=>analyzeLedger(document([event('b','buy',{symbol:'A',quantity:Number.MIN_VALUE,price:0}),event('split','split',{symbol:'A',factor:.5})])),/zero/);
});

test('imports enforce event, valuation, ticker and UTF-8 byte bounds',()=>{
  const events=Array.from({length:1000},(_,i)=>event(`e${i}`,'deposit',{amount:0}));
  assert.equal(analyzeLedger(document(events)).cash,0);
  assert.throws(()=>analyzeLedger(document([...events,event('extra','deposit',{amount:0})])),/1000/);
  const valuations=Array.from({length:500},(_,i)=>({at:new Date(Date.parse(at)+i*1000).toISOString(),prices:{}}));
  assert.equal(analyzeLedger(document([],valuations)).snapshots.length,500);
  assert.throws(()=>analyzeLedger(document([],[...valuations,{at:'2027-01-01T00:00:00Z',prices:{}}])),/500/);
  const prices=Object.fromEntries(Array.from({length:100},(_,i)=>[`A${i}`,1]));
  assert.equal(analyzeLedger(document([],[{at,prices}])).snapshots[0].value,0);
  assert.throws(()=>analyzeLedger(document([event('d','dividend',{symbol:'EXTRA',amount:0})],[{at,prices}])),/100 symbols/);
  const json=JSON.stringify(document());
  assert.deepEqual(parseLedger(json+' '.repeat(512*1024-json.length)),document());
  assert.throws(()=>parseLedger(json+' '.repeat(512*1024)),/512 KB/);
  assert.throws(()=>parseLedger('"'+'😀'.repeat(140000)+'"'),/512 KB/);
});

test('programmatic documents are revalidated without accepting executable record accessors',()=>{
  const input=document([event('d','deposit',{amount:1})]);
  analyzeLedger(input);input.events[0].amount=-1;assert.throws(()=>analyzeLedger(input));
  const prices={get A(){throw new Error('must not run')}};
  assert.throws(()=>analyzeLedger(document([],[{at,prices}])),/accessors/);
  assert.throws(()=>analyzeLedger(new Date()));
});
