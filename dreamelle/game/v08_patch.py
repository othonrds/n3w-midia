"""Dreamelle v0.8.0 (11/10/2026 12h40, Othon: "vamos fazer todos esses testes aí"):
- New players coming from an ad (fbclid / utm_source meta) skip the title screen and the intro slides
  and land straight on "Create your character" (the ad promise). 45 -> 21 was the biggest leak.
  Force for QA with ?x_skip=1. Event title_skipped.
- "Founder's Pass" renamed in the offer: card title "The full story", box "Your story box",
  home Day 2 lock "Unlock the full story · US$ 1".
- pw_offer: the gift box (most checkouts so far: 2 of 3) becomes the main screen, 2/3 of new players;
  'card' stays as control 1/3; 'pick' retired (0 checkouts).
Usage: python3 v08_patch.py index.html index.html
"""
import json, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:90])
    s = s.replace(old, new)

NEW = {
 "The full story": ["A história completa", "La historia completa", "L’histoire complète", "Die ganze Geschichte", "La storia completa"],
 "Your story box": ["Sua caixa da história", "Tu caja de la historia", "Ta boîte de l’histoire", "Deine Story-Box", "La tua scatola della storia"],
 "Day 2 is part of the full story — US$ 1.": ["O Dia 2 faz parte da história completa — US$ 1.", "El Día 2 es parte de la historia completa — US$ 1.", "Le Jour 2 fait partie de l’histoire complète — 1 $ US.", "Tag 2 gehört zur ganzen Geschichte — 1 US$.", "Il Giorno 2 fa parte della storia completa — 1 US$."],
 "Unlock the full story · US$ 1": ["Liberar a história completa · US$ 1", "Desbloquear la historia completa · US$ 1", "Débloquer l’histoire complète · 1 $ US", "Ganze Geschichte freischalten · 1 US$", "Sblocca la storia completa · 1 US$"],
}
i = s.index('const D=') + len('const D=')
j = s.index(', PAT=', i)
D = json.loads(s[i:j])
for k, v in NEW.items():
    for n, c in enumerate(['pt', 'es', 'fr', 'de', 'it']):
        D[c][k] = v[n]
s = s[:i] + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + s[j:]

# experiments
sub1("const EXPS = { pw_moment:['peak','cliff'], pw_offer:['card','pick','gift'] };",
     "const EXPS = { pw_moment:['peak','cliff'], pw_offer:['gift','gift','card'] }; // v0.8: gift main (2/3), card control")

# renames
sub1("      <h2>Founder’s Pass</h2>", "      <h2>The full story</h2>")
sub1("<h2>Your Founder’s box</h2>", "<h2>Your story box</h2>")
sub1("hint='Day 2 is part of the Founder’s Pass.'", "hint='Day 2 is part of the full story — US$ 1.'")
sub1("""<button class="btn gold" data-a="paywall" style="width:100%">Unlock with Founder’s Pass</button>""",
     """<button class="btn gold" data-a="paywall" style="width:100%">Unlock the full story · US$ 1</button>""")

# skip the title screen for new players from ads
sub1("if(conceptId){ track('concept_view',{concept:conceptId}); go('concept'); } else go('splash');",
     "const FROM_AD = !!(SRC.fbclid || /^(meta|fb|facebook|ig|instagram)$/i.test(SRC.utm_source||'') || new URLSearchParams(location.search).get('x_skip')==='1');\n"
     "if(conceptId){ track('concept_view',{concept:conceptId}); go('concept'); }\n"
     "else if(FROM_AD && !S.created){ track('title_skipped',{}); track('game_start',{returning:false,lang:I18N.lang,standalone:STANDALONE,concept:'',auto:true}); S.onbDone=true; save(); go('char'); }\n"
     "else go('splash');")
sub1("const VERSION = '0.7.0';", "const VERSION = '0.8.0';")
open(out, 'w', encoding='utf-8').write(s)
print('ok')
