"""Dreamelle v0.9.0 (11/10/2026 19h, Othon 18h53/18h55):
- char_bg A/B on "Create your character": room (control) vs bay (Sunset Bay map background + "Welcome to Sunset Bay" kicker),
  because the Sunset Bay ad (C09) is the one that brings the most people.
- pw_chk A/B on the Stripe checkout image: face (current) | bay (Sunset Bay map) | gown (the ruined-gown mystery scene).
  Three Payment Links, same price US$ 1, same product name.
- Instant bonus: 9 HD Sunset Bay phone wallpapers, delivered right after paying (dreamelle.app/bonus/),
  announced on the offer screens and the checkout text. Gives the buyer something now, not only a pre-order.
Usage: python3 v09_patch.py index.html index.html
"""
import json, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/'
MAP = CDN + '1b6c984a-a46b-4094-ab51-cc5909dc2bd7.webp'

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:90])
    s = s.replace(old, new)

NEW = {
 "Welcome to Sunset Bay — your dream life starts here": ["Bem-vinda a Sunset Bay — sua vida dos sonhos começa aqui", "Bienvenida a Sunset Bay — tu vida soñada empieza aquí", "Bienvenue à Sunset Bay — ta vie de rêve commence ici", "Willkommen in Sunset Bay — dein Traumleben beginnt hier", "Benvenuta a Sunset Bay — la tua vita da sogno inizia qui"],
 "+ BONUS: 9 HD Sunset Bay phone wallpapers, yours instantly": ["+ BÔNUS: 9 papéis de parede HD de Sunset Bay, na hora", "+ BONO: 9 fondos de pantalla HD de Sunset Bay, al instante", "+ BONUS : 9 fonds d’écran HD de Sunset Bay, tout de suite", "+ BONUS: 9 HD-Hintergründe aus Sunset Bay, sofort", "+ BONUS: 9 sfondi HD di Sunset Bay, subito"],
 "Get my 9 bonus wallpapers": ["Pegar meus 9 papéis de parede", "Obtener mis 9 fondos de pantalla", "Obtenir mes 9 fonds d’écran", "Meine 9 Hintergründe holen", "Prendi i miei 9 sfondi"],
}
i = s.index('const D=') + len('const D=')
j = s.index(', PAT=', i)
D = json.loads(s[i:j])
for k, v in NEW.items():
    for n, c in enumerate(['pt', 'es', 'fr', 'de', 'it']):
        D[c][k] = v[n]
s = s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]

sub1("const EXPS = { pw_moment:['peak','cliff'], pw_offer:['gift','gift','card'] }; // v0.8: gift main (2/3), card control",
     "const EXPS = { pw_moment:['peak','cliff'], pw_offer:['gift','gift','card'], char_bg:['room','bay'], pw_chk:['face','bay','gown'] }; // v0.9")

# checkout link per image arm
sub1("const STRIPE_CHECKOUT_URL = 'https://buy.stripe.com/5kQ7sMeuA9EN7fs1wO3cc05'; // v0.7: US$ 1, approved by Othon 11/10",
     "const STRIPE_LINKS = { face:'https://buy.stripe.com/5kQ7sMeuA9EN7fs1wO3cc05', bay:'https://buy.stripe.com/9B6dRa9agg3b2Zcdfw3cc06', gown:'https://buy.stripe.com/9B6dRa3PW6sBeHUfnE3cc07' }; // v0.9 checkout image A/B, all US$ 1")
sub1("function checkoutUrl(){ return STRIPE_CHECKOUT_URL+'?client_reference_id=dg'+DEVICE+'&utm_source=dreamelle_game'; }",
     "function checkoutUrl(){ return (STRIPE_LINKS[EXP.pw_chk]||STRIPE_LINKS.face)+'?client_reference_id=dg'+DEVICE+'&utm_source=dreamelle_game'; }")

# Sunset Bay on character creation
sub1("    mountScreen('char',`<div class=\"bg bg-bed\"></div><div class=\"layer\">",
     "    mountScreen('char',`<div class=\"bg ${EXP.char_bg==='bay'?'bg-bay':'bg-bed'}\"></div><div class=\"layer\">")
sub1("""<div class="head"><button class="icon-btn" data-a="back-onb" aria-label="Back">${ic('back')}</button><div class="title">Create your character</div></div>""",
     """${EXP.char_bg==='bay'?'<div class="baykick">☀ Welcome to Sunset Bay — your dream life starts here</div>':''}<div class="head"><button class="icon-btn" data-a="back-onb" aria-label="Back">${ic('back')}</button><div class="title">Create your character</div></div>""")
sub1(".bg-bed::after{", ".bg-bay{background-image:url(" + MAP + ");filter:saturate(1.1)}\n.bg-bay::after{background:linear-gradient(120deg,rgba(255,236,246,.35),rgba(240,225,255,.15))}\n"
     ".baykick{font-weight:900;font-size:.82rem;letter-spacing:.02em;color:#c2337c;background:rgba(255,236,246,.9);border-radius:999px;padding:.25rem .8rem;align-self:flex-start;margin-bottom:.3rem}\n.bg-bed::after{")

# bonus line on the offers
sub1("""      <div class="price"><s class="was">US$ 4.99</s><b>US$ 1</b><span>launch price · one-time</span></div>${EXP.pw_loss""",
     """      <div class="price"><s class="was">US$ 4.99</s><b>US$ 1</b><span>launch price · one-time</span></div><div class="bonus">+ BONUS: 9 HD Sunset Bay phone wallpapers, yours instantly</div>${EXP.pw_loss""")
sub1("""    <div class="price"><s class="was">US$ 4.99</s><b>US$ 1</b><span>launch price · one-time</span></div>
    <div class="btnrow"><button class="btn gold big glow cta1" data-a="checkout\"""",
     """    <div class="price"><s class="was">US$ 4.99</s><b>US$ 1</b><span>launch price · one-time</span></div>
    <div class="bonus">+ BONUS: 9 HD Sunset Bay phone wallpapers, yours instantly</div>
    <div class="btnrow"><button class="btn gold big glow cta1" data-a="checkout\"""")
sub1(".pw2 .price b{", ".pw2 .bonus{font-weight:900;font-size:.85rem;color:#8b3fd1;background:linear-gradient(90deg,#f3e8ff,#ffe8f4);border:1.5px dashed #c79bf0;border-radius:.8rem;padding:.3rem .7rem;text-align:center}\n.pw2 .price b{")

# founder screen -> bonus
sub1("""      <div class="btnrow"><button class="btn glow" data-a="closeov">Keep playing</button></div></div>`,'paywall');""",
     """      <div class="btnrow"><a class="btn gold glow" href="/bonus/" target="_blank" rel="noopener" onclick="try{track('bonus_open',{})}catch(e){}">${ic('sparkle')} Get my 9 bonus wallpapers</a><button class="btn glow" data-a="closeov">Keep playing</button></div></div>`,'paywall');""")
sub1("track('checkout_click',{price:1,currency:'USD',product:'founders_pass',moment:pwCtx,offer:EXP.pw_offer,pick:S.d2pick||null});",
     "track('checkout_click',{price:1,currency:'USD',product:'founders_pass',moment:pwCtx,offer:EXP.pw_offer,chk:EXP.pw_chk,pick:S.d2pick||null});")
sub1("const VERSION = '0.8.1';", "const VERSION = '0.9.0';")
open(out, 'w', encoding='utf-8').write(s)
print('ok')
