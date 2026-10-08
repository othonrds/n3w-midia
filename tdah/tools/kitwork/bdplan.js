// offline planner for Block Drop: finds a start board + scripted trays giving many clears
const N=8;
function norm(c){var mr=99,mc=99;c.forEach(function(p){mr=Math.min(mr,p[0]);mc=Math.min(mc,p[1])});return c.map(function(p){return [p[0]-mr,p[1]-mc]}).sort(function(a,b){return a[0]-b[0]||a[1]-b[1]})}
function rot(c){return norm(c.map(function(p){return [p[1],-p[0]]}))}
function mir(c){return norm(c.map(function(p){return [p[0],-p[1]]}))}
function variants(c,m){var out=[],seen={},cur=norm(c);for(var k=0;k<(m?2:1);k++){for(var r=0;r<4;r++){var key=JSON.stringify(cur);if(!seen[key]){seen[key]=1;out.push(cur)}cur=rot(cur)}cur=mir(cur)}return out}
function rect(h,w){var c=[];for(var r=0;r<h;r++)for(var q=0;q<w;q++)c.push([r,q]);return c}
var TYPES=[[rect(1,1),4],[rect(1,2),7],[rect(1,3),7],[[[0,0],[1,0],[1,1]],7],[rect(1,4),6],[rect(2,2),8],[[[0,0],[1,0],[2,0],[2,1]],5,1],[[[0,0],[0,1],[0,2],[1,1]],5],[[[0,0],[0,1],[1,1],[1,2]],4,1],[rect(1,5),4],[[[0,0],[1,0],[2,0],[2,1],[2,2]],4],[rect(2,3),4],[rect(3,3),3]].map(function(t){return {v:variants(t[0],t[2]),w:t[1]}});
const TW=TYPES.reduce((s,t)=>s+t.w,0);
function canPlace(B,c,r0,c0){for(const [a,b] of c){const r=r0+a,q=c0+b;if(r<0||q<0||r>=N||q>=N||B[r*N+q])return false}return true}
function fullLines(T){var rows=[],cols=[];for(var r=0;r<N;r++){var f=true;for(var q=0;q<N;q++)if(!T[r*N+q]){f=false;break}if(f)rows.push(r)}for(q=0;q<N;q++){f=true;for(r=0;r<N;r++)if(!T[r*N+q]){f=false;break}if(f)cols.push(q)}return [rows,cols]}
function apply(B,c,r0,c0,col){const T=B.slice();for(const [a,b] of c)T[(r0+a)*N+c0+b]=col;const L=fullLines(T);const n=L[0].length+L[1].length;L[0].forEach(r=>{for(let q=0;q<N;q++)T[r*N+q]=0});L[1].forEach(q=>{for(let r=0;r<N;r++)T[r*N+q]=0});return [T,n]}
function mulberry(a){return function(){a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
function nearFull(T){let s=0;for(let r=0;r<N;r++){let f=0;for(let q=0;q<N;q++)f+=T[r*N+q]?1:0;s+=f*f}for(let q=0;q<N;q++){let f=0;for(let r=0;r<N;r++)f+=T[r*N+q]?1:0;s+=f*f}return s}
function plan(seed){
  const R=mulberry(seed);let B=[];for(let i=0;i<64;i++)B.push(0);
  // dense lower area with gaps, sparse top
  for(let r=0;r<N;r++)for(let q=0;q<N;q++){const pr=r>=3?0.78:0.25;if(R()<pr)B[r*N+q]=1+Math.floor(R()*6)}
  for(let it=0;it<3;it++){const L=fullLines(B);L[0].forEach(r=>{B[r*N+Math.floor(R()*N)]=0});L[1].forEach(q=>{B[Math.floor(R()*N)*N+q]=0})}
  if(fullLines(B)[0].length+fullLines(B)[1].length)return null;
  const B0=B.slice();const trays=[];let total=0,clears=0,multi=0,combo=0,since=0,maxCombo=0;const steps=[];
  for(let t=0;t<4;t++){
    const tray=[];const used=new Set();
    for(let k=0;k<3;k++){
      let best=null;
      for(let ti=0;ti<TYPES.length;ti++){if(used.has(ti))continue;const T=TYPES[ti];
        for(let vi=0;vi<T.v.length;vi++){const c=T.v[vi];
          for(let r=0;r<N;r++)for(let q=0;q<N;q++){if(!canPlace(B,c,r,q))continue;const [B2,n]=apply(B,c,r,q,1);
            const sc=n*1000+c.length*25+nearFull(B2)*0.5+R()*30;if(!best||sc>best.sc)best={sc,ti,vi,r,q,n,B2,c}}}}
      if(!best)return null;used.add(best.ti);
      const col=Math.floor(R()*6);const [B3,n]=apply(B,best.c,best.r,best.q,col+1);B=B3;
      if(n){combo=since<3&&combo>0?combo+1:1;since=0;clears++;if(n>1)multi++;maxCombo=Math.max(maxCombo,combo)}else{since++;if(since>=3)combo=0}
      tray.push({ti:best.ti,vi:best.vi,col,c:best.c});steps.push({slot:k,r:best.r,q:best.q,n,combo});
    }
    trays.push(tray);
  }
  return {seed,B0,trays,steps,clears,multi,maxCombo,score:clears*10+multi*6+maxCombo*4};
}
let best=null;for(let s=1;s<3000;s++){const p=plan(s);if(p&&(!best||p.score>best.score))best=p}
// random values to force a tray: x, variant, col per piece
function rq(tray){const out=[];let cum=0;const cums=TYPES.map(t=>{const c=cum;cum+=t.w;return c});for(const p of tray){out.push((cums[p.ti]+TYPES[p.ti].w/2)/TW);out.push((p.vi+0.5)/TYPES[p.ti].v.length);out.push((p.col+0.5)/6)}return out}
best.rq=best.trays.map(rq);
console.error('seed',best.seed,'clears',best.clears,'multi',best.multi,'maxCombo',best.maxCombo,JSON.stringify(best.steps));
for(let r=0;r<N;r++)console.error(best.B0.slice(r*N,r*N+8).map(v=>v?'#':'.').join(''));
process.stdout.write(JSON.stringify(best));
