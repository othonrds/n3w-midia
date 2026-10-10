# FOTOSADV – ângulo "vitrine" (onde o cliente vê sua foto antes de ligar). 100% código (Pillow).
# Uso: python3 gen_vitrine.py <hero.png> <saida_dir>
import sys, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
HERO = sys.argv[1]; OUT = sys.argv[2]; os.makedirs(OUT, exist_ok=True)
F = '/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(w, s): return ImageFont.truetype(F + w + '.ttf', s)
W, H = 1080, 1350
BG = (14, 18, 32); GOLD = (232, 186, 72); WHITE = (255, 255, 255); GREY = (150, 158, 175)
INK = (20, 24, 36); MID = (90, 96, 110); LINE = (225, 228, 234); CARD = (242, 244, 247)
hero = Image.open(HERO).convert('RGB').crop((22, 22, 468, 700))
face = hero.crop((140, 0, 400, 260))

def circ(im, d, ring=None):
    im = im.resize((d, d), Image.LANCZOS)
    m = Image.new('L', (d * 4, d * 4), 0); ImageDraw.Draw(m).ellipse((0, 0, d * 4 - 1, d * 4 - 1), fill=255)
    m = m.resize((d, d), Image.LANCZOS); o = Image.new('RGBA', (d, d)); o.paste(im, (0, 0), m)
    if ring:
        R = d + 16; r = Image.new('RGBA', (R, R)); dr = ImageDraw.Draw(r)
        dr.ellipse((0, 0, R - 1, R - 1), outline=ring, width=6); r.paste(o, (8, 8), o); return r
    return o
def cover(im, w, h):
    r = max(w / im.width, h / im.height); im = im.resize((int(im.width * r + .5), int(im.height * r + .5)), Image.LANCZOS)
    x = (im.width - w) // 2; return im.crop((x, 0, x + w, h))
def rpaste(c, im, x, y, r=24):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, im.width - 1, im.height - 1), r, fill=255); c.paste(im, (x, y), m)
def ctext(d, y, t, font, fill):
    d.text(((W - d.textlength(t, font=font)) / 2, y), t, font=font, fill=fill)
def hook(d, lines, cols, y=56, size=72):
    for l, c in zip(lines, cols): ctext(d, y, l, f('Bold', size), c); y += size + 16
    return y
def pricebar(c, y=1084):
    d = ImageDraw.Draw(c); d.rounded_rectangle((60, y, 1020, y + 150), 28, fill=WHITE)
    d.line((540, y + 28, 540, y + 122), fill=(220, 222, 228), width=3)
    for cx, a, b in [(300, '3 fotos', 'R$ 39,90'), (780, '15 fotos', 'R$ 89')]:
        fa = f('Regular', 32); fb = f('Bold', 56)
        d.text((cx - d.textlength(a, font=fa) / 2, y + 18), a, font=fa, fill=MID)
        d.text((cx - d.textlength(b, font=fb) / 2, y + 60), b, font=fb, fill=BG)
def foot(d): ctext(d, 1272, 'Telas ilustrativas · fotos feitas a partir de selfies', f('Regular', 24), GREY)
def label(d, x, y, t):
    fl = f('Bold', 26); w = d.textlength(t, font=fl) + 36
    d.rounded_rectangle((x, y, x + w, y + 46), 23, fill=BG); d.text((x + 18, y + 6), t, font=fl, fill=GOLD)
def bar(d, x, y, w, h=16, col=LINE): d.rounded_rectangle((x, y, x + w, y + h), h // 2, fill=col)

import math
def stars(d, x, y, n=5, r=11):
    for i in range(n):
        cx = x + r + i * (2 * r + 6); cy = y + r
        pts = [(cx + (r if k % 2 == 0 else r * 0.45) * math.sin(k * math.pi / 5), cy - (r if k % 2 == 0 else r * 0.45) * math.cos(k * math.pi / 5)) for k in range(10)]
        d.polygon(pts, fill=(240, 170, 30))
# ---------- 4 mini telas (genéricas, sem logotipos) ----------
def tile_whats(c, x, y, w, h):
    d = ImageDraw.Draw(c); d.rounded_rectangle((x, y, x + w, y + h), 30, fill=CARD)
    d.rounded_rectangle((x, y, x + w, y + 120), 30, fill=(7, 94, 84)); d.rectangle((x, y + 60, x + w, y + 120), fill=(7, 94, 84))
    a = circ(face, 80); c.paste(a, (x + 24, y + 20), a)
    d.text((x + 122, y + 26), 'Dr. Advogado', font=f('Bold', 30), fill=WHITE)
    d.text((x + 122, y + 66), 'online', font=f('Regular', 24), fill=(200, 230, 220))
    d.rounded_rectangle((x + 24, y + 150, x + w - 90, y + 220), 18, fill=WHITE)
    d.text((x + 44, y + 166), 'Olá, vi seu contato.', font=f('Regular', 26), fill=INK)
    d.rounded_rectangle((x + 90, y + 240, x + w - 24, y + 310), 18, fill=(217, 253, 211))
    d.text((x + 110, y + 256), 'Pode falar agora?', font=f('Regular', 26), fill=INK)
    label(d, x + 20, y + h - 66, 'WhatsApp')
def tile_insta(c, x, y, w, h):
    d = ImageDraw.Draw(c); d.rounded_rectangle((x, y, x + w, y + h), 30, fill=CARD)
    a = circ(face, 110, ring=(214, 41, 118)); c.paste(a, (x + 24, y + 20), a)
    for i, (n, t) in enumerate([('312', 'posts'), ('4,1 mil', 'seguid.')]):
        cx = x + 230 + i * 120; fn = f('Bold', 28); ft = f('Regular', 20)
        d.text((cx - d.textlength(n, font=fn) / 2, y + 42), n, font=fn, fill=INK)
        d.text((cx - d.textlength(t, font=ft) / 2, y + 80), t, font=ft, fill=MID)
    d.text((x + 28, y + 152), 'Advocacia', font=f('Bold', 26), fill=INK)
    bar(d, x + 28, y + 196, w - 120); bar(d, x + 28, y + 222, w - 180)
    d.rounded_rectangle((x + 28, y + 252, x + w - 28, y + 296), 12, fill=LINE)
    ft = f('Medium', 22); t = 'Mensagem'; d.text((x + (w - d.textlength(t, font=ft)) / 2, y + 260), t, font=ft, fill=INK)
    label(d, x + 20, y + h - 66, 'Instagram')
def tile_linked(c, x, y, w, h):
    d = ImageDraw.Draw(c); d.rounded_rectangle((x, y, x + w, y + h), 30, fill=CARD)
    d.rounded_rectangle((x, y, x + w, y + 90), 30, fill=(160, 180, 200)); d.rectangle((x, y + 50, x + w, y + 90), fill=(160, 180, 200))
    a = circ(face, 116, ring=WHITE); c.paste(a, (x + 26, y + 26), a)
    d.text((x + 28, y + 168), 'Dr. Advogado', font=f('Bold', 30), fill=INK)
    d.text((x + 28, y + 208), 'Advogado · Sócio', font=f('Regular', 24), fill=MID)
    bar(d, x + 28, y + 252, w - 140); bar(d, x + 28, y + 278, w - 200)
    label(d, x + 20, y + h - 66, 'LinkedIn')
def tile_google(c, x, y, w, h):
    d = ImageDraw.Draw(c); d.rounded_rectangle((x, y, x + w, y + h), 30, fill=CARD)
    d.rounded_rectangle((x + 22, y + 20, x + w - 22, y + 76), 28, fill=WHITE, outline=LINE, width=2)
    d.text((x + 48, y + 30), 'advogado perto de mim', font=f('Regular', 24), fill=MID)
    d.rounded_rectangle((x + 22, y + 92, x + w - 22, y + 300), 20, fill=WHITE)
    p = cover(hero, 128, 176); rpaste(c, p, x + 40, y + 108, 14)
    d.text((x + 190, y + 108), 'Escritório', font=f('Bold', 26), fill=INK)
    stars(d, x + 192, y + 152)
    bar(d, x + 190, y + 186, w - 260, 14); bar(d, x + 190, y + 210, w - 300, 14)
    d.rounded_rectangle((x + 190, y + 240, x + 330, y + 280), 20, fill=LINE)
    d.text((x + 230, y + 246), 'Ligar', font=f('Medium', 22), fill=INK)
    label(d, x + 20, y + h - 66, 'Google')

def v_telas(lines, cols, out):
    c = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(c)
    y = hook(d, lines, cols); top = y + 20
    tw, th = 465, 380; g = 26
    tile_whats(c, 60, top, tw, th); tile_insta(c, 60 + tw + g, top, tw, th)
    tile_linked(c, 60, top + th + g, tw, th); tile_google(c, 60 + tw + g, top + th + g, tw, th)
    pricebar(c); foot(ImageDraw.Draw(c)); c.save(out)

def v_notas(lines, cols, out):
    # mesmo hook; visual "nota no celular" nativa com a foto e a lista dos lugares
    c = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(c)
    y = hook(d, lines, cols); top = max(y + 26, 300)
    d.rounded_rectangle((60, top, 1020, 1058), 34, fill=(255, 251, 235))
    d.text((100, top + 34), 'Onde o cliente vê sua foto', font=f('Bold', 40), fill=INK)
    d.text((100, top + 92), 'antes de te ligar:', font=f('Bold', 40), fill=INK)
    items = ['WhatsApp', 'Instagram', 'LinkedIn', 'Google', 'Site do escritório']
    yy = top + 186
    for t in items:
        d.rounded_rectangle((100, yy + 6, 144, yy + 50), 10, fill=GOLD)
        d.line((110, yy + 28, 120, yy + 40), fill=INK, width=6); d.line((120, yy + 40, 136, yy + 16), fill=INK, width=6)
        d.text((168, yy), t, font=f('Medium', 40), fill=INK); yy += 84
    d.text((100, yy + 20), 'Selfie em todos eles?', font=f('Bold', 36), fill=(200, 70, 70))
    p = cover(hero, 380, 540); rpaste(c, p, 600, top + 180, 26)
    pricebar(c); ImageDraw.Draw(c); foot(ImageDraw.Draw(c)); c.save(out)

v_telas(['Antes de ligar,', 'o cliente vê isto.'], [WHITE, GOLD], os.path.join(OUT, 'FOTOSADV_vitrine_H10_v1.png'))
v_notas(['Antes de ligar,', 'o cliente vê isto.'], [WHITE, GOLD], os.path.join(OUT, 'FOTOSADV_vitrine_H10_v2.png'))
v_telas(['Sua foto aparece', 'em 4 lugares.'], [WHITE, GOLD], os.path.join(OUT, 'FOTOSADV_vitrine_H11_v1.png'))
print('ok')
