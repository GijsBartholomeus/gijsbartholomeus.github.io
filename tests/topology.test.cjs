const assert=require('node:assert/strict');
const {cloud,complex}=require('../site/topology.js');
// Known complexes: isolated vertices, a square cycle, a filled triangle and a simplex.
assert.equal(complex([{x:0,y:0},{x:1,y:0}],0).components,2);
const square=[{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}];
assert.equal(complex(square,1).loops,1);
assert.equal(complex(square,Math.SQRT2).loops,0);
const triangle=complex([{x:0,y:0},{x:1,y:0},{x:0,y:1}],2);
assert.equal(triangle.components,1);assert.equal(triangle.loops,0);assert.equal(triangle.triangles.length,1);
assert.equal(complex(cloud('ring'),.35).loops,1);
assert.equal(complex(cloud('double'),.23).loops,2);
for(const shape of ['ring','double','clusters']){
  const pts=cloud(shape);assert.equal(complex(pts,0).components,pts.length);
  const full=complex(pts,2.4);assert.equal(full.components,1);assert.equal(full.loops,0);
  for(const epsilon of [.1,.25,.5,1,1.5,2])assert.ok(complex(pts,epsilon).loops>=0);
}
console.log('Topology checks passed: isolated points, square loop, filled triangle, two rings, and completed complexes.');
