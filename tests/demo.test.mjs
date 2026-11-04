import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

// Exercise the actual TypeScript data module on all supported Node versions.
const source=await readFile(new URL('../src/lib/demo.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ES2020}});
const {RANGES,demoSeries}=await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

test('all twelve chart ranges have finite values and strictly increasing second timestamps',()=>{
 assert.deepEqual(RANGES,['1m','5m','15m','30m','1h','1D','1W','1M','3M','1Y','5Y','ALL']);
 for(const range of RANGES){
  const points=demoSeries(range);
  assert.ok(points.length>1);
  points.forEach((point,i)=>{
   assert.ok(Number.isInteger(point.time));
   assert.ok(Number.isFinite(point.value)&&point.value>0);
   if(i>0)assert.ok(point.time>points[i-1].time,range);
  });
 }
 const minute=demoSeries('1m');
 assert.equal(minute.at(-1).time-minute[0].time,60);
});

test('every synthetic contribution reconciles to its selected interval value change',()=>{
 for(const range of RANGES){
  const points=demoSeries(range),start=points[0];
  for(const point of points){
   assert.equal(point.groups.length,4);
   assert.ok(point.groups.every(Number.isFinite));
   const contribution=point.groups.reduce((sum,value,i)=>sum+value-start.groups[i],0);
   assert.ok(Math.abs(point.value-start.value-contribution)<1e-8,range);
  }
 }
});
