const { chromium } = require('/usr/local/lib/node_modules/playwright');
(async () => {
  const [url, locale, tz] = process.argv.slice(2);
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport:{width:844,height:390}, deviceScaleFactor:1, locale, timezoneId: tz });
  const pg = await ctx.newPage(); const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
  await pg.route('**/connect.facebook.net/**', r => r.abort());
  const W = ms => pg.waitForTimeout(ms);
  const dump = async (tag) => { const t = await pg.evaluate(()=>{const out=new Set();const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const p=n.parentNode;if(!p||p.closest('#rotate')||p.nodeName==='SCRIPT'||p.nodeName==='STYLE')continue;const s=n.data.trim();if(s)out.add(s);}document.querySelectorAll('[placeholder],[aria-label]').forEach(e=>{out.add('@'+(e.getAttribute('placeholder')||e.getAttribute('aria-label')))});return [...out];}); console.log('##'+tag+': '+t.join(' | ')); };
  await pg.goto(url); await W(1500); console.log('lang', await pg.evaluate('I18N.lang')); await dump('splash'); await pg.screenshot({path:'i1.png'});
  await pg.click('[data-a=play]'); await W(500); await dump('onb');
  for (const s of ['char','career']) { await pg.evaluate(`Dreamelle.state.name='Ava';Dreamelle.go('${s}')`); await W(400); await dump(s); }
  await pg.click('#career-model'); await W(300); await dump('toast-model');
  await pg.evaluate("Object.assign(Dreamelle.state,{created:true,career:'lawyer',onbDone:true});Dreamelle.go('home')"); await W(400); await dump('home'); await pg.screenshot({path:'i2.png'});
  await pg.click('#btn-start'); await W(400); await dump('map');
  await pg.evaluate("Dreamelle.go('law')"); await W(500); await dump('law');
  await pg.click('#job-clause'); await W(400); await dump('case');
  await pg.click('#ans-0'); await W(300); await dump('case-wrong');
  await pg.click('#ans-1'); await W(1200); await dump('reward'); await pg.screenshot({path:'i3.png'});
  await pg.evaluate("Dreamelle.go('org')"); await W(400); await dump('org');
  await pg.evaluate("Dreamelle.go('skills')"); await W(400); await dump('skills');
  await pg.click('#up-logic'); await W(300); await dump('skills-up');
  await pg.evaluate("Dreamelle.showPaywall()"); await W(400); await dump('pay'); await pg.screenshot({path:'i4.png'});
  await pg.click('#btn-checkout'); await W(300); await dump('checkout-toast');
  await pg.evaluate("Dreamelle.go('splash')"); await pg.click('[data-a=settings]'); await W(300); await dump('settings');
  await pg.selectOption('select.lang','es'); await W(400); await dump('settings-es');
  await pg.click('[data-a=closeov]'); await W(200); await pg.click('[data-a=langpick]'); await W(300); await pg.click('[data-l=fr]'); await W(400); await dump('splash-fr');
  console.log('errors', JSON.stringify(errs)); await b.close();
})();
