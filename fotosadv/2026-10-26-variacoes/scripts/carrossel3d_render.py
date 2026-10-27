import sys,pathlib
from playwright.sync_api import sync_playwright
W=pathlib.Path(sys.argv[1]); out=W/'fr'; out.mkdir(exist_ok=True); FPS=30
with sync_playwright() as pw:
  b=pw.chromium.launch(); pg=b.new_page(viewport={'width':1080,'height':1350}); pg.goto(f'file://{W}/c.html'); pg.wait_for_timeout(800)
  D=pg.evaluate('window.DUR'); N=int(D*FPS)
  for i in range(N):
    pg.evaluate('t=>new Promise(r=>{render(t);requestAnimationFrame(()=>r())})', i/FPS); pg.screenshot(path=str(out/f'{i:04d}.png'))
  b.close()
print(N)
