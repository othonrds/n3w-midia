# FOTOSADV V08 (3 hooks + corpo comum) e V09 (gravação de tela / depoimento). 100% código, 0 crédito.
# Fotos: estáticos limpos já aprovados (H01 v2, L02-2 cards, L02-4 grade, L02-5). Sem vídeo de IA = sem distorção.
import os, sys, subprocess, math, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(D, 'out'); os.makedirs(OUT, exist_ok=True)
W, H, FPS = 1080, 1920, 30
FP = '/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(w, s): return ImageFont.truetype(FP + w + '.ttf', s)
GOLD = (232, 186, 72); BG = (14, 17, 30); WHITE = (255, 255, 255); GREY = (170, 178, 195)

def L(n): return Image.open(os.path.join(D, n)).convert('RGB')
H01 = L('FOTOSADV_antes-depois_H01_v2_r3.png')
C = {i: L(f'L02-2_carrossel_card{i}.png') for i in (1, 2, 3, 4)}
GRADE = L('L02-4_grade_v3.png'); RAF = L('L02-5_perfil-antes-depois_v3.png')
IMG = {
    'h01_antes': H01.crop((60, 290, 532, 1010)), 'h01_depois': H01.crop((548, 290, 1020, 1010)),
    'selfie': C[1].crop((0, 190, 940, 1060)), 'escritorio': C[2].crop((0, 40, 940, 940)),
    'reuniao': C[3].crop((0, 40, 940, 940)), 'externo': C[4].crop((0, 40, 940, 940)),
    'grade': GRADE.crop((30, 266, 1050, 1164)),
    'raf_antes': RAF.crop((40, 300, 520, 670)), 'raf_depois': RAF.crop((560, 300, 1040, 670)),
}
TILES = []  # 9 ensaios da grade, recortados um a um
gx, gy, gw, gh = 30, 266, 340, 300
for r in range(3):
    for c in range(3):
        TILES.append(GRADE.crop((gx + c * gw + 6, gy + r * gh + 6, gx + (c + 1) * gw - 6, gy + (r + 1) * gh - 70)))

def ease(t): return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, t)))
def cover(im, w, h, zoom=1.0, cx=0.5, cy=0.4):
    s = max(w / im.width, h / im.height) * zoom
    nw, nh = int(im.width * s), int(im.height * s)
    r = im.resize((nw, nh), Image.LANCZOS)
    x = int((nw - w) * cx); y = int((nh - h) * cy)
    return r.crop((x, y, x + w, y + h))
_bgc = {}
def blurbg(key):
    if key not in _bgc:
        b = cover(IMG[key], W, H).filter(ImageFilter.GaussianBlur(40))
        _bgc[key] = Image.blend(b, Image.new('RGB', (W, H), BG), 0.55)
    return _bgc[key].copy()
def ctext(d, y, t, fo, fill, stroke=0):
    d.text(((W - d.textlength(t, font=fo)) / 2, y), t, font=fo, fill=fill, stroke_width=stroke, stroke_fill=(0, 0, 0))
def wrap_lines(d, t, fo, maxw):
    out, cur = [], ''
    for wd in t.split():
        s = (cur + ' ' + wd).strip()
        if d.textlength(s, font=fo) <= maxw: cur = s
        else: out.append(cur); cur = wd
    out.append(cur); return out
def caption(img, y, t, size=74, color=WHITE, hl=None, box=True):
    d = ImageDraw.Draw(img); fo = f('Bold', size)
    lines = wrap_lines(d, t, fo, W - 140); lh = int(size * 1.22)
    if box:
        wmax = max(d.textlength(l, font=fo) for l in lines)
        ov = Image.new('RGBA', img.size, (0, 0, 0, 0)); od = ImageDraw.Draw(ov)
        od.rounded_rectangle(((W - wmax) / 2 - 36, y - 22, (W + wmax) / 2 + 36, y + lh * len(lines) + 10), 28, fill=(0, 0, 0, 150))
        img.paste(Image.alpha_composite(img.convert('RGBA'), ov).convert('RGB'))
        d = ImageDraw.Draw(img)
    for i, l in enumerate(lines):
        x = (W - d.textlength(l, font=fo)) / 2
        for wd in l.split(' '):
            col = GOLD if hl and wd.strip('.,!?…') in hl else color
            d.text((x, y + i * lh), wd, font=fo, fill=col, stroke_width=3, stroke_fill=(0, 0, 0)); x += d.textlength(wd + ' ', font=fo)
    return img
def card(img, key, t, box=(60, 380, 1020, 1420), zoom0=1.0, zoom1=1.08, radius=34, src=None):
    x0, y0, x1, y1 = box; w, h = x1 - x0, y1 - y0
    ph = cover(src if src is not None else IMG[key], w, h, zoom0 + (zoom1 - zoom0) * t)
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w, h), radius, fill=255)
    sh = Image.new('RGBA', img.size, (0, 0, 0, 0)); ImageDraw.Draw(sh).rounded_rectangle((x0 + 8, y0 + 16, x1 + 8, y1 + 16), radius, fill=(0, 0, 0, 120))
    img.paste(Image.alpha_composite(img.convert('RGBA'), sh.filter(ImageFilter.GaussianBlur(14))).convert('RGB'))
    img.paste(ph, (x0, y0), m); return img
def tag(img, x, y, t, fill=BG, fg=WHITE, size=30):
    d = ImageDraw.Draw(img); fo = f('Bold', size); tw = d.textlength(t, font=fo)
    d.rounded_rectangle((x, y, x + tw + 36, y + size + 22), 12, fill=fill); d.text((x + 18, y + 8), t, font=fo, fill=fg); return img
def ia_note(img):
    d = ImageDraw.Draw(img); fo = f('Medium', 24); t = 'Imagens ilustrativas geradas por IA'
    tw = d.textlength(t, font=fo); d.rounded_rectangle(((W - tw) / 2 - 18, 1852, (W + tw) / 2 + 18, 1894), 21, fill=(255, 255, 255)); d.text(((W - tw) / 2, 1857), t, font=fo, fill=BG)
    return img

# ---------- cenas (cada uma: duração em s, função(t_local 0..1, segundos) -> Image)
def sc_hook_A(t, s):  # selfie -> sócio (corte seco em 1,1 s)
    k = 'h01_antes' if s < 1.1 else 'h01_depois'
    im = blurbg(k); card(im, k, t, box=(90, 330, 990, 1500), zoom0=1.04 if s < 1.1 else 1.12, zoom1=1.0)
    tag(im, 120, 1410, 'ANTES · SELFIE' if s < 1.1 else 'DEPOIS · ENSAIO', fill=WHITE if s < 1.1 else GOLD, fg=BG)
    caption(im, 130, 'Mandei 1 selfie do celular…' if s < 1.1 else '…e virei foto de sócio.', 72, hl=['sócio'])
    return ia_note(im)
def sc_hook_B(t, s):  # cliente julga
    k = 'raf_antes' if s < 1.4 else 'raf_depois'
    im = blurbg(k); card(im, k, t, box=(90, 420, 990, 1420), zoom0=1.0, zoom1=1.1, src=IMG[k])
    if s < 1.4: caption(im, 130, 'Seu cliente vê esta foto antes de ouvir a sua voz.', 66, hl=['esta', 'foto'])
    else: caption(im, 160, 'Ou esta?', 96, hl=['esta?'])
    return ia_note(im)
def sc_hook_C(t, s):  # preço choque
    im = blurbg('grade'); d = ImageDraw.Draw(im)
    z = 0.85 + 0.15 * ease(s / 0.6)
    fo = f('Bold', int(230 * z)); ctext(d, 520, 'R$ 5,93', fo, GOLD, 4)
    caption(im, 860, 'por foto de estúdio.', 74, box=False)
    if s > 1.0: caption(im, 1060, 'Sem fotógrafo. Sem sair do escritório.', 58, color=GREY, box=False)
    if s > 1.6: card(im, 'grade', 0, box=(240, 1250, 840, 1780), radius=24)
    return ia_note(im)
def sc_selfie(t, s):
    im = blurbg('selfie'); card(im, 'selfie', t, box=(70, 380, 1010, 1420), zoom0=1.0, zoom1=1.06)
    tag(im, 100, 1330, 'A SELFIE', fill=WHITE, fg=BG); caption(im, 150, 'Ela mandou uma selfie assim…', 70)
    return ia_note(im)
SEQ = [('escritorio', '…e recebeu isso.', 'ESCRITÓRIO'), ('reuniao', 'E isso.', 'SALA DE REUNIÃO'), ('externo', 'E isso também.', 'EXTERNO')]
def sc_seq(t, s):
    i = min(2, int(s / 0.85)); k, txt, lab = SEQ[i]; tl = (s - i * 0.85) / 0.85
    im = blurbg(k); card(im, k, tl, box=(70, 380, 1010, 1420), zoom0=1.1, zoom1=1.0)
    tag(im, 100, 1330, lab, fill=GOLD, fg=BG); caption(im, 150, txt, 80, hl=['isso.', 'também.'])
    return ia_note(im)
def sc_grade(t, s):
    im = blurbg('grade'); card(im, 'grade', t, box=(40, 420, 1040, 1300), zoom0=1.25, zoom1=1.0, radius=24)
    caption(im, 150, '1 selfie. 9 cenários. A mesma pessoa.', 70, hl=['9', 'cenários.'])
    caption(im, 1380, 'LinkedIn · site · WhatsApp · Instagram', 46, color=GREY, box=False)
    return ia_note(im)
def sc_oferta(t, s):
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im)
    for j, k in enumerate(('escritorio', 'reuniao', 'externo', 'h01_depois')):
        bx = 90 + (j % 2) * 460; by = 520 + (j // 2) * 470
        card(im, k, t, box=(bx, by, bx + 440, by + 450), zoom0=1.0, zoom1=1.05, radius=22)
    d = ImageDraw.Draw(im)
    ctext(d, 150, '15 fotos de estúdio', f('Bold', 80), WHITE); ctext(d, 260, 'por R$ 89', f('Bold', 120), GOLD)
    ctext(d, 1460, 'ou 4 fotos por R$ 49,90', f('Medium', 50), WHITE)
    ctext(d, 1530, 'Feitas a partir das suas selfies', f('Regular', 36), GREY)
    p = 1 + 0.04 * math.sin(s * 6); fb = f('Bold', int(50 * p)); tt = 'Envie suas selfies  ·  Saiba mais'; tw = d.textlength(tt, font=fb)
    d.rounded_rectangle(((W - tw) / 2 - 44, 1640, (W + tw) / 2 + 44, 1640 + 50 * p + 50), 50, fill=GOLD); ctext(d, 1662, tt, fb, BG)
    return ia_note(im)

CORPO = [(2.2, sc_selfie), (2.55, sc_seq), (2.4, sc_grade), (3.4, sc_oferta)]
VIDS = {'V08A_selfie-socio': [(2.3, sc_hook_A)] + CORPO, 'V08B_cliente-julga': [(2.6, sc_hook_B)] + CORPO, 'V08C_preco-choque': [(2.4, sc_hook_C)] + CORPO}

# ---------- V09: gravação de tela / depoimento
def browser(img, y0, inner, url='viralizeshop.com/minhas-fotos', h=820):
    x0, x1 = 40, 1040; d = ImageDraw.Draw(img)
    d.rounded_rectangle((x0, y0, x1, y0 + h), 18, fill=(236, 238, 242))
    d.rounded_rectangle((x0, y0, x1, y0 + 64), 18, fill=(214, 218, 225)); d.rectangle((x0, y0 + 40, x1, y0 + 64), fill=(214, 218, 225))
    for i, c in enumerate(((255, 95, 87), (255, 189, 46), (40, 200, 64))): d.ellipse((x0 + 22 + i * 30, y0 + 22, x0 + 40 + i * 30, y0 + 40), fill=c)
    d.rounded_rectangle((x0 + 130, y0 + 14, x1 - 30, y0 + 50), 18, fill=WHITE); d.text((x0 + 152, y0 + 18), url, font=f('Regular', 24), fill=(80, 86, 100))
    img.paste(inner, (x0 + 10, y0 + 74)); return img
def cursor(img, x, y, click=False):
    d = ImageDraw.Draw(img)
    if click: d.ellipse((x - 34, y - 34, x + 34, y + 34), outline=GOLD, width=5)
    pts = [(x, y), (x, y + 44), (x + 11, y + 33), (x + 20, y + 52), (x + 28, y + 48), (x + 19, y + 30), (x + 34, y + 30)]
    d.polygon(pts, fill=BG, outline=WHITE); d.line(pts + [pts[0]], fill=WHITE, width=3); return img
def gallery(sel=None):
    g = Image.new('RGB', (980, 736), (250, 250, 252)); d = ImageDraw.Draw(g)
    d.text((24, 16), 'Seu ensaio está pronto  ·  15 fotos', font=f('Bold', 30), fill=BG)
    d.text((24, 58), 'Pedido entregue · baixe em alta resolução', font=f('Regular', 22), fill=(110, 116, 130))
    for i, tl in enumerate(TILES[:8]):
        c, r = i % 4, i // 4; bx, by = 24 + c * 238, 110 + r * 300
        g.paste(cover(tl, 222, 284), (bx, by))
        if sel == i: d.rectangle((bx - 4, by - 4, bx + 226, by + 288), outline=GOLD, width=6)
    return g
def lightbox(key, t):
    g = Image.new('RGB', (980, 736), (20, 22, 28)); ph = cover(IMG[key], 560, 700, 1.0 + 0.04 * t)
    g.paste(ph, (210, 18)); d = ImageDraw.Draw(g); d.text((900, 340), '›', font=f('Bold', 80), fill=WHITE); d.text((40, 340), '‹', font=f('Bold', 80), fill=WHITE)
    d.text((24, 690), 'Baixar', font=f('Medium', 24), fill=GOLD); return g
def v09_base(): return Image.new('RGB', (W, H), (18, 20, 28))
def v9_1(t, s):  # hook: a galeria chegou
    im = v09_base(); browser(im, 470, gallery()); cursor(im, 700 - 200 * ease(t), 1200 - 150 * ease(t))
    caption(im, 120, 'POV: chegaram as minhas fotos de advogada', 70, hl=['minhas', 'fotos'])
    caption(im, 1360, 'e eu não fui a nenhum estúdio', 56, color=GREY, box=False); return im
def v9_2(t, s):  # só mandou selfies
    im = v09_base(); browser(im, 470, gallery(sel=0 if s > 1.6 else None)); cursor(im, 160 + 80 * ease(t), 650 + 50 * ease(t), click=s > 1.6)
    caption(im, 120, 'eu só mandei umas selfies do celular…', 70, hl=['selfies'])
    card(im, 'selfie', 0, box=(760, 1340, 1000, 1620), radius=18); tag(im, 776, 1560, 'MINHA SELFIE', fill=WHITE, fg=BG, size=22); return im
LB = [('escritorio', 'olha isso. ESCRITÓRIO.'), ('reuniao', 'sala de reunião…'), ('externo', 'até foto externa.')]
def v9_3(t, s):
    i = min(2, int(s / 1.3)); k, txt = LB[i]; tl = (s - i * 1.3) / 1.3
    im = v09_base(); browser(im, 470, lightbox(k, tl)); cursor(im, 960, 880, click=tl < 0.15 and i > 0)
    caption(im, 120, txt, 78, hl=['ESCRITÓRIO.', 'externa.']); return im
def v9_4(t, s):
    im = v09_base(); browser(im, 470, gallery()); d = ImageDraw.Draw(im)
    caption(im, 100, '15 fotos por R$ 89. Nunca mais fotógrafo.', 66, hl=['R$', '89.'])
    ctext(d, 1340, 'ou 4 fotos por R$ 49,90', f('Medium', 48), WHITE)
    p = 1 + 0.04 * math.sin(s * 6); fb = f('Bold', int(48 * p)); tt = 'Envie suas selfies  ·  Saiba mais'; tw = d.textlength(tt, font=fb)
    d.rounded_rectangle(((W - tw) / 2 - 44, 1460, (W + tw) / 2 + 44, 1460 + 48 * p + 50), 50, fill=GOLD); ctext(d, 1482, tt, fb, BG)
    return ia_note(im)
VIDS['V09_tela-depoimento'] = [(2.6, v9_1), (2.8, v9_2), (3.9, v9_3), (3.6, v9_4)]

# ---------- trilha: pad + batida leve + whoosh nos cortes (sintetizada, livre de direitos)
SR = 44100
def trilha(dur, cortes, path):
    n = int(dur * SR); tt = np.arange(n) / SR; out = np.zeros(n)
    bpm = 100; beat = 60 / bpm
    chords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]  # Am F C G
    for ci in range(int(dur / (beat * 4)) + 1):
        a = int(ci * beat * 4 * SR); b = min(n, int((ci + 1) * beat * 4 * SR))
        if a >= n: break
        seg = tt[a:b] - tt[a]; env = np.minimum(1, seg / 0.3) * np.minimum(1, (beat * 4 - seg) / 0.3)
        for m in chords[ci % 4]:
            fr = 440 * 2 ** ((m - 69) / 12)
            out[a:b] += 0.06 * env * (np.sin(2 * np.pi * fr * seg) + 0.3 * np.sin(4 * np.pi * fr * seg))
    for k in range(int(dur / beat) + 1):  # kick
        a = int(k * beat * SR); seg = np.arange(int(0.25 * SR)) / SR
        if a + len(seg) > n: break
        out[a:a + len(seg)] += 0.5 * np.exp(-seg * 18) * np.sin(2 * np.pi * (50 + 90 * np.exp(-seg * 30)) * seg)
        h = a + int(beat / 2 * SR); hs = np.arange(int(0.05 * SR))
        if h + len(hs) < n: out[h:h + len(hs)] += 0.05 * np.random.randn(len(hs)) * np.exp(-hs / SR * 80)
    for c in cortes:  # whoosh
        a = int((c - 0.25) * SR); L_ = int(0.4 * SR)
        if a < 0 or a + L_ > n: continue
        noise = np.convolve(np.random.randn(L_), np.ones(30) / 30, mode='same')
        out[a:a + L_] += 0.35 * noise * np.sin(np.linspace(0, np.pi, L_)) ** 2
    fade = np.minimum(1, (n - np.arange(n)) / (0.6 * SR)); out *= fade
    out = out / max(1e-9, np.abs(out).max()) * 0.85
    with wave.open(path, 'w') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype(np.int16).tobytes())

def render(nome, cenas):
    dur = sum(c[0] for c in cenas); cortes = list(np.cumsum([c[0] for c in cenas])[:-1])
    wav = os.path.join(OUT, nome + '.wav'); trilha(dur, cortes, wav)
    mp4 = os.path.join(OUT, nome + '.mp4')
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
                          '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', mp4], stdin=subprocess.PIPE)
    for dt, fn in cenas:
        nf = int(round(dt * FPS))
        for i in range(nf):
            p.stdin.write(fn(i / max(1, nf - 1), i / FPS).tobytes())
    p.stdin.close(); p.wait(); print(nome, round(dur, 1), 's')

alvo = sys.argv[1:] or list(VIDS)
for k in alvo: render(k, VIDS[k])
