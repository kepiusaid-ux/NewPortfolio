(() => {
'use strict';
const W=960,H=540,FLOOR=490,MATT=434;
const root=document.querySelector('.development-anim');
const cv=root.querySelector('.da-scene');
const ctx=cv.getContext('2d');
let SCALE=1;

/* ---------- helpers ---------- */
const clamp=(x,a=0,b=1)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>{t=clamp(t);return t*t*(3-2*t)};
const seg=(x,a,b)=>clamp((x-a)/(b-a));
const smooth=(a,b,x)=>ease((x-a)/(b-a));
const mixPt=(p,q,t)=>({x:lerp(p.x,q.x,t),y:lerp(p.y,q.y,t)});
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hexC={};
function rgb(hex){let v=hexC[hex];if(!v){const n=parseInt(hex.slice(1),16);v=hexC[hex]=[n>>16&255,n>>8&255,n&255]}return v}
const mixA=(A,B,t)=>`rgb(${lerp(A[0],B[0],t)|0},${lerp(A[1],B[1],t)|0},${lerp(A[2],B[2],t)|0})`;
const mixC=(a,b,t)=>mixA(rgb(a),rgb(b),t);

/* ---------- ambient light: every room colour goes through C() ---------- */
const amb={n:0,w:0,d:1,key:'0_0'};
function setAmb(h){
  const d=smooth(5.6,7.4,h)*(1-smooth(17.4,19.6,h));
  const dawn=Math.exp(-Math.pow((h-6.4)/0.55,2)),dusk=Math.exp(-Math.pow((h-18.5)/0.7,2));
  amb.d=d;amb.n=1-d;amb.w=clamp(Math.max(dawn,dusk));
  amb.key=Math.round(amb.n*20)+'_'+Math.round(amb.w*10);
}
const tc=new Map();
function C(hex){
  const k=hex+amb.key;let v=tc.get(k);if(v)return v;
  const [r,g,b]=rgb(hex),n=amb.n,w=amb.w;
  const fr=lerp(1,.34,n)*lerp(1,1.03,w),fg=lerp(1,.42,n)*lerp(1,.85,w),fb=lerp(1,.72,n)*lerp(1,.66,w);
  v=`rgb(${clamp(r*fr+n*4,0,255)|0},${clamp(g*fg+n*7,0,255)|0},${clamp(b*fb+n*20,0,255)|0})`;
  if(tc.size>5000)tc.clear();
  tc.set(k,v);return v;
}
function rpath(x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function box(x,y,w,h,r,col){rpath(x,y,w,h,r/2);ctx.fillStyle=C(col);ctx.fill()}
function ell(x,y,rx,ry,col,a){ctx.globalAlpha=a==null?1:a;ctx.fillStyle=col.startsWith('#')?C(col):col;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,7);ctx.fill();ctx.globalAlpha=1}

/* ---------- window / sky ---------- */
const WX=340,WY=60,WW=250,WH=190;
const SKYK=[[0,'#050919','#101b45'],[5,'#0a1235','#26306c'],[6,'#39408a','#f0996c'],[7,'#6aa5ea','#ffd7a2'],[9,'#4a9ae8','#a8dcff'],[13,'#3d8fe6','#9dd7ff'],[17,'#5896e0','#ffd8a0'],[18.2,'#5b4b9f','#ff8d58'],[19.2,'#20275f','#6a3f7d'],[20.6,'#0a1235','#1a2350'],[24,'#050919','#101b45']].map(k=>[k[0],rgb(k[1]),rgb(k[2])]);
function skyAt(h){let i=0;while(i<SKYK.length-2&&h>=SKYK[i+1][0])i++;const a=SKYK[i],b=SKYK[i+1],t=clamp((h-a[0])/(b[0]-a[0]));return[mixA(a[1],b[1],t),mixA(a[2],b[2],t)]}
const stars=[];{const r=mulberry32(11);for(let i=0;i<55;i++)stars.push({x:WX+r()*WW,y:WY+r()*(WH-70),s:.6+r()*1.1,p:r()*6.28})}
const bld=[];{const r=mulberry32(5);let x=WX-10;while(x<WX+WW){const w=16+r()*26,hh=22+r()*40,wins=[];for(let yy=6;yy<hh-4;yy+=8)for(let xx=4;xx<w-4;xx+=7)if(r()<.55)wins.push([xx,yy]);bld.push({x,w,h:hh,wins});x+=w+(r()<.3?4:0)}}
const clouds=[{x:20,y:28,s:1,v:5},{x:150,y:64,s:.8,v:3.5},{x:260,y:40,s:1.2,v:4.5}];
function sunPos(h){const a=(h-6)/12*Math.PI;return{a,x:WX+WW/2-Math.cos(a)*WW*.46,y:WY+WH-30-Math.sin(a)*135,el:Math.sin(a)}}
function drawWindow(h,rt){
  const [top,bot]=skyAt(h),d=amb.d;
  ctx.save();ctx.beginPath();ctx.rect(WX,WY,WW,WH);ctx.clip();
  let g=ctx.createLinearGradient(0,WY,0,WY+WH);g.addColorStop(0,top);g.addColorStop(1,bot);ctx.fillStyle=g;ctx.fillRect(WX,WY,WW,WH);
  const sa=clamp((.6-d)/.6);
  if(sa>0){ctx.fillStyle='#fff';for(const s of stars){ctx.globalAlpha=sa*(.55+.45*Math.sin(rt*2+s.p));ctx.beginPath();ctx.arc(s.x,s.y,s.s,0,7);ctx.fill()}ctx.globalAlpha=1}
  // moon
  const m=((h-18+24)%24)/12;
  if(m>=0&&m<=1){const a=m*Math.PI,mx=WX+WW/2-Math.cos(a)*WW*.46,my=WY+WH-30-Math.sin(a)*130,al=clamp(Math.sin(a)*3)*clamp((.7-d)/.4);
    g=ctx.createRadialGradient(mx,my,4,mx,my,46);g.addColorStop(0,'rgba(220,230,255,.35)');g.addColorStop(1,'rgba(220,230,255,0)');
    ctx.globalAlpha=al;ctx.fillStyle=g;ctx.fillRect(mx-50,my-50,100,100);
    ctx.fillStyle='#f3f0dc';ctx.beginPath();ctx.arc(mx,my,12,0,7);ctx.fill();
    ctx.fillStyle='rgba(180,180,170,.45)';[[-4,-3,3],[4,3,2.4],[2,-6,1.6]].forEach(c=>{ctx.beginPath();ctx.arc(mx+c[0],my+c[1],c[2],0,7);ctx.fill()});ctx.globalAlpha=1}
  // sun
  const sp=sunPos(h);
  if(sp.a>-.15&&sp.a<Math.PI+.15){const el=clamp(sp.el*2);const col=mixC('#ff8a45','#fff4c8',el);
    g=ctx.createRadialGradient(sp.x,sp.y,6,sp.x,sp.y,80);g.addColorStop(0,col);g.addColorStop(1,'rgba(255,200,120,0)');
    ctx.globalAlpha=.55;ctx.fillStyle=g;ctx.fillRect(sp.x-85,sp.y-85,170,170);ctx.globalAlpha=1;
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(sp.x,sp.y,15,0,7);ctx.fill()}
  // clouds
  const cc=mixC('#2b3566','#ffffff',clamp(d*1.2)),warm=amb.w*.6;
  for(const c of clouds){const x=((c.x+rt*c.v)%(WW+140))-70+WX;ctx.globalAlpha=lerp(.4,.9,d);ctx.fillStyle=warm>.1?mixC('#ffffff','#ffb08a',warm):cc;
    [[0,0,15],[16,-6,18],[34,0,14],[18,4,16]].forEach(p=>{ctx.beginPath();ctx.arc(x+p[0]*c.s,WY+c.y+p[1]*c.s,p[2]*c.s,0,7);ctx.fill()});ctx.globalAlpha=1}
  // skyline
  ctx.fillStyle=mixC('#0a0f28','#6c82a8',d);
  for(const b of bld)ctx.fillRect(b.x,WY+WH-b.h,b.w,b.h+2);
  const nl=clamp((.75-d)/.5);
  if(nl>0){ctx.fillStyle='#ffd98a';ctx.globalAlpha=nl*.9;for(const b of bld)for(const w of b.wins)ctx.fillRect(b.x+w[0],WY+WH-b.h+w[1],3,4);ctx.globalAlpha=1}
  g=ctx.createLinearGradient(WX,WY,WX+WW,WY+WH);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(.35,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(WX,WY,WW,WH);
  ctx.restore();
  // frame
  const fc='#f1f3f9';
  box(WX-8,WY-8,WW+16,8,2,fc);box(WX-8,WY+WH,WW+16,8,2,fc);box(WX-8,WY-8,8,WH+16,2,fc);box(WX+WW,WY-8,8,WH+16,2,fc);
  box(WX+WW/3-2,WY,4,WH,1,fc);box(WX+WW*2/3-2,WY,4,WH,1,fc);box(WX,WY+WH*.58,WW,4,1,fc);
  box(WX-16,WY+WH+8,WW+32,8,3,'#dfe3ee');
  // curtains
  ctx.strokeStyle=C('#2e3a5c');ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(306,52);ctx.lineTo(624,52);ctx.stroke();
  ell(306,52,5,5,'#2e3a5c');ell(624,52,5,5,'#2e3a5c');
  for(const cx of[314,578]){box(cx,54,36,208,6,'#7f93c9');ctx.strokeStyle=C('#6478b4');ctx.lineWidth=2;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(cx+i*9,58);ctx.lineTo(cx+i*9,258);ctx.stroke()}}
}

/* ---------- room ---------- */
function drawWall(){
  let g=ctx.createLinearGradient(0,0,0,446);g.addColorStop(0,C('#e8ebf3'));g.addColorStop(1,C('#d8deeb'));
  ctx.fillStyle=g;ctx.fillRect(0,0,W,446);
  ctx.fillStyle=C('#bcc7de');ctx.fillRect(0,352,W,94);ctx.fillStyle=C('#aab6d2');ctx.fillRect(0,350,W,4);
  ctx.fillStyle=C('#f3f4f9');ctx.fillRect(0,438,W,10);
  g=ctx.createLinearGradient(0,448,0,H);g.addColorStop(0,C('#b98d63'));g.addColorStop(1,C('#94693f'));
  ctx.fillStyle=g;ctx.fillRect(0,448,W,H-448);
  ctx.strokeStyle=C('#84592f');ctx.lineWidth=1;ctx.globalAlpha=.5;
  for(const y of[466,486,510,536]){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
  ctx.globalAlpha=1;
}
function drawDecor(h,rt){
  // poster
  ctx.save();ctx.translate(30,0);
  box(128,108,112,84,3,'#2e3a5c');box(133,113,102,74,2,'#f2e3c4');
  ctx.fillStyle=C('#f2b135');ctx.beginPath();ctx.arc(205,138,10,0,7);ctx.fill();
  ctx.fillStyle=C('#4b62b3');ctx.beginPath();ctx.moveTo(133,187);ctx.lineTo(170,140);ctx.lineTo(205,187);ctx.fill();
  ctx.fillStyle=C('#2e3a5c');ctx.beginPath();ctx.moveTo(170,187);ctx.lineTo(207,150);ctx.lineTo(235,187);ctx.fill();ctx.restore();
  // clock
  ctx.fillStyle=C('#2e3a5c');ctx.beginPath();ctx.arc(650,116,30,0,7);ctx.fill();
  ctx.fillStyle=C('#f6f7fb');ctx.beginPath();ctx.arc(650,116,26,0,7);ctx.fill();
  ctx.strokeStyle=C('#2e3a5c');ctx.lineCap='round';
  for(let i=0;i<12;i++){const a=i/12*6.283;ctx.lineWidth=i%3?1:2;ctx.beginPath();ctx.moveTo(650+Math.sin(a)*21,116-Math.cos(a)*21);ctx.lineTo(650+Math.sin(a)*24,116-Math.cos(a)*24);ctx.stroke()}
  const ha=(h%12)/12*6.283,ma=(h%1)*6.283;
  ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(650,116);ctx.lineTo(650+Math.sin(ha)*13,116-Math.cos(ha)*13);ctx.stroke();
  ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(650,116);ctx.lineTo(650+Math.sin(ma)*20,116-Math.cos(ma)*20);ctx.stroke();
  // shelf
  box(694,196,246,6,2,'#8a6248');
  const bk=[['#3f5aa0',12,44],['#f2b135',10,38],['#7bb39a',14,48],['#c65d7b',11,36],['#2e3a5c',13,44],['#e8e3d4',9,40]];
  let x=702;for(const b of bk){box(x,196-b[2],b[1],b[2],2,b[0]);x+=b[1]+1}
  box(x+4,196-30,10,30,2,'#f2b135');
  box(846,196-34,26,34,2,'#2e3a5c');box(849,196-31,20,28,1,'#f2e3c4');
  box(902,196-16,20,16,3,'#c5754f');
  for(let i=0;i<5;i++){ctx.save();ctx.translate(912,196-16);ctx.rotate(-.9+i*.45+Math.sin(rt*.7+i)*.03);ell(0,-12,4,12,'#4f9a6b');ctx.restore()}
}
const BULBS=[];{const cols=['#ffd68a','#ffb3a7','#ffe9a8','#b9d7ff'];let k=0;for(let s=0;s<4;s++)for(let i=1;i<=7;i++){const t=i/8,x=s*240+240*t,y=(1-t)*(1-t)*22+2*(1-t)*t*60+t*t*22;BULBS.push({x,y:y+3,c:cols[k++%4],p:k*1.7})}}
function drawPlant(rt){
  box(311,452,30,38,5,'#c5754f');box(308,448,36,8,3,'#b4653f');
  const cols=['#4f9a6b','#6bb384','#3f8259'];
  for(let i=0;i<8;i++){ctx.save();ctx.translate(326,450);ctx.rotate(-1.15+i*.33+Math.sin(rt*.6+i)*.03);ell(0,-26-(i%3)*5,7,26+(i%3)*5,cols[i%3]);ctx.restore()}
}
function drawRug(){ell(740,514,196,22,'#3a4f96');ell(740,514,170,17,'#f2b135',.9);ell(740,514,160,14,'#3a4f96')}
function drawBed(bed){
  box(28,352,22,124,6,'#7a5a44');box(30,456,262,20,4,'#8a6a52');box(34,472,10,18,2,'#6b4d39');box(276,472,10,18,2,'#6b4d39');
  box(48,MATT,244,24,8,'#f4f1ea');box(54,416,64,22,10,'#ffffff');
}
function drawBlanket(bed,rt){
  const{q,bEnd}=bed,amp=lerp(7,27,q)+Math.sin(rt*1.6)*1.4*q,s=lerp(66,136,q);
  ctx.beginPath();ctx.moveTo(s,MATT+4);
  ctx.bezierCurveTo(s+6,MATT-amp*.9,s+26,MATT-amp,s+52,MATT-amp*.95);
  ctx.bezierCurveTo(s+90,MATT-amp*.9,bEnd-60,MATT-amp*1.05,bEnd-24,MATT-amp*.55);
  ctx.bezierCurveTo(bEnd-10,MATT-amp*.3,bEnd,MATT-amp*.1,bEnd,MATT+6);
  ctx.lineTo(bEnd,MATT+26);ctx.lineTo(s,MATT+22);ctx.closePath();
  ctx.fillStyle=C('#4b62b3');ctx.fill();
  ctx.strokeStyle=C('#6b82cf');ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(s+8,MATT+12);ctx.lineTo(bEnd-6,MATT+14);ctx.stroke();
}
const CT=390,MUGC={x:436,y:376},BTN={x:451,y:356},PLATE={x:505,y:378};
function drawSteam(x,y,a,rt){
  ctx.strokeStyle='rgba(255,255,255,'+(.55*a)+')';ctx.lineWidth=2;ctx.lineCap='round';
  for(let i=0;i<3;i++){ctx.beginPath();for(let j=0;j<=10;j++){const yy=y-j*2.6,xx=x+(i-1)*5+Math.sin(rt*3+j*.6+i*2)*2.4*(j/10+.3);j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy)}ctx.globalAlpha=a*(1-.0);ctx.stroke()}
  ctx.globalAlpha=1;
}
function drawMug(x,y,steam,rt){
  if(steam>0)drawSteam(x,y-10,steam,rt);
  ctx.strokeStyle=C('#f4efe4');ctx.lineWidth=3;ctx.beginPath();ctx.arc(x+9,y,5,-1.3,1.3);ctx.stroke();
  box(x-8,y-8,16,16,3,'#f4efe4');ctx.fillStyle=C('#3b5bdb');ctx.fillRect(x-8,y-1,16,4);
}
function drawSandwich(x,y,p){
  const s=.55+.45*p;ctx.save();ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle=C('#e8c48b');ctx.beginPath();ctx.moveTo(-12,6);ctx.lineTo(12,6);ctx.lineTo(0,-9);ctx.closePath();ctx.fill();
  ctx.fillStyle=C('#79b25f');ctx.fillRect(-9,0,18,2);ctx.fillStyle=C('#e0553f');ctx.fillRect(-8,2.5,16,2);
  ctx.fillStyle=C('#c9a067');ctx.fillRect(-12,5,24,2);ctx.restore();
}
function drawCounter(info,rt){
  const X=400;
  box(X,CT+8,146,92,4,'#41598f');box(X-6,CT,158,10,3,'#efe7d8');
  ctx.strokeStyle=C('#33477a');ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X+73,CT+14);ctx.lineTo(X+73,CT+96);ctx.stroke();
  box(X+62,CT+40,6,16,2,'#c9d2ea');box(X+78,CT+40,6,16,2,'#c9d2ea');
  // machine
  box(414,CT-84,44,78,6,'#2a303f');box(410,CT-90,52,12,5,'#39415a');box(418,CT-6,36,6,2,'#1a1e29');
  ctx.fillStyle=C('#111');ctx.fillRect(432,CT-52,8,8);
  const brewing=info.coffee&&info.coffee.pour>0;
  ell(451,CT-70,3,3,brewing?'#5ee0a0':'#7a3b3b');ell(451,CT-36,4,4,'#c9d2ea');
  // plate + food
  ell(505,CT-3,20,3.5,'#ffffff');
  if(info.foodOnPlate)drawSandwich(505,CT-12,1);
  // succulent
  box(526,CT-16,14,16,3,'#c5754f');ell(533,CT-22,8,7,'#6bb384');
  // mug on counter
  if(info.mug==='counter'){
    if(brewing){ctx.strokeStyle=C('#5a3a26');ctx.lineWidth=2.5;ctx.setLineDash([3,2]);ctx.lineDashOffset=-rt*30;ctx.beginPath();ctx.moveTo(436,CT-44);ctx.lineTo(436,MUGC.y-8);ctx.stroke();ctx.setLineDash([])}
    drawMug(MUGC.x,MUGC.y,info.coffee?info.coffee.steam:0,rt);
  }
}
function drawChair(cx){
  ell(cx,488,36,5,'#000000',.15);
  ctx.strokeStyle=C('#262c3f');ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-30,482);ctx.lineTo(cx+30,482);ctx.stroke();
  for(const dx of[-30,0,30])ell(cx+dx,486,4,4,'#262c3f');
  box(cx-3,448,6,34,2,'#262c3f');box(cx-26,440,52,10,5,'#343c57');box(cx-34,372,12,68,6,'#343c57');box(cx-31,392,6,28,3,'#4a5478');
}
function drawFloorLamp(){
  ell(612,488,18,4,'#000000',.15);ell(612,486,14,4,'#262c3f');
  ctx.strokeStyle=C('#262c3f');ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(612,486);ctx.lineTo(612,254);ctx.quadraticCurveTo(612,236,648,242);ctx.stroke();
  ctx.fillStyle=C('#f2b135');ctx.beginPath();ctx.moveTo(640,240);ctx.lineTo(660,240);ctx.lineTo(676,274);ctx.lineTo(624,274);ctx.closePath();ctx.fill();
}
/* ---------- character rig ---------- */
const TORSO=62,L1=42,L2=42,A1=36,A2=34;
const STAND_Y=FLOOR-82;
const SEATX=660,SEATY=434,KBN={x:722,y:397},KBF={x:737,y:398},DESK_MUG={x:695,y:398};
const REST_N=[8,60],REST_F=[4,60];
function ik(ax,ay,tx,ty,l1,l2,bend){
  let dx=tx-ax,dy=ty-ay,d=Math.hypot(dx,dy);const m=l1+l2-.01;
  if(d>m){dx*=m/d;dy*=m/d;d=m}if(d<.001)d=.001;
  const a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a)),ux=dx/d,uy=dy/d;
  return{jx:ax+ux*a-uy*bend*h,jy:ay+uy*a+ux*bend*h,ex:ax+dx,ey:ay+dy};
}
function rig(b){
  const{hx,hy,th,dir}=b,tilt=b.tilt||0;
  const Sx=-Math.sin(th)*TORSO,Sy=hy-Math.cos(th)*TORSO,Hx=Sx-Math.sin(th)*20,Hy=Sy-Math.cos(th)*20,ha=-th+tilt;
  const toW=(lx,ly)=>({x:hx+dir*lx,y:ly});
  return{S:toW(Sx,Sy),Hc:toW(Hx,Hy),rel:(f,d)=>toW(Sx+f,Sy+d),relA:a=>toW(Sx+a[0],Sy+a[1]),
    head:(ax,ay)=>toW(Hx+ax*Math.cos(ha)-ay*Math.sin(ha),Hy+ax*Math.sin(ha)+ay*Math.cos(ha))};
}
function limb(pts,w,col){ctx.strokeStyle=C(col);ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.stroke()}
function shoe(x,y,col){ctx.fillStyle=C(col);ctx.beginPath();ctx.ellipse(x+5,y-4.5,10.5,5.2,0,0,7);ctx.fill();ctx.fillStyle=C('#aeb4c6');ctx.fillRect(x-5,y-1.6,20,1.8)}
function drawHead(p,rt){
  const mood=p.mood||'neutral',eo=p.eo==null?1:p.eo,mo=p.mouth||0;
  ctx.fillStyle=C('#e2a77c');ctx.beginPath();ctx.arc(0,0,16.5,0,7);ctx.fill();
  ctx.beginPath();ctx.ellipse(16.4,2,2.6,3,0,0,7);ctx.fill();
  ctx.fillStyle=C('#2a1c18');ctx.beginPath();ctx.moveTo(-16.5,7);ctx.bezierCurveTo(-21,-14,-6,-23,7,-19.5);ctx.bezierCurveTo(14,-18,17.5,-10,16.5,-4);ctx.bezierCurveTo(12,-9,3,-10,-4,-6);ctx.bezierCurveTo(-8,-3,-9,3,-7,9);ctx.closePath();ctx.fill();
  ctx.fillStyle=C('#cf936a');ctx.beginPath();ctx.arc(-3,3,3.8,0,7);ctx.fill();
  ctx.strokeStyle=C('#1e2436');ctx.lineWidth=1.7;ctx.lineCap='round';rpath(3.5,-7.5,12,10,3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(3.5,-4.5);ctx.lineTo(-6,-4);ctx.stroke();
  ctx.fillStyle=ctx.strokeStyle=C('#1a1420');
  const ex=10.5,ey=-2.6;
  if(eo>.7){ctx.beginPath();ctx.arc(ex,ey,1.8,0,7);ctx.fill()}
  else if(eo>.25){ctx.beginPath();ctx.ellipse(ex,ey+.5,1.9,.9,0,0,7);ctx.fill()}
  else{ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(ex-2.4,ey+.6);ctx.lineTo(ex+2.4,ey+.6);ctx.stroke()}
  ctx.lineWidth=1.5;ctx.beginPath();
  if(mood==='think'){ctx.moveTo(6,-11);ctx.lineTo(14,-13.5)}else if(mood==='frown'){ctx.moveTo(6,-11.5);ctx.lineTo(14,-8.8)}else{ctx.moveTo(6,-10.5);ctx.lineTo(14,-10.5)}
  ctx.stroke();
  ctx.beginPath();
  if(mo>.05){ctx.fillStyle=C('#6b2b2b');ctx.ellipse(10.5,9.5,2.2+1.6*mo,1.2+3*mo,0,0,7);ctx.fill()}
  else if(mood==='happy'||mood==='calm'){ctx.moveTo(6.5,8);ctx.quadraticCurveTo(10.5,mood==='happy'?13.5:11.5,14.5,7.5);ctx.stroke()}
  else if(mood==='frown'){ctx.moveTo(6.5,11.5);ctx.quadraticCurveTo(10.5,7.5,14.5,10.5);ctx.stroke()}
  else if(mood==='sleep'){ctx.fillStyle=C('#6b2b2b');ctx.ellipse(10.5,9.8,1.8,1.3,0,0,7);ctx.fill()}
  else{ctx.moveTo(7,9);ctx.lineTo(13.5,9);ctx.stroke()}
  if(p.hp){ctx.strokeStyle=C('#2c3350');ctx.lineWidth=3.2;ctx.beginPath();ctx.arc(-1,0,19,3.5,5.6);ctx.stroke();
    ctx.fillStyle=C('#2c3350');ctx.beginPath();ctx.ellipse(-3,3,6.5,8.5,0,0,7);ctx.fill();ctx.fillStyle=C('#5b8cff');ctx.beginPath();ctx.ellipse(-3,3,3.4,5,0,0,7);ctx.fill()}
}
function drawPerson(p,rt){
  const{hx,hy,th,dir}=p,tilt=p.tilt||0;
  if(!p.noShadow)ell(hx,FLOOR+3,36,6,'#000000',.16);
  ctx.save();ctx.translate(hx,0);ctx.scale(dir,1);
  const lx=w=>(w-hx)*dir;
  const S={x:-Math.sin(th)*TORSO,y:hy-Math.cos(th)*TORSO},sh={x:S.x,y:S.y+2},hip={x:0,y:hy};
  const fl=ik(0,hy,lx(p.feet.f.x),p.feet.f.y,L1,L2,-1),nl=ik(0,hy,lx(p.feet.n.x),p.feet.n.y,L1,L2,-1);
  const fa=ik(sh.x,sh.y,lx(p.hands.f.x),p.hands.f.y,A1,A2,1),na=ik(sh.x,sh.y,lx(p.hands.n.x),p.hands.n.y,A1,A2,1);
  const aa=p.armAlpha==null?1:p.armAlpha;
  // far arm & leg
  if(aa>0){ctx.globalAlpha=aa;limb([sh,{x:fa.jx,y:fa.jy},{x:fa.ex,y:fa.ey}],11,'#d99a22');ell(fa.ex,fa.ey,5.4,5.4,'#cf936a');ctx.globalAlpha=1}
  limb([hip,{x:fl.jx,y:fl.jy},{x:fl.ex,y:fl.ey}],15,'#252f4b');shoe(fl.ex,fl.ey,'#d5d8e2');
  // torso
  ell(0,hy+2,9,9,'#2e3a5c');
  ctx.strokeStyle=C('#f2b135');ctx.lineWidth=30;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,hy);ctx.lineTo(S.x,S.y);ctx.stroke();
  const mx=S.x*.4,my=lerp(hy,S.y,.4);ctx.save();ctx.translate(mx,my);ctx.rotate(-th);ctx.strokeStyle=C('#d99a22');ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(9,0);ctx.stroke();ctx.restore();
  ctx.save();ctx.translate(S.x,S.y);ctx.rotate(-th);ell(0,-1,14,6.5,'#d99a22');ctx.restore();
  // near leg
  limb([hip,{x:nl.jx,y:nl.jy},{x:nl.ex,y:nl.ey}],15,'#2e3a5c');shoe(nl.ex,nl.ey,'#f3f4f8');
  // head
  ctx.save();ctx.translate(S.x-Math.sin(th)*20,S.y-Math.cos(th)*20);ctx.rotate(-th+tilt);drawHead(p,rt);ctx.restore();
  // near arm
  if(aa>0){ctx.globalAlpha=aa;limb([sh,{x:na.jx,y:na.jy},{x:na.ex,y:na.ey}],11,'#f2b135');ell(na.ex,na.ey,5.4,5.4,'#e2a77c');ctx.globalAlpha=1}
  ctx.restore();
  return{nh:{x:hx+dir*na.ex,y:na.ey}};
}

/* ---------- schedule ---------- */
const PH=[
['sleep',0,7.0,'Asleep'],['wake',7.0,7.5,'Waking up'],['getup',7.5,7.7,'Getting up'],['walk1',7.7,8.0,'Off to make coffee'],['coffee',8.0,8.6,'Making coffee'],
['walk2',8.6,9.2,'Coffee in hand, back to the desk'],['sit1',9.2,9.35,'Sitting down'],['code',9.35,12.3,''],['stand1',12.3,12.45,'Time for lunch'],['walk3',12.45,12.7,'Time for lunch'],
['lunch',12.7,13.5,'Eating lunch'],['walk4',13.5,13.75,'Back to work'],['sit2',13.75,13.9,'Sitting down'],['code',13.9,17.3,''],['stand2',17.3,17.45,'Taking a break'],
['walk5',17.45,17.7,'Heading to the window'],['sunset',17.7,18.5,'Watching the sunset'],['walk6',18.5,18.65,'Dinner time'],['dinner',18.65,19.4,'Eating dinner'],
['walk7',19.4,19.7,'Back to work'],['sit3',19.7,19.85,'Sitting down'],['code',19.85,22.4,''],['stand3',22.4,22.55,'Calling it a day'],['walk8',22.55,23.3,'Heading to bed'],
['sitbed',23.3,23.45,'Winding down'],['lie',23.45,23.8,'Lights out'],['sleep',23.8,24.01,'Asleep']];
const WALK={walk1:[285,385,1,0],walk2:[385,652,1,1],walk3:[652,545,-1,0],walk4:[545,652,1,0],walk5:[652,590,-1,0],walk6:[590,545,-1,0],walk7:[545,652,1,0],walk8:[652,285,-1,0]};
const DESKC={seatX:660,seatY:434,seatTh:-.1,fN:50,fF:40,standX:652};
const BEDC={seatX:262,seatY:422,seatTh:-.05,fN:22,fF:12,standX:285};
const mk=(b,feet,hands,ex)=>Object.assign({},b,{feet,hands},ex||{});
function standFeet(hx,dir){return{n:{x:hx+dir*10,y:FLOOR},f:{x:hx+dir*-8,y:FLOOR}}}
function trans(cfg,s,dir){
  const e=ease(s),hx=lerp(cfg.seatX,cfg.standX,e),hy=lerp(cfg.seatY,STAND_Y,e),th=lerp(cfg.seatTh,-.02,e)-.4*Math.sin(Math.PI*e);
  const b={hx,hy,th,dir,tilt:lerp(.05,0,e)};
  return{b,e,feet:{n:{x:hx+dir*lerp(cfg.fN,10,e),y:FLOOR},f:{x:hx+dir*lerp(cfg.fF,-8,e),y:FLOOR}}};
}
function walkPose(x,dir,dist,carry,af){
  const ph=dist/112*Math.PI*2,hy=STAND_Y+3*af*Math.cos(2*ph)-1.5*af;
  const b={hx:x,hy,th:-.03-.03*af,dir,tilt:0},R=rig(b);
  const gf=(p,st)=>({x:x+dir*lerp(st,26*Math.cos(p),af),y:FLOOR-af*Math.max(0,-Math.sin(p))*15});
  const sw=22*af;
  return mk(b,{n:gf(ph,10),f:gf(ph+Math.PI,-8)},{n:carry?R.rel(34,40):R.rel(REST_N[0]+sw*Math.cos(ph+Math.PI),60),f:R.rel(REST_F[0]+sw*Math.cos(ph),60)},{mood:'neutral',eo:1});
}
function bedPose(u,eo,yawn,stretch){
  const e=ease(u),hx=lerp(170,262,e),hy=lerp(424,422,e),th=lerp(1.5,-.05,e);
  const b={hx,hy,th,dir:1,tilt:lerp(0,.05,e)},R=rig(b);
  const feet={n:{x:lerp(hx+83,hx+22,e),y:lerp(hy+9,FLOOR,e)},f:{x:lerp(hx+80,hx+12,e),y:lerp(hy+7,FLOOR,e)}};
  const rn=mixPt(R.rel(28,14),R.rel(22,52),e),rf=mixPt(R.rel(22,16),R.rel(12,54),e);
  return mk(b,feet,{n:mixPt(rn,R.rel(8,-64),stretch),f:mixPt(rf,R.rel(2,-62),stretch)},{eo,mouth:yawn,mood:eo<.3?'sleep':'neutral',armAlpha:clamp((.85-(1-e))/.15),noShadow:true});
}
let lastTerm={s:'idle',t:99};
function codePose(h,rt,info){
  const CY=15,k=Math.floor(rt/CY),c=rt-k*CY;
  const wThink=smooth(5.6,6.1,c)*(1-smooth(8.1,8.6,c));
  const reach=smooth(12.6,13.0,c)*(1-smooth(14.3,14.6,c)),sip=k%2===0;
  const lift=sip?smooth(13.0,13.5,c)*(1-smooth(13.9,14.3,c)):0;
  const wStretch=sip?0:smooth(12.6,13.2,c)*(1-smooth(14,14.6,c)),wSip=sip?reach:0;
  const amp=(1-wThink)*(1-wSip)*(1-wStretch);
  let term;
  if(c>=12.2&&c<13.7)term={s:'run',t:c-12.2};
  else if(c>=13.7)term={s:k%3===1?'fail':'pass',t:c-13.7};
  else term={s:k>0?((k-1)%3===1?'fail':'pass'):'idle',t:99};
  lastTerm=term;
  let mood='neutral',label='Writing code';
  if(wThink>.5){mood='think';label='Thinking it through'}
  else if(term.s==='run'){label='Running tests'}
  else if(term.s==='pass'&&term.t<99){mood='happy';label='Tests pass'}
  else if(term.s==='fail'&&term.t<99){mood='frown';label='A test failed'}
  const th=lerp(-.1+.02*Math.sin(rt*1.3)+.05*wThink,.38,wStretch);
  const tilt=.05+.02*Math.sin(rt*2.1)+.12*wThink-.2*wStretch-.14*lift+(info.hp?.035*Math.sin(rt*7.5):0);
  const b={hx:SEATX,hy:SEATY,th,dir:1,tilt},R=rig(b);
  const kn={x:KBN.x+amp*2*Math.sin(rt*5.3),y:KBN.y-amp*Math.abs(Math.sin(rt*11+.5))*2.6};
  const kf={x:KBF.x+amp*2*Math.sin(rt*4.1+1),y:KBF.y-amp*Math.abs(Math.sin(rt*9+2))*2.6};
  let hn=mixPt(kn,R.head(13,17),wThink),hf=kf;
  const mugPos=mixPt(DESK_MUG,R.head(19,9),lift);
  hn=mixPt(hn,{x:mugPos.x+1,y:mugPos.y+1},wSip);
  hn=mixPt(hn,R.head(-14,-9),wStretch);hf=mixPt(hf,R.head(-17,-6),wStretch);
  info.term=term;info.lift=lift;info.mugPos=mugPos;info.typing=amp>.85&&wThink<.1;info.label=label;
  const sipping=sip&&c>13.4&&c<13.9;
  return mk(b,{n:{x:SEATX+50,y:FLOOR},f:{x:SEATX+40,y:FLOOR}},{n:hn,f:hf},{mood,eo:(rt%4.3<.13)?0:1,mouth:sipping?.4:0,hp:info.hp});
}
function poseAt(h,rt){
  const info={label:'Away, back at 9:00 am',screen:smooth(9.0,9.2,h)*(1-smooth(17.55,17.85,h)),typing:false,term:lastTerm,mug:'desk',chairAway:1,foodOnPlate:false,bed:{q:0,bEnd:272},zzz:false,coffee:null,lift:0,mugPos:null,hp:false,food:null,present:h>=8.25&&h<18.4};
  if(!info.present)return{pose:null,info};
  const blink=(rt%4.3<.13)?0:1;
  let pose;
  if(h<9.0){
    const t=seg(h,8.25,9.0),e=.35*t+.65*ease(t),x=lerp(250,652,e),sp=.35+.65*6*t*(1-t),af=clamp((sp-.3)/.4);
    pose=walkPose(x,1,Math.abs(x-250),0,af);pose.eo=blink;info.label='Arriving at the desk';
  }else if(h<9.15){
    const t=seg(h,9.0,9.15),T=trans(DESKC,1-t,1),R=rig(T.b);info.chairAway=1-ease(t);info.label='Sitting down';
    pose=mk(T.b,T.feet,{n:mixPt(KBN,R.relA(REST_N),T.e),f:mixPt(KBF,R.relA(REST_F),T.e)},{eo:blink,mood:'neutral'});
  }else if(h<17.5){
    info.chairAway=0;info.hp=amb.n>.5;pose=codePose(h,rt,info);
  }else if(h<17.65){
    const t=seg(h,17.5,17.65),T=trans(DESKC,t,1),R=rig(T.b);info.chairAway=ease(t);info.label='Calling it a day';
    pose=mk(T.b,T.feet,{n:mixPt(KBN,R.relA(REST_N),T.e),f:mixPt(KBF,R.relA(REST_F),T.e)},{eo:blink,mood:'happy'});
  }else{
    const t=seg(h,17.65,18.4),e=.35*t+.65*ease(t),x=lerp(652,250,e),sp=.35+.65*6*t*(1-t),af=clamp((sp-.3)/.4);
    pose=walkPose(x,-1,Math.abs(x-652),0,af);pose.eo=blink;pose.mood='happy';info.label='Heading home';
  }
  return{pose,info};
}
/* ---------- code editor on the monitor ---------- */
const SW=300,SH=210,sc=document.createElement('canvas');sc.width=SW*2;sc.height=SH*2;
const sx=sc.getContext('2d');
const crng=mulberry32(42);let depth=1;
const ri=(a,b)=>a+Math.floor(crng()*(b-a+1));
function genLine(){
  const r=crng();let kind;
  if(r<.1)kind='c';else if(r<.26&&depth>0)kind='close';else if(r<.42&&depth<3)kind='open';else kind='s';
  if(kind==='close')depth--;
  const cells=[],P=(n,col)=>{for(let i=0;i<n;i++)cells.push({c:col,h:2.4+crng()*2.4,a:.7+crng()*.3})},G=()=>cells.push(null);
  for(let i=0;i<depth*4;i++)cells.push(null);
  if(kind==='c'){P(2,'#5f668a');G();let n=ri(2,4);while(n--){P(ri(2,8),'#5f668a');G()}}
  else if(kind==='close'){P(1,'#89ddff');if(crng()<.4)P(1,'#89ddff')}
  else if(kind==='open'){P(ri(2,8),'#c792ea');G();P(1,'#89ddff');P(ri(2,8),'#e6e9f2');if(crng()<.5){P(1,'#89ddff');G();P(ri(1,3),'#f78c6c')}P(1,'#89ddff');G();P(1,'#89ddff');depth++}
  else{const v=ri(0,3);
    if(v===0){P(5,'#c792ea');G();P(ri(3,9),'#e6e9f2');G();P(1,'#89ddff');G();P(ri(4,10),'#82aaff');P(1,'#89ddff');P(ri(3,9),'#c3e88d');P(1,'#89ddff')}
    else if(v===1){P(ri(3,8),'#e6e9f2');P(1,'#89ddff');P(ri(4,9),'#82aaff');P(1,'#89ddff');P(ri(2,7),'#e6e9f2');P(1,'#89ddff');G();P(ri(1,3),'#f78c6c');P(1,'#89ddff')}
    else if(v===2){P(6,'#c792ea');G();P(ri(3,9),'#e6e9f2');P(1,'#89ddff');P(ri(4,9),'#82aaff');P(2,'#89ddff')}
    else{P(ri(3,8),'#e6e9f2');G();P(1,'#89ddff');G();P(ri(3,10),'#c3e88d')}}
  return{cells,n:cells.length};
}
const ed={lines:[],first:1,cur:null,typed:0,scroll:0,acc:0};
for(let i=0;i<16;i++)ed.lines.push(genLine());ed.cur=genLine();
const TREE=[[0,60],[1,44],[1,52],[1,38],[0,50],[1,46],[1,34],[0,40]];
function updateEditor(dt,typing){
  if(typing){ed.acc+=dt*16;while(ed.acc>=1){ed.acc--;ed.typed++;if(ed.typed>=ed.cur.n){ed.lines.push(ed.cur);ed.cur=genLine();ed.typed=0;if(ed.lines.length>60){ed.lines.shift();ed.first++;ed.scroll=Math.max(0,ed.scroll-1)}}}}
  const target=Math.max(0,ed.lines.length-12);ed.scroll+=(target-ed.scroll)*Math.min(1,dt*8);
}
const MONO='7px ui-monospace,Menlo,Consolas,monospace';
function drawEditor(rt){
  sx.setTransform(2,0,0,2,0,0);sx.fillStyle='#1a1d2e';sx.fillRect(0,0,SW,SH);
  sx.fillStyle='#12141f';sx.fillRect(0,0,SW,14);
  ['#ff6b6b','#ffd166','#5ee0a0'].forEach((c,i)=>{sx.fillStyle=c;sx.beginPath();sx.arc(8+i*9,7,2.4,0,7);sx.fill()});
  sx.fillStyle='#1a1d2e';sx.fillRect(40,2,52,12);sx.fillStyle='#8a90b4';sx.font=MONO;sx.textBaseline='middle';sx.fillText('app.ts',46,8.5);
  sx.fillStyle='#5f668a';sx.fillText('api.ts',100,8.5);
  sx.fillStyle='#151726';sx.fillRect(0,14,44,SH-26);
  TREE.forEach((t,i)=>{const y=22+i*11;sx.fillStyle=t[0]?'#5f668a':'#8a90b4';sx.globalAlpha=.7;sx.fillRect(5+t[0]*7,y,3,4);sx.fillRect(11+t[0]*7,y,t[1]*.5,4);sx.globalAlpha=1;if(i===2){sx.fillStyle='rgba(91,140,255,.2)';sx.fillRect(0,y-3,44,10)}});
  // editor
  sx.save();sx.beginPath();sx.rect(44,14,SW-44,136);sx.clip();
  const ROW=9.5,x0=72,top=ed.scroll,ai=ed.lines.length;
  for(let i=Math.floor(top);i<=Math.floor(top)+15;i++){
    const y=18+(i-top)*ROW,ln=i<ai?ed.lines[i]:(i===ai?ed.cur:null);if(!ln)continue;
    if(i===ai){sx.fillStyle='#232741';sx.fillRect(66,y-1,SW,ROW)}
    sx.fillStyle='#4a5070';sx.font=MONO;sx.textAlign='right';sx.fillText(String(ed.first+i),62,y+4);sx.textAlign='left';
    const n=i===ai?ed.typed:ln.n;
    for(let j=0;j<n;j++){const c=ln.cells[j];if(!c)continue;sx.globalAlpha=c.a;sx.fillStyle=c.c;sx.fillRect(x0+j*3.6,y+7-c.h,2.7,c.h)}
    sx.globalAlpha=1;
    if(i===ai&&(ed.acc>0||Math.floor(rt*2)%2===0)){sx.fillStyle='#ffffff';sx.fillRect(x0+n*3.6,y,1.4,8)}
  }
  sx.restore();
  // terminal
  const T=lastTerm;sx.fillStyle='#12141f';sx.fillRect(44,150,SW-44,48);
  const tc=T.s==='pass'&&T.t<99?'#5ee0a0':T.s==='fail'&&T.t<99?'#ff6b6b':null;
  sx.fillStyle=tc||'#272c48';sx.fillRect(44,150,SW-44,1.5);
  sx.font=MONO;sx.fillStyle='#8a90b4';sx.fillText('$ npm test',50,161);
  if(T.s==='run'){sx.strokeStyle='#82aaff';sx.lineWidth=1.6;sx.beginPath();sx.arc(54,175,3.4,rt*8,rt*8+4.4);sx.stroke();sx.fillStyle='#e6e9f2';sx.fillText('running 24 tests...',62,175)}
  else if(T.s==='pass'){sx.strokeStyle='#5ee0a0';sx.lineWidth=2;sx.beginPath();sx.moveTo(51,175);sx.lineTo(54,178);sx.lineTo(59,172);sx.stroke();sx.fillStyle='#5ee0a0';sx.fillText('24 passed',64,175);sx.fillStyle='#5f668a';sx.fillText('done in 1.2s',50,187)}
  else if(T.s==='fail'){sx.strokeStyle='#ff6b6b';sx.lineWidth=2;sx.beginPath();sx.moveTo(51,172);sx.lineTo(58,179);sx.moveTo(58,172);sx.lineTo(51,179);sx.stroke();sx.fillStyle='#ff6b6b';sx.fillText('1 failed, 23 passed',64,175);sx.fillStyle='#5f668a';sx.fillText('expected 4, got 5',50,187)}
  else{sx.fillStyle='#e6e9f2';sx.fillText('$',50,175);if(Math.floor(rt*2)%2===0)sx.fillRect(58,171,4,7)}
  sx.fillStyle='#3b5bdb';sx.fillRect(0,SH-12,SW,12);sx.fillStyle='#ffffff';sx.fillText('main',6,SH-5.5);sx.textAlign='right';sx.fillText('TypeScript',SW-6,SH-5.5);sx.textAlign='left';
}
/* ---------- desk & monitor ---------- */
const MON={L:792,R:942,Tl:280,Bl:390,Tr:266,Br:394};
function drawDesk(info,rt){
  box(682,406,272,9,3,'#8a6248');box(690,415,7,75,2,'#6d4b37');box(936,415,7,75,2,'#6d4b37');
  box(850,415,86,62,3,'#7a5640');box(856,422,74,22,2,'#8a6248');box(856,448,74,22,2,'#8a6248');box(886,430,14,4,2,'#c9d2ea');box(886,456,14,4,2,'#c9d2ea');
  box(708,401,74,5,2,'#2a303f');ctx.fillStyle=C('#4a5478');ctx.fillRect(712,402,66,1.4);
  box(794,402,12,5,2,'#2a303f');
  // stand
  box(861,386,10,20,2,'#262c3f');ell(866,406,24,3.5,'#262c3f');
  // bezel
  const m=MON,p=5;
  ctx.fillStyle=C('#20263a');ctx.beginPath();ctx.moveTo(m.L-p,m.Tl-p);ctx.lineTo(m.R+p,m.Tr-p);ctx.lineTo(m.R+p,m.Br+p);ctx.lineTo(m.L-p,m.Bl+p);ctx.closePath();ctx.fill();
  box(m.L-2,m.Tl-14,14,14,1,'#ffd166');box(m.L+14,m.Tl-11,14,14,1,'#ff9ec0');
  // screen
  const a=info.screen;
  if(a>.01){drawEditor(rt);}
  ctx.save();ctx.beginPath();ctx.moveTo(m.L,m.Tl);ctx.lineTo(m.R,m.Tr);ctx.lineTo(m.R,m.Br);ctx.lineTo(m.L,m.Bl);ctx.closePath();ctx.clip();
  ctx.fillStyle='#0a0c14';ctx.fillRect(m.L,m.Tr-2,m.R-m.L,m.Bl-m.Tr+10);
  if(a>.01){ctx.globalAlpha=a;const w=m.R-m.L;
    for(let i=0;i<w;i++){const t=i/w,top=lerp(m.Tl,m.Tr,t),bot=lerp(m.Bl,m.Br,t);ctx.drawImage(sc,t*SW*2,0,SW*2/w*1.3,SH*2,m.L+i,top,1.3,bot-top)}
    ctx.globalAlpha=1}
  const g=ctx.createLinearGradient(m.L,m.Tl,m.R,m.Br);g.addColorStop(0,'rgba(255,255,255,.10)');g.addColorStop(.4,'rgba(255,255,255,0)');ctx.fillStyle=g;ctx.fillRect(m.L,m.Tr-2,m.R-m.L,m.Bl-m.Tr+10);
  ctx.restore();
  if(a<.5){ell(866,m.Bl+7,1.8,1.8,Math.floor(rt)%4===0?'#ffb04a':'#7a4b1a')}
}
/* ---------- additive lights ---------- */
function drawLights(h,rt,info,pose){
  const n=amb.n,d=amb.d;
  ctx.save();ctx.globalCompositeOperation='lighter';
  // sunbeam on floor
  const sp=sunPos(h);
  if(false){ctx.save();ctx.beginPath();ctx.rect(0,448,W,H-448);ctx.clip();const off=(sp.x-465)*.5;
    ctx.fillStyle='rgba(255,236,180,'+(.17*d*clamp(sp.el*2))+')';ctx.beginPath();ctx.moveTo(350+off,452);ctx.lineTo(590+off,452);ctx.lineTo(570+off*1.4,530);ctx.lineTo(310+off*1.4,530);ctx.closePath();ctx.fill();ctx.restore()}
  // floor lamp
  const L=smooth(8.9,9.1,h)*(1-smooth(17.6,17.75,h));
  if(L>.01){const k=L*(.4+.6*n);
    let g=ctx.createLinearGradient(740,272,620,480);g.addColorStop(0,'rgba(255,214,140,'+(.36*k)+')');g.addColorStop(1,'rgba(255,214,140,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(716,274);ctx.lineTo(764,274);ctx.lineTo(720,488);ctx.lineTo(430,488);ctx.closePath();ctx.fill();
    g=ctx.createRadialGradient(740,276,0,740,276,52);g.addColorStop(0,'rgba(255,230,170,'+(.85*k)+')');g.addColorStop(1,'rgba(255,214,140,0)');ctx.fillStyle=g;ctx.fillRect(680,222,120,110)}
  // monitor glow
  if(info.screen>.05){const k=info.screen*(.35+.65*n),g=ctx.createRadialGradient(867,332,10,867,332,190);
    g.addColorStop(0,'rgba(120,165,255,'+(.26*k)+')');g.addColorStop(1,'rgba(120,165,255,0)');ctx.fillStyle=g;ctx.fillRect(660,150,300,300);
    if(pose&&pose.hx>600&&pose.dir===1){const hc=rig(pose).Hc,g2=ctx.createRadialGradient(hc.x+8,hc.y,2,hc.x+8,hc.y,46);g2.addColorStop(0,'rgba(140,180,255,'+(.22*k)+')');g2.addColorStop(1,'rgba(140,180,255,0)');ctx.fillStyle=g2;ctx.fillRect(hc.x-40,hc.y-46,100,92)}}
  ctx.restore();
}
function drawZ(rt){
  ctx.fillStyle='rgba(235,240,255,.9)';ctx.font='italic 700 18px sans-serif';
  for(let i=0;i<3;i++){const t=((rt*.35+i/3)%1);ctx.globalAlpha=Math.sin(t*Math.PI)*.9;ctx.font='italic 700 '+(11+t*12)+'px sans-serif';ctx.fillText('z',118+t*28,404-t*46)}
  ctx.globalAlpha=1;
}
function drawNotes(rt,pose){
  ctx.fillStyle=ctx.strokeStyle='rgba(120,150,255,.9)';ctx.lineWidth=1.5;
  for(let i=0;i<3;i++){const t=(rt*.4+i/3)%1,x=pose.hx-16-t*20+Math.sin(t*9+i)*6,y=326-t*56;ctx.globalAlpha=Math.sin(t*Math.PI);
    ctx.beginPath();ctx.ellipse(x,y,3.4,2.5,-.4,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(x+3,y-1);ctx.lineTo(x+3,y-11);ctx.lineTo(x+7,y-8);ctx.stroke()}
  ctx.globalAlpha=1;
}
/* ---------- frame ---------- */
const ZOOM=960/660,VX=300,VY=135;
const SHELF=[];{const r=mulberry32(21),pal=['#3f5aa0','#f2b135','#7bb39a','#c65d7b','#2e3a5c','#e8e3d4','#8d6fd1','#e0553f'];
  for(let row=0;row<4;row++){const bs=[];let x=0;while(x<124){const w=8+Math.floor(r()*7),h=30+Math.floor(r()*24);if(row===1&&x>60&&x<92){x+=32;continue}bs.push({x,w,h,c:pal[Math.floor(r()*pal.length)],lean:r()<.1});x+=w+(r()<.15?7:1)}SHELF.push(bs)}}
function drawBookshelf(rt){
  const X=582,Y=226,Wd=150,Ht=262;
  ell(X+Wd/2,488,Wd/2+6,5,'#000000',.14);
  box(X,Y,Wd,Ht,4,'#7a5a44');box(X+6,Y+6,Wd-12,Ht-18,2,'#5a4232');
  for(let row=0;row<4;row++){
    const py=Y+6+row*64,base=py+58;
    for(const b of SHELF[row]){if(b.x+b.w>Wd-14)continue;ctx.save();ctx.translate(X+9+b.x,base);if(b.lean)ctx.rotate(.14);box(0,-b.h,b.w,b.h,1.5,b.c);ctx.fillStyle=C('#ffffff');ctx.globalAlpha=.25;ctx.fillRect(1.5,-b.h+5,b.w-3,2);ctx.globalAlpha=1;ctx.restore()}
    box(X+3,base,Wd-6,6,2,'#8a6a52');
  }
  box(X+62,Y+6+64+18,32,40,2,'#2e3a5c');box(X+65,Y+6+64+21,26,34,1,'#f2e3c4');ell(X+78,Y+6+64+33,5,5,'#f2b135');
}
function drawCertificate(){
  box(815,166,104,76,3,'#5a4232');box(819,170,96,68,2,'#c9a24b');box(821,172,92,64,1,'#f6efd9');
  ctx.strokeStyle=C('#c9a24b');ctx.lineWidth=1;ctx.strokeRect(825.5,176.5,83,55);
  ctx.textAlign='center';ctx.fillStyle=C('#2e3a5c');
  ctx.font='700 7px Georgia,"Times New Roman",serif';ctx.fillText('CERTIFICATION',867,187);
  ctx.font='700 24px Georgia,"Times New Roman",serif';ctx.fillText('FES',867,210);
  ctx.textAlign='left';
  ctx.fillStyle=C('#8b93ad');ctx.fillRect(838,215,58,1.6);ctx.fillRect(846,219,42,1.6);
  ctx.strokeStyle=C('#2e3a5c');ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(832,227);ctx.bezierCurveTo(836,221,840,232,844,226);ctx.bezierCurveTo(848,221,850,230,856,225);ctx.stroke();
  ctx.fillStyle=C('#b8332b');ctx.beginPath();ctx.moveTo(890,228);ctx.lineTo(886,236);ctx.lineTo(890,234);ctx.lineTo(894,236);ctx.lineTo(892,228);ctx.fill();
  ell(891,225,6,6,'#b8332b');ell(891,225,3.4,3.4,'#e4b84f');
}
function drawClock(cx,cy,r,h){
  ctx.fillStyle=C('#2e3a5c');ctx.beginPath();ctx.arc(cx,cy,r+4,0,7);ctx.fill();
  ctx.fillStyle=C('#f6f7fb');ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.fill();
  ctx.strokeStyle=C('#2e3a5c');ctx.lineCap='round';
  for(let i=0;i<12;i++){const a=i/12*6.283;ctx.lineWidth=i%3?1.2:2.4;ctx.beginPath();ctx.moveTo(cx+Math.sin(a)*(r-6),cy-Math.cos(a)*(r-6));ctx.lineTo(cx+Math.sin(a)*(r-2),cy-Math.cos(a)*(r-2));ctx.stroke()}
  const ha=(h%12)/12*6.283,ma=(h%1)*6.283;
  ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(ha)*r*.5,cy-Math.cos(ha)*r*.5);ctx.stroke();
  ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.sin(ma)*r*.78,cy-Math.cos(ma)*r*.78);ctx.stroke();
  ell(cx,cy,3,3,'#2e3a5c');
}
function frame(h,rt,dt){
  setAmb(h);const{pose,info}=poseAt(h,rt);
  if(dt>0)updateEditor(dt,info.typing);
  ctx.setTransform(SCALE*ZOOM,0,0,SCALE*ZOOM,-VX*SCALE*ZOOM,-VY*SCALE*ZOOM);ctx.clearRect(VX,VY,W,H);
  drawWall();
  ctx.save();ctx.translate(440,240);ctx.scale(.85,.85);ctx.translate(-465,-155);drawWindow(h,rt);ctx.restore();
  drawClock(657,174,28,h);drawCertificate();drawBookshelf(rt);
  ctx.save();ctx.translate(124,0);drawPlant(rt);ctx.restore();ctx.save();ctx.translate(1390,0);ctx.scale(-1,1);drawFloorLamp();ctx.restore();
  drawRug();drawChair(SEATX-26*info.chairAway);drawDesk(info,rt);
  const steam=info.present?.4:0;
  if(info.lift<.05)drawMug(DESK_MUG.x,DESK_MUG.y,steam,rt);
  if(pose)drawPerson(pose,rt);
  if(info.lift>=.05&&info.mugPos)drawMug(info.mugPos.x,info.mugPos.y,info.lift*.2,rt);
  if(pose&&pose.hp&&info.typing)drawNotes(rt,pose);
  drawLights(h,rt,info,pose);
  return info;
}
/* ---------- UI ---------- */
const DAY=96;let hour=8.2,rt=0,playing=true,last=performance.now();
function resize(){const r=cv.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(320,r.width||W);cv.width=Math.round(w*dpr);cv.height=Math.round(w*dpr*H/W);SCALE=cv.width/W}
function render(dt){frame(hour,rt,dt)}
function tick(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(playing){hour=(hour+dt*24/DAY)%24;rt+=dt;render(dt)}
  requestAnimationFrame(tick);
}
if(window.ResizeObserver)new ResizeObserver(()=>{resize();render(0)}).observe(cv);
resize();
const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce){hour=10.4;rt=3;playing=false}
render(0);
requestAnimationFrame(tick);
window.__dbg={frame,setSize:w=>{cv.width=w;cv.height=w*H/W;SCALE=w/W},setHour:h=>{hour=h}};
})();
