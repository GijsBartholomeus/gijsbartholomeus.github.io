(() => {
  'use strict';
  const root=document.documentElement;
  const byId=id=>document.getElementById(id);
  const labels={about:'About me',research:'Research',teaching:'Teaching',cv:'Curriculum vitae',contact:'Contact',playground:'TDA demos'};
  const icons={about:'user',research:'folder',teaching:'book',cv:'file',contact:'mail',playground:'topology'};
  const win=byId('profile-window'),scroller=byId('content-scroll'),panels=[...document.querySelectorAll('.panel')];
  const start=byId('start'),menu=byId('start-menu');
  let current='about',backStack=[],dx=0,dy=0,drag=null;
  root.classList.add('js');
  const save=(key,value)=>{try{localStorage.setItem(key,String(value));}catch{}};
  function closeMenu(){menu.hidden=true;start.setAttribute('aria-expanded','false');}
  function restore(){win.hidden=false;byId('desktop-welcome').hidden=true;byId('task-profile').setAttribute('aria-pressed','true');}
  function hideWindow(){win.hidden=true;byId('desktop-welcome').hidden=false;byId('task-profile').setAttribute('aria-pressed','false');byId('task-profile').focus();stopLab();document.dispatchEvent(new Event('aero-leave-demos'));}
  function navigate(name,{history=true,focus=true,track=true}={}){
    if(!labels[name])name='about';
    if(track&&current!==name)backStack.push(current);
    current=name;restore();closeMenu();
    panels.forEach(p=>{p.hidden=p.id!==name;});
    document.querySelectorAll('.shortcut').forEach(a=>{
      if(a.hash==='#'+name)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
    });
    byId('window-title').textContent=labels[name]+' — Gijs Bartholomeus';
    byId('folder-name').textContent=labels[name];byId('status-label').textContent=labels[name];byId('task-label').textContent=labels[name];
    byId('window-icon').setAttribute('href','#i-'+icons[name]);byId('back').disabled=backStack.length===0;
    if(history&&location.hash!=='#'+name)window.history.pushState({section:name},'', '#'+name);
    scroller.scrollTop=0;
    if(name!=='playground'){stopLab();document.dispatchEvent(new Event('aero-leave-demos'));}
    if(focus){const title=byId(name).querySelector('h1,h2');title.focus({preventScroll:true});if(matchMedia('(max-width:850px)').matches)byId(name).scrollIntoView({block:'start',behavior:'instant'});}
    if(name==='playground')requestAnimationFrame(resizeCanvas);
  }
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const name=a.getAttribute('href').slice(1);if(labels[name]){e.preventDefault();navigate(name);}
  }));
  window.addEventListener('popstate',()=>navigate(location.hash.slice(1),{history:false,track:false}));
  byId('back').addEventListener('click',()=>{const name=backStack.pop();if(name)navigate(name,{track:false});});
  byId('minimize').addEventListener('click',hideWindow);byId('close-window').addEventListener('click',hideWindow);
  byId('task-profile').addEventListener('click',()=>navigate(current,{track:false}));
  byId('show-desktop').addEventListener('click',()=>{if(win.hidden)navigate(current,{track:false});else hideWindow();});
  function setMaximized(value){win.classList.toggle('maximized',value);byId('maximize').setAttribute('aria-pressed',String(value));byId('maximize').setAttribute('aria-label',value?'Restore window size':'Maximize profile window');dx=dy=0;win.style.transform='';requestAnimationFrame(resizeCanvas);}
  byId('maximize').addEventListener('click',()=>setMaximized(!win.classList.contains('maximized')));
  byId('window-handle').addEventListener('dblclick',e=>{if(!e.target.closest('button')&&innerWidth>850)setMaximized(!win.classList.contains('maximized'));});
  byId('window-handle').addEventListener('pointerdown',e=>{
    if(e.target.closest('button')||e.button!==0||innerWidth<=850||win.classList.contains('maximized'))return;
    const r=win.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,dx,dy,left:r.left,top:r.top,width:r.width,height:r.height};
    e.currentTarget.setPointerCapture(e.pointerId);
  });
  byId('window-handle').addEventListener('pointermove',e=>{
    if(!drag)return;
    const moveX=Math.max(8-drag.left,Math.min(innerWidth-8-drag.left-drag.width,e.clientX-drag.x));
    const moveY=Math.max(8-drag.top,Math.min(innerHeight-105-drag.top,e.clientY-drag.y));
    dx=drag.dx+moveX;dy=drag.dy+moveY;win.style.transform=`translate(${dx}px,${dy}px)`;
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>byId('window-handle').addEventListener(event,()=>drag=null));
  window.addEventListener('resize',()=>{dx=dy=0;win.style.transform='';if(innerWidth<=850)setMaximized(false);});
  start.addEventListener('click',()=>{menu.hidden=!menu.hidden;start.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('a').focus();});
  document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!start.contains(e.target))closeMenu();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){closeMenu();start.focus();}});
  function updateTheme(){const dark=root.dataset.theme==='dark';byId('theme-toggle').querySelector('span').textContent=dark?'Daylight':'Evening';byId('theme-toggle').setAttribute('aria-label',dark?'Switch to daylight theme':'Switch to evening theme');document.querySelector('meta[name="theme-color"]').content=dark?'#142e46':'#15759c';draw();}
  byId('theme-toggle').addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';save('aero-theme',root.dataset.theme);updateTheme();});
  function updateClock(){
    const date=new Date(),parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(date);
    const h=Number(parts.find(p=>p.type==='hour').value),m=Number(parts.find(p=>p.type==='minute').value);
    const time=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
    byId('task-time').textContent=time;byId('task-time').dateTime=date.toISOString();
    byId('task-date').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',day:'2-digit',month:'2-digit',year:'numeric'}).format(date);
    byId('year').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',year:'numeric'}).format(date);
  }
  updateClock();setInterval(updateClock,30000);

  // Lab: exact beta_0 and beta_1 at the selected filtration scale.
  const canvas=byId('topology'),ctx=canvas.getContext('2d'),slider=byId('scale'),shapeSelect=byId('cloud-shape');
  const stats=document.querySelector('.lab-stats'),play=byId('animate-lab');
  let points=AeroTopology.cloud('ring'),model=null,w=0,h=0,playing=false,raf=0,lastFrame=0,labVisible=false;
  function recalculate(){model=AeroTopology.complex(points,Number(slider.value)/100);byId('scale-value').value=(Number(slider.value)/100).toFixed(2);byId('components').textContent=model.components;byId('loops').textContent=model.loops;byId('edges').textContent=model.edges.length;draw();}
  function draw(){
    if(!ctx||!w||!h||!model)return;
    ctx.clearRect(0,0,w,h);const dark=root.dataset.theme==='dark';
    const scale=Math.min(w/2.8,h/2.6);const p=points.map(v=>({x:w/2+v.x*scale,y:h/2-v.y*scale}));
    ctx.fillStyle=dark?'#5fbedc':'#71c8da';ctx.globalAlpha=.055;
    for(const [a,b,c] of model.triangles){ctx.beginPath();ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y);ctx.lineTo(p[c].x,p[c].y);ctx.closePath();ctx.fill();}
    ctx.strokeStyle=dark?'#81cce5':'#358ba8';ctx.lineWidth=1;ctx.globalAlpha=.45;ctx.beginPath();
    for(const [a,b] of model.edges){ctx.moveTo(p[a].x,p[a].y);ctx.lineTo(p[b].x,p[b].y);}ctx.stroke();ctx.globalAlpha=1;
    for(const v of p){ctx.beginPath();ctx.arc(v.x,v.y,3.6,0,Math.PI*2);ctx.fillStyle=dark?'#b8edff':'#207d9e';ctx.fill();ctx.lineWidth=1;ctx.strokeStyle=dark?'#1d526c':'#f2feff';ctx.stroke();}
  }
  function resizeCanvas(){if(!canvas||!ctx)return;const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  function stopLab(){playing=false;cancelAnimationFrame(raf);play.textContent='Play scale';play.setAttribute('aria-pressed','false');stats.setAttribute('aria-live','polite');}
  function tick(time){if(!playing||!labVisible||document.hidden){stopLab();return;}if(time-lastFrame>110){lastFrame=time;slider.value=Number(slider.value)+1;if(Number(slider.value)>=240){recalculate();stopLab();return;}recalculate();}raf=requestAnimationFrame(tick);}
  slider.addEventListener('input',()=>{stopLab();recalculate();});
  shapeSelect.addEventListener('change',()=>{stopLab();points=AeroTopology.cloud(shapeSelect.value);recalculate();});
  byId('reset-lab').addEventListener('click',()=>{stopLab();shapeSelect.value='ring';points=AeroTopology.cloud('ring');slider.value=35;recalculate();});
  play.addEventListener('click',()=>{if(playing){stopLab();return;}playing=true;lastFrame=0;if(Number(slider.value)>=240)slider.value=0;stats.setAttribute('aria-live','off');play.textContent='Pause';play.setAttribute('aria-pressed','true');raf=requestAnimationFrame(tick);});
  new ResizeObserver(resizeCanvas).observe(canvas);
  new IntersectionObserver(entries=>{labVisible=entries[0].isIntersecting;if(!labVisible)stopLab();else resizeCanvas();}).observe(canvas);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopLab();});
  matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',stopLab);
  recalculate();updateTheme();navigate(location.hash.slice(1)||'about',{history:false,focus:false,track:false});
})();
