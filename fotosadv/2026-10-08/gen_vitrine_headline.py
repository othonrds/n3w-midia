# FOTOSADV vitrine v3/v4/v2 (08/10): reaproveita o corpo das peças de 07/10 e troca só a headline
# (ensaio fotográfico + fala com o advogado). Preço removido da imagem (fica na copy). 100% Pillow, 0 crédito.
# Uso: python3 gen_vitrine_headline.py <dir_pngs_0710> <saida>
import sys, os
from PIL import Image, ImageDraw, ImageFont
SRC, OUT = sys.argv[1], sys.argv[2]; os.makedirs(OUT, exist_ok=True)
F = '/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(w, s): return ImageFont.truetype(F + w + '.ttf', s)
W, H = 1080, 1350
BG = (14, 18, 32); GOLD = (232, 186, 72); WHITE = (255, 255, 255); GREY = (170, 178, 195)
def ctext(d, y, t, font, fill): d.text(((W - d.textlength(t, font=font)) / 2, y), t, font=font, fill=fill)
def headline(d, tag, lines, sub):
    ft = f('Bold', 46); tw = d.textlength(tag, font=ft) + 56
    d.rounded_rectangle(((W - tw) / 2, 44, (W + tw) / 2, 112), 34, fill=GOLD)
    ctext(d, 50, tag, ft, BG)
    y = 132
    for l in lines: ctext(d, y, l, f('Bold', 74), WHITE); y += 92
    ctext(d, y + 8, sub, f('Medium', 40), GOLD)
def build(src, body_box, top, tag, lines, sub, out):
    s = Image.open(os.path.join(SRC, src)).convert('RGB')
    c = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(c)
    headline(d, tag, lines, sub)
    body = s.crop(body_box); c.paste(body, (body_box[0], top))
    c.paste(s.crop((0, 1262, W, 1316)), (0, 1270))   # rodapé "Telas ilustrativas · fotos feitas a partir de selfies"
    c.save(out); print(out)
A = ('ADVOGADO', ['Seu ensaio fotográfico', 'profissional'], 'feito a partir das suas selfies')
B = ('ADVOGADO', ['Um ensaio fotográfico', 'para os seus 4 perfis'], 'feito a partir das suas selfies')
TEL = (40, 244, 1040, 1046); NOT = (40, 292, 1040, 1066)
build('FOTOSADV_vitrine_H10_v1.png', TEL, 420, *A, os.path.join(OUT, 'FOTOSADV_vitrine_H10_v3.png'))
build('FOTOSADV_vitrine_H10_v2.png', NOT, 432, *A, os.path.join(OUT, 'FOTOSADV_vitrine_H10_v4.png'))
build('FOTOSADV_vitrine_H11_v1.png', TEL, 420, *B, os.path.join(OUT, 'FOTOSADV_vitrine_H11_v2.png'))
