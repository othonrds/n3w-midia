# FOTOSADV 16/10 — variações dos estáticos vencedores, 1 mudança por peça. 100% Pillow, 0 crédito.
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(D, '..', '2026-10-07')
F = '/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(w, s): return ImageFont.truetype(F + w + '.ttf', s)
W = 1080; BG = (15, 18, 32); GOLD = (232, 186, 72); WHITE = (255, 255, 255); GREY = (150, 158, 175)
def o(n): return Image.open(os.path.join(S, n)).convert('RGB')
def ctext(d, y, t, font, fill): d.text(((W - d.textlength(t, font=font)) / 2, y), t, font=font, fill=fill)
H03 = 'FOTOSADV_oferta-grade_H03_v1_r3.png'; H01 = 'FOTOSADV_antes-depois_H01_v2_r3.png'

# H03 v2 — muda SÓ a oferta do rodapé: "ou 3 fotos por R$ 39,90" -> destaque do Ensaio completo R$ 249
im = o(H03); d = ImageDraw.Draw(im); d.rectangle((0, 1150, W, 1350), fill=BG)
fb = f('Bold', 40); t = 'Ensaio completo: 50 fotos por R$ 249'; tw = d.textlength(t, font=fb)
d.rounded_rectangle(((W - tw) / 2 - 30, 1162, (W + tw) / 2 + 30, 1232), 35, fill=GOLD); ctext(d, 1169, t, fb, BG)
ctext(d, 1250, 'R$ 4,98 por foto · feitas a partir das suas selfies', f('Regular', 28), GREY)
im.save(os.path.join(D, 'FOTOSADV_oferta-grade_H03_v2_pacote249.png'))

# H03 v3 — muda SÓ o título: preço por foto em destaque
im = o(H03); d = ImageDraw.Draw(im); d.rectangle((0, 50, W, 280), fill=BG)
ctext(d, 62, 'R$ 5,93 por foto', f('Bold', 104), GOLD)
ctext(d, 200, '15 fotos profissionais por R$ 89', f('Bold', 46), WHITE)
# preço da página (Othon 16/10): entrada = 4 fotos R$ 49,90
d.rectangle((0, 1160, W, 1228), fill=BG); ctext(d, 1168, 'ou 4 fotos por R$ 49,90', f('Medium', 40), WHITE)
im.save(os.path.join(D, 'FOTOSADV_oferta-grade_H03_v3_593-por-foto.png'))

# H01 v4/v5 — muda SÓ a pessoa da prova (antes/depois); título e barra de preço idênticos ao H01 v2
for src, out in (('FOTOSADV_dor-selfie_H02_v1_r3.png', 'FOTOSADV_antes-depois_H01_v4_advogado2.png'),
                 ('FOTOSADV_dor-selfie_H02_v2_r3.png', 'FOTOSADV_antes-depois_H01_v5_advogada.png')):
    im = o(H01); im.paste(o(src).crop((40, 285, 1040, 1080)), (40, 285)); d = ImageDraw.Draw(im)
    # preço da página (Othon 16/10): célula da esquerda vira 4 fotos R$ 49,90
    d.rectangle((90, 1122, 528, 1250), fill=WHITE)
    for y, t, fo, col in ((1128, '4 fotos', f('Regular', 32), (90, 96, 110)), (1172, 'R$ 49,90', f('Bold', 56), BG)):
        d.text((300 - d.textlength(t, font=fo) / 2, y), t, font=fo, fill=col)
    im.save(os.path.join(D, out))
print('ok')
