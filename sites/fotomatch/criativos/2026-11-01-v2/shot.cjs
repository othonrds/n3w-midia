const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
 for (const n of process.argv.slice(2)) { await p.goto('file://' + process.cwd() + '/' + n + '.html'); await p.waitForTimeout(300);
  await p.screenshot({ path: `/home/claude/n3w-midia/sites/fotomatch/public/ad/v2-${n}.jpg`, type: 'jpeg', quality: 90 }); }
 await b.close(); })();
