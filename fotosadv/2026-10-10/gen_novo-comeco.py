# FOTOSADV – ângulo novo "novo começo" (aprovação na OAB / escritório novo / primeiro cliente). 100% código (Pillow), 0 crédito.
# Visual e prova idênticos ao estático H01 v2 (melhor custo por compra entre os estáticos); entre as 3 peças muda SÓ o hook.
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(D, '..', '2026-10-08'))
import gen_autoridade as g
from PIL import Image, ImageDraw
P = g.panels('FOTOSADV_antes-depois_H01_v2_r3.png')

def peca(lines, out):
    c = Image.new('RGB', (g.W, g.H), g.BG); d = ImageDraw.Draw(c)
    g.hook(d, lines, [g.WHITE, g.GOLD], y=78, size=72)
    y0, h = 290, 780
    g.rpaste(c, g.cover(P[0], 473, h), 60, y0); g.rpaste(c, g.cover(P[1], 473, h), 547, y0)
    g.tag(d, 80, y0 + h - 64, 'ANTES', g.WHITE); g.tag(d, 567, y0 + h - 64, 'DEPOIS', g.GOLD)
    g.pricebar(d, 1110); g.ctext(d, 1290, 'Fotos profissionais feitas a partir das suas selfies', g.f('Regular', 24), g.GREY)
    c.save(out)

if __name__ == '__main__':
    o = lambda n: os.path.join(D, n)
    peca(['Passou na OAB.', 'E a sua foto?'], o('FOTOSADV_novo-comeco_H15_v1.png'))
    peca(['Escritório novo,', 'foto de selfie?'], o('FOTOSADV_novo-comeco_H16_v1.png'))
    peca(['Primeiro cliente.', 'Primeira impressão.'], o('FOTOSADV_novo-comeco_H17_v1.png'))
    print('ok')
