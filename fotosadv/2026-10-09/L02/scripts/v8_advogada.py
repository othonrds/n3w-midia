from vlib import *
# 8) ADVOGADA (mulheres) 9:16 — mesma estrutura do V02: ANTES/DEPOIS -> título -> pares selfie/ensaio -> parede de ensaios
#    -> palavras grandes sobre retratos -> CTA "PEÇA SEU ENSAIO". Personas IA: P1, P4, P5, P6.
BG = (12, 12, 14)
def dark_bg(im):
    b = blur_bg(im, VW, VH, dark=0.22)
    return Image.blend(b, Image.new('RGB', (VW, VH), BG), 0.4)

def ab_card(im, head, headcol, cap, cy=0.35, w=760, h=1000):
    base = dark_bg(im)
    c = cover(up(im, 2.0), w, h, 0.5, cy)
    paste_round(base, c, ((VW - w) // 2, 430), r=30)
    d = ImageDraw.Draw(base)
    text_c(d, VW / 2, 300, head, F(84), headcol)
    text_c(d, VW / 2, 430 + h + 50, cap, F(50), WHITE)
    return base

p1s, p1e, p4s, p4e, p5s, p5e = [src(n) for n in ['p1_selfie', 'p1_ensaio', 'p4_selfie', 'p4_ensaio', 'p5_selfie', 'p5_ensaio']]
p5x, p5c = src('p5_escr'), src('p5_ext')
A1 = ab_card(p1s, 'ANTES', WHITE, '1 selfie no celular')
A2 = ab_card(p1e, 'DEPOIS', GOLD, 'ensaio profissional com IA', cy=0.15)
T = cover(up(p1e, 2.4), VW, VH, 0.5, 0.12); T = ImageEnhance.Brightness(T).enhance(0.55)
B1 = ab_card(p4s, '', WHITE, 'outra selfie', cy=0.4)
B2 = ab_card(p4e, '', WHITE, 'virou isso', cy=0.3)
C1 = ab_card(p5s, '', WHITE, 'mais uma selfie', cy=0.35)
C2 = dark_bg(p5e)
c = cover(up(p5e, 1.7), 640, 840, 0.5, 0.2); paste_round(C2, c, (60, 430), r=28)
for k, im in enumerate([p5x, p5c]):
    s = cover(up(im, 1.4), 330, 400, 0.6, 0.0, zoom=1.35)
    paste_round(C2, s, (720, 430 + k * 440), r=24)
text_c(ImageDraw.Draw(C2), VW / 2, 1360, 'e virou um ensaio inteiro', F(50), WHITE)
names = ['LinkedIn', 'Site', 'Forum', 'Reuniao', 'Retrato', 'WhatsApp', 'Cartao', 'Escritorio', 'Instagram']
tiles = [src('p6_' + n) for n in names]
WALL = Image.new('RGB', (VW + 400, VH + 600), BG)
tw, th = 360, 300
k = 0
for r in range(8):
    for cidx in range(5):
        im = tiles[(r * 2 + cidx) % 9]
        t_ = cover(up(im, 1.4), tw - 16, th - 16, 0.5, 0.35)
        WALL.paste(t_, (cidx * tw - 100 * (r % 2), r * th), rmask(t_.size, 18))
WALL_D = ImageEnhance.Brightness(WALL).enhance(0.55)
def big(im, cy):
    f = cover(up(im, 2.4), VW, VH, 0.5, cy)
    g = Image.new('L', (1, VH)); [g.putpixel((0, y), int(255 * max(0, (y - VH * 0.45) / (VH * 0.55)) ** 1.2)) for y in range(VH)]
    g = g.resize((VW, VH))
    return Image.composite(Image.new('RGB', (VW, VH), BG), f, g)
R1 = big(tiles[4], 0.2); R2 = big(p4e, 0.25); R3 = big(p1e, 0.1)

def sc_static(img, words=None, wy=1500, col=WHITE, size=80, spaced=False):
    def f(lt, dur, t):
        fr = zoom_frame(img, punch(lt, 0.05, push=0.02)).copy()
        if words:
            for j, (w, s_, c_) in enumerate(words):
                pop_text(fr, VW / 2, wy + j * (s_ * 1.1), w, s_, c_, lt, 0.1 + 0.15 * j, stroke=0)
        vselo(fr)
        return flash(fr, lt, 0.06)
    return f
def sc_title(lt, dur, t):
    fr = zoom_frame(T, 1.0 + 0.04 * lt).copy()
    lines = ['ENSAIO', 'FOTOGRÁFICO', 'PROFISSIONAL']
    for j, w in enumerate(lines):
        pop_text(fr, VW / 2, 560 + j * 125, w, 112, WHITE, lt, 0.08 * j, stroke=3)
    if lt > 0.35:
        d = ImageDraw.Draw(fr)
        text_c(d, VW / 2 - 130, 560 + 3 * 125, 'COM', F(112), WHITE)
        d.rounded_rectangle((VW / 2 + 60, 560 + 3 * 125 - 10, VW / 2 + 250, 560 + 3 * 125 + 122), 20, fill=GOLD)
        text_c(d, VW / 2 + 155, 560 + 3 * 125, 'IA', F(112), INK)
    vselo(fr); return fr
def sc_wall(lt, dur, t):
    y = int(80 + lt * 140); x = int(200 - lt * 60)
    fr = WALL_D.crop((x, y, x + VW, y + VH))
    pop_text(fr, VW / 2, 1420, 'ensaios que passam', 64, WHITE, lt, 0.1, stroke=4)
    vselo(fr); return fr
CTA = WALL_D.crop((200, 300, 200 + VW, 300 + VH))
CTA = ImageEnhance.Brightness(CTA).enhance(0.6)
cc = cover(up(tiles[4], 1.6), 420, 420, 0.5, 0.3); paste_round(CTA, cc, (130, 520), r=24)
cc = cover(up(p4e, 1.2), 420, 420, 0.5, 0.3); paste_round(CTA, cc, (530, 520), r=24)
def sc_cta(lt, dur, t):
    fr = CTA.copy()
    pop_text(fr, VW / 2, 1050, 'PEÇA SEU ENSAIO', 104, WHITE, lt, 0.0)
    pop_text(fr, VW / 2, 1190, 'toque no botão abaixo', 50, (220, 220, 220), lt, 0.25, w='Medium')
    d = ImageDraw.Draw(fr)
    for j in range(3):
        a = 0.5 + 0.5 * math.sin(lt * 7 - j * 1.1)
        col = tuple(int(c_ * (0.4 + 0.6 * a)) for c_ in RED)
        yy = 1300 + j * 55
        d.line((VW / 2 - 60, yy, VW / 2, yy + 50, VW / 2 + 60, yy), fill=col, width=18, joint='curve')
    vselo(fr, 1650); return fr

tl = TL()
tl.add(0.0, 1.2, sc_static(A1)).add(1.2, 2.2, sc_static(A2)).add(2.2, 4.0, sc_title)
tl.add(4.0, 5.2, sc_static(B1)).add(5.2, 6.4, sc_static(B2)).add(6.4, 7.6, sc_static(C1)).add(7.6, 9.2, sc_static(C2))
tl.add(9.2, 11.2, sc_wall)
tl.add(11.2, 12.4, sc_static(R1, [('MAIS', 150, WHITE)], wy=1300))
tl.add(12.4, 13.6, sc_static(R2, [('AUTORIDADE', 130, GOLD)], wy=1310))
tl.add(13.6, 14.8, sc_static(R3, [('na sua', 60, WHITE), ('ADVOCACIA', 120, GOLD)], wy=1250))
tl.add(14.8, 19.0, sc_cta)
cuts = [1.2, 2.2, 4.0, 5.2, 6.4, 7.6, 9.2, 11.2, 12.4, 13.6, 14.8]
ev = [(c_, 'whoosh') for c_ in cuts] + [(2.2, 'impact'), (11.2, 'impact'), (14.8, 'impact'), (11.2, 'riser:2.0')]
wav = music(19.0, bpm=100, events=ev, start_full=2.2, quiet_until=0, out=OUT + 'm8.wav', key=-5)
render(OUT + 'L02-8_advogada_estrutura-V02_19s', 19.0, tl, wav)
print('ok')
