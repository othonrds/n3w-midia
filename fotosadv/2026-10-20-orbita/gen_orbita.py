# FOTOSADV 20/10 — órbita do H01 v2 (melhor campanha): 1 mudança por peça, preço da página. Pillow, 0 crédito.
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__))
FP = '/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(w, s): return ImageFont.truetype(FP + w + '.ttf', s)
W = 1080; BG = (15, 18, 32); GOLD = (232, 186, 72); WHITE = (255, 255, 255); GREYT = (90, 96, 110)
def ctext(d, y, t, fo, fill): d.text(((W - d.textlength(t, font=fo)) / 2, y), t, font=fo, fill=fill)
def base(): return Image.open(os.path.join(D, 'h01.png')).convert('RGB')
def preco_pagina(im):
    d = ImageDraw.Draw(im)
    for cx, a, b in ((300, '4 fotos', 'R$ 49,90'), (780, '15 fotos', 'R$ 89')):
        d.rectangle((cx - 210, 1122, cx + 210, 1250), fill=WHITE)
        fa, fb = f('Regular', 32), f('Bold', 56)
        d.text((cx - d.textlength(a, font=fa) / 2, 1128), a, font=fa, fill=GREYT)
        d.text((cx - d.textlength(b, font=fb) / 2, 1172), b, font=fb, fill=BG)
    return im
def titulo(im, l1, l2=None, cor2=GOLD):
    d = ImageDraw.Draw(im); d.rectangle((0, 40, W, 280), fill=BG)
    if l2: ctext(d, 70, l1, f('Bold', 76), WHITE); ctext(d, 165, l2, f('Bold', 76), cor2)
    else: ctext(d, 115, l1, f('Bold', 80), WHITE)
    return im
out = {}
# O1 — só o preço da página (controle da órbita)
out['O1_preco-pagina'] = preco_pagina(base())
# O2 — título em 1ª pessoa
out['O2_primeira-pessoa'] = titulo(preco_pagina(base()), 'Mandei 1 selfie.', 'Virei foto de sócio.')
# O3 — depois primeiro (inverte as fotos) + título "Essa foto saiu de uma selfie"
im = preco_pagina(base()); a = im.crop((60, 290, 532, 1066)); b = im.crop((548, 290, 1020, 1066))
im.paste(b, (60, 290)); im.paste(a, (548, 290)); titulo(im, 'Essa foto saiu', 'de uma selfie.')
out['O3_depois-primeiro'] = im
# O5 — título de dor
out['O5_cliente-julga'] = titulo(preco_pagina(base()), 'Seu cliente julga', 'pela sua foto.')
for k, v in out.items(): v.save(os.path.join(D, f'FOTOSADV_H01_orbita_{k}.png'))
# O4 — formato 9:16 (Stories/Reels) a partir do O1
src = out['O1_preco-pagina']; st = Image.new('RGB', (1080, 1920), BG); st.paste(src, (0, 285))
d = ImageDraw.Draw(st); ctext(d, 120, 'Envie suas selfies', f('Bold', 64), WHITE); ctext(d, 1700, 'Toque em Saiba mais', f('Bold', 56), GOLD)
st.save(os.path.join(D, 'FOTOSADV_H01_orbita_O4_9x16.png'))
print('ok')

# Pessoas diferentes no MESMO layout do H01 v2 (fotos limpas já existentes, 0 crédito)
def cover(im, w, h, cy=0.35):
    s = max(w / im.width, h / im.height); r = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    x = (r.width - w) // 2; y = int((r.height - h) * cy); return r.crop((x, y, x + w, y + h))
def pessoa(antes, depois, titulo2):
    im = preco_pagina(base()); d = ImageDraw.Draw(im)
    for (x0, x1), ph, lab, cor in (((60, 532), antes, 'ANTES', (40, 40, 40)), ((548, 1020), depois, 'DEPOIS', GOLD)):
        w, h = x1 - x0, 1066 - 290; c = cover(ph, w, h); m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w, h), 22, fill=255)
        im.paste(c, (x0, 290), m); fo = f('Bold', 26); tw = d.textlength(lab, font=fo)
        d.rounded_rectangle((x0 + 18, 1010, x0 + 18 + tw + 28, 1050), 8, fill=cor); d.text((x0 + 32, 1015), lab, font=fo, fill=WHITE if lab == 'ANTES' else BG)
    if titulo2: titulo(im, 'Da selfie à', titulo2, WHITE)
    return im
L = lambda n: Image.open(os.path.join(D, n)).convert('RGB')
raf = L('L02-5_perfil-antes-depois_v3.png')
pessoa(raf.crop((40, 300, 520, 670)), raf.crop((560, 300, 1040, 670)), None).save(os.path.join(D, 'FOTOSADV_H01_orbita_OP1_advogado-55.png'))
pessoa(L('L02-2_carrossel_card1.png').crop((0, 190, 940, 1060)), L('L02-2_carrossel_card2.png').crop((0, 40, 940, 940)), 'foto de sócia').save(os.path.join(D, 'FOTOSADV_H01_orbita_OP2_advogada-45.png'))
print('pessoas ok')
