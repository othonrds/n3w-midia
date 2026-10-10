// node shot.js <url>  -> screenshots of the main screens (landscape phone)
const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
  const url = process.argv[2];
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 });
  const errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.route('**/connect.facebook.net/**', r => r.abort());
  const W = ms => pg.waitForTimeout(ms);
  await pg.goto(url); await W(3000); await pg.screenshot({ path: 's1_splash.png' });
  await pg.evaluate("Dreamelle.state.name='Ava';Dreamelle.go('char')"); await W(2500); await pg.screenshot({ path: 's2_char.png' });
  await pg.evaluate("Dreamelle.go('career')"); await W(2500); await pg.screenshot({ path: 's3_career.png' });
  await pg.evaluate("Object.assign(Dreamelle.state,{created:true,career:'lawyer',onbDone:true});Dreamelle.go('home')"); await W(2500); await pg.screenshot({ path: 's4_home.png' });
  await pg.evaluate("Dreamelle.go('map')"); await W(2500); await pg.screenshot({ path: 's5_map.png' });
  await pg.evaluate("Dreamelle.go('law')"); await W(2500); await pg.screenshot({ path: 's6_law.png' });
  await pg.evaluate("Dreamelle.showPaywall()"); await W(2500); await pg.screenshot({ path: 's7_pay.png' });
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
