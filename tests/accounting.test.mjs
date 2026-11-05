import test from 'node:test';import assert from 'node:assert/strict';
import {accountValue,externalFlowAdjustedGain,positionPriceContribution,classifyCashEvent,distributeEtfExposure} from '../src/lib/accounting.mjs';
test('deposit increases account value but not profit',()=>assert.equal(externalFlowAdjustedGain({start:1000,end:1100,deposits:100,withdrawals:0}),0));
test('withdrawal does not count as market loss',()=>assert.equal(externalFlowAdjustedGain({start:1000,end:970,deposits:0,withdrawals:30}),0));
test('sale proceeds are not external cash withdrawal',()=>assert.deepEqual(classifyCashEvent('sale',50),{external:0,saleProceeds:50}));
test('dividend stays within investment result rather than deposit',()=>{assert.deepEqual(classifyCashEvent('dividend',8),{external:0,saleProceeds:0});assert.equal(externalFlowAdjustedGain({start:1000,end:1008,deposits:0,withdrawals:0}),8)});
test('fractional share value and cash',()=>assert.equal(accountValue([{quantity:.5,price:200},{quantity:1.25,price:80}],15),215));
test('direct price contribution',()=>assert.equal(positionPriceContribution(.5,200,210),5));
test('ETF sectors plus unclassified equal ETF value',()=>{const x=distributeEtfExposure(200,{technology:.3,financials:.15});assert.ok(Math.abs(Object.values(x).reduce((s,v)=>s+v,0)-200)<1e-8);assert.ok(Math.abs(x.unclassified-110)<1e-8)});
test('bad values fail closed',()=>assert.throws(()=>accountValue([{quantity:-1,price:100}],0)));

test('cash flow calculations require every field and nonnegative transfer amounts',()=>{
 for(const input of [{start:100,end:110},{start:100,end:100,deposits:-20,withdrawals:0},{start:100,end:100,deposits:0,withdrawals:-20},null,[]])assert.throws(()=>externalFlowAdjustedGain(input));
 assert.equal(externalFlowAdjustedGain({start:100,end:75,deposits:20,withdrawals:10}),-35);
});

test('finite inputs cannot produce infinite financial results',()=>{
 assert.throws(()=>accountValue([{quantity:1e308,price:2}],0));
 assert.throws(()=>accountValue([{quantity:1,price:1e308},{quantity:1,price:1e308}],0));
 assert.throws(()=>positionPriceContribution(1e308,0,2));
 assert.throws(()=>externalFlowAdjustedGain({start:1e308,end:0,deposits:1e308,withdrawals:0}));
});

test('malformed or missing positions cannot silently disappear from account value',()=>{
 for(const holdings of [null,{},[null],Array(1),[{quantity:'1',price:100}]])assert.throws(()=>accountValue(holdings));
 assert.equal(accountValue([],0),0);
});

test('explicit unknown ETF exposure and uncovered exposure both reconcile',()=>{
 const result=distributeEtfExposure(100,{technology:.3,unclassified:.2});
 assert.deepEqual(result,{technology:30,unclassified:70});
 assert.equal(Object.values(result).reduce((sum,value)=>sum+value,0),100);
 assert.deepEqual(distributeEtfExposure(100,{}),{unclassified:100});
});

test('ETF allocations reject overcoverage and malformed weight records',()=>{
 for(const weights of [{technology:.6,other:.4000005},[.3,.2],null,{'':.2},{technology:NaN},{technology:-.2}])assert.throws(()=>distributeEtfExposure(100,weights));
});

test('ETF machine rounding never generates negative unknown exposure',()=>{
 const result=distributeEtfExposure(200,{a:.1,b:.2,c:.7+Number.EPSILON});
 assert.ok(Object.values(result).every(value=>Number.isFinite(value)&&value>=0));
 assert.ok(Math.abs(Object.values(result).reduce((sum,value)=>sum+value,0)-200)<1e-10);
});
