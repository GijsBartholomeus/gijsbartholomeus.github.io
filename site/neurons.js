/* Independent educational implementation. See README for method references and scope. */
(function (root) {
  'use strict';
  const examples={
    branching:[[0,100],[12,82],[24,94],[36,65],[43,87],[55,77],[67,91],[74,96]],
    small:[[0,100],[23,80],[46,92],[61,72]],
    tufted:[[0,100],[72,94],[75,96],[78,92],[81,98],[84,95],[87,99],[90,97]],
    distributed:[[0,100],[10,56],[20,82],[30,95],[40,74],[50,91],[60,85],[70,98]]
  };
  function rng(seed){let state=seed>>>0;return ()=>{state+=0x6D2B79F5;let x=state;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
  function synthesize(intervals,seed=1){
    const random=rng(seed),bars=intervals.map(([start,end],id)=>({start,end,id,parent:null})).sort((a,b)=>a.start-b.start);
    if(!bars.length||bars[0].start!==0||bars.some(b=>!Number.isFinite(b.start)||!Number.isFinite(b.end)||b.end<=b.start))throw new Error('Expected positive finite intervals with a root bar starting at zero.');
    const nodes=[{id:0,parent:-1,r:0,theta:0,source:bars[0].id}],children=bars.map(()=>[]);
    for(let i=1;i<bars.length;i++){
      const bar=bars[i],eligible=bars.slice(0,i).filter(b=>b.start<bar.start&&b.end>bar.end);
      if(!eligible.length)throw new Error('Each bar must be strictly contained in an earlier bar.');
      bar.parent=eligible[Math.floor(random()*eligible.length)].id;children[bar.parent].push(bar);
    }
    function add(parent,r,source){const id=nodes.length;nodes.push({id,parent,r,theta:0,source});return id;}
    function grow(bar,parent){
      let cursor=parent;
      for(const side of children[bar.id]){const fork=add(cursor,side.start,bar.id);grow(side,fork);cursor=fork;}
      add(cursor,bar.end,bar.id);
    }
    grow(bars[0],0);
    const byParent=nodes.map(()=>[]);nodes.slice(1).forEach(n=>byParent[n.parent].push(n.id));
    const count=id=>byParent[id].length?byParent[id].reduce((s,c)=>s+count(c),0):1;
    // Disjoint angular sectors keep the planar drawing from crossing itself.
    function embed(id,left,right){
      if(id)nodes[id].theta=(left+right)/2;
      const cs=[...byParent[id]];if(cs.length===2&&random()<.5)cs.reverse();
      let at=left;const total=count(id);
      for(const child of cs){const next=at+(right-left)*count(child)/total;embed(child,at,next);at=next;}
    }
    embed(0,-1.12,1.12);
    return {nodes,seed};
  }
  function describe(tree){
    const nodes=tree.nodes,children=nodes.map(()=>[]),owners=Array(nodes.length),bars=[];
    nodes.forEach((n,i)=>{if(i){if(n.parent<0||n.parent>=i||n.r<=nodes[n.parent].r)throw new Error('Tree must be rooted, ordered and radially increasing.');children[n.parent].push(i);}});
    const survivors=Array(nodes.length);
    // Parent-before-child storage permits an iterative postorder, including long real arbors.
    for(let id=nodes.length-1;id>=0;id--){
      const n=nodes[id];let survivor={tip:id,end:n.r,source:n.source};
      if(children[id].length){
        const branches=children[id].map(child=>survivors[child]).sort((a,b)=>b.end-a.end||a.tip-b.tip);
        survivor=branches[0];branches.slice(1).forEach(s=>bars.push({start:n.r,...s}));
      }
      survivors[id]=survivor;owners[id]=survivor.source;
    }
    bars.push({start:0,...survivors[0]});bars.sort((a,b)=>a.start-b.start||b.end-a.end);
    return {bars,owners};
  }
  const active=(bar,r)=>r===0?bar.start===0:bar.start<r&&r<=bar.end;
  function sameBarcode(a,b,tolerance=1e-7){
    const ordered=x=>x.map(v=>Array.isArray(v)?v:[v.start,v.end]).sort((u,v)=>u[0]-v[0]||u[1]-v[1]);
    const aa=ordered(a),bb=ordered(b);return aa.length===bb.length&&aa.every((v,i)=>v.every((x,j)=>Math.abs(x-bb[i][j])<tolerance));
  }
  const api={examples,synthesize,describe,active,sameBarcode};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AeroNeurons=api;
})(typeof globalThis!=='undefined'?globalThis:this);
