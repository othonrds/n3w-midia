from vlib import *
# 6) TEXTO CINÉTICO 8s — só tipografia + 1 foto no final (persona P3)
seq = [  # (start, end, words, bg, fg, size)
    (0.0, 0.5, ['SEU', 'CLIENTE'], NAVY, WHITE, 170),
    (0.5, 1.0, ['JULGA'], GOLD, INK, 230),
    (1.0, 1.5, ['SUA', 'FOTO'], NAVY, WHITE, 210),
    (1.5, 2.0, ['ANTES'], CREAM, INK, 230),
    (2.0, 2.5, ['DO SEU'], NAVY, WHITE, 190),
    (2.5, 3.25, ['CURRÍ-', 'CULO.'], NAVY, GOLD, 200),
    (3.25, 4.0, ['SELFIE?'], CREAM, INK, 200),
    (4.0, 4.5, ['ENSAIO.'], GOLD, INK, 200),
    (4.5, 5.0, ['A PARTIR', 'DAS SUAS'], NAVY, WHITE, 150),
    (5.0, 5.5, ['SELFIES.'], NAVY, GOLD, 200),
]
def sc_word(words, bg, fg, size, strike=False, idx=0):
    def f(lt, dur, t):
        fr = Image.new('RGB', (VW, VH), bg)
        n = len(words); lh = size * 1.05
        y0 = VH / 2 - n * lh / 2 - 20
        for k, w in enumerate(words):
            d = 0.06 * k
            # entra deslizando de lados alternados + overshoot
            x = (lt - d) / 0.2
            if x <= 0: continue
            e = ease_back(min(1, x))
            off = (1 - e) * (300 if (idx + k) % 2 == 0 else -300)
            sz = int(size * (0.85 + 0.15 * min(1, e)))
            dd = ImageDraw.Draw(fr); fnt = F(sz)
            tw, th, b = tsize(dd, w, fnt)
            dd.text((VW / 2 - tw / 2 - b[0] + off, y0 + k * lh - b[1]), w, font=fnt, fill=fg)
        if strike and lt > 0.3:
            p = ease((lt - 0.3) / 0.2)
            dd = ImageDraw.Draw(fr); fnt = F(size); tw, th, b = tsize(dd, words[0], fnt)
            xa = VW / 2 - tw / 2 - 20; yb = VH / 2 - 20 + 10
            dd.line((xa, yb, xa + (tw + 40) * p, yb), fill=RED, width=22)
        # leve tremor de câmera na batida
        return zoom_frame(fr, 1 + 0.04 * (1 - ease(lt / 0.15)))
    return f

photo = src('p3_ensaio2')
P = card_scene(photo, cw=880, ch=1160, cy=0.12, top=420, scale=2.0, bg_dark=0.35)
def sc_photo(lt, dur, t):
    fr = zoom_frame(P, punch(lt, 0.1, 0.2, push=0.02)).copy()
    pop_text(fr, VW / 2, 150, 'Ensaio profissional', 80, WHITE, lt, 0.1, stroke=4)
    pop_text(fr, VW / 2, 260, 'feito com IA a partir de selfies', 52, GOLD, lt, 0.3, stroke=3, w='Medium')
    if lt > 0.8:
        dd = ImageDraw.Draw(fr); pill(dd, VW / 2, 1670 + 4 * math.sin(lt * 6), 'Toque em Saiba mais', F(52), GOLD, INK, padx=56, pady=26)
    selo(fr, 1500 + 40)
    return flash(fr, lt, 0.1)

tl = TL()
for i, (a, b, w, bg, fg, sz) in enumerate(seq):
    tl.add(a, b, sc_word(w, bg, fg, sz, strike=(w[0] == 'SELFIE?'), idx=i))
tl.add(5.5, 8.0, sc_photo)
ev = [(5.5, 'impact'), (5.5, 'riser:1.0'), (3.25, 'whoosh'), (4.0, 'impact')]
wav = music(8.0, bpm=120, events=ev, start_full=0, out=OUT + 'm6.wav', key=3)
render(OUT + 'L02-6_texto-cinetico_8s', 8.0, tl, wav)
print('ok')
