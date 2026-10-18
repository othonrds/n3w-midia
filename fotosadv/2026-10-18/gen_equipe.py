# FOTOSADV – ângulo novo "equipe do escritório" (quem decide é o sócio que quer a página Equipe/site com todo mundo profissional).
# Nunca testado (18/10: sem líder claro, P(H01v2 1-1-1 > H03 F1) = 0,52). 100% código (Pillow), 0 crédito.
# Visual fixo: 3 pessoas reais (selfie em cima, foto profissional embaixo) + barra de preço; entre as 3 peças muda SÓ o hook.
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(D, '..', '2026-10-08'))
import gen_autoridade as g
from PIL import Image, ImageDraw
C = g.panels('FOTOSADV_antes-depois_H01_v2_r3.png')
PEOPLE = [(g.A, 0.30, 0.0), (C, 0.30, 0.10), (g.B, 0.45, 0.0)]  # (painéis, top selfie, top profissional)

def peca(lines, out):
    c = Image.new('RGB', (g.W, g.H), g.BG); d = ImageDraw.Draw(c)
    size = 70
    while max(d.textlength(t, font=g.f('Bold', size)) for t in lines) > g.W - 2 * 72: size -= 2
    g.hook(d, lines, [g.WHITE, g.GOLD], y=70, size=size)
    cw, gap, y1, h = 309, 16, 268, 362
    for i, (P, ts, tp) in enumerate(PEOPLE):
        x = 60 + i * (cw + gap)
        g.rpaste(c, g.cover(P[0], cw, h, ts), x, y1, 22)
        g.rpaste(c, g.cover(P[1], cw, h, tp), x, y1 + h + 44, 22)
    lf = g.f('Bold', 26)
    g.ctext(d, y1 + h + 6, 'ANTES: SELFIES', lf, g.GREY)
    g.ctext(d, y1 + 2 * h + 58, 'DEPOIS: FOTOS PROFISSIONAIS', lf, g.GOLD)
    g.pricebar(d, 1112)
    g.ctext(d, 1284, '3 exemplos · fotos feitas a partir de selfies · valor por pessoa', g.f('Regular', 23), g.GREY)
    c.save(out)

if __name__ == '__main__':
    o = lambda n: os.path.join(D, n)
    peca(['A página “Equipe”', 'do seu site convence?'], o('FOTOSADV_equipe_H33_v1.png'))
    peca(['Sócios com selfie no', 'site do escritório?'], o('FOTOSADV_equipe_H34_v1.png'))
    peca(['O time inteiro com', 'foto de sócio.'], o('FOTOSADV_equipe_H35_v1.png'))
    print('ok')
