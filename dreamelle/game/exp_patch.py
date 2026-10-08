"""Dreamelle v0.5: A/B experiments + first-party event log.
Usage: python3 exp_patch.py index.html index.html

Experiments (fixed per device; force with ?x_<name>=<arm> for QA):
  pw_moment  end | peak | cliff   when the paywall first appears
             end   = end of Day 1 (control)
             peak  = also right after the first case is won (Day 1 continues if she says maybe later)
             cliff = end of Day 1 behind a cliffhanger scene (a designer's ruined gown, Day 2 teaser)
  pw_cta     founder | story | unlock   checkout button copy
  pw_value   plain | perday             price line: plain vs "about US$ 0.71 per day of story"
  pw_loss    off | on                   "your character and progress are saved" reassurance
  onb        full | short               intro slides vs straight to character creation
Every event goes to Supabase (dreamelle_events) with the device's arms and first-touch source,
and to the Meta Pixel as before. Read results with the view dreamelle_funnel.
"""
import json, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/'
MYSTERY = CDN + '226bfdae-4e94-491c-97c5-9a43e7760c06.webp'

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:90])
    s = s.replace(old, new)

NEW = {
 "Continue my story": ["Continuar minha história", "Continuar mi historia", "Continuer mon histoire", "Meine Geschichte fortsetzen", "Continua la mia storia"],
 "Unlock Days 2–7": ["Liberar Dias 2–7", "Desbloquear Días 2–7", "Débloquer les Jours 2 à 7", "Tage 2–7 freischalten", "Sblocca i Giorni 2–7"],
 "one-time · about US$ 0.71 per day of story": ["pagamento único · cerca de US$ 0,71 por dia de história", "pago único · unos US$ 0,71 por día de historia", "paiement unique · environ 0,71 $ US par jour d’histoire", "einmalig · ca. 0,71 US$ pro Story-Tag", "pagamento unico · circa 0,71 US$ per giorno di storia"],
 "Your character, looks and progress are saved — you pick up right where you left off.": ["Sua personagem, seus looks e seu progresso estão salvos — você continua de onde parou.", "Tu personaje, tus looks y tu progreso están guardados — sigues justo donde lo dejaste.", "Ton personnage, tes tenues et ta progression sont sauvegardés — tu reprends là où tu t’es arrêtée.", "Deine Figur, deine Looks und dein Fortschritt sind gespeichert — du machst genau dort weiter.", "Il tuo personaggio, i tuoi look e i tuoi progressi sono salvati — riprendi da dove avevi lasciato."],
 "YOU’RE A NATURAL!": ["VOCÊ NASCEU PRA ISSO!", "¡ERES UNA NATURAL!", "TU ES DOUÉE !", "DU BIST EIN NATURTALENT!", "SEI NATA PER QUESTO!"],
 "Love it? Become a Founder and get the whole first week.": ["Amou? Vire Founder e garanta a primeira semana inteira.", "¿Te encanta? Hazte Founder y llévate toda la primera semana.", "Tu adores ? Deviens Founder et obtiens toute la première semaine.", "Gefällt’s dir? Werde Founder und hol dir die ganze erste Woche.", "Ti piace? Diventa Founder e ottieni tutta la prima settimana."],
 "Keep playing Day 1": ["Continuar o Dia 1", "Seguir con el Día 1", "Continuer le Jour 1", "Tag 1 weiterspielen", "Continua il Giorno 1"],
 "THAT NIGHT…": ["NAQUELA NOITE…", "ESA NOCHE…", "CETTE NUIT-LÀ…", "IN DIESER NACHT…", "QUELLA NOTTE…"],
 "A message lights up your phone": ["Uma mensagem acende a tela do seu celular", "Un mensaje ilumina tu teléfono", "Un message s’affiche sur ton téléphone", "Eine Nachricht leuchtet auf deinem Handy auf", "Un messaggio illumina il tuo telefono"],
 "“My gown was ruined an hour before the show. Everyone thinks it was me. You’re the only lawyer I trust.” — Mira V., designer": ["“Meu vestido foi destruído uma hora antes do desfile. Todos acham que fui eu. Você é a única advogada em quem confio.” — Mira V., estilista", "“Arruinaron mi vestido una hora antes del desfile. Todos creen que fui yo. Eres la única abogada en quien confío.” — Mira V., diseñadora", "« Ma robe a été détruite une heure avant le défilé. Tout le monde pense que c’est moi. Tu es la seule avocate en qui j’ai confiance. » — Mira V., styliste", "„Mein Kleid wurde eine Stunde vor der Show ruiniert. Alle glauben, ich war es. Du bist die einzige Anwältin, der ich vertraue.“ — Mira V., Designerin", "“Il mio abito è stato rovinato un’ora prima della sfilata. Tutti pensano che sia stata io. Sei l’unica avvocata di cui mi fido.” — Mira V., stilista"],
 "Find out what happens": ["Descobrir o que acontece", "Descubre qué pasa", "Découvrir la suite", "Erfahre, was passiert", "Scopri cosa succede"],
 "DAY 2 · THE RUINED GOWN": ["DIA 2 · O VESTIDO DESTRUÍDO", "DÍA 2 · EL VESTIDO ARRUINADO", "JOUR 2 · LA ROBE DÉTRUITE", "TAG 2 · DAS RUINIERTE KLEID", "GIORNO 2 · L’ABITO ROVINATO"],
 "Take Mira’s case": ["Aceitar o caso da Mira", "Acepta el caso de Mira", "Prendre l’affaire de Mira", "Miras Fall übernehmen", "Accetta il caso di Mira"],
}
i = s.index('const D=') + len('const D=')
j = s.index(', PAT=', i)
D = json.loads(s[i:j])
for k, v in NEW.items():
    for n, c in enumerate(['pt', 'es', 'fr', 'de', 'it']):
        D[c][k] = v[n]
s = s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]

# ---- event log + experiments, right after track() is defined ----
ENGINE = r"""
/* ===== Experiments + first-party event log (v0.5) ===== */
const EXPS = { pw_moment:['end','peak','cliff'], pw_cta:['founder','story','unlock'], pw_value:['plain','perday'], pw_loss:['off','on'], onb:['full','short'] };
const LOG_API = 'https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/dreamelle/e';
const DEV_ID = (function(){ let d=null; try{ d=localStorage.getItem('dreamelle_device'); }catch(e){} if(!d||!/^[a-z0-9]{8,40}$/.test(d)){ d=(Math.random().toString(36).slice(2,10)+Date.now().toString(36)).replace(/[^a-z0-9]/g,''); try{ localStorage.setItem('dreamelle_device',d); }catch(e){} } return d; })();
const EXP = (function(){
  let saved={}; try{ saved=JSON.parse(localStorage.getItem('dreamelle_exp')||'{}')||{}; }catch(e){}
  const q=new URLSearchParams(location.search); const out={};
  const h=str=>{ let x=2166136261; for(let i=0;i<str.length;i++){ x^=str.charCodeAt(i); x=Math.imul(x,16777619); } return (x>>>0); };
  Object.keys(EXPS).forEach(k=>{ const arms=EXPS[k], f=q.get('x_'+k);
    out[k] = (f&&arms.includes(f)) ? f : (arms.includes(saved[k]) ? saved[k] : arms[h(DEV_ID+':'+k)%arms.length]); });
  try{ localStorage.setItem('dreamelle_exp',JSON.stringify(out)); }catch(e){}
  return out; })();
const SRC = (function(){ let f=null; try{ f=JSON.parse(localStorage.getItem('dreamelle_src')||'null'); }catch(e){}
  if(f) return f; const q=new URLSearchParams(location.search), o={};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','c','r'].forEach(k=>{ const v=q.get(k); if(v) o[k]=v.slice(0,80); });
  if(q.get('fbclid')) o.fbclid=1; try{ if(document.referrer) o.ref=new URL(document.referrer).hostname; }catch(e){}
  o.at=Date.now(); try{ localStorage.setItem('dreamelle_src',JSON.stringify(o)); }catch(e){} return o; })();
let LOGQ=[];
function logEvent(n,p){ LOGQ.push({n:String(n).toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,40),p:p||{},t:Date.now()}); if(LOGQ.length>=20) flushLog(); }
function flushLog(){ if(!LOGQ.length) return; const body=JSON.stringify({d:DEV_ID,v:(typeof VERSION!=='undefined'?VERSION:''),exp:EXP,src:SRC,ev:LOGQ.splice(0,40)});
  try{ if(navigator.sendBeacon && navigator.sendBeacon(LOG_API,new Blob([body],{type:'text/plain'}))) return; }catch(e){}
  try{ fetch(LOG_API,{method:'POST',body,keepalive:true,headers:{'content-type':'text/plain'}}).catch(()=>{}); }catch(e){} }
setInterval(flushLog,4000);
document.addEventListener('visibilitychange',()=>{ if(document.hidden) flushLog(); });
window.addEventListener('pagehide',flushLog);
window.DreamelleExp=EXP;
"""
sub1("window.track = track;", "window.track = track;\n" + ENGINE)
# every tracked event also goes to our log; paywall events carry the arms to the Pixel too
sub1("  window.__dreamelleEvents.push({eventName, props});",
     "  window.__dreamelleEvents.push({eventName, props});\n  try{ if(typeof logEvent==='function') logEvent(eventName, props); }catch(e){}\n  if(/^(paywall_view|checkout_click|founder_unlocked)$/.test(eventName) && typeof EXP!=='undefined') props=Object.assign({},props,EXP);")

# ---- paywall: context, copy variants ----
sub1("""function showPaywall(){
  if(S.founder){ showFounder(); return; }
  track('paywall_view',{day:1,level:S.level});""",
"""let pwCtx='end';
const CTA={founder:'Get the Founder’s Pass',story:'Continue my story',unlock:'Unlock Days 2–7'};
function showPaywall(ctx){
  if(S.founder){ showFounder(); return; }
  pwCtx=ctx||'end'; S.pwViews=(S.pwViews||0)+1; save();
  track('paywall_view',{day:1,level:S.level,moment:pwCtx,n:S.pwViews});
  const kicker = pwCtx==='peak' ? 'YOU’RE A NATURAL!' : pwCtx==='cliff' ? 'DAY 2 · THE RUINED GOWN' : 'YOUR STORY CONTINUES';
  const ctaTxt = pwCtx==='cliff' && EXP.pw_cta==='story' ? 'Take Mira’s case' : CTA[EXP.pw_cta]||CTA.founder;""")
sub1("""<div class="small" style="font-weight:900;color:var(--lilac);letter-spacing:.06em">YOUR STORY CONTINUES</div>""",
     """<div class="small" style="font-weight:900;color:var(--lilac);letter-spacing:.06em">${kicker}</div>${pwCtx==='peak'?'<p class="lead" style="margin:.2rem 0 .3rem"><b>Love it? Become a Founder and get the whole first week.</b></p>':''}""")
sub1("""<div class="price"><b>US$ 4.99</b><span>one-time · early-supporter price</span></div>""",
     """<div class="price"><b>US$ 4.99</b><span>${EXP.pw_value==='perday'?'one-time · about US$ 0.71 per day of story':'one-time · early-supporter price'}</span></div>${EXP.pw_loss==='on'?'<div class="small" style="margin:.1rem 0 .4rem">💾 Your character, looks and progress are saved — you pick up right where you left off.</div>':''}""")
sub1("""${ic('crown')} Get the Founder’s Pass</button><button class="btn ghost" data-a="maybelater" id="btn-later">Maybe later</button>""",
     """${ic('crown')} ${ctaTxt}</button><button class="btn ghost" data-a="maybelater" id="btn-later">${pwCtx==='peak'?'Keep playing Day 1':'Maybe later'}</button>""")

sub1("""      <p class="lead">Pre-order the full first week:""", """      <p class="lead" ${pwCtx==='peak'?'hidden':''}>Pre-order the full first week:""")
# cliffhanger scene before the end-of-day paywall
CLIFF = """
function showCliff(){
  track('cliff_view',{});
  overlay(`<div class="pl" style="background:#1d0f24 url(""" + MYSTERY + """) center/cover;border-radius:1.2rem;min-height:12rem"></div>
    <div class="pr"><div class="small" style="font-weight:900;color:var(--lilac);letter-spacing:.06em">THAT NIGHT…</div>
      <h2>A message lights up your phone</h2>
      <p class="lead" style="font-style:italic">“My gown was ruined an hour before the show. Everyone thinks it was me. You’re the only lawyer I trust.” — Mira V., designer</p>
      <div class="btnrow"><button class="btn gold big glow" data-a="cliffgo">${ic('crown')} Find out what happens</button></div></div>`,'paywall');
}
"""
sub1("let resetArm=false;", CLIFF + "let resetArm=false;")

# actions: day1_done event, moment routing, peak after first case, checkout carries the moment
sub1("  enddayok(){ S.day1Done=true; S.day=2; save(); closeOverlay(); showPaywall(); },",
     "  enddayok(){ const first=!S.day1Done; S.day1Done=true; S.day=2; save(); if(first) track('day1_done',{level:S.level}); closeOverlay(); if(EXP.pw_moment==='cliff' && !S.founder) showCliff(); else showPaywall('end'); },\n  cliffgo(){ sfx('tap'); closeOverlay(); showPaywall('cliff'); },")
sub1("  paywall(){ showPaywall(); },", "  paywall(){ showPaywall(S.day1Done?(EXP.pw_moment==='cliff'?'cliff':'end'):'home'); },")
sub1("  checkout(){ track('checkout_click',{price:4.99,currency:'USD',product:'founders_pass'});",
     "  checkout(){ track('checkout_click',{price:4.99,currency:'USD',product:'founders_pass',moment:pwCtx});")
sub1("  maybelater(){ closeOverlay(); if(cur!=='home') go('home'); else go('home'); },",
     "  maybelater(){ track('paywall_dismiss',{moment:pwCtx}); closeOverlay(); if(pwCtx==='peak'){ go(rewardBack||'law'); return; } go('home'); },")
sub1("  rewardok(){ closeOverlay(); go(rewardBack); },",
     "  rewardok(){ closeOverlay(); go(rewardBack); if(EXP.pw_moment==='peak' && S.missions.clause && !S.peakShown && !S.founder){ S.peakShown=true; save(); setTimeout(()=>showPaywall('peak'),450); } },")
sub1("  rewardskill(){ closeOverlay(); go('skills'); },",
     "  rewardskill(){ closeOverlay(); go('skills'); if(EXP.pw_moment==='peak' && S.missions.clause && !S.peakShown && !S.founder){ S.peakShown=true; save(); rewardBack='skills'; setTimeout(()=>showPaywall('peak'),450); } },")

# onboarding: short arm skips the intro slides
sub1("else { onbIdx=0; go(S.onbDone?'char':'onb'); } },",
     "else { onbIdx=0; if(EXP.onb==='short' && !S.onbDone){ S.onbDone=true; save(); track('onb_skipped_by_test',{}); } go(S.onbDone?'char':'onb'); } },")

# a session marker on boot
sub1("setTimeout(()=>checkFounder('boot'),1200);", "setTimeout(()=>checkFounder('boot'),1200);\ntrack('session_start',{returning:!!S.created,day1Done:!!S.day1Done,standalone:STANDALONE});")
sub1("window.Dreamelle={get state(){return S;}, go, showPaywall,", "window.Dreamelle={get state(){return S;}, go, showPaywall, act:(n,el)=>A[n]&&A[n](el), exp:EXP, flush:flushLog, get screen(){return cur;},")
sub1("const VERSION = '0.4.0';", "const VERSION = '0.5.0';")
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
