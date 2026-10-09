import { chromium } from "/opt/node-tools/node_modules/playwright/index.mjs";
import fs from "fs";
const m = await import("/home/claude/n3w-midia/sites/juris/public/lp.js?" + Date.now());
const ff = `@font-face{font-family:"Playfair Display";src:url(file:///mnt/skills/examples/canvas-design/canvas-fonts/Lora-Regular.ttf);font-weight:400 500}@font-face{font-family:"Playfair Display";src:url(file:///mnt/skills/examples/canvas-design/canvas-fonts/Lora-Bold.ttf);font-weight:600 800}@font-face{font-family:"Playfair Display";font-style:italic;src:url(file:///mnt/skills/examples/canvas-design/canvas-fonts/Lora-Italic.ttf)}@font-face{font-family:"Manrope";src:url(file:///mnt/skills/examples/canvas-design/canvas-fonts/InstrumentSans-Regular.ttf);font-weight:400 500}@font-face{font-family:"Manrope";src:url(file:///mnt/skills/examples/canvas-design/canvas-fonts/InstrumentSans-Bold.ttf);font-weight:600 900}`;
const P = { bancario:["Dra. Ana Souza","a","SP","São Paulo","Souza Advocacia"], previdenciario:["Dra. Helena Duarte","a","MG","Belo Horizonte","Duarte Advocacia Previdenciária"], trabalhista:["Dr. Rafael Moura","o","PE","Recife","Moura Advocacia Trabalhista"], consumidor:["Dra. Camila Rocha","a","BA","Salvador","Rocha Advocacia"] };
const specs = JSON.parse(process.argv[2]);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const s of specs) {
  const [nome, genero, uf, cidade, escritorio] = P[s.foto];
  const t = m.TPLS.find(x => x[0] === s.tpl);
  const d = { nome, genero, area: s.area, tese: s.tese || "", tpl: s.tpl, uf, oab: "123.456", anos: "12", zap: "11999998888", insta: nome.toLowerCase().replace(/^dra?\. /,"").replace(/ /g,".") + ".adv", email: "contato@exemplo.adv.br", end: "Rua das Flores, 100, sala 12", escritorio, cidade, atend: s.online ? "Somente online, todo o Brasil" : "Presencial e online", p: t[4][0], a: t[4][1], foto: "file:///home/claude/n3w-midia/sites/juris/docs/fotos/adv-" + s.foto + ".jpg" };
  const r = m.renderLP(d);
  fs.writeFileSync("p.html", `<!doctype html><meta charset=utf-8><style>body{margin:0}${ff}${m.CSS}</style><div class="${r.cls}" style="${r.style}">${r.html}</div>`);
  const w = s.w || 390, p = await b.newPage({ viewport: { width: w, height: s.h || 844 }, deviceScaleFactor: 2 });
  await p.goto("file://" + process.cwd() + "/p.html"); await p.waitForTimeout(300);
  await p.screenshot({ path: "shots/" + s.out + ".png", fullPage: !!s.full }); await p.close(); console.log(s.out);
}
await b.close();
