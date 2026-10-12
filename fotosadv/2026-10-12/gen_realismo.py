# FOTOSADV – ângulo novo "realismo" (objeção: medo de ficar com cara de IA/avatar). 100% código (Pillow), 0 crédito.
# Visual, prova e barra de preço idênticos ao estático H01 v2 (o estático que mais vende); entre as 3 peças muda SÓ o hook.
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(D, '..', '2026-10-08'))
import gen_autoridade as g
from PIL import Image, ImageDraw
P = g.panels('FOTOSADV_antes-depois_H01_v2_r3.png')

def peca(lines, out):
    c = Image.new('RGB', (g.W, g.H), g.BG); d = ImageDraw.Draw(c)
    size = 72
    while max(d.textlength(t, font=g.f('Bold', size)) for t in lines) > g.W - 2 * 72: size -= 2
    g.hook(d, lines, [g.WHITE, g.GOLD], y=78, size=size)
    y0, h = 290, 780
    g.rpaste(c, g.cover(P[0], 473, h), 60, y0); g.rpaste(c, g.cover(P[1], 473, h), 547, y0)
    g.tag(d, 80, y0 + h - 64, 'ANTES', g.WHITE); g.tag(d, 567, y0 + h - 64, 'DEPOIS', g.GOLD)
    g.pricebar(d, 1110); g.ctext(d, 1290, 'Fotos profissionais feitas a partir das suas selfies', g.f('Regular', 24), g.GREY)
    c.save(out)

if __name__ == '__main__':
    o = lambda n: os.path.join(D, n)
    peca(['Parece você.', 'Não um avatar.'], o('FOTOSADV_realismo_H21_v1.png'))
    peca(['Medo de ficar', 'com cara de IA?'], o('FOTOSADV_realismo_H22_v1.png'))
    peca(['Seu rosto de verdade.', 'Só que no melhor dia.'], o('FOTOSADV_realismo_H23_v1.png'))
    print('ok')
