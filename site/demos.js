(() => {
  'use strict';
  const {examples,synthesize,describe,active,sameBarcode}=AeroNeurons;
  const byId=id=>document.getElementById(id);
  const colours=['#177ca4','#b26a16','#7653b3','#218878','#b84d6b','#627b24','#3972be','#996028'];
  const colour=id=>colours[id%colours.length];
  const number=x=>Number(x.toFixed(2));
  const point=(r,theta)=>[180+2*r*Math.sin(theta),252-2*r*Math.cos(theta)];
  const position=n=>point(n.r,n.theta);
  function segment(a,b,low,high){
    const from=Math.max(a.r,low),to=Math.min(b.r,high);if(to<=from)return '';
    const count=Math.max(2,Math.ceil((to-from)/2)),points=[];
    for(let i=0;i<=count;i++){
      const r=from+(to-from)*i/count,t=(r-a.r)/(b.r-a.r);
      const theta=a.theta+(b.theta-a.theta)*t;
      points.push(point(r,theta).map(number).join(','));
    }
    return points.join(' ');
  }
  function drawTree(svg,tree,descriptor,{radius=0,growth=100,selected='all',filtration=false}={}){
    let markup='';
    // Guides share the radial coordinate used by the barcode.
    for(const r of [25,50,75,100])markup+=`<circle class="neuron-guide" cx="180" cy="252" r="${r*2}"/>`;
    for(const n of tree.nodes.slice(1)){
      const parent=tree.nodes[n.parent],owner=descriptor.owners[n.id],isSelected=selected==='all'||Number(selected)===owner;
      const full=segment(parent,n,0,100),shown=segment(parent,n,filtration?radius:0,growth);
      markup+=`<polyline points="${full}" fill="none" stroke="${colour(owner)}" stroke-width="2.4" opacity=".14"/>`;
      if(shown)markup+=`<polyline points="${shown}" fill="none" stroke="${colour(owner)}" stroke-width="${isSelected?3:1.8}" opacity="${isSelected?1:.2}" stroke-linecap="round"/>`;
    }
    if(filtration)markup+=`<circle class="filtration-circle" cx="180" cy="252" r="${radius*2}"/>`;
    const parents=new Set(tree.nodes.map(n=>n.parent));
    for(const n of tree.nodes.slice(1))if(!parents.has(n.id)){
      const [x,y]=position(n),lit=n.r<=growth&&(!filtration||n.r>=radius),isSelected=selected==='all'||Number(selected)===n.source;
      markup+=`<circle cx="${number(x)}" cy="${number(y)}" r="3.3" fill="${colour(n.source)}" opacity="${lit&&isSelected?1:.22}"/><text class="neuron-tip" x="${number(x)}" y="${number(y-9)}" opacity="${isSelected?1:.3}">${n.source+1}</text>`;
    }
    markup+='<circle class="neuron-soma" cx="180" cy="252" r="5"/><text class="neuron-label" x="180" y="274" text-anchor="middle">soma</text>';
    svg.innerHTML=markup;
  }
  function drawBarcode(svg,bars,{radius=0,selected='all',filtration=false,growth=null}={}){
    let markup='';const x=r=>40+2.8*r;
    for(const r of [0,25,50,75,100])markup+=`<path class="barcode-grid" d="M${x(r)} 22V236"/><text class="neuron-label" x="${x(r)}" y="251" text-anchor="middle">${r}</text>`;
    bars.forEach((bar,i)=>{
      const y=38+i*25,on=!filtration||active(bar,radius),chosen=selected==='all'||Number(selected)===bar.source;
      const opacity=chosen?(on?1:.55):.18;
      markup+=`<text class="neuron-label" x="20" y="${y+4}" text-anchor="middle">${bar.source+1}</text><path d="M${x(bar.start)} ${y}H${x(bar.end)}" stroke="${colour(bar.source)}" stroke-width="6" opacity="${opacity}" stroke-linecap="round"/>`;
      markup+=`<circle cx="${x(bar.start)}" cy="${y}" r="3" fill="${colour(bar.source)}" opacity="${opacity}"/><circle cx="${x(bar.end)}" cy="${y}" r="3" fill="${colour(bar.source)}" opacity="${opacity}"/>`;
    });
    const cursor=growth===null?radius:growth;
    markup+=`<path class="barcode-cursor" d="M${x(cursor)} 20V235"/><text class="neuron-label" x="180" y="274" text-anchor="middle">distance from soma · arbitrary units</text>`;
    svg.innerHTML=markup;
    svg.setAttribute('aria-label',bars.map(b=>`Branch ${b.source+1}: ${b.start} to ${b.end}`).join('; '));
  }
  const comparisons=[
    {key:'tufted',label:'A · tufted crown',tree:synthesize(examples.tufted,41)},
    {key:'distributed',label:'B · distributed branching',tree:synthesize(examples.distributed,41)}
  ];
  // A narrow crown makes the long-trunk example visually distinct, preserving all radii.
  comparisons[0].tree.nodes.forEach(n=>n.theta*=.46);
  comparisons.forEach(c=>c.descriptor=describe(c.tree));
  function renderTmd(){
    const radius=Number(byId('tmd-radius').value),selected=byId('tmd-highlight').value;
    const counts=comparisons.map(c=>{
      drawTree(byId('tmd-tree-'+c.key),c.tree,c.descriptor,{radius,selected,filtration:true});
      drawBarcode(byId('tmd-barcode-'+c.key),c.descriptor.bars,{radius,selected,filtration:true});
      const count=c.descriptor.bars.filter(b=>active(b,radius)).length;
      byId('tmd-tree-'+c.key).setAttribute('aria-label',`${c.label}: synthetic tree at radius ${radius}, with ${count} connected pieces outside the circle.`);
      return `${c.label}: ${count} ${count===1?'piece':'pieces'}`;
    });
    byId('tmd-radius-value').value=radius;
    byId('tmd-readout').textContent='Outside the circle — '+counts.join(' · ')+'. Both trees have 8 tips and a maximum radius of 100.';
  }
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
