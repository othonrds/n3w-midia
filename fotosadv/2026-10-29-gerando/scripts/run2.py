import sys,pathlib,json,urllib.parse
from playwright.sync_api import sync_playwright
W=pathlib.Path(__file__).parent.resolve(); name=sys.argv[1]; K=json.loads(sys.argv[2]); only=[float(x) for x in sys.argv[3:]]
out=W/f'fr_{name}'; out.mkdir(exist_ok=True); FPS=30
with sync_playwright() as pw:
  b=pw.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1350}); pg.goto(f'file://{W}/g02.html#'+urllib.parse.quote(json.dumps(K))); pg.wait_for_timeout(1200)
  if only:
    for t in only:
      pg.evaluate('t=>new Promise(r=>{render(t);requestAnimationFrame(()=>r())})', t); pg.screenshot(path=str(W/f'ck_{name}_{t:05.2f}.png'))
  else:
    N=int(pg.evaluate('window.DUR')*FPS)
    for i in range(N):
      pg.evaluate('t=>new Promise(r=>{render(t);requestAnimationFrame(()=>r())})', i/FPS); pg.screenshot(path=str(out/f'{i:04d}.png'))
    print(N)
  b.close()
