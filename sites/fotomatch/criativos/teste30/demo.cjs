const {chromium}=require('playwright');const U=require('./ui.cjs');const fs=require('fs');
const css=fs.readFileSync('kit.css','utf8');
const page=(bg,body)=>`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="background:${bg}">${body}</body></html>`;
const C={
d1:page('#fff',`<div class="hk dark">Ela respondeu em <em>2 minutos</em>. A mensagem foi escrita pela IA.</div>${U.phone(170,330,740,900,U.chat(1,'Lu',[['t','Hoje 21:31'],['m','pela foto na trilha eu deduzo: chegou no topo e pensou "ok agora quero um pastel". acertei?','hl'],['she','KKKKKK como vc sabe 😭'],['she','foi exatamente isso']]))}<div class="cta">Gerar minha mensagem <small>R$ 9,90</small></div>`),
d2:page('#111',`<div class="hk">De 0 para <em>99+ curtidas</em> trocando só as fotos.</div>${U.phone(170,320,740,920,U.curtidas('99+',[1,2,3,4,5,6]))}<div class="cta">Quero minhas fotos <small>R$ 9,90</small></div>`),
d3:page('linear-gradient(160deg,#2a0f22,#0d0610)',`<div class="hk">Quando o perfil está certo, <em>a caixa fica assim</em>.</div>${U.phone(170,320,740,920,U.mensagens([[1,'Lu'],[2,'Bia'],[3,'Mari'],[4,'Carol'],[5,'Nina']],[[6,'Júlia','oi! adorei sua foto da praia',1],[7,'Rafa','kkkk para, sério?',1],[8,'Gabi','sábado então? 😊',1],[2,'Bia','vc que tirou essa foto?',0]]))}<div class="cta">Arrumar meu perfil <small>R$ 9,90</small></div>`),
d4:page('#111',`${U.phone(110,60,860,1110,U.match(12,5),false,true)}<div class="cta">Ter mais matches <small>R$ 9,90</small></div>`),
};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1350}});
for(const [k,h] of Object.entries(C)){fs.writeFileSync(k+'.html',h);await p.goto('file://'+process.cwd()+'/'+k+'.html');await p.waitForTimeout(200);await p.screenshot({path:'out/'+k+'.jpg',type:'jpeg',quality:85});}
await b.close();})();
