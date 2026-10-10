exports.ls = {};
exports.run = async (H, X) => {
  const { p, sleep } = H;
  await sleep(600);
  const [x, y] = await H.center('#play'); await H.mark('menu'); await H.tap(x, y);
  await H.mark('go'); await sleep(450);
  const T0 = Date.now(); let flips = 0, taps = 0, lastAnn = false, lastStreak = '';
  const DUR = (X.dur || 17) * 1000 * H.K;
  while (Date.now() - T0 < DUR) {
    const s = await p.evaluate(() => {
      const hex = { RED: '#FF5C77', BLUE: '#4C8DFF', GREEN: '#3EDC6B', YELLOW: '#FFD84D' };
      const names = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
      const toRgb = h => { const n = parseInt(h.slice(1), 16); return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`; };
      const w = document.getElementById('word'); const ink = names.findIndex(n => toRgb(hex[n]) === w.style.color);
      const word = names.indexOf(w.textContent); const flip = document.getElementById('rule').classList.contains('flip');
      const ann = !document.getElementById('ann').classList.contains('hide');
      const pads = [...document.querySelectorAll('.pad')].map(b => { const r = b.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
      return { ink, word, flip, ann, pads, mu: document.getElementById('mu').textContent, txt: w.textContent + '|' + w.style.color };
    });
    if (s.ann) { if (!lastAnn) { await H.mark(s.flip ? 'flip' : 'unflip'); flips++; } lastAnn = true; await sleep(60); continue; }
    lastAnn = false;
    if (s.mu !== lastStreak) { if (s.mu !== 'x1') await H.mark('streak', { v: s.mu }); lastStreak = s.mu; }
    const target = s.flip ? s.word : s.ink;
    const c = s.pads[target];
    await sleep(taps === 0 ? 250 : (s.flip ? 330 : 260) + Math.random() * 120);
    await H.tap(c[0] + (Math.random() * 30 - 15), c[1] + (Math.random() * 16 - 8), 40);
    await H.mark('hit', { i: target, flip: s.flip });
    taps++;
    await sleep(120);
  }
  return { taps, flips };
};
