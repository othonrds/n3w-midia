exports.ls = {};
exports.run = async (H, X) => {
  const { p, sleep } = H;
  await sleep(600);
  const [x, y] = await H.center('#play'); await H.mark('menu'); await H.tap(x, y);
  await sleep(300);
  await p.evaluate(() => window.__mu.load([[1024, 512, 256, 128], [2, 8, 4, 64], [4, 2, 16, 32], [4, 4, 8, 16]], 18436));
  await sleep(500); await H.mark('go');
  const b = await p.locator('#board').boundingBox();
  const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
  const D = { 0: [-1, 0], 1: [1, 0], 2: [0, -1], 3: [0, 1] };
  const plan = [1, 1, 1, 2, 2, 2, 0, 0, 0];
  let maxT = 0;
  for (const dir of plan) {
    const [dx, dy] = D[dir], L = 95;
    const ox = (Math.random() * 40 - 20), oy = (Math.random() * 40 - 20);
    await H.drag(cx - dx * L / 2 + ox, cy - dy * L / 2 + oy, cx + dx * L / 2 + ox, cy + dy * L / 2 + oy, 170, 8);
    await sleep(160);
    const s = await p.evaluate(() => window.__mu.state());
    const m = Math.max(...s.grid.flat());
    await H.mark('move', { dir, max: m, score: s.score, g: s.grid });
    if (m > maxT) { maxT = m; await H.mark('newmax', { v: m }); }
    await sleep(560);
  }
  await sleep(1800);
  return { max: maxT };
};
