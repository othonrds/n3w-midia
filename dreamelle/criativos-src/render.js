// Dreamelle static ads, 1080x1350. Usage (Higgsfield sandbox): node render.js <outdir>
// Needs ./assets.json next to it. 1) captures real game screens from dreamelle.vercel.app, 2) composes each ad in HTML, 3) renders PNG.
const { chromium } = require('/usr/local/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || 'out';
const A = JSON.parse(fs.readFileSync(path.join(__dirname, 'assets.json'), 'utf8'));
fs.mkdirSync(OUT + '/shots', { recursive: true });
const GAME = 'https://dreamelle.vercel.app/?lang=en';

async function capture(b) {
  const c = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, locale: 'en-US' });
  const p = await c.newPage();
  await p.route('**/connect.facebook.net/**', r => r.abort());
  const W = ms => p.waitForTimeout(ms), S = n => p.screenshot({ path: `${OUT}/shots/${n}.png` });
  await p.goto(GAME); await W(3500); await S('splash');
  await p.evaluate("Dreamelle.state.name='Ava';Dreamelle.go('char')"); await W(2500); await S('char');
  await p.evaluate("Dreamelle.go('career')"); await W(2500); await S('career');
  await p.evaluate("Object.assign(Dreamelle.state,{created:true,career:'lawyer',onbDone:true});Dreamelle.go('home')"); await W(2500); await S('home');
  await p.click('#btn-start'); await W(2600); await S('map');
  await p.evaluate("Dreamelle.go('law')"); await W(2500); await S('law');
  await p.click('#job-clause'); await W(2000); await S('case');
  await p.click('#ans-0'); await W(900); await S('case_wrong');
  await p.click('#ans-1'); await W(2600); await S('reward');
  await p.evaluate("Dreamelle.go('org')"); await W(1800);
  // file two docs correctly so the counters show progress
  for (const [doc, f] of [['d1', 'contracts'], ['d3', 'evidence']]) { await p.click('#doc-' + doc); await W(250); await p.click('#folder-' + f); await W(500); }
  await S('org');
  await c.close();
}

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">`;
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;overflow:hidden;font-family:Nunito,sans-serif;color:#4a2547;position:relative;background:#ffe3f1}
.bg{position:absolute;inset:0;background-size:cover;background-position:center}
.veil{position:absolute;inset:0}
.hook{position:absolute;left:72px;right:72px;font-family:Fredoka,sans-serif;font-weight:700;font-size:92px;line-height:1.02;letter-spacing:-1px;color:#4a2547}
.hook em{font-style:normal;color:#ff4f9e}
.sub{position:absolute;left:72px;right:72px;font-weight:800;font-size:38px;line-height:1.25;color:#6b3f68}
.cta{position:absolute;left:72px;bottom:84px;font-family:Fredoka,sans-serif;font-weight:600;font-size:40px;color:#ff4f9e}
.fine{position:absolute;left:72px;right:72px;bottom:40px;font-weight:700;font-size:22px;color:rgba(74,37,71,.6)}
.logo{position:absolute;right:72px;bottom:72px;font-family:Fredoka,sans-serif;font-weight:700;font-size:46px;background:linear-gradient(180deg,#ff8cc4,#ff4f9e);-webkit-background-clip:text;color:transparent}
.phone{position:absolute;background:#1d1220;border-radius:58px;padding:20px;box-shadow:0 40px 80px rgba(120,30,90,.35),inset 0 0 0 3px #3a2a3e}
.phone .scr{border-radius:40px;overflow:hidden;position:relative;background:#000}
.phone .scr img{display:block;width:100%;height:100%;object-fit:cover}
.phone .isl{position:absolute;left:30px;top:50%;width:14px;height:90px;margin-top:-45px;border-radius:8px;background:#000;z-index:2}
.pose{position:absolute;filter:drop-shadow(0 24px 30px rgba(120,30,90,.35))}
.tag{display:inline-block;padding:10px 22px;border-radius:999px;background:#fff;font-weight:900;font-size:26px;color:#a98bf5;letter-spacing:1px;box-shadow:0 8px 20px rgba(155,48,120,.18)}
.tap{position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.35);border:6px solid #fff;box-shadow:0 0 0 14px rgba(255,79,158,.25),0 10px 30px rgba(0,0,0,.25)}
`;
const phone = (shot, x, y, w, rot = 0) => {
  const h = Math.round(w * 390 / 844);
  return `<div class="phone" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)"><div class="isl"></div><div class="scr" style="width:${w}px;height:${h}px"><img src="shots/${shot}.png"></div></div>`;
};
const FINE = 'Original game · Free to start · Not affiliated with any toy brand';
const foot = (cta = 'Play free in your browser →') => `<div class="cta">${cta}</div><div class="logo">Dreamelle</div><div class="fine">${FINE}</div>`;
const soft = (img, op = .82) => `<div class="bg" style="background-image:url(${img});filter:blur(6px) saturate(1.1);transform:scale(1.06)"></div><div class="veil" style="background:linear-gradient(180deg,rgba(255,232,244,${op}) 0%,rgba(255,226,242,${op - .1}) 45%,rgba(255,236,246,${op + .08}) 100%)"></div>`;

const ADS = [
  { id: 'C01', angulo: 'nostalgia', hook: 'The doll games you loved grew up.', html: () =>
    `<div class="bg" style="background-image:url(${A.C01_quarto})"></div><div class="veil" style="background:linear-gradient(100deg,rgba(255,232,244,.95) 0%,rgba(255,226,242,.82) 48%,rgba(255,226,242,.1) 78%)"></div>
     <div class="hook" style="top:120px;right:420px;font-size:100px">The doll games you loved <em>grew up.</em></div>
     <div class="sub" style="top:610px;right:470px">Create her. Pick a career. Live the dream life.</div>
     <img class="pose" src="${A.P05_aceno}" style="right:-40px;top:150px;height:1080px">
     ${phone('splash', 72, 820, 520, -3)}${foot()}` },
  { id: 'C02', angulo: 'carreira-quiz', hook: 'Would you make a good lawyer?', html: () =>
    `${soft(A.C03_escritorio)}<div class="hook" style="top:96px">Would you make a <em>good lawyer?</em></div>
     <div class="sub" style="top:330px">Solve your first case in Sunset Bay.</div>
     ${phone('case', 50, 470, 940, -2)}${foot('Take the case →')}` },
  { id: 'C03', angulo: 'identidade', hook: 'Which one are you?', html: () =>
    `<div class="bg" style="background:linear-gradient(160deg,#ffe3f1,#f1e6ff)"></div>
     <div class="hook" style="top:90px;text-align:center">Which one <em>are you?</em></div>
     <div style="position:absolute;left:72px;right:72px;top:290px;display:grid;grid-template-columns:repeat(3,1fr);gap:26px">
       ${['V01','V02','V03','V04','V05','V06'].map((k,i)=>`<div style="position:relative;aspect-ratio:1/1.12;border-radius:36px;overflow:hidden;background:linear-gradient(180deg,#ffe6f3,#efe3ff);box-shadow:0 14px 30px rgba(155,48,120,.2);border:6px solid #fff"><img src="${A[k]}" style="width:100%;height:100%;object-fit:cover;object-position:50% 12%"><span style="position:absolute;left:16px;top:14px;width:64px;height:64px;border-radius:50%;background:#ff4f9e;color:#fff;font-family:Fredoka;font-weight:700;font-size:40px;display:flex;align-items:center;justify-content:center">${'ABCDEF'[i]}</span></div>`).join('')}
     </div>
     <div class="sub" style="top:1060px;text-align:center">Pick your look and create your dream life.</div>${foot('Create yours →')}` },
  { id: 'C04', angulo: 'escolha-look', hook: 'Pick her look. Live her life.', html: () =>
    `${soft(A.C04_casa)}<div class="hook" style="top:96px">Pick her look. <em>Live her life.</em></div>
     <div class="sub" style="top:330px">6 looks to start. More unlock as you play.</div>
     ${phone('char', 50, 480, 940, 0)}<div class="tap" style="left:690px;top:640px"></div>${foot('Create your character →')}` },
  { id: 'C05', angulo: 'dream-life', hook: 'Your dream life starts on Day 1.', html: () =>
    `${soft(A.C01_quarto)}<div class="hook" style="top:96px">Your dream life starts on <em>Day 1.</em></div>
     <div class="sub" style="top:330px">Go to work, win a case, level up, go home.</div>
     ${phone('home', 50, 480, 940, 2)}${foot()}` },
  { id: 'C06', angulo: 'carreira-fantasia', hook: 'Pick your dream career.', html: () =>
    `${soft(A.C04_casa)}<div class="hook" style="top:96px">Pick your <em>dream career.</em></div>
     <div class="sub" style="top:330px">Start as a lawyer today. More careers are coming soon.</div>
     ${phone('career', 50, 520, 940, -2)}${foot()}` },
  { id: 'C07', angulo: 'falha-desafio', hook: 'She almost lost her first case.', html: () =>
    `${soft(A.C03_escritorio)}<div class="hook" style="top:96px">She almost lost <em>her first case.</em></div>
     <div class="sub" style="top:330px">Can you get it right on the first try?</div>
     ${phone('case_wrong', 50, 480, 940, 0)}${foot('Try the case →')}` },
  { id: 'C08', angulo: 'satisfatorio', hook: 'Sort the case files in 45 seconds.', html: () =>
    `${soft(A.C03_escritorio)}<div class="hook" style="top:96px">Sort the case files in <em>45 seconds.</em></div>
     <div class="sub" style="top:330px">Tap, drag, beat the clock.</div>
     ${phone('org', 50, 480, 940, 2)}${foot('Beat the clock →')}` },
  { id: 'C09', angulo: 'explorar-cidade', hook: 'Welcome to Sunset Bay.', html: () =>
    `<div class="bg" style="background-image:url(${A.C02_mapa})"></div><div class="veil" style="background:linear-gradient(180deg,rgba(255,232,244,.96) 0%,rgba(255,232,244,.75) 30%,rgba(255,232,244,.15) 55%,rgba(255,232,244,.85) 88%)"></div>
     <div class="hook" style="top:96px">Welcome to <em>Sunset Bay.</em></div>
     <div class="sub" style="top:330px">Level up to unlock the salon, the beach and shopping.</div>
     ${phone('map', 50, 520, 940, -2)}${foot('Explore the city →')}` },
  { id: 'C10', angulo: 'recompensa', hook: 'That “case won” feeling.', html: () =>
    `${soft(A.C03_escritorio, .78)}<div class="hook" style="top:96px">That <em>“case won”</em> feeling.</div>
     <div class="sub" style="top:330px">Earn XP, coins and reputation. Level up your career.</div>
     ${phone('reward', 50, 480, 760, -3)}<img class="pose" src="${A.P04_comemora}" style="right:10px;top:380px;height:820px">${foot()}` },
];

(async () => {
  const b = await chromium.launch();
  if (!process.env.SKIP_CAPTURE) await capture(b);
  const c = await b.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const p = await c.newPage();
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  for (const ad of ADS) {
    if (only && !only.includes(ad.id)) continue;
    const html = `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head><body>${ad.html()}</body></html>`;
    fs.writeFileSync(`${OUT}/${ad.id}.html`, html);
    await p.goto('file://' + path.resolve(OUT, ad.id + '.html'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    await p.screenshot({ path: `${OUT}/${ad.id}.png` });
  }
  fs.writeFileSync(`${OUT}/ads.json`, JSON.stringify(ADS.map(({ id, angulo, hook }) => ({ id, angulo, hook })), null, 1));
  await b.close(); console.log('done');
})();
