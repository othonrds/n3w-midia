from vlib import *
# 1) REELS 13s — POV selfie -> corte seco -> 6 cortes de ensaio no ritmo (persona P5)
sel = src('p5_selfie'); ens = src('p5_ensaio'); esc = src('p5_escr'); ext = src('p5_ext')

def wide_card(im, label, zoom=1.0, cx=0.5, cy=0.5):
    base = blur_bg(im, VW, VH, dark=0.42)
    cw, ch = 1000, 522
    c = cover(up(im, 2.4), cw, ch, cx, cy, zoom=zoom)
    dd = ImageDraw.Draw(c); dd.rounded_rectangle((30, ch - 140, 470, ch - 26), 20, fill=NAVY)
    text_c(dd, 250, ch - 104, label, F(40), WHITE)
    paste_round(base, c, ((VW - cw) // 2, 640), r=36)
    return base

def tall_card(im, label, zoom=1.0, cy=0.3):
    base = card_scene(im, cw=900, ch=1170, cy=cy, top=420, zoom=zoom)
    d = ImageDraw.Draw(base); tag(d, 120, 420 + 1170 - 96, label, 34, NAVY, WHITE)
    return base

S_sel = card_scene(sel, cw=900, ch=1170, cy=0.35, top=420)
ImageDraw.Draw(S_sel); tag(ImageDraw.Draw(S_sel), 120, 420 + 1170 - 96, 'A SELFIE', 34, (0, 0, 0), WHITE)
shots = [tall_card(ens, 'ESTÚDIO', cy=0.25),
         wide_card(esc, 'ESCRITÓRIO'),
         wide_card(ext, 'EXTERNO'),
         tall_card(ens, 'RETRATO', zoom=1.55, cy=0.2),
         wide_card(esc, 'ESCRITÓRIO', zoom=1.5, cx=0.55, cy=0.2),
         wide_card(ext, 'EXTERNO', zoom=1.5, cx=0.55, cy=0.25)]

def sc_pov(lt, dur, t):
    sh_x = 10 * math.sin(lt * 7.1) + 6 * math.sin(lt * 13.3)
    sh_y = 8 * math.cos(lt * 6.3) + 5 * math.sin(lt * 11.7)
    fr = zoom_frame(S_sel, 1.04 + 0.03 * lt, dx=sh_x, dy=sh_y)
    pop_text(fr, VW / 2, 120, 'POV:', 60, GOLD, lt, 0.0, stroke=4)
    pop_text(fr, VW / 2, 200, 'você manda 1 selfie…', 74, WHITE, lt, 0.25, stroke=5)
    if lt > 1.3: pop_text(fr, VW / 2, 300, '(do escritório mesmo)', 44, (220, 220, 220), lt, 1.3, stroke=3, w='Medium')
    vselo(fr); return fr

def sc_shot(i):
    def f(lt, dur, t):
        fr = zoom_frame(shots[i], punch(lt, 0.09))
        fr = fr.copy()
        if i == 0 or lt < 0:
            pop_text(fr, VW / 2, 150, '…e recebe isso:', 84, GOLD, lt, 0.0, stroke=5)
        else:
            shadow_text(fr, VW / 2, 150, 'Mesma pessoa.', 70, WHITE)
            shadow_text(fr, VW / 2, 240, 'Outro estilo.', 70, GOLD)
        d = ImageDraw.Draw(fr)
        vselo(fr)
        return flash(fr, lt, 0.08)
    return f

END = Image.new('RGB', (VW, VH), NAVY)
d = ImageDraw.Draw(END)
a = cover(up(sel, 1.4), 400, 520, 0.5, 0.35); b = cover(up(ens, 1.6), 520, 680, 0.5, 0.25)
paste_round(END, a, (70, 600), r=28); paste_round(END, b, (500, 520), r=32)
tag(d, 90, 1050, 'A SELFIE', 28, (0, 0, 0), WHITE); tag(d, 520, 1130, 'O ENSAIO', 30, GOLD, INK)
arrow(d, 420, 860, 70, GOLD)
def sc_end(lt, dur, t):
    fr = zoom_frame(END, punch(lt, 0.06, push=0.01)).copy()
    pop_text(fr, VW / 2, 180, 'Ensaio profissional', 80, WHITE, lt, 0.0)
    pop_text(fr, VW / 2, 290, 'a partir das suas selfies.', 60, GOLD, lt, 0.2)
    if lt > 0.6:
        dd = ImageDraw.Draw(fr)
        for j, s in enumerate(['Sem estúdio', 'Sem fotógrafo', 'Sem agendar']):
            if lt > 0.6 + j * 0.25:
                text_c(dd, VW / 2, 1290 + j * 70, s, F(48, 'Medium'), WHITE)
    if lt > 1.6:
        dd = ImageDraw.Draw(fr)
        pill(dd, VW / 2, 1560 + 4 * math.sin(lt * 6), 'Toque em Saiba mais', F(52), GOLD, INK, padx=56, pady=26)
    selo(fr, 1700)
    return flash(fr, lt, 0.08)

tl = TL().add(0, 2.5, sc_pov)
for i in range(6): tl.add(2.5 + i, 3.5 + i, sc_shot(i))
tl.add(8.5, 13.0, sc_end)
ev = [(2.5, 'riser:1.5'), (2.5, 'impact'), (8.5, 'impact')] + [(2.5 + i, 'whoosh') for i in range(1, 6)]
wav = music(13.0, bpm=120, events=ev, start_full=2.5, quiet_until=2.5, out=OUT + 'm1.wav', seed=1)
render(OUT + 'L02-1_reels_selfie-6-ensaios_13s', 13.0, tl, wav)
print('ok')
