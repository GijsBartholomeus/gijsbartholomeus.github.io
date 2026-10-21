(() => {
  'use strict';
  const {describe,active}=AeroNeurons;
  const byId=id=>document.getElementById(id);
  const colours=['#177ca4','#b26a16','#7653b3','#218878','#b84d6b','#627b24','#3972be','#996028'];
  const colour=id=>colours[id]||`hsl(${(id*137.508)%360} 58% 42%)`;
  const number=x=>Number(x.toFixed(2));
  const comparisons=AeroTMDCells.map(c=>({...c,descriptor:describe(c)}));
  const geometry=comparisons.flatMap(c=>[...c.nodes.map(n=>[n.x,n.y]),...c.ghost.flatMap(g=>[[g[0],g[1]],[g[3],g[4]]])]);
  const minX=Math.min(...geometry.map(p=>p[0])),maxX=Math.max(...geometry.map(p=>p[0])),minY=Math.min(...geometry.map(p=>p[1])),maxY=Math.max(...geometry.map(p=>p[1]));
  const cellScale=Math.min(285/(maxX-minX),365/(maxY-minY)),middle=(minX+maxX)/2;
  const project=(x,y)=>[180+(x-middle)*cellScale,405-(y-minY)*cellScale];
  const maxDistance=Math.ceil(Math.max(...comparisons.flatMap(c=>c.descriptor.bars.map(b=>b.end)))/250)*250;
  const selectedFor=c=>{const [cell,branch]=byId('tmd-highlight').value.split(':');return cell===c.key?Number(branch):'all';};
  function drawCell(c,cut){
    const svg=byId('tmd-tree-'+c.key),selected=selectedFor(c);let markup='';
    const path=(a,b)=>`M${number(a[0])} ${number(a[1])}L${number(b[0])} ${number(b[1])}`;
    markup+=`<path class="cell-context" d="${c.ghost.map(g=>path(project(g[0],g[1]),project(g[3],g[4]))).join('')}"/>`;
    const branches=new Map();
    for(const n of c.nodes.slice(1)){
      const parent=c.nodes[n.parent],owner=c.descriptor.owners[n.id];
      if(!branches.has(owner))branches.set(owner,{full:'',outer:'',cuts:[]});
      const branch=branches.get(owner),a=project(parent.x,parent.y),b=project(n.x,n.y);
      branch.full+=path(a,b);
      if(n.r>=cut){
        const t=Math.max(0,Math.min(1,(cut-parent.r)/(n.r-parent.r)));
        const start=[a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])];
        branch.outer+=path(start,b);if(parent.r<cut)branch.cuts.push(start);
      }
    }
    for(const [owner,branch] of branches){
      const chosen=selected==='all'||selected===owner;
      markup+=`<path d="${branch.full}" class="cell-trace" stroke="${colour(owner)}" opacity=".16"/>`;
      markup+=`<path d="${branch.outer}" class="cell-trace" stroke="${colour(owner)}" opacity="${chosen?1:.15}"/>`;
      markup+=branch.cuts.map(p=>`<circle cx="${number(p[0])}" cy="${number(p[1])}" r="2.2" fill="${colour(owner)}"/>`).join('');
    }
    // Place terminal numbers in two columns to keep dense biological tufts legible.
    const terminals=c.descriptor.bars.map(b=>({...b,at:project(c.nodes[b.tip].x,c.nodes[b.tip].y)})).sort((a,b)=>a.at[0]-b.at[0]);
    for(const [side,group] of [terminals.slice(0,Math.ceil(terminals.length/2)),terminals.slice(Math.ceil(terminals.length/2))].entries()){
      group.sort((a,b)=>a.at[1]-b.at[1]);let previous=12;
      const ys=group.map(b=>{const y=Math.max(b.at[1],previous+12);previous=y;return y;});
      const shift=Math.max(0,(ys[ys.length-1]||0)-390);
      group.forEach((b,i)=>{
        const x=side?340:20,y=ys[i]-shift,chosen=selected==='all'||selected===b.source,opacity=chosen?1:.2;
        markup+=`<path class="cell-leader" d="${path(b.at,[x+(side?-9:9),y-3])}" stroke="${colour(b.source)}" opacity="${chosen?.38:.1}"/><circle cx="${number(b.at[0])}" cy="${number(b.at[1])}" r="1.8" fill="${colour(b.source)}"/><text class="cell-number" x="${x}" y="${number(y)}" fill="${colour(b.source)}" opacity="${opacity}" text-anchor="middle">${b.source+1}</text>`;
      });
    }
    const root=project(c.nodes[0].x,c.nodes[0].y);
    markup+=`<circle class="neuron-soma" cx="${number(root[0])}" cy="${number(root[1])}" r="4"/><path class="neurots-scalebar" d="M25 426h${number(100*cellScale)}"/><text class="neuron-label" x="25" y="419">100 μm</text>`;
    svg.innerHTML=markup;
  }
  function drawCellBarcode(c,cut){
    const svg=byId('tmd-barcode-'+c.key),selected=selectedFor(c),x=r=>42+280*r/maxDistance;let markup='';
    for(let r=0;r<=maxDistance;r+=250)markup+=`<path class="barcode-grid" d="M${x(r)} 20V391"/><text class="neuron-label" x="${x(r)}" y="408" text-anchor="middle">${r}</text>`;
    c.descriptor.bars.forEach((b,i)=>{
      const y=30+i*12,chosen=selected==='all'||selected===b.source,on=active(b,cut),opacity=chosen?(on?1:.65):.15;
      markup+=`<text class="cell-bar-number" x="20" y="${y+3.5}" text-anchor="middle">${b.source+1}</text><path d="M${x(b.start)} ${y}H${x(b.end)}" stroke="${colour(b.source)}" stroke-width="5" opacity="${opacity}" stroke-linecap="round"><title>Branch ${b.source+1}: ${number(b.start)}–${number(b.end)} μm</title></path>`;
    });
    markup+=`<path class="barcode-cursor" d="M${x(cut)} 20V391"/><text class="neuron-label" x="180" y="430" text-anchor="middle">distance along branches (μm)</text>`;
    svg.innerHTML=markup;svg.setAttribute('aria-label',c.name+': '+c.descriptor.bars.map(b=>`branch ${b.source+1}, ${number(b.start)} to ${number(b.end)} micrometres`).join('; '));
  }
  function renderTmd(){
    const percent=Number(byId('tmd-radius').value);
    const counts=comparisons.map(c=>{
      const max=Math.max(...c.descriptor.bars.map(b=>b.end)),cut=percent*max/100;
      drawCell(c,cut);drawCellBarcode(c,cut);
      const count=c.descriptor.bars.filter(b=>active(b,cut)).length;
      byId('tmd-tree-'+c.key).setAttribute('aria-label',`${c.name}, reconstructed cell with ${c.tips} apical terminals. ${count} connected pieces beyond a path-distance cut of ${number(cut)} micrometres.`);
      return `${c.name}: ${count} ${count===1?'piece':'pieces'}`;
    });
    byId('tmd-radius-value').value=percent+'%';
    byId('tmd-readout').textContent='Beyond the cut — '+counts.join(' · ')+'.';
  }
  byId('tmd-highlight').innerHTML='<option value="all">All branches</option>'+comparisons.map(c=>`<optgroup label="${c.name}">`+c.descriptor.bars.map(b=>`<option value="${c.key}:${b.source}">${c.name} · branch ${b.source+1}</option>`).join('')+'</optgroup>').join('');
  byId('tmd-highlight').addEventListener('change',renderTmd);byId('tmd-radius').addEventListener('input',renderTmd);
  // These are recordings of official NeuroTS runs, not simulations of growth in the browser.
  const recordings=AeroNeuroTSRecordings,allRecordings=[recordings.reference,...recordings.recordings];
  let playing=false,frame=0,last=0,visible=false;
  const play=byId('tns-play'),progress=byId('tns-progress');
  function stop(){playing=false;cancelAnimationFrame(frame);play.textContent='Play synthesis';play.setAttribute('aria-pressed','false');byId('tns-readout').setAttribute('aria-live','polite');}
  function drawRecording(svg,recording,percent,label=false){
    const dimension=byId('tns-view').value==='zy'?2:0;
    const vertices=allRecordings.flatMap(r=>r.vertices);
    const xs=vertices.map(p=>p[dimension]),ys=vertices.map(p=>p[1]);
    const minX=Math.min(0,...xs),maxX=Math.max(0,...xs),minY=Math.min(0,...ys),maxY=Math.max(0,...ys);
    const scale=Math.min(310/(maxX-minX),280/(maxY-minY)),mid=(minX+maxX)/2;
    const project=p=>[180+(p[dimension]-mid)*scale,310-(p[1]-minY)*scale];
    let background='',grown='';const step=recording.steps*percent/100;
    for(const [a,b] of recording.edges){
      const va=recording.vertices[a],vb=recording.vertices[b],pa=project(va),pb=project(vb);
      const move=`M${number(pa[0])} ${number(pa[1])}`;
      background+=move+`L${number(pb[0])} ${number(pb[1])}`;
      if(vb[3]<=step)grown+=move+`L${number(pb[0])} ${number(pb[1])}`;
      else if(va[3]<step&&vb[3]>va[3]){const t=(step-va[3])/(vb[3]-va[3]);grown+=move+`L${number(pa[0]+t*(pb[0]-pa[0]))} ${number(pa[1]+t*(pb[1]-pa[1]))}`;}
    }
    const soma=project([0,0,0]),bar=100*scale;
    svg.innerHTML=(label?`<text class="neuron-label neurots-seed" x="180" y="18" text-anchor="middle">seed ${recording.seed}</text>`:'')+`<path class="neurots-ghost" d="${background}"/><path class="neurots-grown" d="${grown}"/><circle class="neuron-soma" cx="${number(soma[0])}" cy="${number(soma[1])}" r="${number(Math.max(3,12.5*scale))}"/><path class="neurots-scalebar" d="M25 325h${number(bar)}"/><text class="neuron-label" x="25" y="319">100 μm</text>`;
  }
  function drawRecordedBarcode(){
    const svg=byId('tns-barcode'),bars=recordings.target,maximum=Math.ceil(Math.max(...bars.map(b=>b[1]))/100)*100,x=r=>40+280*r/maximum;
    let markup='';
    for(let i=0;i<=4;i++){const r=maximum*i/4;markup+=`<path class="barcode-grid" d="M${x(r)} 18V298"/><text class="neuron-label" x="${x(r)}" y="316" text-anchor="middle">${number(r)}</text>`;}
    bars.forEach(([start,end],i)=>{const y=28+i*252/(bars.length-1);markup+=`<path class="neurots-target" d="M${x(start)} ${y}H${x(end)}"/>`;});
    svg.innerHTML=markup;svg.setAttribute('aria-label',`${bars.length} TMD bars extracted from the source tree using path distance in micrometres. `+bars.map(([a,b])=>`${number(a)} to ${number(b)}`).join('; '));
  }
  function renderTns(){
    const growth=Number(progress.value);
    recordings.recordings.forEach(recording=>{
      const svg=byId('tns-tree-'+recording.seed);
      drawRecording(svg,recording,growth,true);
      svg.setAttribute('aria-label',`Recorded NeuroTS tree, seed ${recording.seed}, at ${growth} percent of its synthesis. ${recording.tips} terminal tips in the finished tree.`);
    });
    byId('tns-progress-value').value=growth+'%';
    byId('tns-readout').textContent=growth===100?`${recordings.software} · three completed trees · ${recordings.recordings.map(r=>r.tips).join(', ')} tips.`:'Recorded steps — '+recordings.recordings.map(r=>`seed ${r.seed}: ${Math.round(r.steps*growth/100)} / ${r.steps}`).join(' · ')+'.';
  }
  function tick(time){
    if(!playing||!visible||document.hidden){stop();return;}
    if(time-last>=60){last=time;progress.value=Math.min(100,Number(progress.value)+1);renderTns();if(Number(progress.value)===100){stop();return;}}
    frame=requestAnimationFrame(tick);
  }
  play.addEventListener('click',()=>{if(playing){stop();return;}if(Number(progress.value)===100)progress.value=0;playing=true;last=0;play.textContent='Pause synthesis';play.setAttribute('aria-pressed','true');byId('tns-readout').setAttribute('aria-live','off');frame=requestAnimationFrame(tick);});
  byId('tns-reset').addEventListener('click',()=>{stop();progress.value=0;renderTns();});
  byId('tns-view').addEventListener('change',()=>{drawRecording(byId('tns-source'),recordings.reference,100);renderTns();});
  progress.addEventListener('input',()=>{stop();renderTns();});
  document.querySelectorAll('.demo-choice').forEach(button=>button.addEventListener('click',()=>{
    stop();document.querySelectorAll('.demo-choice').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    document.querySelectorAll('.demo-stage').forEach(s=>s.hidden=s.id!=='demo-'+button.dataset.demo);
    byId('demo-'+button.dataset.demo).scrollIntoView({block:'start',behavior:'instant'});
  }));
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)stop();}).observe(byId('demo-tns'));
  document.addEventListener('aero-leave-demos',stop);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',stop);
  renderTmd();drawRecording(byId('tns-source'),recordings.reference,100);drawRecordedBarcode();renderTns();
})();
