exports.ls = { nh_lv: '2' };
exports.run = async (H) => {
  const { p, sleep } = H;
  await sleep(700);
  const [x, y] = await H.center('#play'); await H.mark('menu'); await H.tap(x, y);
  await H.mark('countdown');
  await H.wait(() => !document.getElementById('grid').classList.contains('veil'));
  await H.mark('go'); await sleep(250);
  for (let v = 1; v <= 25; v++) {
    const c = await p.evaluate(v => { const e = document.querySelector('.c[data-v="' + v + '"]'); const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, v);
    await H.tap(c[0] + (Math.random() * 8 - 4), c[1] + (Math.random() * 8 - 4), 35);
    await H.mark('hit', { v });
    await sleep(210 + Math.random() * 110);
  }
  await H.mark('finish');
  await sleep(2600);
  const t = await p.evaluate(() => document.getElementById('eScore').textContent);
  return { time: t };
};
