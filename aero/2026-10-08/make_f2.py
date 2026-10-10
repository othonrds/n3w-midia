"""AERO F2 — formato da casa (navy + âmbar) com fotos reais do Rafael.
Teste A/B: P = preço na imagem (R$ 67) · S = sem preço. Só essa variável muda entre irmãs."""
import pathlib, sys
from playwright.sync_api import sync_playwright

D = pathlib.Path(__file__).parent
F = pathlib.Path("/tmp/claude-0/-home-claude-n3w-midia/bcc1d7e7-f05d-5ffd-afe1-d1b1f5b37ae3/scratchpad/ads/node_modules/@fontsource")
FOTO = D / "fotos"
OUT = D / "out"; OUT.mkdir(exist_ok=True)

CSS = f"""
@font-face{{font-family:IN;font-weight:400;src:url('file://{F}/inter/files/inter-latin-400-normal.woff2')}}
@font-face{{font-family:IN;font-weight:600;src:url('file://{F}/inter/files/inter-latin-600-normal.woff2')}}
@font-face{{font-family:IN;font-weight:700;src:url('file://{F}/inter/files/inter-latin-700-normal.woff2')}}
@font-face{{font-family:IN;font-weight:800;src:url('file://{F}/inter/files/inter-latin-800-normal.woff2')}}
@font-face{{font-family:IN;font-weight:400;src:url('file://{F}/inter/files/inter-latin-ext-400-normal.woff2');unicode-range:U+0100-024F}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1350px;overflow:hidden}}
body{{font-family:IN;color:#fff;background:#0b1a30;position:relative}}
.ph{{position:absolute;inset:0;background-repeat:no-repeat;filter:saturate(1.08) contrast(1.06)}}
.fadeL{{position:absolute;inset:0;background:linear-gradient(90deg,#0b1a30 0%,rgba(11,26,48,.96) 34%,rgba(11,26,48,.55) 56%,rgba(11,26,48,0) 74%)}}
.fadeB{{position:absolute;inset:0;background:linear-gradient(180deg,rgba(11,26,48,0) 0%,rgba(11,26,48,0) 26%,rgba(11,26,48,.85) 44%,#0b1a30 52%)}}
.vig{{position:absolute;inset:0;background:radial-gradient(1200px 900px at 75% 40%,transparent 50%,rgba(5,12,24,.55) 100%)}}
.stripe{{position:absolute;left:0;right:0;bottom:0;height:22px;background:#f5b21b}}
.pad{{position:absolute;left:68px;right:68px}}
.eye{{font-weight:700;letter-spacing:.2em;font-size:25px;color:#f5b21b;text-transform:uppercase;display:flex;align-items:center;gap:18px}}
.eye:before{{content:"";width:66px;height:6px;background:#f5b21b;flex:none}}
h1{{font-weight:800;letter-spacing:-.035em;line-height:1.0;margin-top:30px;text-shadow:0 4px 30px rgba(0,0,0,.35)}}
h1 em{{font-style:normal;color:#f5b21b}}
.sub{{font-size:35px;line-height:1.36;color:#dbe4f2;margin-top:28px}}
.pill{{display:inline-flex;align-items:center;gap:18px;margin-top:38px;border:3px solid #f5b21b;border-radius:22px;padding:18px 28px;font-weight:700;font-size:25px;letter-spacing:.14em;text-transform:uppercase;line-height:1.3;background:rgba(11,26,48,.55)}}
.pill.price{{background:#f5b21b;color:#0b1a30}}
.pill b{{font-weight:800;font-size:52px;letter-spacing:-.02em;display:block;line-height:1;margin-bottom:4px}}
.who{{border-left:8px solid #f5b21b;padding-left:26px}}
.who b{{display:block;font-size:34px;font-weight:700;line-height:1.25}}
.who span{{display:block;font-size:26px;color:#c9d4e6;margin-top:10px;line-height:1.35}}
"""

ICON = "<svg width='46' height='46' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'><path d='M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'/></svg>"

def pill(price):
    if price:
        return f"<div class='pill price'>{ICON}<div><b>R$ 67</b>Kit Plano de Voo</div></div>"
    return f"<div class='pill' style='color:#fff'><span style='color:#f5b21b;display:flex'>{ICON}</span><div>Guia + planilha<br>do ex-Capitão da FAB</div></div>"

WHO = "<div class='who'><b>Rafael Francisco<br>Rodrigues dos Santos</b><span>Ex-Capitão Aviador da FAB<br>Piloto Comercial (ANAC)</span></div>"

def retrato(foto, pos, size, eye, h1, h1size, sub, price):
    return f"""<div class='ph' style="background-image:url('file://{FOTO}/{foto}');background-size:{size};background-position:{pos}"></div>
<div class='vig'></div><div class='fadeL'></div>
<div class='pad' style='top:150px;width:640px'>
 <div class='eye'>{eye}</div>
 <h1 style='font-size:{h1size}px'>{h1}</h1>
 <div class='sub' style='max-width:600px'>{sub}</div>
 {pill(price)}
</div>
<div class='pad' style='bottom:96px'>{WHO}</div>
<div class='stripe'></div>"""

def faixa(foto, pos, size, eye, h1, h1size, sub, price):
    return f"""<div class='ph' style="background-image:url('file://{FOTO}/{foto}');background-size:{size};background-position:{pos};bottom:auto;height:720px"></div>
<div class='fadeB'></div>
<div class='pad' style='top:520px'>
 <div class='eye'>{eye}</div>
 <h1 style='font-size:{h1size}px'>{h1}</h1>
 <div class='sub'>{sub}</div>
 {pill(price)}
</div>
<div class='pad' style='bottom:84px'>{WHO}</div>
<div class='stripe'></div>"""

def page(body):
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body>{body}</body></html>"

PECAS = {
 "H07_pais-idade": (retrato, ("cadete-sorrindo.png", "100% 0%", "auto 1500px",
    "Guia para pais", "A FAB aceita<br>a partir dos<br><em>14 anos</em>", 104,
    "EPCAR, Colégio Naval, AFA: cada porta tem idade, prova e prazo. Veja quais estão abertas hoje.")),
 "H08_custo-real": (retrato, ("selfie-pista.png", "46% 0%", "auto 1350px",
    "Guia de carreira na aviação", "Quanto custa<br>virar <em>piloto</em><br>no Brasil?", 100,
    "Até o Piloto Comercial: de R$ 129 a 188 mil no mínimo regulamentar. Item por item, com fontes.")),
 "H09_rota-militar": (faixa, ("olhando-ceu.png", "50% 30%", "1243px auto",
    "Rota militar", "Piloto <em>sem pagar</em><br>a formação", 96,
    "Na FAB, Marinha e Exército a Força paga o curso e você recebe soldo. Veja cada porta.")),
 "H10_escola-alerta": (faixa, ("cockpit-lateral.png", "60% 40%", "1300px auto",
    "Antes de escolher a escola", "Antes de pagar a<br><em>1ª hora de voo</em>", 96,
    "O checklist de escola e os 5 sinais de alerta de quem já foi instrutor de voo.")),
}

only = sys.argv[1:]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1080, "height": 1350})
    for key, (fn, args) in PECAS.items():
        for tag, price in (("P", True), ("S", False)):
            name = f"AERO_{key}_{tag}"
            if only and name not in only and key not in only: continue
            f = D / f"{name}.html"; f.write_text(page(fn(*args, price)), encoding="utf-8")
            pg.goto(f"file://{f}"); pg.wait_for_timeout(700)
            pg.screenshot(path=str(OUT / f"{name}.png"))
            print(name)
    b.close()
