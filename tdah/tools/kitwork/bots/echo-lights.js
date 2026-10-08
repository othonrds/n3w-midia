exports.ls = { el_zen: '0' };
exports.run = async (H, X) => {
  const { p, sleep } = H;
  await sleep(600);
  const [x, y] = await H.center('#play'); await H.mark('menu'); await H.tap(x, y);
  const target = X.levels || 10; let lastShow = 0;
  while (true) {
    const s = await p.evaluate(() => window.__el.state());
    if (s.phase === 'show' && s.seq.length !== lastShow) { lastShow = s.seq.length; await H.mark('show', { v: s.seq.length }); }
    if (s.phase === 'input' && s.idx === 0) {
      await H.mark('input', { v: s.seq.length });
      await sleep(180);
      const pads = await p.evaluate(() => [...document.querySelectorAll('.pad')].map(b => { const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }));
      for (const i of s.seq) {
        await H.tap(pads[i][0] + (Math.random() * 30 - 15), pads[i][1] + (Math.random() * 30 - 15), 50);
        await H.mark('hit', { i });
        await sleep(170 + Math.random() * 60);
      }
      await H.mark('cleared', { v: s.seq.length });
      if (s.seq.length >= target) { await sleep(1500); break; }
    }
    await sleep(40);
  }
  return { level: await p.evaluate(() => window.__el.state().seq.length) };
};
