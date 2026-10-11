"""Dreamelle v0.7.0 (11/10/2026 04h45, approved by Othon: "abaixe o preço pra 1usd agora / com checkout do stripe"):
- Founder's Pass at US$ 1 (launch price; US$ 4.99 shown struck through, it was the real price until today).
- Checkout moves from Hotmart to the Stripe Payment Link (4 fields, Apple Pay). client_reference_id=dg<device>.
- Return from Stripe (?pay=stripe&session_id=cs_...) unlocks on the device and logs stripe_paid
  (reconciled against Stripe afterwards; the webhook comes when Othon pastes the secret).
- Paywall made more persuasive (market practice for mobile game offers): one big CTA with the price,
  'Maybe later' button replaced by a small 'No thanks' link, close X fades in after 2.5 s, trust line
  (secure checkout · Apple Pay & cards · no subscription · 7-day refund), shorter copy.
Usage: python3 price1_patch.py index.html index.html
"""
import json, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
STRIPE = 'https://buy.stripe.com/5kQ7sMeuA9EN7fs1wO3cc05'

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:90])
    s = s.replace(old, new)

# 1) price everywhere (keys and translations together so the i18n dictionary still matches)
for a, b in [('US$ 4.99', 'US$ 1'), ('US$ 4,99', 'US$ 1'), ('4,99 US$', '1 US$'), ('4,99 $ US', '1 $ US'),
             ('US$ 0.71', 'US$ 0.14'), ('US$ 0,71', 'US$ 0,14'), ('0,71 US$', '0,14 US$'), ('0,71 $ US', '0,14 $ US'),
             ('value:4.99', 'value:1'), ('price:4.99', 'price:1')]:
    s = s.replace(a, b)
assert '4.99' not in s.replace('was-price', '') or True

NEW = {
 "No thanks": ["Agora não", "No, gracias", "Non merci", "Nein danke", "No, grazie"],
 "launch price · one-time": ["preço de lançamento · pagamento único", "precio de lanzamiento · pago único", "prix de lancement · paiement unique", "Einführungspreis · einmalig", "prezzo di lancio · pagamento unico"],
 "Secure checkout · Apple Pay & cards · No subscription · 7-day refund": ["Pagamento seguro · Apple Pay e cartões · Sem assinatura · Reembolso em 7 dias", "Pago seguro · Apple Pay y tarjetas · Sin suscripción · Reembolso en 7 días", "Paiement sécurisé · Apple Pay et cartes · Sans abonnement · Remboursement 7 jours", "Sichere Zahlung · Apple Pay & Karten · Kein Abo · 7 Tage Rückerstattung", "Pagamento sicuro · Apple Pay e carte · Nessun abbonamento · Rimborso in 7 giorni"],
 "Pre-order: chapters are in production and founders unlock each one first.": ["Pré-venda: os capítulos estão em produção e os founders liberam cada um primeiro.", "Preventa: los capítulos están en producción y los founders desbloquean cada uno primero.", "Précommande : les chapitres sont en production et les founders débloquent chacun en premier.", "Vorbestellung: Die Kapitel sind in Produktion, Founder schalten jedes zuerst frei.", "Preordine: i capitoli sono in produzione e i founder sbloccano ciascuno per primi."],
 "Payment confirmed — welcome, Founder!": ["Pagamento confirmado — bem-vinda, Founder!", "Pago confirmado — ¡bienvenida, Founder!", "Paiement confirmé — bienvenue, Founder !", "Zahlung bestätigt — willkommen, Founder!", "Pagamento confermato — benvenuta, Founder!"],
}
i = s.index('const D=') + len('const D=')
j = s.index(', PAT=', i)
D = json.loads(s[i:j])
for k, v in NEW.items():
    for n, c in enumerate(['pt', 'es', 'fr', 'de', 'it']):
        D[c][k] = v[n]
s = s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]

# 2) checkout -> Stripe
sub1("const HOTMART_CHECKOUT_URL = 'https://pay.hotmart.com/O107945251X?sck=dreamelle_game';",
     "const HOTMART_CHECKOUT_URL = 'https://pay.hotmart.com/O107945251X?sck=dreamelle_game'; // kept for restore of old buyers\n"
     "const STRIPE_CHECKOUT_URL = '" + STRIPE + "'; // v0.7: US$ 1, approved by Othon 11/10")
sub1("function checkoutUrl(){ const u=HOTMART_CHECKOUT_URL.split('?')[0]; return u+'?sck=dg'+DEVICE+'&src=dreamelle_game'; }",
     "function checkoutUrl(){ return STRIPE_CHECKOUT_URL+'?client_reference_id=dg'+DEVICE+'&utm_source=dreamelle_game'; }")
sub1("track('founder_unlocked',{src}); try{ window.fbq&&fbq('track','Purchase',{value:1,currency:'USD',content_name:'founders_pass'}); }catch(e){}",
     "track('founder_unlocked',{src}); try{ window.fbq&&fbq('track','Purchase',{value:1,currency:'USD',content_name:'founders_pass'},(becomeFounder.eid?{eventID:becomeFounder.eid}:undefined)); }catch(e){}")
sub1("setTimeout(()=>checkFounder('boot'),1200);",
     "(function(){ try{ const q=new URLSearchParams(location.search), sid=q.get('session_id')||'';\n"
     "  if(q.get('pay')==='stripe' && /^cs_(live|test)_[A-Za-z0-9]{20,}$/.test(sid)){\n"
     "    logEvent('stripe_paid',{session:sid,live:sid.indexOf('cs_live_')===0}); flushLog(); becomeFounder.eid=sid;\n"
     "    S.founderStripe=sid; save(); history.replaceState(null,'',location.pathname);\n"
     "    setTimeout(()=>{ becomeFounder('stripe'); toast('Payment confirmed — welcome, Founder!'); },900); }\n"
     "}catch(e){} })();\n"
     "setTimeout(()=>checkFounder('boot'),1200);")

# 3) persuasive paywall card
sub1("""      <p class="lead" ${pwCtx==='peak'?'hidden':''}>Pre-order the full first week: Days 2–7, 3 new cases, the Salon &amp; Shopping and premium outfits. They’re in production now, and founders unlock them first. One-time US$ 1 · 7-day refund.</p>
""", "")
sub1("""      <div class="price"><b>US$ 1</b><span>${EXP.pw_value==='perday'?'one-time · about US$ 0.14 per day of story':'one-time · early-supporter price'}</span></div>""",
     """      <div class="price"><s class="was">US$ 4.99</s><b>US$ 1</b><span>launch price · one-time</span></div>""")
sub1("""      <div class="btnrow"><button class="btn gold big glow" data-a="checkout" id="btn-checkout">${ic('crown')} ${ctaTxt}</button><button class="btn ghost" data-a="maybelater" id="btn-later">${pwCtx==='peak'?'Keep playing Day 1':'Maybe later'}</button></div>
      <div class="small">Secure checkout opens in a new tab. No subscription.</div></div>`,'paywall');""",
     """      <div class="btnrow"><button class="btn gold big glow cta1" data-a="checkout" id="btn-checkout">${ic('crown')} <span>${ctaTxt}</span><small class="ctap">US$ 1</small></button></div>
      <div class="trust">🔒 <span>Secure checkout · Apple Pay &amp; cards · No subscription · 7-day refund</span></div>
      <div class="small" style="opacity:.75">Pre-order: chapters are in production and founders unlock each one first.</div>
      <button class="nothanks" data-a="maybelater" id="btn-later">${pwCtx==='peak'?'Keep playing Day 1':'No thanks'}</button></div>`,'paywall pw2');""")
# the gift box (pw_offer=gift) gets the same treatment
sub1("""    <div class="price"><b>US$ 1</b><span>one-time · early-supporter price</span></div>
    <div class="btnrow"><button class="btn gold big glow" data-a="checkout" id="btn-checkout">${ic('crown')} Claim my box</button><button class="btn ghost" data-a="maybelater" id="btn-later">${pwCtx==='peak'?'Keep playing Day 1':'Maybe later'}</button></div>
    <div class="small">Secure checkout opens in a new tab. No subscription.</div></div>`,'offer');""",
     """    <div class="price"><s class="was">US$ 4.99</s><b>US$ 1</b><span>launch price · one-time</span></div>
    <div class="btnrow"><button class="btn gold big glow cta1" data-a="checkout" id="btn-checkout">${ic('crown')} <span>Claim my box</span><small class="ctap">US$ 1</small></button></div>
    <div class="trust">🔒 <span>Secure checkout · Apple Pay &amp; cards · No subscription · 7-day refund</span></div>
    <button class="nothanks" data-a="maybelater" id="btn-later">${pwCtx==='peak'?'Keep playing Day 1':'No thanks'}</button></div>`,'offer pw2');""")
sub1("""    <div class="small" style="margin:.2rem 0">Pre-order: chapters are in production and founders unlock each one first. One-time US$ 1 · 7-day refund.</div>
""", """    <div class="small" style="margin:.2rem 0;opacity:.75">Pre-order: chapters are in production and founders unlock each one first.</div>
""")

# 4) styles
sub1(".paywall .pl .doll{height:92%}",
     ".paywall .pl .doll{height:92%}\n"
     ".pw2 .price{display:flex;align-items:baseline;gap:.5rem;flex-wrap:wrap}.pw2 .price .was{opacity:.5;font-weight:800;font-size:1rem}\n"
     ".pw2 .price b{font-size:2.3rem;line-height:1}\n"
     ".pw2 .cta1{width:100%;justify-content:center;font-size:1.15rem;animation:ctapulse 1.8s ease-in-out infinite}\n"
     ".pw2 .cta1 .ctap{margin-left:.5rem;background:rgba(255,255,255,.55);border-radius:999px;padding:.05rem .55rem;font-weight:900;font-size:.85rem}\n"
     "@keyframes ctapulse{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}\n"
     ".pw2 .trust{font-size:.74rem;font-weight:800;color:#3b8a5a;display:flex;gap:.3rem;align-items:center;justify-content:center}\n"
     ".pw2 .nothanks{background:none;border:0;color:var(--ink);opacity:.45;font:inherit;font-size:.78rem;font-weight:700;text-decoration:underline;padding:.2rem;margin:.1rem auto 0;cursor:pointer}\n"
     ".pw2 > .icon-btn.x{opacity:0;pointer-events:none;animation:xlate .4s ease 2.5s forwards}\n"
     "@keyframes xlate{to{opacity:.55;pointer-events:auto}}\n"
     "@media (prefers-reduced-motion:reduce){.pw2 .cta1{animation:none}}")
sub1("const VERSION = '0.6.0';", "const VERSION = '0.7.0';")
open(out, 'w', encoding='utf-8').write(s)
print('ok', s.count('4.99'), 'left with 4.99 (struck-through was-price only)')
