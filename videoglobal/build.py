"""Build the AI Photo & Video Playbook web-book + PDF and the Prompt Vault.

Usage: python3 videoglobal/build.py
Sources: videoglobal/playbook-src/*.md (not deployed)
Output (deployed by Vercel, root video-global/):
  video-global/b/9945d0f63751/index.html  + playbook.pdf   (main book)
  video-global/v/56a9e7a6a86e/index.html  + prompt-vault.pdf (order bump)
"""
import html
import pathlib
import re
import asyncio

import markdown

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "playbook-src"
OUT = ROOT.parent / "video-global"
BOOK_DIR = OUT / "b" / "9945d0f63751"
VAULT_DIR = OUT / "v" / "56a9e7a6a86e"

CSS = r"""
:root{--bg:#FBF8F3;--paper:#FFFFFF;--ink:#1C1A17;--muted:#6B655C;--line:#E7E0D4;--accent:#D2553A;--accent-soft:#F8E4DD;--code:#F3EEE5;
--f-d:"Fraunces",Georgia,serif;--f-b:"Inter",system-ui,-apple-system,"Segoe UI",sans-serif;--f-m:"JetBrains Mono",ui-monospace,Menlo,monospace}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#15130F;--paper:#1D1A16;--ink:#EEE8DE;--muted:#A69E91;--line:#2F2A23;--accent:#F07A5E;--accent-soft:#3A221B;--code:#25211B}}
*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:16px}
body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 var(--f-b);-webkit-font-smoothing:antialiased}
.layout{display:grid;grid-template-columns:280px minmax(0,1fr);max-width:1180px;margin:0 auto}
nav.toc{position:sticky;top:0;height:100vh;overflow:auto;padding:28px 20px;border-right:1px solid var(--line)}
nav.toc .brand{font:600 20px/1.2 var(--f-d);margin-bottom:4px}
nav.toc .by{color:var(--muted);font-size:13px;margin-bottom:20px}
nav.toc a{display:block;color:var(--ink);text-decoration:none;font-size:14px;padding:6px 8px;border-radius:6px}
nav.toc a:hover{background:var(--accent-soft)}
nav.toc .dl{margin-top:18px;display:block;text-align:center;background:var(--accent);color:#fff;font-weight:600;border-radius:8px;padding:10px}
main{padding:40px 48px 120px;min-width:0}
.chapter{max-width:720px;margin:0 auto 96px}
h1,h2,h3{font-family:var(--f-d);line-height:1.2;letter-spacing:-.01em}
h1{font-size:40px;margin:0 0 8px}
h1+p em{color:var(--muted);font-size:19px}
h2{font-size:27px;margin:44px 0 12px}
h3{font-size:20px;margin:30px 0 8px}
p,li{overflow-wrap:anywhere}
a{color:var(--accent)}
blockquote{margin:22px 0;padding:14px 18px;background:var(--accent-soft);border-left:4px solid var(--accent);border-radius:0 8px 8px 0}
blockquote p{margin:0}
table{border-collapse:collapse;width:100%;font-size:14.5px;margin:18px 0;display:block;overflow-x:auto}
th,td{border-bottom:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
th{font-weight:600;background:var(--code)}
code{font-family:var(--f-m);font-size:.88em;background:var(--code);padding:1px 5px;border-radius:4px}
.prompt{position:relative;margin:18px 0;border:1px solid var(--line);border-radius:10px;background:var(--paper)}
.prompt .lbl{font:600 11px/1 var(--f-b);letter-spacing:.08em;text-transform:uppercase;color:var(--accent);padding:12px 14px 0}
.prompt pre{margin:0;padding:8px 14px 14px;white-space:pre-wrap;font:14px/1.6 var(--f-m);overflow-wrap:anywhere}
.prompt button{position:absolute;top:8px;right:8px;border:1px solid var(--line);background:var(--bg);color:var(--ink);border-radius:6px;font:600 12px var(--f-b);padding:6px 10px;cursor:pointer}
pre{white-space:pre-wrap}
ul li input[type=checkbox]{margin-right:8px}
.cover{max-width:720px;margin:0 auto 96px;padding:60px 0 20px;border-bottom:1px solid var(--line)}
.cover .kicker{color:var(--accent);font-weight:600;letter-spacing:.1em;text-transform:uppercase;font-size:13px}
.cover h1{font-size:52px;margin:12px 0}
.cover p{color:var(--muted);font-size:19px}
.menu-btn{display:none}
@media (max-width:860px){
 .layout{grid-template-columns:minmax(0,1fr)}
 nav.toc{position:fixed;inset:0 25% 0 0;z-index:5;background:var(--bg);transform:translateX(-102%);transition:transform .2s;height:100%}
 nav.toc.open{transform:none;box-shadow:8px 0 30px rgb(0 0 0/.2)}
 .menu-btn{display:block;position:fixed;right:16px;bottom:16px;z-index:6;background:var(--ink);color:var(--bg);border:0;border-radius:999px;padding:12px 18px;font:600 14px var(--f-b)}
 main{padding:24px 16px 100px}
 h1{font-size:32px}.cover h1{font-size:38px}
}
@media print{
 :root{--bg:#fff;--paper:#fff;--ink:#111;--muted:#555;--line:#ddd;--accent:#C2442A;--accent-soft:#FBEDE8;--code:#F5F1EA}
 @page{size:A4;margin:18mm 16mm}
 body{font-size:11pt}
 nav.toc,.menu-btn,.prompt button{display:none!important}
 .layout{display:block}main{padding:0}
 .chapter{max-width:none;margin:0;break-before:page}
 .cover{break-after:page;border:0;padding-top:70mm;max-width:none}
 .prompt,blockquote,table,tr{break-inside:avoid}
 h2,h3{break-after:avoid}
 a{color:inherit;text-decoration:none}
}
"""

JS = r"""
document.querySelectorAll('.prompt button').forEach(b=>b.addEventListener('click',async()=>{
 const t=b.parentElement.querySelector('pre').innerText;
 try{await navigator.clipboard.writeText(t);b.textContent='Copied';}catch(e){
  const r=document.createRange();r.selectNodeContents(b.parentElement.querySelector('pre'));const s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Selected';}
 setTimeout(()=>b.textContent='Copy',1600);
}));
const nav=document.querySelector('nav.toc'),mb=document.querySelector('.menu-btn');
if(mb){mb.onclick=()=>nav.classList.toggle('open');nav.querySelectorAll('a[href^="#"]').forEach(a=>a.onclick=()=>nav.classList.remove('open'));}
"""

PROMPT_RE = re.compile(r"```prompt\n(.*?)```", re.S)


def md_to_html(text):
    blocks = []

    def stash(m):
        blocks.append(m.group(1).rstrip())
        return f"\n\nPROMPTBLOCK{len(blocks)-1}END\n\n"

    text = PROMPT_RE.sub(stash, text)
    # checkbox lists
    text = re.sub(r"^- \[ \] ", "- ☐ ", text, flags=re.M)
    h = markdown.markdown(text, extensions=["tables", "fenced_code", "sane_lists"])
    for i, b in enumerate(blocks):
        box = ('<div class="prompt"><div class="lbl">Prompt</div>'
               '<button type="button">Copy</button>'
               f'<pre>{html.escape(b)}</pre></div>')
        h = h.replace(f"<p>PROMPTBLOCK{i}END</p>", box)
    return h, len(blocks)


def slug(title):
    return re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:40]


def build(title, subtitle, files, out_dir, pdf_name, kicker):
    sections, toc, total = [], [], 0
    for f in files:
        raw = (SRC / f).read_text()
        first = raw.splitlines()[0].lstrip("# ").strip()
        sid = slug(first)
        body, n = md_to_html(raw)
        total += n
        sections.append(f'<section class="chapter" id="{sid}">{body}</section>')
        toc.append(f'<a href="#{sid}">{html.escape(first)}</a>')
    page = f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow">
<title>{html.escape(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;600&family=JetBrains+Mono&display=swap">
<style>{CSS}</style></head><body><div class="layout">
<nav class="toc"><div class="brand">{html.escape(title)}</div><div class="by">by Maggy Lane</div>{''.join(toc)}
<a class="dl" href="{pdf_name}" download>Download PDF</a></nav>
<main><div class="cover"><div class="kicker">{kicker}</div><h1>{html.escape(title)}</h1><p><b>by Maggy Lane</b></p><p>{html.escape(subtitle)}</p>
<p style="font-size:14px">Maggy Lane is an AI-generated creator. All examples use original characters and generic products.</p></div>
{''.join(sections)}</main></div><button class="menu-btn" type="button">Contents</button><script>{JS}</script></body></html>"""
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "index.html").write_text(page)
    return total


async def to_pdf(html_path, pdf_path):
    from playwright.async_api import async_playwright
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page()
        await pg.goto(html_path.as_uri(), wait_until="networkidle")
        await pg.emulate_media(media="print")
        await pg.pdf(path=str(pdf_path), format="A4", print_background=True,
                     margin={"top": "18mm", "bottom": "18mm", "left": "16mm", "right": "16mm"},
                     display_header_footer=True, header_template="<span></span>",
                     footer_template='<div style="font-size:8px;color:#888;width:100%;text-align:center"><span class="pageNumber"></span></div>')
        await b.close()


if __name__ == "__main__":
    chapters = [f"ch0{i}.md" for i in range(9)]
    n_book = build("The AI Photo & Video Playbook", "Create pro photos and cinematic videos with AI that don't look like AI — no camera, no studio, no editing experience.",
                   chapters, BOOK_DIR, "playbook.pdf", "The complete playbook")
    n_vault = build("The Viral Prompt Vault", "60 copy-ready templates for six repeatable short-video formats — image prompt, motion prompt and hook for each.",
                    ["vault.md"], VAULT_DIR, "prompt-vault.pdf", "Bonus add-on")
    asyncio.run(to_pdf(BOOK_DIR / "index.html", BOOK_DIR / "playbook.pdf"))
    asyncio.run(to_pdf(VAULT_DIR / "index.html", VAULT_DIR / "prompt-vault.pdf"))
    print("book prompts", n_book, "vault prompts", n_vault)
