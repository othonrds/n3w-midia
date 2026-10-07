"""Dreamelle app-like mode. Usage: python3 pwa_patch.py <in.html> <out_dir>
Writes <out_dir>/index.html, manifest.webmanifest and sw.js.
- Installable PWA (manifest + service worker): opens full screen from the home screen (iOS and Android).
- Android / iPad / desktop touch: real Fullscreen API + landscape lock on the first tap.
- iPhone Safari (no fullscreen API): one-time "play full screen like an app" sheet with Add to Home Screen steps.
- In-app browsers (Instagram, Facebook, TikTok): nothing is shown, the game just plays.
"""
import json, os, sys
src, outdir = sys.argv[1:3]
s = open(src, encoding='utf-8').read()

ICON = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/'
I512, I192, I180 = ICON + 'c8dd10a7-1443-4225-bb7e-7dc94e6d56c2.png', ICON + 'f3721bec-d83f-4abf-a457-65bd805265fb.png', ICON + 'cbb5012b-b7ea-4dcd-a786-561015796b8f.png'

def sub1(old, new):
    global s
    assert s.count(old) == 1, ('count', s.count(old), old[:90])
    s = s.replace(old, new)

# 1) head: app meta + manifest
head = f"""<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#ff8cc4">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Dreamelle">
<meta name="application-name" content="Dreamelle">
<meta name="format-detection" content="telephone=no">
<link rel="apple-touch-icon" href="{I180}">
<link rel="icon" type="image/png" sizes="192x192" href="{I192}">
"""
sub1('<meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">',
     '<meta name=viewport content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">' + head)

css = """<style>
/* app-like: no rubber-band, no callouts, no text selection */
html,body{overscroll-behavior:none;-webkit-touch-callout:none;touch-action:manipulation}
html.standalone,html.standalone body{background:#ffd9ec}
/* robust character layout (Safari) */
.char .layer{display:grid!important;grid-template-columns:36% minmax(0,1fr);grid-template-rows:minmax(0,1fr);gap:1rem}
.char .stage{position:relative;min-width:0;min-height:0;height:100%}
.char .stage .doll{position:absolute!important;bottom:0;left:50%;transform:translateX(-50%);height:100%!important;width:auto!important;max-width:none}
.char .panel{min-width:0;min-height:0;overflow:hidden}
.looks{grid-template-columns:repeat(6,minmax(0,1fr))}
.lookbtn{min-width:0}
/* install sheet */
.appsheet{display:flex;gap:1.2rem;align-items:center;text-align:left}
.appsheet .appicon{flex:0 0 7rem;width:7rem;height:7rem;border-radius:1.6rem;box-shadow:0 .5rem 1.4rem rgba(255,79,158,.35);background-size:cover;background-position:center}
.appsheet h2{margin:0 2.6rem .3rem 0;font-size:1.5rem}
.appsheet p{margin:0 0 .6rem;font-size:.92rem;line-height:1.4;color:var(--ink2)}
.appsheet ol{margin:0 0 .7rem;padding:0;list-style:none;display:grid;gap:.4rem}
.appsheet li{display:flex;align-items:center;gap:.55rem;font-weight:800;font-size:.95rem}
.appsheet li b{flex:0 0 1.7rem;height:1.7rem;border-radius:50%;background:var(--pink);color:#fff;display:flex;align-items:center;justify-content:center;font-size:.85rem}
.appsheet li svg{width:1.3rem;height:1.3rem;color:#2f7cf6}
.appchip{position:absolute;z-index:4;bottom:calc(3.2rem + var(--sb));left:calc(.9rem + var(--sl));display:flex;align-items:center;gap:.4rem;height:2.5rem;padding:0 .9rem;border-radius:1.25rem;background:rgba(255,255,255,.92);box-shadow:var(--shadow);font-weight:800;font-size:.85rem;color:var(--ink)}
.appchip svg{width:1.1rem;height:1.1rem;color:var(--pink)}
</style>
"""
j = s.find('</head>'); s = s[:j] + css + s[j:]

# 2) icons
sub1("  arrow:'M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z',\n",
     "  arrow:'M4 11h12.2l-5.6-5.6L12 4l8 8-8 8-1.4-1.4 5.6-5.6H4z',\n"
     "  share:'M12 2l4.5 4.5-1.4 1.4L13 5.8V15h-2V5.8L8.9 7.9 7.5 6.5zM5 10h3v2H6v8h12v-8h-2v-2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z',\n"
     "  plusbox:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5zm6 3h2v3h3v2h-3v3h-2v-3H8v-2h3z',\n"
     "  expand:'M3 3h7v2H6.4l4.3 4.3-1.4 1.4L5 6.4V10H3zm11 0h7v7h-2V6.4l-4.3 4.3-1.4-1.4L17.6 5H14zM3 14h2v3.6l4.3-4.3 1.4 1.4L6.4 19H10v2H3zm16 0h2v7h-7v-2h3.6l-4.3-4.3 1.4-1.4 4.3 4.3z',\n")

# 3) app module (inside the game closure so it can use overlay/track/go)
app_js = r"""
/* ===== App-like mode ===== */
const UA=navigator.userAgent||'';
const IS_IOS=/iPad|iPhone|iPod/.test(UA)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const IN_APP=/FBAN|FBAV|FB_IAB|FBIOS|Instagram|TikTok|musical_ly|BytedanceWebview|Snapchat|Pinterest|Line\//i.test(UA);
const STANDALONE=(window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches))||navigator.standalone===true;
const COARSE=window.matchMedia&&matchMedia('(pointer: coarse)').matches;
const DE=document.documentElement;
const FS_REQ=DE.requestFullscreen||DE.webkitRequestFullscreen;
const fsOn=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
let installEvt=null;
if(STANDALONE){ DE.classList.add('standalone'); }
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); installEvt=e; if(cur==='splash') go('splash'); });
window.addEventListener('appinstalled',()=>{ track('app_installed',{}); installEvt=null; });
function enterFS(){
  if(STANDALONE||!COARSE||!FS_REQ||fsOn()) return;
  try{ const p=FS_REQ.call(DE,{navigationUI:'hide'}); const lock=()=>{ try{ screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{}); }catch(e){} };
    if(p&&p.then) p.then(()=>{ lock(); track('fullscreen_on',{}); }).catch(()=>{}); else lock(); }catch(e){}
}
document.addEventListener('pointerup',enterFS,{capture:true});
document.addEventListener('touchend',enterFS,{capture:true,passive:true});
// iPhone Safari: no fullscreen API for pages, so the only full-screen path is Add to Home Screen.
const NEEDS_A2HS=IS_IOS&&!STANDALONE&&!IN_APP&&!(FS_REQ&&/iPad/.test(UA));
const CAN_INSTALL=()=>!STANDALONE&&!IN_APP&&(NEEDS_A2HS||!!installEvt);
function appChip(){ return CAN_INSTALL()?`<button class="appchip" data-a="appsheet">${ic('expand')}${NEEDS_A2HS?'Full screen':'Install the app'}</button>`:''; }
function showAppSheet(src){
  track('install_prompt_view',{src:src||'chip',ios:IS_IOS});
  const steps = NEEDS_A2HS
    ? `<ol><li><b>1</b><span>Tap the Share button</span>${ic('share')}</li><li><b>2</b><span>Choose “Add to Home Screen”</span>${ic('plusbox')}</li><li><b>3</b><span>Open Dreamelle from your Home Screen</span></li></ol>`
    : `<div class="btnrow" style="justify-content:flex-start"><button class="btn glow" data-a="appinstall">${ic('plusbox')} Install the app</button></div>`;
  overlay(`<button class="icon-btn x" data-a="appclose" aria-label="Close">${ic('close')}</button>
    <div class="appsheet"><div class="appicon" style="background-image:url(__I512__)"></div>
    <div><h2>Play full screen like an app</h2><p>Add Dreamelle to your Home Screen. It opens full screen, with no browser bars — just like an app.</p>${steps}
    <button class="linkbtn" data-a="appclose">Play in browser</button></div></div>`,'');
}
if(STANDALONE) track('pwa_open',{});
""".replace('__I512__', I512)
sub1("/* ===== Actions ===== */", app_js + "\n/* ===== Actions ===== */")

sub1("  rotok(){ document.body.classList.add('rot-ok'); },",
     """  rotok(){ document.body.classList.add('rot-ok'); },
  appsheet(){ sfx('tap'); showAppSheet('chip'); },
  appclose(){ track('install_prompt_dismiss',{}); closeOverlay(); },
  appinstall(){ if(!installEvt){ closeOverlay(); return; } track('install_click',{}); installEvt.prompt(); installEvt.userChoice.then(r=>{ track('install_choice',{outcome:r&&r.outcome}); installEvt=null; closeOverlay(); go(cur); }).catch(()=>{}); },""")

# Play: on iPhone Safari offer the full-screen app once before the first session
sub1("  play(){ track('game_start',{returning:!!S.created,lang:I18N.lang});",
     "  play(){ if(NEEDS_A2HS && !store.get('dreamelle_a2hs_seen')){ store.set('dreamelle_a2hs_seen','1'); showAppSheet('play'); return; }\n    track('game_start',{returning:!!S.created,lang:I18N.lang,standalone:STANDALONE});")

# splash chip
sub1('      <div class="foot"><span class="version">v${VERSION}</span>',
     '      ${appChip()}\n      <div class="foot"><span class="version">v${VERSION}</span>')

# service worker registration
sub1("go('splash');\nwindow.Dreamelle=",
     "go('splash');\nif('serviceWorker' in navigator && location.protocol==='https:'){ window.addEventListener('load',()=>{ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }); }\nwindow.Dreamelle=")
sub1("window.Dreamelle={get state(){return S;}, go, showPaywall, HOTMART_CHECKOUT_URL};",
     "window.Dreamelle={get state(){return S;}, go, showPaywall, showAppSheet, HOTMART_CHECKOUT_URL, env:{IS_IOS,IN_APP,STANDALONE,NEEDS_A2HS}};")
sub1("const VERSION = '0.3.1';", "const VERSION = '0.3.2';")

os.makedirs(outdir, exist_ok=True)
open(os.path.join(outdir, 'index.html'), 'w', encoding='utf-8').write(s)
manifest = {
    "name": "Dreamelle", "short_name": "Dreamelle", "description": "Create your dream life.",
    "id": "/", "start_url": "/?src=app", "scope": "/", "display": "fullscreen",
    "display_override": ["fullscreen", "standalone"], "orientation": "landscape",
    "background_color": "#ffd9ec", "theme_color": "#ff8cc4", "categories": ["games", "entertainment"],
    "icons": [{"src": I192, "sizes": "192x192", "type": "image/png", "purpose": "any"},
              {"src": I512, "sizes": "512x512", "type": "image/png", "purpose": "any"},
              {"src": I512, "sizes": "512x512", "type": "image/png", "purpose": "maskable"}]}
open(os.path.join(outdir, 'manifest.webmanifest'), 'w').write(json.dumps(manifest, indent=1))
open(os.path.join(outdir, 'sw.js'), 'w').write("""/* Dreamelle service worker: network-first for the page, cache as offline fallback. */
const C='dreamelle-v032';
self.addEventListener('install',e=>{ self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    e.respondWith(fetch(r).then(res=>{ const cp=res.clone(); caches.open(C).then(c=>c.put(r,cp)); return res; }).catch(()=>caches.match(r).then(m=>m||caches.match('/'))));
  } else if(/cloudfront\\.net$/.test(u.hostname)){
    e.respondWith(caches.open(C).then(c=>c.match(r).then(m=>m||fetch(r).then(res=>{ if(res.ok||res.type==='opaque') c.put(r,res.clone()); return res; }))));
  }
});
""")
print('ok', len(s))
