"""Dreamelle v0.4: automatic Founder's Pass delivery (Hotmart webhook -> Supabase -> game).
Usage: python3 founder_patch.py <in index.html> <out index.html>
- Each device gets a random id; the checkout link carries sck=dg<id>.
- The game asks the backend whether this device is a founder (on load, when the player comes back, and every 15 s after opening checkout).
- Restore purchase (email + HP transaction code) in Settings, for a new phone or browser.
- Paywall copy is now an honest pre-order: Days 2-7 are in production; founders unlock them first.
"""
import json, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
API = 'https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/dreamelle'

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:80])
    s = s.replace(old, new)

NEW = {
 "Pre-order the full first week: Days 2–7, 3 new cases, the Salon & Shopping and premium outfits. They’re in production now, and founders unlock them first. One-time US$ 4.99 · 7-day refund.":
 ["Garanta a primeira semana completa: Dias 2–7, 3 novos casos, o Salão e o Shopping e looks premium. Eles estão em produção, e quem tem o Founder’s Pass libera primeiro. Pagamento único de US$ 4,99 · reembolso em 7 dias.",
  "Reserva la primera semana completa: Días 2–7, 3 casos nuevos, el Salón y el Shopping y outfits premium. Están en producción y los founders los desbloquean primero. Pago único de US$ 4,99 · reembolso en 7 días.",
  "Précommande toute la première semaine : Jours 2 à 7, 3 nouvelles affaires, le Salon et le Shopping et des tenues premium. Ils sont en production, et les founders les débloquent en premier. Paiement unique de 4,99 $ US · remboursement sous 7 jours.",
  "Sichere dir die ganze erste Woche vorab: Tage 2–7, 3 neue Fälle, Salon & Shopping und Premium-Outfits. Sie sind in Arbeit, und Founder schalten sie zuerst frei. Einmalig 4,99 US$ · 7 Tage Rückerstattung.",
  "Preordina tutta la prima settimana: Giorni 2–7, 3 nuovi casi, il Salone e lo Shopping e outfit premium. Sono in produzione e i founder li sbloccano per primi. Pagamento unico di 4,99 US$ · rimborso entro 7 giorni."],
 "FOUNDER’S PASS ACTIVE": ["FOUNDER’S PASS ATIVO", "FOUNDER’S PASS ACTIVO", "FOUNDER’S PASS ACTIF", "FOUNDER’S PASS AKTIV", "FOUNDER’S PASS ATTIVO"],
 "Thank you for supporting Dreamelle!": ["Obrigado por apoiar o Dreamelle!", "¡Gracias por apoyar Dreamelle!", "Merci de soutenir Dreamelle !", "Danke, dass du Dreamelle unterstützt!", "Grazie per sostenere Dreamelle!"],
 "Days 2–7 are in production. You’ll unlock them here first, the moment they’re ready.": ["Os Dias 2–7 estão em produção. Você libera aqui primeiro, assim que ficarem prontos.", "Los Días 2–7 están en producción. Los desbloquearás aquí primero, en cuanto estén listos.", "Les Jours 2 à 7 sont en production. Tu les débloqueras ici en premier, dès qu’ils seront prêts.", "Tage 2–7 sind in Arbeit. Du schaltest sie hier zuerst frei, sobald sie fertig sind.", "I Giorni 2–7 sono in produzione. Li sbloccherai qui per prima, appena saranno pronti."],
 "Keep playing": ["Continuar jogando", "Seguir jugando", "Continuer à jouer", "Weiterspielen", "Continua a giocare"],
 "Restore purchase": ["Restaurar compra", "Restaurar compra", "Restaurer l’achat", "Kauf wiederherstellen", "Ripristina acquisto"],
 "Bought the Founder’s Pass on another device?": ["Comprou o Founder’s Pass em outro aparelho?", "¿Compraste el Founder’s Pass en otro dispositivo?", "Tu as acheté le Founder’s Pass sur un autre appareil ?", "Founder’s Pass auf einem anderen Gerät gekauft?", "Hai comprato il Founder’s Pass su un altro dispositivo?"],
 "Email used at checkout": ["E-mail usado na compra", "Correo usado en la compra", "E-mail utilisé à l’achat", "Beim Kauf verwendete E-Mail", "Email usata per l’acquisto"],
 "Transaction code (starts with HP)": ["Código da transação (começa com HP)", "Código de transacción (empieza con HP)", "Code de transaction (commence par HP)", "Transaktionscode (beginnt mit HP)", "Codice transazione (inizia con HP)"],
 "Restore": ["Restaurar", "Restaurar", "Restaurer", "Wiederherstellen", "Ripristina"],
 "Purchase restored! Welcome, Founder 💖": ["Compra restaurada! Bem-vinda, Founder 💖", "¡Compra restaurada! Bienvenida, Founder 💖", "Achat restauré ! Bienvenue, Founder 💖", "Kauf wiederhergestellt! Willkommen, Founder 💖", "Acquisto ripristinato! Benvenuta, Founder 💖"],
 "We couldn’t find that purchase. Check the email and the HP code on your receipt.": ["Não encontramos essa compra. Confira o e-mail e o código HP do seu recibo.", "No encontramos esa compra. Revisa el correo y el código HP de tu recibo.", "Achat introuvable. Vérifie l’e-mail et le code HP de ton reçu.", "Kauf nicht gefunden. Prüfe die E-Mail und den HP-Code auf deinem Beleg.", "Acquisto non trovato. Controlla l’email e il codice HP della ricevuta."],
 "Founder’s Pass active! Welcome, Founder 💖": ["Founder’s Pass ativo! Bem-vinda, Founder 💖", "¡Founder’s Pass activo! Bienvenida, Founder 💖", "Founder’s Pass actif ! Bienvenue, Founder 💖", "Founder’s Pass aktiv! Willkommen, Founder 💖", "Founder’s Pass attivo! Benvenuta, Founder 💖"],
 "Checking your purchase…": ["Verificando sua compra…", "Verificando tu compra…", "Vérification de ton achat…", "Kauf wird geprüft…", "Verifica dell’acquisto…"],
 "Get the Founder’s Pass": None,
}
# merge into the embedded i18n dictionary
i = s.index('const D=') + len('const D=')
j = s.index(', PAT=', i)
D = json.loads(s[i:j])
for k, v in NEW.items():
    if v:
        for n, c in enumerate(['pt', 'es', 'fr', 'de', 'it']):
            D[c][k] = v[n]
s = s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]

# paywall: honest pre-order + founder view
sub1("""      <p class="lead">Unlock the full first week: Days 2–7, 3 new cases, the Salon &amp; Shopping, premium outfits — one-time US$ 4.99, early-supporter price.</p>""",
     """      <p class="lead">Pre-order the full first week: Days 2–7, 3 new cases, the Salon &amp; Shopping and premium outfits. They’re in production now, and founders unlock them first. One-time US$ 4.99 · 7-day refund.</p>""")
sub1("""function showPaywall(){
  track('paywall_view',{day:1,level:S.level});""",
     """function showPaywall(){
  if(S.founder){ showFounder(); return; }
  track('paywall_view',{day:1,level:S.level});""")

js = """
/* ===== Founder's Pass (automatic delivery) ===== */
const FP_API='""" + API + """';
const DEVICE=(function(){ let d=store.get('dreamelle_device'); if(!d||!/^[a-z0-9]{8,40}$/.test(d)){ d=(Math.random().toString(36).slice(2,10)+Date.now().toString(36)).replace(/[^a-z0-9]/g,''); store.set('dreamelle_device',d); } return d; })();
function checkoutUrl(){ const u=HOTMART_CHECKOUT_URL.split('?')[0]; return u+'?sck=dg'+DEVICE+'&src=dreamelle_game'; }
let fpPoll=null;
function becomeFounder(src){
  if(S.founder) return; S.founder=true; save();
  track('founder_unlocked',{src}); try{ window.fbq&&fbq('track','Purchase',{value:4.99,currency:'USD',content_name:'founders_pass'}); }catch(e){}
  if(fpPoll){ clearInterval(fpPoll); fpPoll=null; }
  closeOverlay(); sfx('win'); confetti(); toast('Founder’s Pass active! Welcome, Founder 💖'); setTimeout(showFounder,600);
}
function checkFounder(src){
  if(S.founder) return Promise.resolve(true);
  return fetch(FP_API+'/unlock?device='+DEVICE).then(r=>r.json()).then(j=>{ if(j&&j.founder) becomeFounder(src||'auto'); return !!(j&&j.founder); }).catch(()=>false);
}
function startFounderPoll(){ if(fpPoll) clearInterval(fpPoll); let n=0; fpPoll=setInterval(()=>{ if(++n>40||S.founder){ clearInterval(fpPoll); fpPoll=null; return; } checkFounder('poll'); },15000); }
document.addEventListener('visibilitychange',()=>{ if(!document.hidden && store.get('dreamelle_checkout_opened') && !S.founder) checkFounder('return'); });
function showFounder(){
  overlay(`<button class="icon-btn x" data-a="closeov" aria-label="Close">${ic('close')}</button>
    <div class="pl"><span class="crown">${ic('crown')} FOUNDER’S PASS ACTIVE</span>${Doll.dollSVG(S.av,{pose:'P04'})}</div>
    <div class="pr"><h2>Thank you for supporting Dreamelle!</h2>
      <p class="lead">Days 2–7 are in production. You’ll unlock them here first, the moment they’re ready.</p>
      <ul>${['Days 2–7 of your story','3 new legal cases','The Salon &amp; Shopping','Premium outfits'].map(t=>`<li><i>${ic('check')}</i>${t}</li>`).join('')}</ul>
      <div class="btnrow"><button class="btn glow" data-a="closeov">Keep playing</button></div></div>`,'paywall');
}
function showRestore(){
  overlay(`<button class="icon-btn x" data-a="closeov" aria-label="Close">${ic('close')}</button><div class="set"><h2>Restore purchase</h2>
    <p style="margin:.2rem 0 .7rem">Bought the Founder’s Pass on another device?</p>
    <input id="rs-email" class="namein" style="width:100%;margin-bottom:.5rem" type="email" placeholder="Email used at checkout" autocomplete="email">
    <input id="rs-tx" class="namein" style="width:100%;margin-bottom:.7rem" placeholder="Transaction code (starts with HP)" autocapitalize="characters">
    <div class="btnrow"><button class="btn glow" data-a="restoreok">Restore</button></div><div class="small" id="rs-msg" style="margin-top:.5rem"></div></div>`);
}
"""
sub1("/* ===== Actions ===== */", js + "\n/* ===== Actions ===== */")

# checkout opens with the device id and starts watching for the purchase
sub1("""    try{ window.open(HOTMART_CHECKOUT_URL,'_blank','noopener'); }catch(e){}""",
     """    store.set('dreamelle_checkout_opened','1'); startFounderPoll();
    try{ const w=window.open(checkoutUrl(),'_blank','noopener'); if(!w) location.href=checkoutUrl(); }catch(e){ location.href=checkoutUrl(); }""")

# settings: restore purchase row
sub1("""    <div class="setrow"><b>Reset progress<small>Erase your character and start over</small></b>""",
     """    <div class="setrow"><b>Restore purchase<small>${S.founder?'FOUNDER’S PASS ACTIVE':'Bought the Founder’s Pass on another device?'}</small></b><button class="btn ghost" data-a="restore" ${S.founder?'disabled':''}>Restore</button></div>
    <div class="setrow"><b>Reset progress<small>Erase your character and start over</small></b>""")

sub1("  rotok(){ document.body.classList.add('rot-ok'); },",
     """  rotok(){ document.body.classList.add('rot-ok'); },
  restore(){ sfx('tap'); showRestore(); },
  restoreok(){ const e=($('#rs-email')||{}).value||'', t=($('#rs-tx')||{}).value||''; const m=$('#rs-msg'); if(m) m.textContent=I18N.t('Checking your purchue…'.replace('pue','ase'));
    fetch(FP_API+'/restore',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:e,transaction:t,device:DEVICE})}).then(r=>r.json()).then(j=>{
      if(j&&j.founder){ track('purchase_restored',{}); toast('Purchase restored! Welcome, Founder 💖'); becomeFounder('restore'); }
      else { sfx('bad'); if(m) m.textContent=I18N.t('We couldn’t find that purchase. Check the email and the HP code on your receipt.'); } }).catch(()=>{ if(m) m.textContent=I18N.t('We couldn’t find that purchase. Check the email and the HP code on your receipt.'); }); },""")

# keep founder flag across saves, check on boot
sub1("settings:{music:true,sfx:true,reducedMotion:false,lang:'en'},", "settings:{music:true,sfx:true,reducedMotion:false,lang:'en'}, founder:false,")
sub1("if(conceptId){ track('concept_view'", "setTimeout(()=>checkFounder('boot'),1200);\nif(conceptId){ track('concept_view'")
sub1("const VERSION = '0.3.4';", "const VERSION = '0.4.0';")
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
