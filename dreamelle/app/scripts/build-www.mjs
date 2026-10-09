// Builds www/ for the native app: the web game bundled OFFLINE (no remote URL),
// which is what Apple's guideline 4.2 expects from a game shipped in a native shell.
// - copies dreamelle/game (index.html, data, legal pages)
// - downloads every CDN image/font the game references into www/a/ and rewrites the URLs
// - marks the build as native (window.DREAMELLE_NATIVE = true) and drops the web service worker
// Usage: node scripts/build-www.mjs [--no-download]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const here = path.dirname(new URL(import.meta.url).pathname);
const app = path.resolve(here, '..');
const game = path.resolve(app, '../game');
const www = path.join(app, 'www');
const noDownload = process.argv.includes('--no-download');

fs.rmSync(www, { recursive: true, force: true });
fs.mkdirSync(path.join(www, 'a'), { recursive: true });

const copy = (rel) => {
  const src = path.join(game, rel), dst = path.join(www, rel);
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) fs.cpSync(src, dst, { recursive: true });
  else { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
};
['assets.json', 'poses.json', 'manifest.webmanifest', 'legal'].forEach(copy);

let html = fs.readFileSync(path.join(game, 'index.html'), 'utf8');
const CDN = /https:\/\/d2ol7oe51mr4n9\.cloudfront\.net\/[A-Za-z0-9_\-./]+?\.(?:png|jpe?g|webp|gif|svg|mp3|ogg|woff2?)/g;
const urls = [...new Set([...(html.match(CDN) || []),
  ...JSON.stringify(JSON.parse(fs.readFileSync(path.join(game, 'assets.json'), 'utf8'))).match(CDN) || []])];

let ok = 0, failed = [];
for (const u of urls) {
  const name = crypto.createHash('sha1').update(u).digest('hex').slice(0, 16) + path.extname(u);
  const local = 'a/' + name;
  if (!noDownload) {
    try {
      const r = await fetch(u);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      fs.writeFileSync(path.join(www, local), Buffer.from(await r.arrayBuffer()));
      ok++;
    } catch (e) { failed.push(u + ' ' + e.message); continue; }
  }
  html = html.split(u).join(local);
  for (const f of ['assets.json', 'poses.json']) {
    const p = path.join(www, f);
    if (fs.existsSync(p)) fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split(u).join(local));
  }
}

// Native build flags: no service worker, mark native, keep the same analytics/unlock backend.
html = html.replace(/navigator\.serviceWorker\.register\([^)]*\)[^;]*;?/g, '/* sw disabled in native */');
html = html.replace('<head>', '<head><script>window.DREAMELLE_NATIVE=true;</script>');
fs.writeFileSync(path.join(www, 'index.html'), html);

console.log(`www ready: ${urls.length} CDN files, ${ok} downloaded, ${failed.length} failed`);
if (failed.length) { console.log(failed.join('\n')); if (!noDownload) process.exit(1); }
