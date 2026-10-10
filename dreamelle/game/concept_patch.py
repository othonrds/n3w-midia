"""Dreamelle concept-test pages. Usage: python3 concept_patch.py <in index.html> <out index.html>
dreamelle.vercel.app/?c=<id> opens a "coming soon" page for that game concept (honest fake door):
track concept_view, concept_vote (+ Meta Lead), concept_play. Then the player can play the real game.
"""
import json, sys
src, out = sys.argv[1:3]
s = open(src, encoding='utf-8').read()
CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/'
C = {
 'style': {'art': CDN + '1b88b6de-3b8d-40f1-9e64-eccf0a205084.webp', 'title': 'Gala Night', 'sub': 'Style her for the biggest night in Sunset Bay.',
           'pts': ['Pick gowns, shoes and jewelry', 'Every choice changes how the night goes', 'Unlock new looks as you play']},
 'date': {'art': CDN + '5f307106-a375-4e7f-becc-1e4dbd596479.webp', 'title': 'Sunset Dates', 'sub': 'Two dates. One rooftop. Your choices write the story.',
          'pts': ['Choose who she meets', 'Romance, drama and surprises', 'Different endings every time']},
 'home': {'art': CDN + '2901c501-c0ab-4858-bd8e-355a7f52bc99.webp', 'title': 'Dream Apartment', 'sub': 'Turn an empty seaside flat into her dream home.',
          'pts': ['Decorate room by room', 'Satisfying before and after', 'Unlock furniture and styles']},
 'influencer': {'art': CDN + 'c1bf3983-f870-49ec-bf98-b57250fc920a.webp', 'title': 'Going Viral', 'sub': 'From 0 to 1M followers in Sunset Bay.',
                'pts': ['Create content and pick trends', 'Grow followers and brand deals', 'Deal with fame and drama']},
 'mystery': {'art': CDN + '226bfdae-4e94-491c-97c5-9a43e7760c06.webp', 'title': 'Runway Mystery', 'sub': 'Someone ruined the gown before the show. Find out who.',
             'pts': ['Search for clues backstage', 'Question three suspects', 'Save the show before the lights go on']},
 'spa': {'art': CDN + 'a28c1c90-a016-4161-91f2-51e6b8dc6b3c.webp', 'title': 'Spa Night', 'sub': 'A calm, satisfying self-care routine for her and for you.',
         'pts': ['Relaxing step-by-step routines', 'Soft sounds and cozy rooms', 'Unlock new rituals every day']},
}

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:80])
    s = s.replace(old, new)

css = """<style>
.concept .bg{filter:saturate(1.05)}
.concept .bg::after{background:linear-gradient(90deg,rgba(40,10,40,.0) 30%,rgba(40,10,40,.35) 100%)}
.ccard2{position:absolute;z-index:2;right:calc(1.2rem + var(--sr));top:50%;transform:translateY(-50%);width:min(24rem,46%);padding:1.1rem 1.3rem;border-radius:1.4rem;background:rgba(255,255,255,.93);box-shadow:var(--shadow)}
.ccard2 .tagc{display:inline-block;font-weight:900;font-size:.68rem;letter-spacing:.08em;color:#fff;background:linear-gradient(90deg,#a98bf5,#ff5fa8);padding:.3rem .7rem;border-radius:999px}
.ccard2 h2{font-family:var(--fd);font-size:1.9rem;margin:.45rem 0 .2rem;color:var(--ink)}
.ccard2 p{margin:0 0 .5rem;color:var(--ink2);font-weight:700;font-size:.92rem;line-height:1.35}
.ccard2 ul{margin:0 0 .7rem;padding:0;list-style:none;display:grid;gap:.25rem}
.ccard2 li{font-weight:800;font-size:.85rem;display:flex;gap:.4rem;align-items:center}
.ccard2 li:before{content:"";width:.55rem;height:.55rem;border-radius:50%;background:var(--pink);flex:0 0 auto}
.ccard2 .btn{width:100%;justify-content:center}
.ccard2 .linkbtn{display:block;margin:.55rem auto 0}
.ccard2 .ok{font-weight:900;color:#3bbf7a;margin:.2rem 0 .5rem}
</style>
"""
j = s.find('</head>'); s = s[:j] + css + s[j:]

js_concepts = 'const CONCEPTS=' + json.dumps(C, separators=(',', ':')) + ';\n'
sub1("const SCREENS = {\n  splash(){",
     js_concepts + """let conceptId=null;
try{ const q=new URLSearchParams(location.search).get('c'); if(q && CONCEPTS[q]) conceptId=q; }catch(e){}
const SCREENS = {
  concept(){
    const c=CONCEPTS[conceptId]; const voted=store.get('dreamelle_vote_'+conceptId);
    mountScreen('concept',`<div class="bg" style="background-image:url(${c.art})"></div>
      <div class="ccard2" data-noi18n><span class="tagc">NEW MODE · COMING SOON TO DREAMELLE</span><h2>${c.title}</h2><p>${c.sub}</p>
      <ul>${c.pts.map(t=>`<li>${t}</li>`).join('')}</ul>
      ${voted?'<div class="ok">You are on the early list on this device 💖</div>':`<button class="btn big glow" data-a="cvote">I want to play this! 💖</button>`}
      <button class="${voted?'btn big glow':'linkbtn'}" data-a="cplay">${voted?'Play Dreamelle Day 1 now':'Play Dreamelle now (free)'}</button></div>`);
  },
  splash(){""")

sub1("  rotok(){ document.body.classList.add('rot-ok'); },",
     """  rotok(){ document.body.classList.add('rot-ok'); },
  cvote(){ store.set('dreamelle_vote_'+conceptId,'1'); track('concept_vote',{concept:conceptId}); try{ window.fbq&&fbq('track','Lead',{content_name:'concept_'+conceptId}); }catch(e){} sfx('win'); confetti(); go('concept'); },
  cplay(){ track('concept_play',{concept:conceptId}); sfx('tap'); store.set('dreamelle_concept',conceptId); conceptId=null; try{ history.replaceState(null,'',location.pathname); }catch(e){} go('splash'); },""")

sub1("go('splash');\nif('serviceWorker'",
     "if(conceptId){ track('concept_view',{concept:conceptId}); go('concept'); } else go('splash');\nif('serviceWorker'")
# remember which concept brought the player, for later analysis
sub1("track('game_start',{returning:!!S.created,lang:I18N.lang,standalone:STANDALONE});",
     "track('game_start',{returning:!!S.created,lang:I18N.lang,standalone:STANDALONE,concept:store.get('dreamelle_concept')||''});")
sub1("const VERSION = '0.3.2';", "const VERSION = '0.3.3';")
open(out, 'w', encoding='utf-8').write(s)
print('ok', len(s))
