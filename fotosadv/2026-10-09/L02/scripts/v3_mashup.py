from vlib import *
# 3) MASHUP 14s — Pexels/Pixabay bloqueados pelo proxy: movimento feito em código (whip-pan, RGB split,
#    light leak, tremor, zoom) sobre as NOSSAS fotos de personas IA, intercalado com legenda grande.
pairs = [('p2_selfie', 'p2_ensaio', 0.35, 0.2), ('p3_selfie', 'p3_ensaio2', 0.4, 0.15),
         ('p4_selfie', 'p4_ensaio', 0.5, 0.3), ('p1_selfie', 'p1_ensaio', 0.4, 0.15)]
def full(name, cy):
    im = src(name)
    fr = cover(up(im, 2.0), VW, VH, 0.5, cy)
    return grain(fr, 5, 7)
imgs = []
for s, e, cs, ce in pairs:
    imgs.append(('SELFIE', full(s, cs))); imgs.append(('ENSAIO', full(e, ce)))
D = 1.25
caps = {0: ('Isso é uma selfie.', WHITE), 1: ('Isso é um ensaio.', GOLD)}
def sc(i):
    lab, im = imgs[i]
    def f(lt, dur, t):
        if lt < 0.16 and i > 0:  # whip-pan da imagem anterior
            fr = whip(imgs[i - 1][1], im, lt / 0.16)
        else:
            z = punch(lt, 0.07, push=0.05) if lab == 'ENSAIO' else 1.03 + 0.02 * math.sin(lt * 9)
            sx = 0 if lab == 'ENSAIO' else 7 * math.sin(lt * 17)
            fr = zoom_frame(im, z, dx=sx, dy=4 * math.cos(lt * 13))
        fr = fr.copy()
        if lab == 'ENSAIO':
            fr = light_leak(fr, t, 0.28, seed=i)
            if lt < 0.12: fr = rgb_split(fr, 14)
        else:
            fr = ImageEnhance.Color(fr).enhance(0.75)
        # faixa escura para legibilidade
        ov = Image.new('RGBA', (VW, VH), (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
        for y in range(0, 520, 8): od.rectangle((0, y, VW, y + 8), fill=(0, 0, 0, int(170 * (1 - y / 520))))
        fr.paste(ov, (0, 0), ov)
        if i in caps:
            txt, col = caps[i]
            pop_text(fr, VW / 2, 170, txt, 84, col, lt, 0.05, stroke=6)
            if i == 1 and lt > 0.35: pop_text(fr, VW / 2, 290, 'Mesma pessoa.', 56, WHITE, lt, 0.35, stroke=4, w='Medium')
        else:
            pop_text(fr, VW / 2, 170, lab, 128, GOLD if lab == 'ENSAIO' else WHITE, lt, 0.0, stroke=7)
        vselo(fr)
        return fr
    return f

# final: 2x2 dos ensaios
END = Image.new('RGB', (VW, VH), NAVY)
cw, ch = 470, 620
for k, (s, e, cs, ce) in enumerate(pairs):
    c = cover(up(src(e), 1.5), cw, ch, 0.5, ce)
    paste_round(END, c, (50 + (k % 2) * (cw + 40), 470 + (k // 2) * (ch + 30)), r=28)
def sc_end(lt, dur, t):
    fr = zoom_frame(END, punch(lt, 0.05, push=0.012)).copy()
    fr = light_leak(fr, t, 0.18, seed=9)
    pop_text(fr, VW / 2, 150, 'Da selfie ao ensaio.', 84, WHITE, lt, 0.0)
    pop_text(fr, VW / 2, 270, 'Sem estúdio. Sem fotógrafo.', 56, GOLD, lt, 0.25, w='Medium')
    if lt > 0.9:
        dd = ImageDraw.Draw(fr)
        pill(dd, VW / 2, 1830 - 30 + 4 * math.sin(lt * 6) - 60, 'Envie suas selfies → receba seu ensaio', F(44), GOLD, INK, padx=44, pady=24)
    selo(fr, 410 - 20)
    return flash(fr, lt, 0.08)

tl = TL()
for i in range(8): tl.add(i * D, (i + 1) * D, sc(i))
tl.add(8 * D, 14.0, sc_end)
ev = [(i * D, 'whoosh') for i in range(1, 8)] + [(D, 'impact'), (8 * D, 'impact'), (8 * D, 'riser:1.0')]
wav = music(14.0, bpm=96, events=ev, start_full=D, quiet_until=0, out=OUT + 'm3.wav', key=-2)
render(OUT + 'L02-3_mashup_movimento-codigo_14s', 14.0, tl, wav)
print('ok')
