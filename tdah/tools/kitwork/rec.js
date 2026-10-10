// Records one game with a scripted bot via CDP screencast (1080x1920 jpeg frames + timestamps).
// usage: node rec.js GAME OUTDIR [seed] [extra-json]
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const GAME = process.argv[2], OUT = process.argv[3], SEED = +(process.argv[4] || 1), K = +(process.env.K || 8);
const EXTRA = JSON.parse(process.argv[5] || '{}');
const GDIR = '/home/claude/adhd-reflex/kit-5345843cc6/games/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const INIT = (cfg) => {
  const K = cfg.k, rp = performance.now.bind(performance), rd = Date.now, p0 = rp(), d0 = rd();
  window.__d0 = d0; window.__K = K;
  performance.now = () => p0 + (rp() - p0) / K;
  Date.now = () => Math.round(d0 + (rd() - d0) / K);
  const vnow = () => d0 + (rd() - d0) / K;
  const st = window.setTimeout.bind(window), si = window.setInterval.bind(window);
  window.setTimeout = (f, ms, ...a) => st(f, (ms || 0) * K, ...a);
  window.setInterval = (f, ms, ...a) => si(f, (ms || 0) * K, ...a);
  const raf = window.requestAnimationFrame.bind(window), caf = window.cancelAnimationFrame.bind(window);
  let pend = new Map(), rid = 0, driving = false, lastV = 0;
  function tick() {
    const v = performance.now();
    if (v - lastV < 1000 / 60 - 2) { raf(tick); return; }
    lastV = v; const list = pend; pend = new Map(); driving = false;
    list.forEach(cb => { try { cb(v); } catch (e) { console.error(e); } });
    if (pend.size && !driving) { driving = true; raf(tick); }
  }
  window.requestAnimationFrame = cb => { const id = ++rid; pend.set(id, cb); if (!driving) { driving = true; raf(tick); } return id; };
  window.cancelAnimationFrame = id => { pend.delete(id); };
  try { localStorage.clear(); for (const k in cfg.ls) localStorage.setItem(k, cfg.ls[k]); } catch (e) {}
  // seeded random with an injectable queue
  let a = cfg.seed >>> 0 || 1;
  const prng = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  window.__rq = [];
  Math.random = () => (window.__rq.length ? window.__rq.shift() : prng());
  window.__ev = [];
  window.__mark = (type, extra) => { window.__ev.push(Object.assign({ t: vnow() / 1000, type }, extra || {})); };
  // finger overlay
  let fx = null, down = false, lastDot = 0;
  function layer() { if (!fx) { fx = document.createElement('div'); fx.style.cssText = 'position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2147483647'; document.documentElement.appendChild(fx); } return fx; }
  function ring(x, y, big) {
    const s = big ? 64 : 40, d = document.createElement('div');
    d.style.cssText = `position:absolute;left:${x - s / 2}px;top:${y - s / 2}px;width:${s}px;height:${s}px;border-radius:50%;background:rgba(255,255,255,.28);border:3.5px solid #fff;box-shadow:0 0 12px rgba(0,0,0,.35);transform:scale(.5);opacity:1;transition:transform .38s ease-out,opacity .38s ease-out`;
    layer().appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => { d.style.transform = 'scale(1.6)'; d.style.opacity = '0'; }));
    setTimeout(() => d.remove(), 450);
  }
  function dot(x, y) {
    const d = document.createElement('div');
    d.style.cssText = `position:absolute;left:${x - 16}px;top:${y - 16}px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.45);border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,.35);opacity:.95;transition:opacity .25s ease-out,transform .25s`;
    layer().appendChild(d); requestAnimationFrame(() => requestAnimationFrame(() => { d.style.opacity = '0'; d.style.transform = 'scale(.6)'; }));
    setTimeout(() => d.remove(), 300);
  }
  window.addEventListener('pointerdown', e => { down = true; ring(e.clientX, e.clientY, true); window.__mark('tap', { x: e.clientX, y: e.clientY }); }, true);
  window.addEventListener('pointermove', e => { if (!down) return; const n = performance.now(); if (n - lastDot > 22) { lastDot = n; dot(e.clientX, e.clientY); } }, true);
  window.addEventListener('pointerup', e => { if (down) ring(e.clientX, e.clientY, false); down = false; }, true);
};

(async () => {
  fs.mkdirSync(path.join(OUT, 'f'), { recursive: true });
  const bot = require('./bots/' + GAME + '.js');
  const b = await chromium.launch({ args: ['--force-device-scale-factor=3'] });
  const c = await b.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3 });
  await c.route(/supabase/, r => r.abort());
  await c.route(/^https?:/, r => r.abort());
  const p = await c.newPage();
  await p.addInitScript(INIT, { k: K, seed: SEED, ls: Object.assign({ kit_mute: '1' }, bot.ls || {}, EXTRA.ls || {}) });
  const cdp = await c.newCDPSession(p);
  await cdp.send('Animation.enable'); await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 / K });
  await p.goto('file://' + GDIR + GAME + '/index.html');
  await sleep(500);
  const frames = []; let n = 0;
  cdp.on('Page.screencastFrame', async ev => {
    const fn = String(n++).padStart(5, '0') + '.jpg';
    fs.writeFileSync(path.join(OUT, 'f', fn), Buffer.from(ev.data, 'base64'));
    frames.push({ f: fn, t: ev.metadata.timestamp });
    try { await cdp.send('Page.screencastFrameAck', { sessionId: ev.sessionId }); } catch (e) {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  await sleep(400);
  const vs = ms => sleep(ms * K);
  const H = {
    p, sleep: vs, K,
    wait: (fn, arg) => p.waitForFunction(fn, arg, { polling: 40, timeout: 120000 }),
    mark: (type, extra) => p.evaluate(([a, b]) => window.__mark(a, b), [type, extra || {}]),
    async tap(x, y, hold = 45) { await p.mouse.move(x, y); await p.mouse.down(); await vs(hold); await p.mouse.up(); },
    async center(sel) { const r = await p.locator(sel).first().boundingBox(); return [r.x + r.width / 2, r.y + r.height / 2]; },
    async drag(x0, y0, x1, y1, ms = 320, steps = 14, beforeUp) {
      await p.mouse.move(x0, y0); await p.mouse.down(); await vs(60);
      for (let i = 1; i <= steps; i++) { const k = i / steps, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; await p.mouse.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e); await vs(ms / steps); }
      await vs(70); if (beforeUp) await beforeUp(); await p.mouse.up();
    },
  };
  const res = await bot.run(H, EXTRA);
  await sleep(300);
  await cdp.send('Page.stopScreencast');
  await sleep(300);
  const ev = await p.evaluate(() => window.__ev);
  const d0 = await p.evaluate(() => window.__d0) / 1000;
  frames.forEach(f => { f.rt = f.t; f.t = d0 + (f.t - d0) / K; });
  fs.writeFileSync(path.join(OUT, 'rec.json'), JSON.stringify({ game: GAME, frames, ev, res }, null, 0));
  console.log(GAME, 'frames', frames.length, 'span', (frames[frames.length - 1].t - frames[0].t).toFixed(2), 'res', JSON.stringify(res));
  await c.close(); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
