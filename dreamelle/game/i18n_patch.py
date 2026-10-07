"""Dreamelle i18n layer. Usage: python3 i18n_patch.py <in.html> <out.html>
Adds auto language detection (phone language -> timezone -> English), a language chip on the splash,
a language list in Settings, and a DOM translation layer driven by i18n_data.py."""
import json, sys, re
sys.path.insert(0, __file__.rsplit('/', 1)[0])
from i18n_data import T, PAT

src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
CODES = ['pt', 'es', 'fr', 'de', 'it']
D = {c: {k: v[i] for k, v in T.items()} for i, c in enumerate(CODES)}
P = [[rx, {c: v[i] for i, c in enumerate(CODES)}] for rx, v in PAT]

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:90])
    s = s.replace(old, new)

js = r"""
/* Dreamelle i18n — detect language, translate rendered text in place. */
(function(){
'use strict';
const LANGS=[['en','English'],['pt','Português'],['es','Español'],['fr','Français'],['de','Deutsch'],['it','Italiano']];
const D=__D__, PAT=__P__.map(([r,m])=>[new RegExp(r),m]);
const KEY='dreamelle_lang';
const ok=c=>LANGS.some(l=>l[0]===c);
function detect(){
  try{ const s=localStorage.getItem(KEY); if(s&&ok(s)) return s; }catch(e){}
  try{ const q=new URLSearchParams(location.search).get('lang'); if(q&&ok(q)) return q; }catch(e){}
  const list=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||'en'];
  for(const l of list){ const c=String(l).slice(0,2).toLowerCase(); if(ok(c)) return c; }
  try{ const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||'';
    if(/Sao_Paulo|Fortaleza|Recife|Bahia|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Araguaina|Maceio|Noronha|Santarem|Lisbon|Luanda|Maputo/.test(tz)) return 'pt';
    if(/Madrid|Mexico|Bogota|Lima|Buenos_Aires|Argentina|Santiago|Caracas|Montevideo|Asuncion|La_Paz|Guayaquil|Panama|Costa_Rica|Guatemala|El_Salvador|Tegucigalpa|Managua|Santo_Domingo|Havana|Monterrey|Cancun|Tijuana/.test(tz)) return 'es';
    if(/Paris|Brussels|Luxembourg|Monaco|Abidjan|Dakar/.test(tz)) return 'fr';
    if(/Berlin|Vienna|Zurich|Busingen/.test(tz)) return 'de';
    if(/Rome|San_Marino|Vatican/.test(tz)) return 'it';
  }catch(e){}
  return 'en';
}
let lang=detect();
const orig=new WeakMap(), wrote=new WeakMap();
function tStr(core){
  if(lang==='en'||!core) return null;
  const d=D[lang]; if(Object.prototype.hasOwnProperty.call(d,core)) return d[core];
  for(const [rx,m] of PAT){ const g=core.match(rx); if(g){
    return m[lang].replace(/\{(t?)(\d)\}/g,(_,t,i)=>{ const v=g[+i]||''; return t?(Object.prototype.hasOwnProperty.call(d,v)?d[v]:v):v; });
  } }
  return null;
}
function tr(str){
  const m=String(str).match(/^(\s*)([\s\S]*?)(\s*)$/); const r=tStr(m[2]);
  return r==null?str:m[1]+r+m[3];
}
const ATTRS=['placeholder','aria-label','title'];
function doText(n){
  const p=n.parentNode; if(!p||p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||(p.closest&&p.closest('[data-noi18n]'))) return;
  if(wrote.get(n)!==n.data) orig.set(n,n.data);
  const src=orig.get(n), v=tr(src);
  if(n.data!==v){ n.data=v; }
  wrote.set(n,n.data);
}
function doEl(el){
  if(el.closest&&el.closest('[data-noi18n]')) return;
  for(const a of ATTRS){ if(!el.hasAttribute(a)) continue;
    const k='i18n'+a.replace('-',''), cur=el.getAttribute(a);
    if(el.dataset[k+'w']!==cur) el.dataset[k]=cur;
    const v=tr(el.dataset[k]); if(v!==cur) el.setAttribute(a,v); el.dataset[k+'w']=v; }
}
function walk(root){
  if(!root) return;
  if(root.nodeType===3){ doText(root); return; }
  if(root.nodeType!==1) return;
  doEl(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let n; while((n=w.nextNode())){ if(n.nodeType===3) doText(n); else doEl(n); }
}
let mo=null;
function start(){
  document.documentElement.lang=lang==='pt'?'pt-BR':lang;
  walk(document.body);
  if(mo) return;
  mo=new MutationObserver(recs=>{ for(const r of recs){
    if(r.type==='characterData'){ if(wrote.get(r.target)!==r.target.data) doText(r.target); }
    else r.addedNodes.forEach(walk);
  } });
  mo.observe(document.body,{childList:true,subtree:true,characterData:true});
}
function set(c){ if(!ok(c)) return; lang=c; try{ localStorage.setItem(KEY,c); }catch(e){} document.documentElement.lang=c==='pt'?'pt-BR':c; walk(document.body); }
const TAG={en:'Create your <em>dream</em> life.',pt:'Crie a vida dos seus <em>sonhos</em>.',es:'Crea la vida de tus <em>sueños</em>.',fr:'Crée la vie de tes <em>rêves</em>.',de:'Erschaffe dein <em>Traum</em>leben.',it:'Crea la vita dei tuoi <em>sogni</em>.'};
function tagline(){ return TAG[lang]||TAG.en; }
function label(){ return (LANGS.find(l=>l[0]===lang)||LANGS[0])[1]; }
window.I18N={LANGS, get lang(){return lang;}, set, start, t:tr, label, tagline, detected:detect};
if(document.body) start(); else document.addEventListener('DOMContentLoaded',start);
})();
""".replace('__D__', json.dumps(D, ensure_ascii=False, separators=(',', ':'))).replace('__P__', json.dumps(P, ensure_ascii=False, separators=(',', ':')))

# inject the module right after the art module (before the main game script)
i = s.find("window.Doll=Object.assign(window.Doll||{}, {dollSVG, LOOKS, ART, preload});\n})();")
assert i > 0
i = s.find('})();', i) + len('})();')
s = s[:i] + '\n' + js + s[i:]

css = """<style>
.langchip{position:absolute;z-index:4;top:calc(.7rem + var(--st));right:calc(4.4rem + var(--sr));display:flex;align-items:center;gap:.35rem;height:2.6rem;padding:0 .9rem;border-radius:1.3rem;background:rgba(255,255,255,.9);box-shadow:var(--shadow);font-weight:800;font-size:.85rem;color:var(--ink)}
.langchip svg{width:1.1rem;height:1.1rem;color:var(--pink)}
.langgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:.5rem;margin-top:.6rem}
.langgrid button{padding:.75rem .5rem;border-radius:.9rem;background:#fff;box-shadow:0 .2rem .6rem rgba(155,48,120,.15);font-weight:800;font-size:.95rem}
.langgrid button.sel{box-shadow:0 0 0 3px var(--pink),0 .3rem .8rem rgba(255,79,158,.35)}
select.lang{font:inherit;font-weight:800;padding:.4rem .6rem;border-radius:.7rem;border:2px solid var(--pink3);background:#fff;color:var(--ink)}
</style>
"""
j = s.find('</head>'); s = s[:j] + css + s[j:]

# globe icon
sub1("  arrow:'M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z'\n};",
     "  arrow:'M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z',\n  globe:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-3a15.7 15.7 0 0 0-1.4-3.6A8 8 0 0 1 18.9 8zM12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4zM4.3 14a8.2 8.2 0 0 1 0-4h3.4a16.5 16.5 0 0 0 0 4zm.8 2h3a15.7 15.7 0 0 0 1.4 3.6A8 8 0 0 1 5.1 16zm3-8h-3a8 8 0 0 1 4.4-3.6C8.9 5.5 8.4 6.7 8.1 8zM12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4zm2.3-6H9.7a14.7 14.7 0 0 1 0-4h4.6a14.7 14.7 0 0 1 0 4zm.2 5.6c.6-1.1 1.1-2.3 1.4-3.6h3a8 8 0 0 1-4.4 3.6zm1.8-5.6a16.5 16.5 0 0 0 0-4h3.4a8.2 8.2 0 0 1 0 4z'\n};")

# splash: language chip next to the settings gear
sub1("""      <button class="icon-btn" data-a="settings" aria-label="Settings" style="position:absolute;z-index:4;top:calc(.7rem + var(--st));right:calc(.9rem + var(--sr))">${ic('gear')}</button>
      <div class="foot">""",
     """      <button class="langchip" data-a="langpick" data-noi18n aria-label="Language">${ic('globe')}${I18N.label()}</button>
      <button class="icon-btn" data-a="settings" aria-label="Settings" style="position:absolute;z-index:4;top:calc(.7rem + var(--st));right:calc(.9rem + var(--sr))">${ic('gear')}</button>
      <div class="foot">""")

# settings: real language selector
sub1("""<div class="setrow"><b>Language<small>More languages coming soon</small></b><select class="lang" aria-label="Language"><option value="en" selected>English</option></select></div>""",
     """<div class="setrow"><b>Language<small>Choose your language</small></b><select class="lang" aria-label="Language" data-noi18n>${I18N.LANGS.map(([c,n])=>`<option value="${c}" ${I18N.lang===c?'selected':''}>${n}</option>`).join('')}</select></div>""")

# actions: language picker overlay + apply
sub1("  rotok(){ document.body.classList.add('rot-ok'); }",
     """  rotok(){ document.body.classList.add('rot-ok'); },
  langpick(){ sfx('tap'); overlay(`<button class="icon-btn x" data-a="closeov" aria-label="Close">${ic('close')}</button><h2>${ic('globe')} Choose your language</h2>
    <div class="langgrid" data-noi18n>${I18N.LANGS.map(([c,n])=>`<button class="${I18N.lang===c?'sel':''}" data-a="setlang" data-l="${c}">${n}</button>`).join('')}</div>`); },
  setlang(el){ const c=el.dataset.l; I18N.set(c); track('language_set',{lang:c,source:'splash'}); sfx('ok'); closeOverlay(); go(cur); }""")

sub1("document.addEventListener('click',e=>{ if(e.target.id==='overlay'",
     "document.addEventListener('change',e=>{ if(e.target.matches&&e.target.matches('select.lang')){ I18N.set(e.target.value); track('language_set',{lang:e.target.value,source:'settings'}); const back=cur; go(back); showSettings(); } });\ndocument.addEventListener('click',e=>{ if(e.target.id==='overlay'")

sub1('<div class="tagline">Create your <em>dream</em> life.</div>', '<div class="tagline" data-noi18n>${I18N.tagline()}</div>')
# report the language with game_start so the dashboard can split by language
sub1("play(){ track('game_start',{returning:!!S.created});", "play(){ track('game_start',{returning:!!S.created,lang:I18N.lang});")
sub1("const VERSION = '0.3.0';", "const VERSION = '0.3.1';")
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
