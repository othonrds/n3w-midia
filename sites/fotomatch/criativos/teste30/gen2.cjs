const {chromium}=require('playwright');const fs=require('fs');const {S,OF}=require('./specs.cjs');
const css=fs.readFileSync('kit.css','utf8');
const html=s=>{const light=s.bg==='#fff';return `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="background:${s.bg}"><div class="hk${light?' dark':''}">${s.hook}</div>${s.mid}<div class="cta">${OF[s.of].btn} →</div></body></html>`};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});fs.mkdirSync('out2',{recursive:true});
const only=process.argv.slice(2);
for(const s of S){if(only.length&&!only.includes(s.id))continue;fs.writeFileSync('out2/'+s.id+'.html',html(s));await p.goto('file://'+process.cwd()+'/out2/'+s.id+'.html');await p.waitForTimeout(150);await p.screenshot({path:'out2/'+s.id+'.jpg',type:'jpeg',quality:86});}
await b.close();})();
