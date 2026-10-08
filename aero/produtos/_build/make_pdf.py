"""Gera os PDFs dos produtos AERO a partir do Markdown (pandoc → HTML → Chromium PDF)."""
import subprocess, pathlib, sys, base64
from playwright.sync_api import sync_playwright
ROOT = pathlib.Path(__file__).resolve().parent.parent
F = pathlib.Path("/tmp/claude-0/-home-claude-n3w-midia/bcc1d7e7-f05d-5ffd-afe1-d1b1f5b37ae3/scratchpad/ads/node_modules/@fontsource")
IMG = pathlib.Path("/home/claude/n3w-midia/sites/aero/public/img")
PRODS = {
 "rota-militar": ("Rota Militar", "Preparatório EPCAR e AFA", "rafael-cadete.jpg"),
 "entrevista": ("Kit de Entrevista", "para Companhias Aéreas", "rafael-cockpit.jpg"),
 "icao": ("Inglês Aeronáutico", "Rumo ao nível 4 ICAO", "rafael-ceu.jpg"),
}
def ff(name, w): return f"@font-face{{font-family:{name[0]};font-weight:{w};src:url('file://{F}/{name[1]}/files/{name[1]}-latin-{w}-normal.woff2')}}@font-face{{font-family:{name[0]};font-weight:{w};src:url('file://{F}/{name[1]}/files/{name[1]}-latin-ext-{w}-normal.woff2');unicode-range:U+0100-024F}}"
FONTS = "".join(ff(("IN","inter"),w) for w in (400,600,700,800)) + "".join(ff(("BC","barlow-condensed"),w) for w in (700,800))
CSS = FONTS + """
@page{size:A4;margin:18mm 17mm 20mm}
body{font-family:IN;color:#14213a;font-size:10.6pt;line-height:1.55}
h1,h2,h3{font-family:BC;text-transform:uppercase;color:#0b1a30;line-height:1.05;letter-spacing:.01em}
h1{font-size:30pt;margin:0 0 8pt}
h2{font-size:21pt;margin:20pt 0 8pt;padding-top:6pt;border-top:3px solid #f5b21b;break-after:avoid}
h2.chap{break-before:page}
h3{font-size:14.5pt;margin:14pt 0 5pt;break-after:avoid}
h4{font-size:11pt;margin:10pt 0 4pt;break-after:avoid}
p{margin:0 0 7pt} ul,ol{margin:0 0 8pt 16pt;padding:0} li{margin:2pt 0}
table{border-collapse:collapse;width:100%;margin:6pt 0 10pt;font-size:9.2pt;break-inside:auto}
th{background:#0b1a30;color:#fff;text-align:left;padding:5pt 6pt;font-weight:700}
td{border-bottom:1px solid #dde3ec;padding:4pt 6pt;vertical-align:top}
tr{break-inside:avoid}
blockquote{margin:8pt 0;padding:8pt 12pt;background:#fff8e6;border-left:4px solid #f5b21b;border-radius:4px}
blockquote p:last-child{margin:0}
code{font-family:IN;background:#eef2f7;padding:0 3px;border-radius:3px;font-size:9.4pt}
pre{background:#eef2f7;padding:8pt;border-radius:6px;white-space:pre-wrap;font-size:9pt}
hr{border:0;border-top:1px solid #dde3ec;margin:12pt 0}
a{color:#0b1a30}
strong{color:#0b1a30}
.cover{height:257mm;margin:-18mm -17mm 0;background:#0b1a30;color:#fff;position:relative;overflow:hidden;break-after:page}
.cover .ph{position:absolute;right:0;top:0;bottom:0;width:62%;background-size:cover;background-position:65% 30%;opacity:.9}
.cover .fade{position:absolute;inset:0;background:linear-gradient(90deg,#0b1a30 38%,rgba(11,26,48,.6) 60%,rgba(11,26,48,.1))}
.cover .txt{position:absolute;left:18mm;top:60mm;width:105mm}
.cover .eye{font-family:BC;font-weight:700;letter-spacing:.22em;color:#f5b21b;font-size:11pt;text-transform:uppercase}
.cover h1{color:#fff;font-size:50pt;margin:10pt 0 6pt}
.cover .sub{font-family:BC;font-weight:700;font-size:20pt;color:#f5b21b;text-transform:uppercase}
.cover .who{position:absolute;left:18mm;bottom:28mm;border-left:4px solid #f5b21b;padding-left:10pt;font-size:10pt;color:#c9d4e6}
.cover .who b{display:block;color:#fff;font-size:12pt}
.cover .bar{position:absolute;left:0;right:0;bottom:0;height:8mm;background:#f5b21b}
"""
def build(slug):
    title, sub, foto = PRODS[slug]
    d = ROOT / slug
    md = (d/"conteudo.md").read_text(encoding="utf-8")
    fontes = (d/"fontes.md").read_text(encoding="utf-8") if (d/"fontes.md").exists() else ""
    # remove do PDF a lista interna de revisão (é para o Rafael, não para o comprador)
    import re
    fontes = re.split(r"\n#+ .*(?:[Rr]evis|Rafael).*\n", fontes)[0]
    fontes = re.sub(r"^# .*\n", "", fontes, count=1)
    body = md + "\n\n## Anexo – Fontes\n\n" + fontes
    html = subprocess.run(["pandoc","-f","gfm","-t","html5"], input=body, capture_output=True, text=True, check=True).stdout
    html = re.sub(r"<h1[^>]*>.*?</h1>", "", html, count=1, flags=re.S)  # o título vai na capa
    html = re.sub(r"<h2([^>]*)>(Cap[ií]tulo|\d+[\.\s]|Anexo|Parte|Se[cç][aã]o)", r'<h2 class="chap"\1>\2', html)
    b64 = base64.b64encode((IMG/foto).read_bytes()).decode()
    cover = f"""<div class="cover"><div class="ph" style="background-image:url(data:image/jpeg;base64,{b64})"></div><div class="fade"></div>
<div class="txt"><div class="eye">AERO · Guia de carreira</div><h1>{title}</h1><div class="sub">{sub}</div></div>
<div class="who"><b>Rafael Francisco</b>Ex-Capitão Aviador da FAB · Piloto Comercial e Instrutor de Voo (ANAC)<br>Versão outubro de 2026</div><div class="bar"></div></div>"""
    page = f"<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><style>{CSS}</style></head><body>{cover}{html}</body></html>"
    hf = d/"_print.html"; hf.write_text(page, encoding="utf-8")
    out = d/f"AERO-{slug}.pdf"
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page()
        pg.goto(f"file://{hf}"); pg.wait_for_timeout(800)
        pg.pdf(path=str(out), format="A4", print_background=True, display_header_footer=True,
               header_template="<span></span>",
               footer_template=f"<div style='font-family:Arial;font-size:7.5pt;color:#8a96ab;width:100%;padding:0 17mm;display:flex;justify-content:space-between'><span>AERO · {title} · Rafael Francisco</span><span><span class='pageNumber'></span>/<span class='totalPages'></span></span></div>",
               margin={"top":"18mm","bottom":"20mm","left":"17mm","right":"17mm"})
        b.close()
    hf.unlink()
    print(slug, out.stat().st_size//1024, "KB")
for s in (sys.argv[1:] or PRODS): build(s)
