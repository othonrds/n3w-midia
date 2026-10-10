from lib import *
W, H = 1080, 1350

# ===== 2) CARROSSEL 5 cards (persona P5) =====
def card_photo(im, top_lines, label=None, cx=0.5, cy=0.4, bottom=None, idx=None, arrow_=True, wide=False):
    base = blur_bg(im, W, H, dark=0.35)
    base = Image.blend(base, Image.new('RGB', (W, H), NAVY), 0.45)
    pw, ph = (920, 960) if not wide else (1000, 522)
    py = 250 if not wide else 380
    ph_im = cover(up(im, 2.4), pw, ph, cx, cy)
    if wide:  # cobre o rótulo antigo embutido na fonte com a nossa etiqueta
        dd = ImageDraw.Draw(ph_im); dd.rounded_rectangle((30, ph - 140, 470, ph - 26), 20, fill=NAVY)
    paste_round(base, ph_im, ((W - pw) // 2, py), r=36)
    d = ImageDraw.Draw(base)
    y = 70
    for t, f, c in top_lines:
        text_c(d, W / 2, y, t, f, c); y += f.size * 1.15
    if label and not wide: tag(d, (W - pw) // 2 + 28, py + ph - 84, label, 30, NAVY, WHITE)
    if label and wide: text_c(d, (W - pw) // 2 + 250, py + ph - 104, label, F(40), WHITE)
    if idx:
        f = F(26, 'Medium'); text_c(d, W - 110, 40, idx, f, GREY)
    if bottom:
        text_c(d, W / 2, (py + ph + 26) if not wide else py + ph + 40, bottom, F(34 if wide else 30, 'Medium'), WHITE)
    if arrow_:
        d.ellipse((W - 128, py + ph // 2 - 44, W - 40, py + ph // 2 + 44), fill=(0, 0, 0, 120) if False else (20, 22, 34))
        arrow(d, W - 108, py + ph // 2, 50, WHITE)
    selo(base, H - 30)
    return grain(base, 4, 1)

sel = src('p5_selfie'); ens = src('p5_ensaio'); esc = src('p5_escr'); ext = src('p5_ext')
c1 = card_photo(sel, [('Isso aqui…', F(92), WHITE)], label='A SELFIE', cy=0.35, bottom='…é a foto que o seu cliente vê primeiro?', idx='1/5')
c2 = card_photo(ens, [('…virou isso.', F(92), GOLD)], label='ESTÚDIO · FUNDO NEUTRO', cy=0.3, bottom='Mesma pessoa. Nenhum estúdio.', idx='2/5')
c3 = card_photo(esc, [('E isso.', F(92), GOLD)], label='ESCRITÓRIO', cx=0.5, cy=0.5, wide=True, bottom='Outro estilo, mesmas selfies.', idx='3/5')
c4 = card_photo(ext, [('E isso também.', F(88), GOLD)], label='EXTERNO', cx=0.5, cy=0.5, wide=True, bottom='Sem agendar, sem sair do escritório.', idx='4/5')
# card 5: 4th style (collage) + CTA
c5 = Image.new('RGB', (W, H), NAVY); d = ImageDraw.Draw(c5)
text_c(d, W / 2, 60, 'Da selfie ao ensaio.', F(76), WHITE)
text_c(d, W / 2, 150, 'Feito com IA a partir das suas selfies.', F(36, 'Medium'), GOLD)
big = cover(up(ens, 2.0), 560, 700, 0.5, 0.25); paste_round(c5, big, (60, 250), r=30)
s1 = cover(up(sel, 1.4), 400, 330, 0.5, 0.3); paste_round(c5, s1, (650, 250), r=26)
s2 = cover(up(esc, 1.6), 400, 170, 0.65, 0.05, zoom=1.35); paste_round(c5, s2, (650, 600), r=22)
s3 = cover(up(ext, 1.6), 400, 170, 0.6, 0.1, zoom=1.35); paste_round(c5, s3, (650, 780), r=22)
tag(d, 678, 528, 'A SELFIE', 24, (0, 0, 0), WHITE); tag(d, 88, 878, 'O ENSAIO', 26, GOLD, INK)
y = 1000
for t in ['✓ Vários estilos', '✓ Sem estúdio, sem fotógrafo', '✓ Pronto para LinkedIn, site e WhatsApp']:
    pass
items = ['Vários estilos', 'Sem estúdio, sem fotógrafo', 'Pronto para LinkedIn, site e WhatsApp']
f = F(34, 'Medium')
for t in items:
    d.ellipse((150, y + 8, 176, y + 34), fill=GOLD); d.text((190, y - 4), t, font=f, fill=WHITE); y += 52
pill(d, W / 2, 1210, 'Envie suas selfies  →  receba seu ensaio', F(36, 'Bold'), GOLD, INK, padx=44, pady=22)
selo(c5, H - 34)
for i, c in enumerate([c1, c2, c3, c4, c5], 1):
    c.save(OUT + f'L02-2_carrossel_card{i}.png')
# grade de revisão
g = Image.new('RGB', (5 * 432 + 40, 540 + 40), (40, 40, 40))
for i, c in enumerate([c1, c2, c3, c4, c5]): g.paste(c.resize((432, 540)), (20 + i * 432, 20))
g.save(OUT + 'L02-2_carrossel_grade.jpg', quality=90)

# ===== 4) GRADE 3x3 (persona P6, 9 estilos) =====
names = [('LinkedIn', 'LinkedIn'), ('Site', 'Site'), ('Forum', 'Fórum'), ('Reuniao', 'Reunião'), ('Retrato', 'Retrato'),
         ('WhatsApp', 'WhatsApp'), ('Cartao', 'Cartão'), ('Escritorio', 'Escritório'), ('Instagram', 'Instagram')]
g4 = Image.new('RGB', (W, H), NAVY); d = ImageDraw.Draw(g4)
text_c(d, W / 2, 56, '1 pessoa. 9 ensaios.', F(84), WHITE)
text_c(d, W / 2, 162, 'Todos a partir de selfies.', F(46, 'SemiBold') if os.path.exists(FD + 'Poppins-SemiBold.ttf') else F(46, 'Medium'), GOLD)
gx, gy, gap = 30, 250, 12
cw = (W - 2 * gx - 2 * gap) // 3; chh = 280
for i, (k, lab) in enumerate(names):
    im = src('p6_' + k)
    x = gx + (i % 3) * (cw + gap); y = gy + (i // 3) * (chh + gap)
    cell = cover(up(im, 1.4), cw, chh, 0.5, 0.35)
    g4.paste(cell, (x, y), rmask((cw, chh), 18))
    tag(d, x + 12, y + chh - 54, lab, 22, (0, 0, 0), WHITE)
y0 = gy + 3 * chh + 2 * gap
pill(d, W / 2, y0 + 80, 'Envie suas selfies  →  receba seu ensaio', F(38, 'Bold'), GOLD, INK, padx=46, pady=22)
selo(g4, H - 44)
g4 = grain(g4, 3, 4); g4.save(OUT + 'L02-4_grade3x3.png')

# ===== 5) PRINT GENÉRICO perfil antes x depois (persona P2) =====
g5 = Image.new('RGB', (W, H), (232, 234, 238)); d = ImageDraw.Draw(g5)
text_c(d, W / 2, 50, 'Mesmo advogado.', F(70), INK)
text_c(d, W / 2, 138, 'Qual perfil você chamaria?', F(56), (176, 128, 28))
selfie = src('p2_selfie'); ensa = src('p2_ensaio')
def profile_card(x, y, w, h, photo, cy, state, label, good, zm=1.0):
    card = Image.new('RGB', (w, h), WHITE); cd = ImageDraw.Draw(card)
    # generic header band (no brand)
    cd.rectangle((0, 0, w, 120), fill=(41, 56, 80) if good else (90, 96, 108))
    # avatar
    av = 200
    a = cover(up(photo, 1.2), av, av, 0.5, cy, zoom=zm)
    m = Image.new('L', (av, av), 0); ImageDraw.Draw(m).ellipse((0, 0, av - 1, av - 1), fill=255)
    cd.ellipse((w / 2 - av / 2 - 8, 120 - av / 2 - 8 + 20, w / 2 + av / 2 + 8, 120 + av / 2 + 8 + 20), fill=WHITE)
    card.paste(a, (int(w / 2 - av / 2), int(120 - av / 2 + 20)), m)
    yy = 120 + av / 2 + 44
    text_c(cd, w / 2, yy, 'Dr. Rafael M.', F(40), INK); yy += 58
    text_c(cd, w / 2, yy, 'Advogado · Direito Empresarial', F(26, 'Regular'), (95, 100, 112)); yy += 44
    text_c(cd, w / 2, yy, 'online', F(24, 'Medium'), (40, 160, 90)); yy += 50
    # fake chat bubble from client (illustrative)
    cd.rounded_rectangle((30, yy, w - 30, yy + 120), 18, fill=(240, 242, 246))
    cd.text((52, yy + 16), 'Cliente:', font=F(22, 'Bold'), fill=(95, 100, 112))
    cd.text((52, yy + 50), state, font=F(26, 'Medium'), fill=INK)
    paste_round(g5, card, (x, y), r=30)
    tag(d, x + 20, y + 20, label, 26, (0, 0, 0) if not good else GOLD, WHITE if not good else INK)
cw5, ch5 = 470, 600
profile_card(50, 260, cw5, ch5, selfie, 0.6, '"É você mesmo, doutor?"', 'ANTES · SELFIE', False, zm=1.1)
profile_card(W - 50 - cw5, 260, cw5, ch5, ensa, 0.16, '"Pode me atender hoje?"', 'DEPOIS · ENSAIO', True, zm=2.3)
text_c(d, W / 2, 920, 'O cliente vê sua foto antes de ouvir sua voz.', F(34, 'Medium'), INK)
text_c(d, W / 2, 975, 'Ensaio profissional feito por IA a partir das suas selfies.', F(28, 'Regular'), (80, 84, 96))
pill(d, W / 2, 1110, 'Envie suas selfies  →  receba seu ensaio', F(38, 'Bold'), NAVY, WHITE, padx=46, pady=22)
text_c(d, W / 2, 1196, 'Tela genérica ilustrativa · conversa fictícia', F(22, 'Regular'), (110, 114, 126))
selo(g5, H - 60, dark=True)
g5.save(OUT + 'L02-5_print-perfil.png')
print('ok')
