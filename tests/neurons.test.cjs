const assert=require('node:assert/strict');
const {examples,synthesize,describe,active,sameBarcode}=require('../site/neurons.js');
// An explicit Y: the shorter tip ends at 60 and merges at 20; the elder survives to the soma.
const y={nodes:[{parent:-1,r:0,source:0},{parent:0,r:20,source:0},{parent:1,r:100,source:0},{parent:1,r:60,source:1}]};
assert.ok(sameBarcode(describe(y).bars,[[0,100],[20,60]]));
assert.deepEqual(describe(y).owners,[0,0,0,1]);
assert.equal(describe(y).bars.filter(b=>active(b,40)).length,2);
assert.equal(describe(y).bars.filter(b=>active(b,20)).length,1);
assert.equal(describe(y).bars.filter(b=>active(b,0)).length,1);
// Independently recover every input barcode across many stochastic tree attachments.
const topologies=new Set();
for(const intervals of Object.values(examples))for(let seed=1;seed<=100;seed++){
 const tree=synthesize(intervals,seed),result=describe(tree);
 assert.ok(sameBarcode(result.bars,intervals),'Generated tree must recover the target barcode');
 assert.equal(result.bars.length,intervals.length);
 assert.ok(tree.nodes.every(n=>Math.abs(n.theta)<=1.12));
 if(intervals===examples.branching)topologies.add(JSON.stringify(tree.nodes.map(n=>[n.parent,n.r])));
}
assert.ok(topologies.size>5,'The same barcode should allow different branching structures');
assert.throws(()=>synthesize([[0,20],[10,30]]));
assert.throws(()=>describe({nodes:[{parent:-1,r:0},{parent:0,r:10},{parent:1,r:5}]}));
console.log('Neuron checks passed: elder rule, merge events, invalid trees and 200 barcode round trips.');
// Validate the shipped official NeuroTS recordings and their source-to-barcode provenance.
const fs=require('node:fs'),vm=require('node:vm');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(require('node:path').join(__dirname,'../site/assets/neurots-growth.js'),'utf8'),context);
const recorded=context.window.AeroNeuroTSRecordings;
assert.equal(recorded.software,'NeuroTS 3.7.0');
assert.equal(recorded.recordings.length,3);
assert.ok(sameBarcode(recorded.reference.barcode,recorded.target,.01));
for(const r of [recorded.reference,...recorded.recordings]){
 assert.equal(r.edges.length,r.vertices.length-1,'Each recording must be one connected tree');
 const parent=Array.from({length:r.vertices.length},(_,i)=>i);
 const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 for(const [a,b] of r.edges){
  assert.ok(a>=0&&b>=0&&a<r.vertices.length&&b<r.vertices.length);
  assert.notEqual(find(a),find(b),'No cycles in the recorded neuron');parent[find(a)]=find(b);
  assert.ok(r.vertices[a][3]<=r.vertices[b][3],'Growth timestamps follow edges');
 }
 assert.equal(new Set(parent.map((_,i)=>find(i))).size,1);
 assert.ok(r.vertices.every(p=>p.length===4&&p.every(Number.isFinite)&&p[3]>=0&&p[3]<=r.steps));
 assert.equal(r.barcode.length,r.tips);
 assert.ok(fs.existsSync(require('node:path').join(__dirname,'../site/assets',r.swc)));
}
console.log('Recorded NeuroTS checks passed: source barcode, tree geometry, timestamps and downloadable morphology files.');
