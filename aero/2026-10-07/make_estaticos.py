import os, pathlib
from playwright.sync_api import sync_playwright

D = pathlib.Path(__file__).parent
F = D / "node_modules/@fontsource"
IMG = pathlib.Path("/home/claude/aero-lp/img")
OUT = D / "out"; OUT.mkdir(exist_ok=True)

CSS = f"""
@font-face{{font-family:BC;font-weight:700;src:url('file://{F}/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2')}}
@font-face{{font-family:BC;font-weight:800;src:url('file://{F}/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2')}}
@font-face{{font-family:IN;font-weight:400;src:url('file://{F}/inter/files/inter-latin-400-normal.woff2')}}
@font-face{{font-family:IN;font-weight:600;src:url('file://{F}/inter/files/inter-latin-600-normal.woff2')}}
@font-face{{font-family:IN;font-weight:700;src:url('file://{F}/inter/files/inter-latin-700-normal.woff2')}}
@font-face{{font-family:IN;font-weight:800;src:url('file://{F}/inter/files/inter-latin-800-normal.woff2')}}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:1080px;height:1350px;overflow:hidden}}
body{{font-family:IN;color:#fff;background:radial-gradient(1100px 800px at 85% 8%,#1f4476 0%,#0b1d36 55%,#071426 100%);position:relative}}
body:before{{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 88% 10%,transparent 0 110px,rgba(255,255,255,.045) 111px 113px)}}
.pad{{position:absolute;inset:0;padding:84px 76px}}
.eye{{font-family:BC;font-weight:700;letter-spacing:.2em;font-size:30px;color:#f5b21b;text-transform:uppercase;display:flex;align-items:center;gap:16px}}
.eye:before{{content:"";width:56px;height:5px;background:#f5b21b}}
h1{{font-family:BC;font-weight:800;text-transform:uppercase;line-height:.95;font-size:136px;margin-top:26px;letter-spacing:.005em}}
h1 em{{font-style:normal;color:#f5b21b}}
.sub{{font-size:40px;color:#c9d4e6;line-height:1.35;margin-top:26px;max-width:880px}}
.foot{{position:absolute;left:76px;right:76px;bottom:70px;display:flex;justify-content:space-between;align-items:flex-end;gap:20px}}
.who{{border-left:6px solid #f5b21b;padding-left:20px}}
.who b{{display:block;font-size:32px}}
.who span{{font-size:25px;color:#aebbd2}}
.pill{{background:#f5b21b;color:#0b1d36;font-family:BC;font-weight:800;font-size:40px;text-transform:uppercase;padding:18px 30px;border-radius:14px;white-space:nowrap}}
.trust{{position:absolute;left:76px;right:76px;bottom:178px;font-size:26px;color:#c9d4e6;border-top:2px solid rgba(255,255,255,.14);padding-top:22px}}
.card{{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:22px;padding:30px 34px}}
.big{{font-family:BC;font-weight:800;font-size:150px;line-height:1;color:#f5b21b}}
.src{{font-size:21px;color:#8fa0bb;margin-top:14px}}
"""

def page(body):
    return f"<!doctype html><html><head><meta charset='utf-8'><style>{CSS}</style></head><body><div class='pad'>{body}</div></body></html>"

FOOT = """<div class='trust'>Guia de 30 páginas · 52 fontes oficiais · acesso imediato</div><div class='foot'><div class='who'><b>Rafael Francisco</b><span>Ex-Capitão Aviador da FAB · Piloto Comercial ANAC</span></div><div class='pill'>Kit · R$ 67</div></div>"""

ads = {}

# 1 custo real (número)
ads["AERO_custo-real_H01_v1"] = page(f"""
<div class='eye'>Guia de carreira 2026</div>
<h1>Quanto custa<br>virar piloto<br><em>no Brasil?</em></h1>
<div class='card' style='margin-top:46px;display:flex;gap:34px;align-items:center'>
 <img src='file://{IMG}/p10.jpg' style='width:330px;border-radius:8px;box-shadow:0 20px 40px rgba(0,0,0,.5);transform:rotate(-3deg)'>
 <div><div style='font-size:30px;color:#c9d4e6'>Até o Piloto Comercial, no mínimo regulamentar:</div>
 <div class='big' style='font-size:100px;margin-top:10px;white-space:nowrap'>R$ 129–188 mil</div>
 <div class='src'>Item por item, com preços de aeroclubes e fontes oficiais</div></div>
</div>{FOOT}""")

# 2 rota militar R$0 (tabela comparativa)
ads["AERO_rota-militar_H02_v1"] = page(f"""
<div class='eye'>Civil × Militar</div>
<h1>Virar piloto<br><em>sem pagar</em><br>a formação</h1>
<div style='display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:50px'>
 <div class='card'><div style='font-family:BC;font-weight:700;font-size:32px;letter-spacing:.12em;color:#aebbd2'>ROTA CIVIL</div><div class='big' style='font-size:80px;color:#fff;white-space:nowrap;margin-top:10px'>R$ 130–190 mil</div><div class='sub' style='font-size:27px;margin-top:12px'>você paga as horas de voo</div></div>
 <div class='card' style='border-color:#f5b21b;background:rgba(245,178,27,.1)'><div style='font-family:BC;font-weight:700;font-size:32px;letter-spacing:.12em;color:#f5b21b'>ROTA MILITAR</div><div class='big' style='font-size:100px;margin-top:10px'>R$ 0</div><div class='sub' style='font-size:27px;margin-top:12px'>a Força paga e você recebe soldo</div></div>
</div>
<div class='src' style='font-size:24px'>Em troca: concurso, idade-limite, saúde e teste físico. O kit mostra cada porta.</div>
{FOOT}""")

# 3 pais / idade (barras)
bars = [("EPCAR · FAB","14 a 18",1,5),("Colégio Naval","15 a 17",2,4),("AFA · Aviador","17 a 22",4,10),("Escola Naval","18 a 22",5,10),("EsPCEx · Exército","17 a 22",4,10)]
rows = "".join(f"<div style='display:grid;grid-template-columns:300px 1fr;align-items:center;gap:18px;margin-top:18px'><div style='font-family:BC;font-weight:700;font-size:38px'>{n}</div><div style='height:56px;background:rgba(255,255,255,.08);border-radius:10px;position:relative'><div style='position:absolute;top:0;bottom:0;left:{a*100/11:.1f}%;width:{(b-a)*100/11:.1f}%;background:#f5b21b;border-radius:10px;color:#0b1d36;font-weight:800;font-size:26px;display:flex;align-items:center;justify-content:center'>{t}</div></div></div>" for n,t,a,b in bars)
ads["AERO_pais-idade_H03_v1"] = page(f"""
<div class='eye'>Para pais</div>
<h1>Seu filho pode<br>entrar na FAB<br><em>aos 14 anos</em></h1>
<div class='card' style='margin-top:40px;padding:22px 34px 30px'>{rows}<div class='src'>Idades em anos, conforme os editais 2026/2027. Detalhes e fontes no kit.</div></div>
{FOOT}""")

# 4 mito sargento (contraintuitivo)
ads["AERO_mito-sargento_H04_v1"] = page(f"""
<div class='eye'>Erro comum no Exército</div>
<h1>Sargento<br><em>não pilota.</em></h1>
<div class='sub' style='font-size:40px;margin-top:34px'>Na Aviação do Exército, quem pilota é <b style='color:#fff'>oficial</b> formado na AMAN, que depois passa numa seleção interna.</div>
<div class='card' style='margin-top:44px'>
 <div style='font-family:BC;font-weight:700;font-size:30px;letter-spacing:.14em;color:#f5b21b'>A ROTA ATÉ O COCKPIT</div>
 <div style='font-family:BC;font-weight:800;font-size:64px;margin-top:14px;line-height:1.15'>EsPCEx → AMAN → Oficial → Seleção → CPA</div>
 <div class='src'>Antes de escolher o concurso, entenda qual porta leva ao voo.</div>
</div>{FOOT}""")

# 5 lista red flags escola
flags = ["Cobra o curso inteiro adiantado, \"só hoje\"","Não mostra a certificação da ANAC","Promete emprego garantido em companhia aérea","Aeronaves paradas e alunos esperando para voar","Contrato sem cláusula de reembolso"]
li = "".join(f"<div style='display:flex;gap:22px;align-items:flex-start;margin-top:22px'><div style='flex:none;width:52px;height:52px;border-radius:12px;background:#c0392b;display:grid;place-items:center;font-weight:800;font-size:30px'>!</div><div style='font-size:35px;line-height:1.22'>{f}</div></div>" for f in flags)
ads["AERO_escola-alerta_H05_v1"] = page(f"""
<div class='eye'>Antes de pagar a 1ª hora</div>
<h1 style='font-size:118px'>5 sinais de<br><em>escola de aviação</em><br>furada</h1>
<div style='margin-top:30px'>{li}</div>
{FOOT}""")

# 6 salário/mercado
sal = [("Copiloto de jato · linha aérea (piso)","R$ 6.069"),("Comandante de jato (piso)","R$ 11.643"),("Aspirante a Oficial · FAB","R$ 7.988"),("Instrutor de voo (média)","R$ 5.405")]
tr = "".join(f"<div style='display:flex;justify-content:space-between;align-items:baseline;padding:18px 0;border-bottom:2px dashed rgba(255,255,255,.16)'><span style='font-size:33px'>{a}</span><b style='font-family:BC;font-weight:800;font-size:58px;color:#f5b21b'>{b}</b></div>" for a,b in sal)
ads["AERO_salarios_H06_v1"] = page(f"""
<div class='eye'>Mercado 2026</div>
<h1>Quanto ganha<br>um piloto<br><em>no Brasil?</em></h1>
<div class='card' style='margin-top:36px;padding:10px 34px 24px'>{tr}<div class='src'>Pisos de convenção, soldo-base e média CBO. Não é promessa de salário. Fontes no kit.</div></div>
{FOOT}""")

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width":1080,"height":1350})
    for name, html in ads.items():
        f = D / f"{name}.html"; f.write_text(html, encoding="utf-8")
        pg.goto(f"file://{f}"); pg.wait_for_timeout(600)
        pg.screenshot(path=str(OUT / f"{name}.png"))
        print(name)
    b.close()
