// Grava uma partida "para video": bot espera as bolas certas chegarem ao meio da tela e destroi,
// erra de proposito as vezes (drama), corta as gemas, mostra o "dedo" na tela.
const fs = require('fs'); let pw; try { pw = require('playwright'); } catch (e) { pw = require('/opt/npm-tools/node_modules/playwright'); } const { chromium } = pw;
const OUT = process.argv[2] || 'rec1';
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 720, height: 1280 }, deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 720, height: 1280 } } });
  const p = await c.newPage();
  const src = process.env.GAME_HTML ? fs.readFileSync(process.env.GAME_HTML, 'utf8') : await (await fetch('https://adhd.xyzgames.app/?nc=' + Date.now())).text();
  const html = src
    .replace('function frame(t){', 'function frame(t){ window.__S=S; window.__tapAt=tapAt; window.__slice=sliceCheck; window.__H=H; window.__W=W;')
    .replace(/<script>\s*\/\* session replay[\s\S]*?<\/script>/, '');
  await p.route('https://adhd.xyzgames.app/**', r => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
  await p.route(/fbevents|facebook\.net|facebook\.com|supabase|hotjar|jsdelivr/, r => r.abort());
  const t0 = Date.now();
  await p.goto('https://adhd.xyzgames.app/?ab_ini=B&ab_rel=A&utm_source=claude');
  await p.waitForTimeout(700);
  await p.click('text=START FREE CHECK'); await p.waitForTimeout(500);
  await p.click("text=I'M READY");
  const tGame = (Date.now() - t0) / 1000;
  await p.evaluate(() => {
    const fx = document.createElement('div');
    fx.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(fx);
    function finger(x, y, bad) {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;left:${x - 36}px;top:${y - 36}px;width:72px;height:72px;border-radius:50%;
        background:${bad ? 'rgba(255,92,119,.35)' : 'rgba(255,255,255,.30)'};border:4px solid ${bad ? '#FF5C77' : '#fff'};
        transform:scale(.55);opacity:1;transition:transform .32s ease-out,opacity .32s ease-out`;
      fx.appendChild(d); requestAnimationFrame(() => { d.style.transform = 'scale(1.5)'; d.style.opacity = '0'; });
      setTimeout(() => d.remove(), 380);
    }
    const last = new Map(); let lastTap = 0;
    setInterval(() => {
      const S = window.__S, H = window.__H; if (!S || !S.running) return;
      const now = performance.now();
      const cv = document.querySelector('canvas'); const rc = cv.getBoundingClientRect();
      const k = rc.width / window.__W;
      for (const o of S.orbs) {
        if (o.dead) continue; const isT = o.color === S.tapColor;
        if (!o.__p) o.__p = { line: 0.46 + Math.random() * 0.16, slip: (!isT && S.wave >= 1 && Math.random() < 0.08), skip: isT && Math.random() < 0.05 };
        if (o.__p.skip) continue;
        if ((isT || o.__p.slip) && o.y > H * o.__p.line && now - (last.get(o) || 0) > 120 && now - lastTap > 70) {
          window.__tapAt(o.x, o.y, true); last.set(o, now); lastTap = now;
          finger(rc.left + o.x * k, rc.top + o.y * k, !isT);
        }
      }
      for (const g of S.gems) {
        if (g.sliced || g.__s) continue;
        if (g.y > H * 0.5) { g.__s = 1; window.__slice(g.x - g.r * 1.6, g.y - g.r * 0.5, g.x + g.r * 1.6, g.y + g.r * 0.5); finger(rc.left + g.x * k, rc.top + g.y * k, false); }
      }
    }, 25);
  });
  await p.waitForSelector('#reportScreen:not([hidden])', { timeout: 200000 });
  const tRep = (Date.now() - t0) / 1000;
  await p.waitForTimeout(3000);
  const S = await p.evaluate(() => ({ score: window.__S.score, hits: window.__S.hits, fa: window.__S.falseAlarms, best: window.__S.bestCombo }));
  await c.close(); await b.close();
  console.log(JSON.stringify({ tGame, tRep, S }));
})();
