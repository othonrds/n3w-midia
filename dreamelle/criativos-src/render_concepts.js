// Dreamelle concept-test ads (1080x1350). Usage (Higgsfield sandbox): node render_concepts.js <outdir>
// Concept art from the CDN + game-style UI drawn in HTML. Every ad carries a "coming soon" tag (honest concept test).
const { chromium } = require('/usr/local/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || 'outc'; fs.mkdirSync(OUT, { recursive: true });
const CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/';
const ART = { style: '1b88b6de-3b8d-40f1-9e64-eccf0a205084', date: '5f307106-a375-4e7f-becc-1e4dbd596479', home: '2901c501-c0ab-4858-bd8e-355a7f52bc99',
  influencer: 'c1bf3983-f870-49ec-bf98-b57250fc920a', mystery: '226bfdae-4e94-491c-97c5-9a43e7760c06', spa: 'a28c1c90-a016-4161-91f2-51e6b8dc6b3c' };
const art = k => CDN + ART[k] + '.webp';
const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@600;700;800;900&display=swap" rel="stylesheet">`;
const CSS = `*{box-sizing:border-box;margin:0;padding:0}
body{width:1080px;height:1350px;overflow:hidden;font-family:Nunito,sans-serif;color:#4a2547;position:relative;background:#ffe3f1}
.bg{position:absolute;inset:-30px;background-size:cover;background-position:center;filter:blur(14px) saturate(1.1)}
.veil{position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,234,245,.94) 0%,rgba(255,228,243,.80) 30%,rgba(255,228,243,.55) 60%,rgba(255,236,246,.92) 100%)}
.dark .veil{background:linear-gradient(180deg,rgba(40,12,48,.92) 0%,rgba(40,12,48,.72) 32%,rgba(40,12,48,.5) 60%,rgba(40,12,48,.9) 100%)}
.hook{position:absolute;left:72px;right:72px;top:92px;font-family:Fredoka,sans-serif;font-weight:700;font-size:94px;line-height:1.02;letter-spacing:-1px}
.hook em{font-style:normal;color:#ff4f9e;white-space:nowrap}
.dark .hook{color:#fff}.dark .sub{color:#ffd9ec}.dark .fine{color:rgba(255,255,255,.65)}
.sub{position:absolute;left:72px;right:72px;top:318px;font-weight:800;font-size:38px;line-height:1.25;color:#6b3f68}
.tag{position:absolute;left:72px;top:40px;padding:10px 22px;border-radius:999px;background:linear-gradient(90deg,#a98bf5,#ff5fa8);color:#fff;font-weight:900;font-size:24px;letter-spacing:2px}
.phone{position:absolute;left:40px;top:420px;border-radius:46px;border:8px solid #fff;box-shadow:0 0 0 6px #ff8cc4,0 40px 80px rgba(120,30,90,.35)}
.scr{width:984px;height:720px;border-radius:38px;overflow:hidden;position:relative;background-size:cover;background-position:center}
.isl{display:none}
.ui{position:absolute;font-family:Fredoka,sans-serif;font-weight:600}
.chip{background:rgba(255,255,255,.94);border-radius:26px;box-shadow:0 8px 20px rgba(80,20,70,.25);color:#4a2547}
.btnp{background:linear-gradient(180deg,#ff8cc4,#ff4f9e);color:#fff;border-radius:30px;box-shadow:0 8px 0 #d43c86,0 14px 24px rgba(120,30,90,.35)}
.cta{position:absolute;left:72px;bottom:84px;font-family:Fredoka,sans-serif;font-weight:600;font-size:40px;color:#ff4f9e}
.logo{position:absolute;right:72px;bottom:72px;font-family:Fredoka,sans-serif;font-weight:700;font-size:46px;background:linear-gradient(180deg,#ff8cc4,#ff4f9e);-webkit-background-clip:text;color:transparent}
.fine{position:absolute;left:72px;right:72px;bottom:40px;font-weight:700;font-size:22px;color:rgba(74,37,71,.6)}`;
const FINE = 'New mode in development · Original game · Not affiliated with any toy brand';
const shell = (k, hook, sub, ui, dark = false, cta = 'Get early access →') =>
  `<body class="${dark ? 'dark' : ''}"><div class="bg" style="background-image:url(${art(k)})"></div><div class="veil"></div>
   <div class="tag">NEW MODE · COMING SOON</div><div class="hook">${hook}</div><div class="sub">${sub}</div>
   <div class="phone"><div class="isl"></div><div class="scr" style="background-image:url(${art(k)});${k==='mystery'?'height:554px;margin-top:80px':''}">${ui}</div></div>
   <div class="cta">${cta}</div><div class="logo">Dreamelle</div><div class="fine">${FINE}</div></body>`;
const two = (a, b) => `<div class="ui" style="left:0;right:0;bottom:26px;display:flex;justify-content:center;gap:28px">
   <div class="ui chip" style="position:static;padding:16px 34px;font-size:34px">${a}</div><div class="ui btnp" style="position:static;padding:16px 34px;font-size:34px">${b}</div></div>`;
const tap = (x, y) => `<div style="position:absolute;left:${x}px;top:${y}px;width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,.35);border:6px solid #fff;box-shadow:0 0 0 12px rgba(255,79,158,.3);z-index:4"></div>`;

const ADS = [
  { id: 'K1A', c: 'style', angulo: 'estilo-escolha', hook: 'Champagne or rose? <em>Pick her look.</em>', html: () =>
    shell('style', 'Champagne or rose? <em>Pick her look.</em>', 'Style her for the biggest night in Sunset Bay.', two('A · Champagne', 'B · Rose') + tap(700, 590)) },
  { id: 'K1B', c: 'style', angulo: 'estilo-desafio', hook: 'Dress her for the gala in 30 seconds.', html: () =>
    shell('style', 'Dress her for the gala in <em>30 seconds.</em>', 'Gowns, shoes, jewelry. The clock is on.',
      `<div class="ui chip" style="right:26px;top:22px;padding:10px 24px;font-size:34px">⏱ 0:30</div>` + two('Gown', 'Shoes')) },
  { id: 'K2A', c: 'date', angulo: 'romance-escolha', hook: 'Rooftop date. Who does she choose?', html: () =>
    shell('date', 'Rooftop date. <em>Who does she choose?</em>', 'Your choices write her love story.', two('💙 Ethan', '🤍 Leo') + tap(600, 590)) },
  { id: 'K2B', c: 'date', angulo: 'romance-drama', hook: 'Two dates. One sunset. Your call.', html: () =>
    shell('date', 'Two dates. One sunset. <em>Your call.</em>', 'Romance, drama and surprises in Sunset Bay.',
      `<div class="ui chip" style="left:50%;transform:translateX(-50%);bottom:26px;padding:14px 30px;font-size:30px;max-width:900px;text-align:center">“So… who are you having dinner with tonight?”</div>`) },
  { id: 'K3A', c: 'home', angulo: 'casa-antes-depois', hook: 'From empty to dream apartment.', html: () =>
    shell('home', 'From empty to <em>dream apartment.</em>', 'Decorate her seaside home room by room.',
      `<div class="ui chip" style="left:30px;top:22px;padding:10px 22px;font-size:30px">BEFORE</div><div class="ui btnp" style="right:30px;top:22px;padding:10px 22px;font-size:30px">AFTER ✨</div>`) },
  { id: 'K3B', c: 'home', angulo: 'casa-design', hook: 'Design her dream home.', html: () =>
    shell('home', 'Design her <em>dream home.</em>', 'Sofas, lights, flowers. Every room is yours.',
      `<div class="ui chip" style="left:50%;transform:translateX(-50%);bottom:26px;padding:12px 28px;font-size:30px;width:620px"><div style="display:flex;justify-content:space-between"><span>Living room</span><span>3/8 rooms</span></div><div style="height:14px;border-radius:7px;background:#f3d8e8;margin-top:8px"><div style="width:38%;height:100%;border-radius:7px;background:linear-gradient(90deg,#ff8cc4,#ff4f9e)"></div></div></div>`) },
  { id: 'K4A', c: 'influencer', angulo: 'fama-numero', hook: '0 to 1M followers. Can you?', html: () =>
    shell('influencer', '0 to 1M followers. <em>Can you?</em>', 'Post, pick trends, go viral in Sunset Bay.',
      `<div class="ui chip" style="left:30px;top:22px;padding:12px 26px;font-size:36px">👥 12,480 followers</div><div class="ui btnp" style="right:30px;bottom:26px;padding:14px 30px;font-size:32px">Post ♥</div>`) },
  { id: 'K4B', c: 'influencer', angulo: 'fama-viral', hook: 'Her first post just went viral.', html: () =>
    shell('influencer', 'Her first post just <em>went viral.</em>', 'What does she post next?', two('☕ Coffee vlog', '👗 Outfit check')) },
  { id: 'K5A', c: 'mystery', angulo: 'misterio-pergunta', hook: 'Who ruined the gown?', dark: true, html: () =>
    shell('mystery', 'Who ruined <em>the gown?</em>', 'One of them did it. The show starts in 10 minutes.',
      `<div class="ui" style="left:0;right:0;bottom:26px;display:flex;justify-content:center;gap:22px">${['A · Stylist', 'B · Photographer', 'C · Model'].map((t, i) => `<div class="ui ${i === 1 ? 'btnp' : 'chip'}" style="position:static;padding:14px 26px;font-size:30px">${t}</div>`).join('')}</div>`, true, 'Solve the mystery →') },
  { id: 'K5B', c: 'mystery', angulo: 'misterio-detetive', hook: 'Find the saboteur before the show.', dark: true, html: () =>
    shell('mystery', 'Find the saboteur <em>before the show.</em>', 'Search for clues backstage in Sunset Bay.',
      `<div class="ui chip" style="right:26px;top:22px;padding:10px 24px;font-size:32px">🔍 Clues 2/5</div>`, true, 'Solve the mystery →') },
  { id: 'K6A', c: 'spa', angulo: 'spa-asmr', hook: 'Spa night. Pure satisfaction.', html: () =>
    shell('spa', 'Spa night. <em>Pure satisfaction.</em>', 'A calm, cozy routine, one step at a time.',
      `<div class="ui" style="left:0;right:0;bottom:26px;display:flex;justify-content:center;gap:18px">${['Cleanse ✓', 'Mask ✓', 'Glow'].map((t, i) => `<div class="ui ${i === 2 ? 'btnp' : 'chip'}" style="position:static;padding:12px 26px;font-size:30px">${t}</div>`).join('')}</div>`) },
  { id: 'K6B', c: 'spa', angulo: 'spa-relax', hook: 'Your 5 most relaxing minutes today.', html: () =>
    shell('spa', 'Your 5 most relaxing <em>minutes today.</em>', 'Candles, bubbles, rose mask. Breathe.', tap(520, 330)) },
];

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1080, height: 1350 } })).newPage();
  for (const ad of ADS) {
    fs.writeFileSync(`${OUT}/${ad.id}.html`, `<!doctype html><html><head><meta charset="utf-8">${FONTS}<style>${CSS}</style></head>${ad.html()}</html>`);
    await p.goto('file://' + path.resolve(OUT, ad.id + '.html'), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
    await p.screenshot({ path: `${OUT}/${ad.id}.png` });
  }
  fs.writeFileSync(`${OUT}/ads.json`, JSON.stringify(ADS.map(({ id, c, angulo, hook }) => ({ id, c, angulo, hook: hook.replace(/<\/?em>/g, '') })), null, 1));
  await b.close(); console.log('done');
})();
