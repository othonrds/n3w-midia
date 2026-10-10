exports.ls = { ps_level: '13', ps_best: '13' };
exports.run = async (H, X) => {
  const { p, sleep } = H;
  await sleep(600);
  const [x, y] = await H.center('#play'); await H.mark('menu'); await H.tap(x, y);
  await sleep(700); await H.mark('go');
  const sol = await p.evaluate(() => window.__ps.solve());
  const cen = i => p.evaluate(i => { const r = document.querySelector('.tube[data-i="' + i + '"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * 0.55]; }, i);
  let fulls = 0;
  for (const [i, j] of sol) {
    let c = await cen(i); await H.tap(c[0], c[1], 40);
    await sleep(170);
    c = await cen(j); await H.tap(c[0], c[1], 40);
    await H.mark('pour', { i, j });
    await sleep(300);
    await H.wait(() => !window.__ps.state().lock);
    const st = await p.evaluate(j => { const s = window.__ps.state(); const t = s.tubes[j]; return { full: t.length === 4 && t.every(v => v === t[0]), playing: s.playing }; }, j);
    if (st.full) { fulls++; await H.mark('full', { n: fulls }); }
    if (!st.playing) { await H.mark('win'); break; }
    await sleep(140);
  }
  await sleep(2200);
  return { moves: sol.length, fulls };
};
