/* Vietoris–Rips 2-skeleton, with homology over F_2. No dependencies. */
(function (root) {
  'use strict';
  function cloud(shape) {
    if (shape === 'double') return Array.from({length:32}, (_, i) => {
      const a=(i%16)/16*Math.PI*2;
      return {x:(i<16?-.62:.62)+.53*Math.cos(a),y:.53*Math.sin(a)};
    });
    if (shape === 'clusters') return Array.from({length:30}, (_, i) => {
      const c=[[-.75,.5],[.75,.5],[0,-.7]][Math.floor(i/10)];
      const a=i*2.399963, r=.09+.025*(i%7);
      return {x:c[0]+Math.cos(a)*r,y:c[1]+Math.sin(a)*r};
    });
    return Array.from({length:32}, (_, i) => {
      const a=i/32*Math.PI*2,r=1+.025*Math.sin(i*3.7);
      return {x:Math.cos(a)*r,y:Math.sin(a)*r};
    });
  }
  function complex(points, epsilon) {
    const n=points.length, edges=[], triangles=[], matrix=Array.from({length:n},()=>Array(n).fill(-1));
    const parent=Array.from({length:n},(_,i)=>i);
    const find=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
      if(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)<=epsilon+1e-10){
        matrix[i][j]=edges.length;edges.push([i,j]);parent[find(i)]=find(j);
      }
    }
    const pivots=new Map();let rank=0;
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(matrix[i][j]>=0){
      for(let k=j+1;k<n;k++)if(matrix[i][k]>=0&&matrix[j][k]>=0){
        triangles.push([i,j,k]);
        let column=(1n<<BigInt(matrix[i][j]))^(1n<<BigInt(matrix[i][k]))^(1n<<BigInt(matrix[j][k]));
        while(column){
          const pivot=column.toString(2).length-1;
          if(pivots.has(pivot))column^=pivots.get(pivot);
          else{pivots.set(pivot,column);rank++;break;}
        }
      }
    }
    const components=new Set(parent.map((_,i)=>find(i))).size;
    return {edges,triangles,components,loops:edges.length-n+components-rank};
  }
  const api={cloud,complex};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.AeroTopology=api;
})(typeof globalThis!=='undefined'?globalThis:this);
