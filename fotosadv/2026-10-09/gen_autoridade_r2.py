# FOTOSADV – rodada 2 de variações do líder "Gaby vídeo 01" (base: H12 v1 de 08/10). 100% código (Pillow), 0 crédito.
# Cada peça muda UMA coisa em relação ao H12 v1: visual (fundo claro), hook (H14) ou prova (exemplo masculino).
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(D, '..', '2026-10-08'))
import gen_autoridade as g
from PIL import Image, ImageDraw
W, H = g.W, g.H
CREAM = (246, 242, 234); NAVY = (14, 18, 32); GOLD_D = (176, 128, 22)

def pair(lines, cols, out, P=g.A, bg=g.BG, price_bg=None, foot_col=g.GREY, top=(0.0, 0.0)):
    c = Image.new('RGB', (W, H), bg); d = ImageDraw.Draw(c); g.hook(d, lines, cols)
    y0, h = 260, 800
    g.rpaste(c, g.cover(P[0], 473, h, top[0]), 60, y0); g.rpaste(c, g.cover(P[1], 473, h, top[1]), 547, y0)
    g.tag(d, 80, y0 + h - 70, 'SELFIE', g.WHITE); g.tag(d, 567, y0 + h - 70, 'FOTO PROFISSIONAL', g.GOLD)
    if price_bg:  # barra de preço escura no fundo claro
        y = 1100; d.rounded_rectangle((60, y, 1020, y + 150), 28, fill=price_bg); d.line((540, y + 28, 540, y + 122), fill=(60, 66, 84), width=3)
        for cx, a, b in [(300, '3 fotos', 'R$ 39,90'), (780, '15 fotos', 'R$ 89')]:
            fa = g.f('Regular', 32); fb = g.f('Bold', 56)
            d.text((cx - d.textlength(a, font=fa) / 2, y + 18), a, font=fa, fill=(180, 186, 200))
            d.text((cx - d.textlength(b, font=fb) / 2, y + 62), b, font=fb, fill=g.WHITE)
    else: g.pricebar(d)
    t = 'Fotos feitas a partir de selfies'; g.ctext(d, 1278, t, g.f('Regular', 26), foot_col)
    c.save(out)

if __name__ == '__main__':
    o = lambda n: os.path.join(D, n)
    # v3: muda só o VISUAL (paleta clara creme + texto navy/dourado escuro) — mesmo hook, mesma prova
    pair(['Sua foto transmite', 'a sua autoridade?'], [NAVY, GOLD_D], o('FOTOSADV_autoridade_H12_v3.png'), bg=CREAM, price_bg=NAVY, foot_col=(110, 112, 120))
    # H14: muda só o HOOK (contraste carreira × selfie) — mesmo visual escuro, mesma prova
    pair(['Currículo de sócio.', 'Foto de selfie?'], [g.WHITE, g.GOLD], o('FOTOSADV_autoridade_H14_v1.png'))
    # v4: muda só a PROVA (exemplo masculino em vez da advogada) — mesmo hook, mesmo visual
    pair(['Sua foto transmite', 'a sua autoridade?'], [g.WHITE, g.GOLD], o('FOTOSADV_autoridade_H12_v4.png'), P=g.B, top=(0.35, 0.0))
    print('ok')
