import json, pathlib, sys
src = pathlib.Path("/home/claude/n3w-midia/aero/produtos/simulados/questoes.json")
out = pathlib.Path(sys.argv[1]) / "index.html"
data = json.loads(src.read_text(encoding="utf-8"))
payload = json.dumps({"materias": data["materias"], "questoes": data["questoes"]}, ensure_ascii=False)
html = r"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>Simulados Banca ANAC · AERO</title>
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#0b1a30;--amber:#f5b21b;--muted:#5b6880;--line:#dde3ec;--ok:#1e8e4e;--bad:#c0392b}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,system-ui,sans-serif;background:#f5f7fa;color:#14213a;line-height:1.5}
header{background:var(--navy);color:#fff;padding:22px 18px;border-bottom:4px solid var(--amber)}
h1,h2{font-family:"Barlow Condensed",Inter,sans-serif;text-transform:uppercase;line-height:1.05}
header h1{font-size:28px}header p{color:#c9d4e6;font-size:14px;margin-top:4px}
.wrap{max-width:760px;margin:0 auto;padding:18px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px;margin-bottom:14px}
label{font-weight:600;font-size:14px;display:block;margin:10px 0 6px}
select,button{font:inherit}select{width:100%;padding:10px;border:1px solid var(--line);border-radius:8px;background:#fff}
.btn{display:inline-block;background:var(--amber);color:var(--navy);border:0;border-radius:10px;padding:13px 20px;font-family:"Barlow Condensed";font-weight:800;font-size:19px;text-transform:uppercase;cursor:pointer}
.btn.ghost{background:transparent;border:2px solid var(--navy)}
.meta{font-size:13px;color:var(--muted);display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}
.q{font-size:17px;font-weight:600;margin:6px 0 14px}
.opt{display:block;width:100%;text-align:left;background:#fff;border:2px solid var(--line);border-radius:10px;padding:12px 14px;margin:8px 0;cursor:pointer;font-size:15px}
.opt b{color:var(--navy);margin-right:8px}
.opt.ok{border-color:var(--ok);background:#e9f7ef}.opt.bad{border-color:var(--bad);background:#fdecea}
.exp{display:none;background:#fff8e6;border-left:4px solid var(--amber);border-radius:6px;padding:12px;margin-top:10px;font-size:14px}
.exp small{display:block;color:var(--muted);margin-top:6px}
.bar{height:8px;background:var(--line);border-radius:6px;overflow:hidden;margin-bottom:12px}.bar i{display:block;height:100%;background:var(--amber)}
.res h2{font-size:34px;color:var(--navy)}.big{font-family:"Barlow Condensed";font-weight:800;font-size:64px;color:var(--navy)}
table{width:100%;border-collapse:collapse;font-size:14px;margin-top:10px}td,th{padding:7px;border-bottom:1px solid var(--line);text-align:left}
.note{font-size:12px;color:var(--muted);margin-top:14px}
</style></head><body>
<header><div class="wrap" style="padding:0"><h1>Simulados Banca ANAC · PP e PC</h1><p>Kit AERO · Rafael Francisco, ex-Capitão Aviador da FAB e instrutor de voo</p></div></header>
<main class="wrap" id="app"></main>
<script>
const DATA=__DATA__;
const NOMES=Object.fromEntries(DATA.materias.map(m=>[m.id,m.nome]));
const app=document.getElementById('app');
let S=null;
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function hist(){try{return JSON.parse(localStorage.getItem('aero_sim_hist')||'[]')}catch(e){return[]}}
function home(){
 const mats=DATA.materias.map(m=>`<option value="${m.id}">${m.nome}</option>`).join('');
 const h=hist().slice(-5).reverse().map(x=>`<tr><td>${x.d}</td><td>${x.nivel}</td><td>${x.mat}</td><td><b>${x.ac}/${x.tot}</b></td></tr>`).join('');
 app.innerHTML=`<div class="card"><h2 style="font-size:24px">Monte seu simulado</h2>
 <label>Nível</label><select id="niv"><option value="PP">Piloto Privado (PP)</option><option value="PC">Piloto Comercial (PC)</option><option value="ALL">Todos</option></select>
 <label>Matéria</label><select id="mat"><option value="ALL">Todas as matérias</option>${mats}</select>
 <label>Quantidade</label><select id="qtd"><option>10</option><option selected>20</option><option>40</option><option value="999">Todas</option></select>
 <label>Modo</label><select id="modo"><option value="estudo">Estudo (mostra a explicação a cada questão)</option><option value="prova">Prova (resultado só no fim)</option></select>
 <div style="margin-top:18px"><button class="btn" onclick="start()">Começar</button></div></div>
 ${h?`<div class="card"><h2 style="font-size:20px">Seus últimos simulados</h2><table><tr><th>Data</th><th>Nível</th><th>Matéria</th><th>Acertos</th></tr>${h}</table></div>`:''}
 <p class="note">${DATA.questoes.length} questões originais, elaboradas com base no conteúdo programático da ANAC e nas normas vigentes (RBAC 61, RBAC 91, ICA 100-12). Não são questões oficiais de prova. Normas mudam: confira sempre a versão vigente.</p>`;
}
function start(){
 const niv=document.getElementById('niv').value,mat=document.getElementById('mat').value,qtd=+document.getElementById('qtd').value,modo=document.getElementById('modo').value;
 let qs=DATA.questoes.filter(q=>(niv==='ALL'||q.nivel===niv)&&(mat==='ALL'||q.materia===mat));
 if(!qs.length){alert('Não há questões para essa combinação.');return}
 qs=shuffle(qs).slice(0,qtd);
 S={qs,i:0,resp:[],modo,niv,mat};show();
}
function show(){
 const q=S.qs[S.i],pct=Math.round(S.i/S.qs.length*100);
 const opts=Object.entries(q.alternativas).map(([k,v])=>`<button class="opt" data-k="${k}" onclick="pick('${k}')"><b>${k}</b>${v}</button>`).join('');
 app.innerHTML=`<div class="card"><div class="bar"><i style="width:${pct}%"></i></div>
 <div class="meta"><span>Questão ${S.i+1} de ${S.qs.length}</span><span>${q.nivel} · ${NOMES[q.materia]||q.materia}</span></div>
 <div class="q">${q.enunciado}</div>${opts}
 <div class="exp" id="exp"><b>${''}</b><span id="expt"></span><small>Referência: ${q.referencia||'-'}</small></div>
 <div style="margin-top:14px;display:flex;gap:10px"><button class="btn" id="nx" style="display:none" onclick="next()">${S.i+1<S.qs.length?'Próxima':'Ver resultado'}</button><button class="btn ghost" onclick="if(confirm('Sair do simulado?'))home()">Sair</button></div></div>`;
}
function pick(k){
 if(S.resp[S.i])return; const q=S.qs[S.i]; S.resp[S.i]=k;
 if(S.modo==='estudo'){document.querySelectorAll('.opt').forEach(b=>{const kk=b.dataset.k;if(kk===q.correta)b.classList.add('ok');else if(kk===k)b.classList.add('bad')});
  const e=document.getElementById('exp');e.style.display='block';document.getElementById('expt').innerHTML=(k===q.correta?'<b>Correto.</b> ':'<b>Resposta certa: '+q.correta+'.</b> ')+q.explicacao;
  document.getElementById('nx').style.display='inline-block';}
 else next();
}
function next(){S.i++; if(S.i<S.qs.length)show(); else result()}
function result(){
 const ac=S.qs.filter((q,i)=>S.resp[i]===q.correta).length,tot=S.qs.length,p=Math.round(ac/tot*100);
 const by={};S.qs.forEach((q,i)=>{by[q.materia]=by[q.materia]||[0,0];by[q.materia][1]++;if(S.resp[i]===q.correta)by[q.materia][0]++});
 const rows=Object.entries(by).map(([m,[a,t]])=>`<tr><td>${NOMES[m]||m}</td><td>${a}/${t}</td><td>${Math.round(a/t*100)}%</td></tr>`).join('');
 const erros=S.qs.map((q,i)=>S.resp[i]!==q.correta?`<div class="card"><div class="meta"><span>${q.id}</span><span>${NOMES[q.materia]}</span></div><div class="q" style="font-size:15px">${q.enunciado}</div><p style="font-size:14px">Sua resposta: <b>${S.resp[i]||'-'}</b> · Correta: <b>${q.correta}</b> — ${q.alternativas[q.correta]}</p><div class="exp" style="display:block">${q.explicacao}<small>Referência: ${q.referencia||'-'}</small></div></div>`:'').join('');
 const h=hist();h.push({d:new Date().toLocaleDateString('pt-BR'),nivel:S.niv==='ALL'?'Todos':S.niv,mat:S.mat==='ALL'?'Todas':(NOMES[S.mat]||S.mat),ac,tot});try{localStorage.setItem('aero_sim_hist',JSON.stringify(h.slice(-30)))}catch(e){}
 app.innerHTML=`<div class="card res"><h2>Resultado</h2><div class="big">${p}%</div><p>${ac} acertos de ${tot}. A banca da ANAC costuma exigir 70% de acerto em cada matéria.</p>
 <table><tr><th>Matéria</th><th>Acertos</th><th>%</th></tr>${rows}</table>
 <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><button class="btn" onclick="home()">Novo simulado</button></div></div>
 ${erros?'<h2 style="font-size:22px;margin:18px 0 10px">Revise os erros</h2>'+erros:''}`;
}
home();
</script></body></html>"""
out.write_text(html.replace("__DATA__", payload), encoding="utf-8")
print(out, out.stat().st_size//1024, "KB")
