import { chromium } from '/home/claude/.npm-global/lib/node_modules/@playwright/mcp/node_modules/playwright/index.mjs';
import { CSS, renderLP } from './lp.js';
const F='/usr/share/fonts/truetype/google-fonts/';
const fonts=`@font-face{font-family:"Playfair Display";src:url(file://${F}Lora-Variable.ttf);font-weight:400 700}
@font-face{font-family:"Playfair Display";src:url(file://${F}Lora-Variable.ttf);font-weight:401}
@font-face{font-family:"Manrope";src:url(file://${F}Poppins-Regular.ttf);font-weight:400}
@font-face{font-family:"Manrope";src:url(file://${F}Poppins-Medium.ttf);font-weight:600}
@font-face{font-family:"Manrope";src:url(file://${F}Poppins-Bold.ttf);font-weight:800}`;
const L=[
 {k:'helena',d:{nome:'Dra. Helena Duarte',genero:'a',area:'previdenciario',cidade:'Fortaleza',uf:'CE',oab:'12.345',anos:'9',zap:'85999990000',atend:'Presencial e online',tpl:'classico',p:'#1B2A41',a:'#C9A227'}},
 {k:'rafael',d:{nome:'Dr. Rafael Moura',genero:'o',area:'trabalhista',cidade:'Recife',uf:'PE',oab:'23.456',anos:'7',zap:'81999990000',atend:'Presencial e online',tpl:'moderno',p:'#0F3D3E',a:'#E0B04A'}},
 {k:'camila',d:{nome:'Dra. Camila Rocha',genero:'a',area:'familia',cidade:'Belo Horizonte',uf:'MG',oab:'34.567',anos:'11',zap:'31999990000',atend:'Presencial e online',tpl:'minimal',p:'#3B1F2B',a:'#D9A5A0'}},
];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const [w,h,tag] of [[390,844,'mob'],[1280,800,'desk']]){
  const pg=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
  await pg.route('**/fonts.g*/**',r=>r.abort());
  for(const x of L){const o=renderLP(x.d);
    await pg.setContent(`<!doctype html><html><head><meta charset=utf-8><style>${fonts}body{margin:0}${CSS}</style></head><body><div class="${o.cls}" style="${o.style}">${o.html}</div></body></html>`,{waitUntil:'load'});
    await pg.waitForTimeout(300); await pg.screenshot({path:`lp-${x.k}-${tag}.png`});}
  await pg.close();}
await b.close();
