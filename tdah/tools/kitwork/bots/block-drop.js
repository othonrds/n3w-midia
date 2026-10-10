const PL = require('../bdplan.json');
const save = { B: PL.B0, tray: PL.trays[0].map(p => ({ c: p.c, col: p.col })), score: 312, lines: 9, moves: 21, combo: 0, since: 0 };
exports.ls = { bd_save: JSON.stringify(save), bd_best: '1480' };
exports.run = async (H) => {
  const { p, sleep } = H;
  await sleep(600);
  const [x, y] = await H.center('#cont'); await H.mark('menu'); await H.tap(x, y);
  await sleep(700); await H.mark('go');
  let k = 0, bad = 0;
  for (let t = 0; t < PL.trays.length; t++) {
    for (let s = 0; s < 3; s++, k++) {
      const st = PL.steps[k], piece = PL.trays[t][s];
      const g = await p.evaluate(() => { const cs = [...document.querySelectorAll('#board .cell')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width]; }); const sl = [...document.querySelectorAll('.slot')].map(e => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); return { cs, sl, tray: JSON.parse(localStorage.getItem('bd_save')).tray }; });
      const tp = g.tray[st.slot];
      if (!tp || JSON.stringify(tp.c) !== JSON.stringify(piece.c)) { bad++; console.error('tray mismatch', t, s, JSON.stringify(tp), JSON.stringify(piece.c)); }
      const pitch = g.cs[1][0] - g.cs[0][0], csz = g.cs[0][2], gap = pitch - csz;
      let dh = 0, dw = 0; piece.c.forEach(([a, b]) => { dh = Math.max(dh, a + 1); dw = Math.max(dw, b + 1); });
      const w = dw * pitch - gap, h = dh * pitch - gap;
      const cell = g.cs[st.r * 8 + st.q];
      const tx = cell[0] + w / 2, ty = cell[1] + h + 8;
      const [sx, sy] = g.sl[st.slot];
      const last = s === 2 && t + 1 < PL.trays.length;
      await H.drag(sx, sy, tx, ty, 300, 12, last ? () => p.evaluate(q => { window.__rq.length = 0; window.__rq.push(...q); }, PL.rq[t + 1]) : null);
      await H.mark('place', { n: st.n, combo: st.combo, r: st.r, q: st.q, x: tx, y: ty - h / 2 - 8 });
      await sleep(st.n ? 620 : 380);
    }
  }
  await sleep(1500);
  const fin = await p.evaluate(() => JSON.parse(localStorage.getItem('bd_save')));
  return { bad, score: fin && fin.score, combo: fin && fin.combo };
};
