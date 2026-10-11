"""Dreamelle v0.6: new A/B test on the OFFER MECHANISM at the paywall + experiment hash fix.
Usage: python3 offer_patch.py index.html index.html

Why (data up to 11/10/2026, human players from ads):
  - pw_moment 'end' (plain Founder card right after Day 1): 17 paywall views, 0 checkouts -> retired.
    'peak' 6/25 and 'cliff' 3/12 keep running.
  - The old hash gave every 2-arm experiment the same split (onb, pw_value, pw_loss were 100% correlated),
    so those three could not be read. Fixed with a proper mixer; they are frozen at the arm that did better
    (onb=full, pw_value=plain, pw_loss=off) and pw_cta is frozen at 'story' to concentrate traffic.

New experiment pw_offer (force with ?x_pw_offer=<arm>):
  card = current Founder's Pass card (control)
  pick = "How should your Day 2 begin?" -> player picks Mira's case / the Salon / Shopping,
         then a personalised card ("Your Day 2: the Salon") with CTA "Play my Day 2". Commitment before price,
         and the pick tells us which content to build first (event day2_pick).
  gift = "Your Founder's box" -> tap to open, the contents are revealed one by one with art, then the price
         and "Claim my box". Reveal before price.
"""
import json, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/'
MYSTERY = CDN + '226bfdae-4e94-491c-97c5-9a43e7760c06.webp'
SALON = CDN + '6720f808-c857-4a4c-b3e3-9614f1f6f488.webp'
SHOP = CDN + '58e3ad58-6fd6-43f5-8ff6-1d3b235fdaa5.webp'
MODEL = CDN + '1d70878d-364e-4127-b28a-7ddedf9ad767.webp'

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:90])
    s = s.replace(old, new)

NEW = {
 "How should your Day 2 begin?": ["Como deve começar o seu Dia 2?", "¿Cómo debería empezar tu Día 2?", "Comment commence ton Jour 2 ?", "Wie soll dein Tag 2 beginnen?", "Come deve iniziare il tuo Giorno 2?"],
 "Pick one. Founders play Days 2–7 first.": ["Escolha um. Founders jogam os Dias 2–7 primeiro.", "Elige uno. Los Founders juegan los Días 2–7 primero.", "Choisis-en un. Les Founders jouent les Jours 2 à 7 en premier.", "Wähle eins. Founder spielen die Tage 2–7 zuerst.", "Scegline uno. I Founder giocano i Giorni 2–7 per primi."],
 "Mira’s case": ["O caso da Mira", "El caso de Mira", "L’affaire de Mira", "Miras Fall", "Il caso di Mira"],
 "A ruined gown, an hour before the show": ["Um vestido destruído, uma hora antes do desfile", "Un vestido arruinado, una hora antes del desfile", "Une robe détruite, une heure avant le défilé", "Ein ruiniertes Kleid, eine Stunde vor der Show", "Un abito rovinato, un’ora prima della sfilata"],
 "The Salon": ["O Salão", "El Salón", "Le Salon", "Der Salon", "Il Salone"],
 "A brand-new look for the big night": ["Um visual novo para a grande noite", "Un look nuevo para la gran noche", "Un tout nouveau look pour le grand soir", "Ein ganz neuer Look für den großen Abend", "Un look nuovo per la grande serata"],
 "Shopping": ["Shopping", "Compras", "Shopping", "Shopping", "Shopping"],
 "Your first designer outfit": ["Seu primeiro look de grife", "Tu primer outfit de diseñador", "Ta première tenue de créateur", "Dein erstes Designer-Outfit", "Il tuo primo outfit firmato"],
 "Your Day 2 starts here": ["Seu Dia 2 começa aqui", "Tu Día 2 empieza aquí", "Ton Jour 2 commence ici", "Dein Tag 2 beginnt hier", "Il tuo Giorno 2 inizia qui"],
 "Play my Day 2": ["Jogar meu Dia 2", "Jugar mi Día 2", "Jouer mon Jour 2", "Meinen Tag 2 spielen", "Gioca il mio Giorno 2"],
 "Your Founder’s box": ["Sua caixa de Founder", "Tu caja de Founder", "Ta boîte de Founder", "Deine Founder-Box", "La tua scatola Founder"],
 "Tap to open it and see what’s inside.": ["Toque para abrir e ver o que tem dentro.", "Toca para abrirla y ver qué hay dentro.", "Touche pour l’ouvrir et voir ce qu’il y a dedans.", "Tippe, um sie zu öffnen und zu sehen, was drin ist.", "Tocca per aprirla e vedere cosa c’è dentro."],
 "Open my box": ["Abrir minha caixa", "Abrir mi caja", "Ouvrir ma boîte", "Meine Box öffnen", "Apri la mia scatola"],
 "Inside your box": ["Dentro da sua caixa", "Dentro de tu caja", "Dans ta boîte", "In deiner Box", "Nella tua scatola"],
 "Claim my box": ["Garantir minha caixa", "Reclamar mi caja", "Récupérer ma boîte", "Meine Box sichern", "Prendi la mia scatola"],
 "Days 2–7 of your story": None, "The Salon & Shopping": None, "Premium outfits": None,
 "Mira’s case and 2 more cases": ["O caso da Mira e mais 2 casos", "El caso de Mira y 2 casos más", "L’affaire de Mira et 2 autres affaires", "Miras Fall und 2 weitere Fälle", "Il caso di Mira e altri 2 casi"],
 "Pre-order: chapters are in production and founders unlock each one first. One-time US$ 4.99 · 7-day refund.": ["Pré-venda: os capítulos estão em produção e os founders liberam cada um primeiro. Pagamento único de US$ 4,99 · reembolso em 7 dias.", "Preventa: los capítulos están en producción y los founders desbloquean cada uno primero. Pago único de US$ 4,99 · reembolso en 7 días.", "Précommande : les chapitres sont en production et les founders débloquent chacun en premier. Paiement unique de 4,99 $ US · remboursement sous 7 jours.", "Vorbestellung: Die Kapitel sind in Produktion, Founder schalten jedes zuerst frei. Einmalig 4,99 US$ · 7 Tage Rückerstattung.", "Preordine: i capitoli sono in produzione e i founder sbloccano ciascuno per primi. Pagamento unico di 4,99 US$ · rimborso entro 7 giorni."],
}
i = s.index('const D=') + len('const D=')
j = s.index(', PAT=', i)
D = json.loads(s[i:j])
for k, v in NEW.items():
    if v is None:
        assert k in D['pt'], k
        continue
    for n, c in enumerate(['pt', 'es', 'fr', 'de', 'it']):
        D[c][k] = v[n]
s = s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]

# ---- experiments: new set + hash fix + frozen arms ----
sub1("const EXPS = { pw_moment:['end','peak','cliff'], pw_cta:['founder','story','unlock'], pw_value:['plain','perday'], pw_loss:['off','on'], onb:['full','short'] };",
     "const EXPS = { pw_moment:['peak','cliff'], pw_offer:['card','pick','gift'] };\n"
     "const EXP_FIXED = { pw_cta:'story', pw_value:'plain', pw_loss:'off', onb:'full' }; // frozen after v0.5 (see offer_patch.py)")
sub1("const h=str=>{ let x=2166136261; for(let i=0;i<str.length;i++){ x^=str.charCodeAt(i); x=Math.imul(x,16777619); } return (x>>>0); };",
     "const h=str=>{ let x=2166136261; for(let i=0;i<str.length;i++){ x^=str.charCodeAt(i); x=Math.imul(x,16777619); }\n"
     "    x^=x>>>16; x=Math.imul(x,0x85ebca6b); x^=x>>>13; x=Math.imul(x,0xc2b2ae35); x^=x>>>16; return (x>>>0); }; // v0.6: mixer, arms independent")
sub1("    out[k] = (f&&arms.includes(f)) ? f : (arms.includes(saved[k]) ? saved[k] : arms[h(DEV_ID+':'+k)%arms.length]); });",
     "    out[k] = (f&&arms.includes(f)) ? f : (arms.includes(saved[k]) ? saved[k] : arms[h(DEV_ID+':'+k)%arms.length]); });\n"
     "  Object.keys(EXP_FIXED).forEach(k=>{ out[k]=EXP_FIXED[k]; });")

sub1("const VERSION = '0.5.0';", "const VERSION = '0.6.0';")

# ---- end of Day 1 for the retired 'end' arm: peak players still get the card at the end of Day 1 ----
# (enddayok already does: cliff -> showCliff, otherwise showPaywall('end'); 'end' is no longer assigned.)

# ---- offer mechanisms ----
sub1("function showPaywall(ctx){\n  if(S.founder){ showFounder(); return; }\n  pwCtx=ctx||'end'; S.pwViews=(S.pwViews||0)+1; save();",
     r"""const D2PICK={case:{t:'Mira’s case',d:'A ruined gown, an hour before the show',img:'__MYSTERY__'},salon:{t:'The Salon',d:'A brand-new look for the big night',img:'__SALON__'},shop:{t:'Shopping',d:'Your first designer outfit',img:'__SHOP__'}};
const BOX=[['Days 2–7 of your story','__MYSTERY__'],['Mira’s case and 2 more cases','__MODEL__'],['The Salon &amp; Shopping','__SALON__'],['Premium outfits','__SHOP__']];
function showPick(){
  track('offer_view',{arm:'pick',moment:pwCtx});
  overlay(`<button class="icon-btn x" data-a="maybelater" aria-label="Close">${ic('close')}</button>
    <div class="ofr"><h2>How should your Day 2 begin?</h2><div class="sub">Pick one. Founders play Days 2–7 first.</div>
    <div class="ofr-row">${Object.keys(D2PICK).map(k=>`<button class="ofr-tile" data-a="d2pick" data-k="${k}" id="btn-pick-${k}"><span class="ph" style="background-image:url(${D2PICK[k].img})"></span><b>${D2PICK[k].t}</b><small>${D2PICK[k].d}</small></button>`).join('')}</div></div>`,'offer');
}
function showGift(){
  track('offer_view',{arm:'gift',moment:pwCtx});
  overlay(`<button class="icon-btn x" data-a="maybelater" aria-label="Close">${ic('close')}</button>
    <div class="ofr"><div class="small" style="font-weight:900;color:var(--lilac);letter-spacing:.06em">EARLY SUPPORTER</div><h2>Your Founder’s box</h2><div class="sub">Tap to open it and see what’s inside.</div>
    <button class="ofr-box" data-a="giftopen" id="btn-gift-open" aria-label="Open my box"><span class="lid"></span><span class="bow">${ic('crown')}</span></button>
    <div class="btnrow"><button class="btn gold big glow" data-a="giftopen" id="btn-gift-open2">${ic('sparkle')} Open my box</button></div></div>`,'offer');
}
function showBoxOpen(){
  overlay(`<button class="icon-btn x" data-a="maybelater" aria-label="Close">${ic('close')}</button>
    <div class="ofr"><h2>Inside your box</h2>
    <div class="ofr-row four">${BOX.map(([t,img],n)=>`<div class="ofr-tile pop" style="animation-delay:${.15+n*.35}s"><span class="ph" style="background-image:url(${img})"></span><b>${t}</b></div>`).join('')}</div>
    <div class="small" style="margin:.2rem 0">Pre-order: chapters are in production and founders unlock each one first. One-time US$ 4.99 · 7-day refund.</div>
    <div class="price"><b>US$ 4.99</b><span>one-time · early-supporter price</span></div>
    <div class="btnrow"><button class="btn gold big glow" data-a="checkout" id="btn-checkout">${ic('crown')} Claim my box</button><button class="btn ghost" data-a="maybelater" id="btn-later">${pwCtx==='peak'?'Keep playing Day 1':'Maybe later'}</button></div>
    <div class="small">Secure checkout opens in a new tab. No subscription.</div></div>`,'offer');
  confetti(); sfx('win');
}
function showPaywall(ctx){
  if(S.founder){ showFounder(); return; }
  pwCtx=ctx||'end';
  if(EXP.pw_offer==='pick' && !S.d2pick){ showPick(); return; }
  if(EXP.pw_offer==='gift'){ S.pwViews=(S.pwViews||0)+1; save(); track('paywall_view',{day:1,level:S.level,moment:pwCtx,n:S.pwViews,offer:'gift'}); if(!S.giftOpened){ showGift(); } else { showBoxOpen(); } return; }
  S.pwViews=(S.pwViews||0)+1; save();""".replace('__MYSTERY__', MYSTERY).replace('__SALON__', SALON).replace('__SHOP__', SHOP).replace('__MODEL__', MODEL))

# paywall_view for card/pick carries the arm; pick personalises the card
sub1("  track('paywall_view',{day:1,level:S.level,moment:pwCtx,n:S.pwViews});",
     "  track('paywall_view',{day:1,level:S.level,moment:pwCtx,n:S.pwViews,offer:EXP.pw_offer});\n"
     "  const pk = EXP.pw_offer==='pick' && S.d2pick && D2PICK[S.d2pick];")
sub1("  const ctaTxt = pwCtx==='cliff' && EXP.pw_cta==='story' ? 'Take Mira’s case' : CTA[EXP.pw_cta]||CTA.founder;",
     "  const ctaTxt = pk ? 'Play my Day 2' : pwCtx==='cliff' && EXP.pw_cta==='story' ? 'Take Mira’s case' : CTA[EXP.pw_cta]||CTA.founder;")
sub1("""    <div class="pl"><span class="crown">${ic('crown')} EARLY SUPPORTER</span>${Doll.dollSVG(S.av,{pose:'P04'})}</div>
    <div class="pr"><div class="small" style="font-weight:900;color:var(--lilac);letter-spacing:.06em">${kicker}</div>""",
     """    <div class="pl" ${pk?`style="background:url(${pk.img}) center/cover"`:''}><span class="crown">${ic('crown')} EARLY SUPPORTER</span>${Doll.dollSVG(S.av,{pose:'P04'})}</div>
    <div class="pr"><div class="small" style="font-weight:900;color:var(--lilac);letter-spacing:.06em">${pk?'Your Day 2 starts here':kicker}</div>${pk?`<p class="lead" style="margin:.1rem 0 0"><b>${pk.t}</b> · ${pk.d}</p>`:''}""")

# actions
sub1("  cliffgo(){ sfx('tap'); closeOverlay(); showPaywall('cliff'); },",
     "  cliffgo(){ sfx('tap'); closeOverlay(); showPaywall('cliff'); },\n"
     "  d2pick(el){ const k=el.dataset.k; if(!D2PICK[k]) return; sfx('ok'); S.d2pick=k; save(); track('day2_pick',{choice:k,moment:pwCtx}); closeOverlay(); showPaywall(pwCtx); },\n"
     "  giftopen(){ sfx('tap'); S.giftOpened=true; save(); track('gift_open',{moment:pwCtx}); showBoxOpen(); },")
# checkout click carries the arm
sub1("  checkout(){ track('checkout_click',{price:4.99,currency:'USD',product:'founders_pass',moment:pwCtx});",
     "  checkout(){ track('checkout_click',{price:4.99,currency:'USD',product:'founders_pass',moment:pwCtx,offer:EXP.pw_offer,pick:S.d2pick||null});")

# styles
sub1(".paywall .pl .doll{height:92%}",
     ".paywall .pl .doll{height:92%}\n"
     ".offer{width:min(46rem,98%);padding:1rem 1.2rem;background:linear-gradient(160deg,rgba(255,255,255,.97),rgba(255,236,247,.97) 60%,rgba(240,230,255,.97))}\n"
     ".ofr{display:flex;flex-direction:column;align-items:center;gap:.45rem;text-align:center}\n"
     ".ofr h2{font-size:1.7rem;margin:0;background:linear-gradient(90deg,#d08a1c,#ff4f9e);-webkit-background-clip:text;background-clip:text;color:transparent}\n"
     ".ofr-row{display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem;width:100%}.ofr-row.four{grid-template-columns:repeat(4,1fr)}\n"
     ".ofr-tile{display:flex;flex-direction:column;gap:.2rem;align-items:stretch;border:0;border-radius:1rem;padding:.4rem;background:#fff;box-shadow:0 .25rem .8rem rgba(140,60,120,.15);font:inherit;color:var(--ink);cursor:pointer;text-align:center}\n"
     ".ofr-tile .ph{display:block;aspect-ratio:4/3;border-radius:.7rem;background:#f3e6f7 center/cover}\n"
     ".ofr-tile b{font-size:.92rem}.ofr-tile small{font-size:.74rem;opacity:.75;font-weight:700}\n"
     "button.ofr-tile:active{transform:scale(.97)}\n"
     ".ofr-tile.pop{opacity:0;transform:scale(.6);animation:ofrpop .45s cubic-bezier(.3,1.6,.5,1) forwards}\n"
     "@keyframes ofrpop{to{opacity:1;transform:none}}\n"
     ".ofr-box{position:relative;width:8.5rem;height:7rem;border:0;margin:1.5rem 0 .3rem;border-radius:1rem;background:linear-gradient(180deg,#ff8cc6,#ff5fa8);box-shadow:0 .5rem 1.4rem rgba(255,79,158,.35);cursor:pointer;animation:ofrwig 1.6s ease-in-out infinite}\n"
     ".ofr-box .lid{position:absolute;left:-.4rem;right:-.4rem;top:-.2rem;height:1.6rem;border-radius:.6rem;background:linear-gradient(180deg,#ffb3d6,#ff8cc6)}\n"
     ".ofr-box::before{content:'';position:absolute;left:50%;top:0;bottom:0;width:1.1rem;margin-left:-.55rem;background:#ffe08a}\n"
     ".ofr-box .bow{position:absolute;left:50%;top:-1.3rem;transform:translateX(-50%);width:2.2rem;height:2.2rem;border-radius:50%;background:#ffe08a;display:flex;align-items:center;justify-content:center;color:#a35a00}\n"
     ".ofr-box .bow svg{width:1.3rem;height:1.3rem}\n"
     "@keyframes ofrwig{0%,70%,100%{transform:rotate(0)}76%{transform:rotate(-5deg)}82%{transform:rotate(5deg)}88%{transform:rotate(-3deg)}94%{transform:rotate(2deg)}}\n"
     "@media (prefers-reduced-motion:reduce){.ofr-box{animation:none}.ofr-tile.pop{animation:none;opacity:1;transform:none}}\n"
     "@media (max-height:420px){.ofr h2{font-size:1.35rem}.ofr-tile .ph{aspect-ratio:16/9}.offer{padding:.6rem .9rem}}")

open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
