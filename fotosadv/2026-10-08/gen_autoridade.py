# FOTOSADV – variações estáticas do líder "Gaby vídeo 01" (hook de autoridade). 100% código (Pillow).
# Uso: python3 gen_autoridade.py  (reaproveita os painéis selfie/profissional das peças H01/H02 de 07/10)
import os
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__)); S = os.path.join(D, '..', '2026-10-07')
F = '/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(w, s): return ImageFont.truetype(F + w + '.ttf', s)
W, H = 1080, 1350
BG = (14, 18, 32); GOLD = (232, 186, 72); WHITE = (255, 255, 255); GREY = (150, 158, 175); MID = (90, 96, 110)

def panels(fn):
    im = Image.open(os.path.join(S, fn)).convert('RGB')
    return im.crop((60, 290, 533, 1000)), im.crop((547, 290, 1020, 1000))
A = panels('FOTOSADV_antes-depois_H01_v1_r3.png')   # advogada
B = panels('FOTOSADV_dor-selfie_H02_v1_r3.png')     # advogado

def cover(im, w, h, top=0.0):
    r = max(w / im.width, h / im.height); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = (im.width - w) // 2; y = int((im.height - h) * top); return im.crop((x, y, x + w, y + h))
def rpaste(c, im, x, y, r=26):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255); c.paste(im, (x, y), m)
def ctext(d, y, t, font, fill):
    d.text(((W - d.textlength(t, font=font)) / 2, y), t, font=font, fill=fill)
def tag(d, x, y, t, col, s=28):
    fl = f('Bold', s); w = d.textlength(t, font=fl) + 32
    d.rounded_rectangle((x, y, x + w, y + s + 22), 14, fill=BG); d.text((x + 16, y + 7), t, font=fl, fill=col)
def pricebar(d, y=1100):
    d.rounded_rectangle((60, y, 1020, y + 150), 28, fill=WHITE); d.line((540, y + 28, 540, y + 122), fill=(220, 222, 228), width=3)
    for cx, a, b in [(300, '3 fotos', 'R$ 39,90'), (780, '15 fotos', 'R$ 89')]:
        fa = f('Regular', 32); fb = f('Bold', 56)
        d.text((cx - d.textlength(a, font=fa) / 2, y + 18), a, font=fa, fill=MID)
        d.text((cx - d.textlength(b, font=fb) / 2, y + 62), b, font=fb, fill=BG)
def hook(d, lines, cols, y=64, size=70):
    for l, c in zip(lines, cols): ctext(d, y, l, f('Bold', size), c); y += size + 14
def foot(d, t='Fotos feitas a partir de selfies'): ctext(d, 1278, t, f('Regular', 26), GREY)

def one_pair(lines, cols, out):
    c = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(c); hook(d, lines, cols)
    y0, h = 260, 800
    rpaste(c, cover(A[0], 473, h), 60, y0); rpaste(c, cover(A[1], 473, h), 547, y0)
    tag(d, 80, y0 + h - 70, 'SELFIE', WHITE); tag(d, 567, y0 + h - 70, 'FOTO PROFISSIONAL', GOLD)
    pricebar(d); foot(d); c.save(out)

def two_pairs(lines, cols, out):
    c = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(c); hook(d, lines, cols)
    y, h = 260, 392
    for (bf, af), t in ((A, 0.42), (B, 0.62)):
        rpaste(c, cover(bf, 473, h, t), 60, y); rpaste(c, cover(af, 473, h, 0.0), 547, y)
        tag(d, 76, y + h - 58, 'SELFIE', WHITE, 24); tag(d, 563, y + h - 58, 'FOTO PROFISSIONAL', GOLD, 24)
        y += h + 16
    pricebar(d); foot(d, '2 exemplos · fotos feitas a partir de selfies'); c.save(out)

if __name__ == '__main__':
    # v1: hook do líder (pergunta de autoridade) em estático — muda só o formato/visual (vídeo → antes/depois)
    one_pair(['Sua foto transmite', 'a sua autoridade?'], [WHITE, GOLD], os.path.join(D, 'FOTOSADV_autoridade_H12_v1.png'))
    # v2: igual ao v1, muda só o hook (clientes de alto valor, tirado da copy do líder)
    one_pair(['Cliente de alto valor', 'escolhe pela imagem.'], [WHITE, GOLD], os.path.join(D, 'FOTOSADV_autoridade_H13_v1.png'))
    # v3: igual ao v1, muda só a prova (2 exemplos selfie → profissional em vez de 1)
    two_pairs(['Sua foto transmite', 'a sua autoridade?'], [WHITE, GOLD], os.path.join(D, 'FOTOSADV_autoridade_H12_v2.png'))
    print('ok')
