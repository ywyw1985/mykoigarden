/*
 * Canvas adaptation of the top-view koi width profile and selected colour
 * palettes from Koi Pond Garden by Sourany Phomhome (MIT, 2026).
 * The full notice is included in virtual-pond-LICENSE.txt.
 */
const widths = [[0,.007],[.015,.03],[.05,.06],[.1,.077],[.17,.087],[.27,.098],[.37,.1],[.5,.087],[.64,.063],[.78,.038],[.91,.021],[1,.013]];
const varieties = [
  { base:'#e8e4dc', red:'#e8481c', marks:[[.13,0,.09],[.38,-.011,.115],[.67,.002,.09]] },
  { base:'#e8e4dc', red:'#ea4d1e', marks:[[.13,.016,.09],[.4,0,.12],[.73,.01,.085]], ink:[[.32,-.046,.042],[.51,.027,.045],[.69,-.02,.032]] },
  { base:'#ebe8e2', red:'#d92a1b', marks:[[.125,0,.049]] },
  { base:'#f6ae1c', red:'#f6ae1c', marks:[] },
];
const tau = Math.PI * 2;
const initial = [[.28,.27,.48,162],[.71,.29,2.64,147],[.29,.72,-.39,143],[.70,.70,-2.71,157]];

function ellipse(ctx,x,y,rx,ry,angle,color) {
  ctx.beginPath();
  ctx.ellipse(x,y,rx,ry,angle,0,tau);
  ctx.fillStyle=color;
  ctx.fill();
}

function fishShape(ctx,fish,index,time) {
  const style=varieties[index];
  const wave=Math.sin(time*3+index);
  const sway=s => wave*.050*s*s + Math.sin(time*3+index-1.4)*.016*s*s*s;
  const xAt=s => .45-s;
  ctx.save();
  ctx.translate(fish.x,fish.y);
  ctx.rotate(fish.angle);
  ctx.scale(fish.length,fish.length);
  // The triangular caudal fin flexes about the narrow peduncle.
  const tail=sway(1);
  ctx.fillStyle=index===3?'#e9b54b':'#c7c6b4';
  ctx.beginPath();
  ctx.moveTo(-.53,tail);
  ctx.quadraticCurveTo(-.60,tail-.01,-.77,tail-.12);
  ctx.quadraticCurveTo(-.73,tail-.028,-.68,tail);
  ctx.quadraticCurveTo(-.75,tail+.044,-.77,tail+.12);
  ctx.quadraticCurveTo(-.61,tail+.033,-.53,tail);
  ctx.fill();
  for (const side of [-1,1]) {
    ctx.fillStyle=index===3?'#efbe61':'#d5d6c7';
    ctx.beginPath();
    ctx.moveTo(.22,side*.052);
    ctx.bezierCurveTo(.18,side*.13,.12,side*(.23+.012*wave),.052,side*.22);
    ctx.quadraticCurveTo(.01,side*.18,.09,side*.068);
    ctx.fill();
    ctx.strokeStyle='rgba(67,74,54,.25)';
    ctx.lineWidth=.0045;
    for (let ray=0;ray<4;ray++) {
      ctx.beginPath();ctx.moveTo(.17,side*.075);
      ctx.lineTo(.066+ray*.014,side*(.197-ray*.009));ctx.stroke();
    }
    ellipse(ctx,-.2,side*.084,.070,.025,side*-.64,index===3?'#e8b44b':'#c0c8b8');
  }
  const body=new Path2D();
  widths.forEach(([s,w],i) => i?body.lineTo(xAt(s),sway(s)+w):body.moveTo(xAt(s),w));
  for (const [s,w] of [...widths].reverse()) body.lineTo(xAt(s),sway(s)-w);
  body.closePath();
  ctx.fillStyle=style.base;
  ctx.fill(body);
  ctx.save();ctx.clip(body);
  for (const [s,y,r] of style.marks) {
    const tancho=index===2;
    ellipse(ctx,xAt(s),y+sway(s),r*(tancho?1:1.18),r,tancho?0:.3,style.red);
    if (!tancho) ellipse(ctx,xAt(s)-r*.57,y+r*.35+sway(s),r*.85,r*.72,-.58,style.red);
  }
  for (const [s,y,r] of style.ink||[]) ellipse(ctx,xAt(s),sway(s)+y,r*.9,r,-.77,'#1a201e');
  const sheen=ctx.createLinearGradient(0,-.11,0,.11);
  sheen.addColorStop(0,'rgba(0,33,29,.35)');sheen.addColorStop(.39,'rgba(255,255,239,.23)');
  sheen.addColorStop(.56,'rgba(255,255,224,.08)');sheen.addColorStop(1,'rgba(0,30,32,.40)');
  ctx.fillStyle=sheen;ctx.fill(body);
  ctx.strokeStyle='rgba(255,255,244,.45)';ctx.lineWidth=.006;
  ctx.beginPath();ctx.moveTo(.07,-.004);ctx.quadraticCurveTo(-.095,.013,-.25,sway(.7));ctx.stroke();
  ctx.restore();
  for (const side of [-1,1]) {
    ellipse(ctx,.347,side*.067,.014,.009,.1,'#292d27');
    ellipse(ctx,.352,side*.068,.004,.003,0,'#eee6ce');
  }
  ctx.restore();
}

function backdrop(width,height,ratio) {
  const bg=document.createElement('canvas');
  bg.width=Math.ceil(width*ratio);bg.height=Math.ceil(height*ratio);
  const ctx=bg.getContext('2d');
  ctx.scale(ratio,ratio);
  const water=ctx.createLinearGradient(0,0,width,height);
  water.addColorStop(0,'#4f8882');water.addColorStop(.52,'#2b6666');water.addColorStop(1,'#173f43');
  ctx.fillStyle=water;ctx.fillRect(0,0,width,height);
  // Fixed seed keeps the pool floor still between animation frames.
  let seed=24;
  const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
  for (let i=0;i<245;i++) {
    const x=random()*width,y=random()*height,r=3+random()*15;
    const tone=98+Math.floor(random()*64);
    ellipse(ctx,x,y,r,r*.65,random()*tau,'rgba('+tone+','+(tone+6)+','+(tone-12)+',.11)');
  }
  for (let i=0;i<29;i++) {
    const x=random()*width,y=random()*height;
    ctx.beginPath();ctx.moveTo(x-60,y+15);
    ctx.bezierCurveTo(x-29,y-4,x-6,y+3,x+26,y-11);
    ctx.strokeStyle='rgba(191,227,210,.12)';ctx.lineWidth=1+random()*2;ctx.stroke();
  }
  for (const [x,y,r,a] of [[.035,.12,40,.2],[.082,.052,35,2.4],[.965,.87,43,1.5],[.996,.76,29,-.7],[.895,.98,32,-2.33]]) {
    ctx.save();ctx.translate(x*width,y*height);ctx.rotate(a);
    ctx.fillStyle='#446e56';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,.14,tau-.18);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(168,190,122,.40)';ctx.lineWidth=1.4;
    for(let j=1;j<8;j++) {ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(j*.78)*r*.90,Math.sin(j*.78)*r*.90);ctx.stroke();}
    ctx.restore();
  }
  return bg;
}

export function openPond(root) {
  const canvas=root.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  if (!ctx) throw Error('Canvas unavailable');
  const frame=root.querySelector('.vp-frame');
  const buttons=root.querySelector('.vp-controls');
  const pause=root.querySelector('[data-pause]');
  const status=root.querySelector('[role="status"]');
  const selector=root.querySelector('select');
  const fish=initial.map(([, ,angle,length],i)=>({x:0,y:0,angle,length,phase:i*1.41}));
  const worldWidth=900;
  let worldHeight=490, backing, width=0, height=0, scale=1, started=false;
  let pellets=[], ripple=null, time=0, request=0, last=0, inView=true;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=motion.matches;
  function draw() {
    ctx.setTransform(1,0,0,1,0,0);
    ctx.drawImage(backing,0,0,canvas.width,canvas.height);
    ctx.setTransform(scale,0,0,scale,0,0);
    fish.forEach((f,i)=>{
      if (selector.value===String(i)) {
        ctx.beginPath();ctx.ellipse(f.x,f.y,f.length*.83,f.length*.31,f.angle,0,tau);
        ctx.strokeStyle='#f3e9ad';ctx.lineWidth=2.5;ctx.setLineDash([9,6]);ctx.stroke();ctx.setLineDash([]);
      }
      fishShape(ctx,f,i,time);
    });
    pellets.forEach(p=>ellipse(ctx,p.x,p.y,3.8,2.7,.3,'#e9b780'));
    if (ripple) {
      ctx.beginPath();ctx.ellipse(ripple.x,ripple.y,14+ripple.age*29,11+ripple.age*21,0,0,tau);
      ctx.strokeStyle='rgba(234,242,216,'+Math.max(0,.78-ripple.age*.37)+')';ctx.lineWidth=2;ctx.stroke();
    }
  }
  function resize() {
    const rect=frame.getBoundingClientRect();
    if (!rect.width || !rect.height || (width===rect.width && height===rect.height)) return;
    width=rect.width;height=rect.height;
    const oldHeight=worldHeight;
    worldHeight=worldWidth*height/width;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    scale=canvas.width/worldWidth;
    fish.forEach((f,i)=>{
      if (!started) { f.x=initial[i][0]*worldWidth; f.y=initial[i][1]*worldHeight; }
      else f.y*=worldHeight/oldHeight;
    });
    started=true;pellets=[];ripple=null;
    backing=backdrop(worldWidth,worldHeight,scale);
    draw();
  }
  function update(dt) {
    time+=dt;
    for (const p of pellets) p.age+=dt;
    pellets=pellets.filter(p=>p.age<14);
    if (ripple && (ripple.age+=dt)>2) ripple=null;
    fish.forEach((f,i)=>{
      let aimX=worldWidth*(.5+.33*Math.cos(time*.12+f.phase));
      let aimY=worldHeight*(.5+.28*Math.sin(time*.16+f.phase));
      let nearest=null, distance=Infinity;
      pellets.forEach(p=>{
        const d=Math.hypot(p.x-f.x,p.y-f.y);
        if(d<distance) {nearest=p;distance=d;}
      });
      if(nearest) {
        aimX=nearest.x;aimY=nearest.y;
        if(distance<f.length*.46) pellets.splice(pellets.indexOf(nearest),1);
      }
      const wanted=Math.atan2(aimY-f.y,aimX-f.x);
      const turn=Math.atan2(Math.sin(wanted-f.angle),Math.cos(wanted-f.angle));
      f.angle+=Math.max(-1.16*dt,Math.min(1.16*dt,turn));
      const speed=nearest?47:20+i*2;
      f.x=Math.max(40,Math.min(worldWidth-40,f.x+Math.cos(f.angle)*speed*dt));
      f.y=Math.max(40,Math.min(worldHeight-40,f.y+Math.sin(f.angle)*speed*dt));
    });
  }
  function tick(now) {
    if (!last || now-last>=32) {
      if (last) update(Math.min((now-last)/1000,.09));
      last=now;draw();
    }
    request=requestAnimationFrame(tick);
  }
  function sync() {
    if(request) cancelAnimationFrame(request);
    request=0;last=0;
    pause.textContent=paused?pause.dataset.resume:pause.dataset.pause;
    if(!paused && inView && !document.hidden) request=requestAnimationFrame(tick);
  }
  function feed(x,y) {
    pellets=Array.from({length:6},(_,i)=>({x:x+Math.cos(i*2.4)*i*2,y:y+Math.sin(i*2.4)*i*2,age:0}));
    ripple={x,y,age:0};
    status.textContent=paused?root.dataset.fedPaused:root.dataset.fed;
    draw();
  }
  canvas.addEventListener('pointerdown',event=>{
    const rect=canvas.getBoundingClientRect();
    feed(Math.max(35,Math.min(worldWidth-35,(event.clientX-rect.left)*worldWidth/rect.width)),
         Math.max(35,Math.min(worldHeight-35,(event.clientY-rect.top)*worldHeight/rect.height)));
  });
  root.querySelector('[data-feed]').addEventListener('click',()=>feed(worldWidth*.50,worldHeight*.50));
  pause.addEventListener('click',()=>{
    paused=!paused;sync();status.textContent=paused?root.dataset.still:root.dataset.live;
  });
  selector.addEventListener('change',()=>{
    status.textContent=selector.selectedOptions[0].dataset.desc;draw();
  });
  motion.addEventListener('change',event=>{
    if(event.matches) {paused=true;sync();status.textContent=root.dataset.still;}
  });
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();}).observe(canvas);
  }
  if('ResizeObserver' in window) new ResizeObserver(resize).observe(frame);
  else window.addEventListener('resize',resize);
  canvas.hidden=false;root.querySelector('.vp-poster').hidden=true;
  buttons.hidden=false;resize();sync();pause.focus();
  status.textContent=paused?root.dataset.still:root.dataset.live;
}
