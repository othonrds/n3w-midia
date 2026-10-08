"""Reels do Reflex modelados nos virais de 'ADHD focus test' (TikTok).
uso: python3 reels.py MODO SAIDA.mp4   (MODO = mib | after | asmr)
Precisa no diretorio: raw.mp4 (gravacao bruta do jogo 1080x2338), a.mp4 (VID-A v2 720x1280),
som.py ao lado, edge-tts instalado, fonte Montserrat ExtraBold.
"""
import sys, os, math, subprocess, json, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

MODE, OUT = sys.argv[1], sys.argv[2]
W, H, FPS = 720, 1280, 30
HERE = os.path.dirname(os.path.abspath(__file__))
FB = '/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf'
if not os.path.exists(FB):
    FB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
MINT, PINK, YEL, WHITE = (62, 240, 195), (255, 92, 122), (255, 216, 77), (255, 255, 255)

# ---------------- roteiros ----------------
# seg: (tipo, duracao, extra)   linhas: (t, texto_tela, fala)
if MODE == 'mib':
    HEAD = ('ADHD FOCUS TEST', 'STARE AT THE GREEN DOT', MINT)
    SEGS = [('mib', 14.5, None), ('game', 3.5, 9.6), ('end', 2.6, None)]
    LINES = [(0.2, 'Stare at the green dot.', 'Stare at the green dot.'),
             (2.6, "Don't look away.", "Don't look away."),
             (5.0, 'Keep staring...', 'Keep staring.'),
             (8.4, 'Did the yellow dots vanish?', 'Did the yellow dots just vanish?'),
             (11.6, 'Your brain hid them from you.', 'Your brain hid them from you.'),
             (14.6, 'Now try the ADHD focus game.', 'Now try the ADHD focus game.'),
             (18.1, None, 'Free. Sixty seconds.')]
    VOICE, RATE, CALM, FLIPS = 'en-US-AndrewNeural', '-4%', True, [14.5]
elif MODE == 'after':
    HEAD = ('TRY NOT TO LOOK AWAY', 'STARE AT THE BLACK DOT', PINK)
    SEGS = [('stare', 10.0, None), ('blank', 5.5, None), ('game', 5.0, 9.4), ('end', 2.6, None)]
    LINES = [(0.2, 'Stare at the black dot. 10 seconds.', 'Stare at the black dot for ten seconds.'),
             (3.8, "Don't look away.", "Don't look away."),
             (7.0, 'Almost there...', 'Almost there.'),
             (10.1, 'Now... what color do you see?', 'Now. What color do you see?'),
             (13.4, 'GREEN. Green means GO.', 'Green. Green means go.'),
             (15.6, 'Tap the green. Hold back on the red.', 'In the ADHD focus game, you tap the green, and hold back on the red.'),
             (20.7, None, 'Play free.')]
    VOICE, RATE, CALM, FLIPS = 'en-US-AndrewNeural', '-2%', True, [10.0]
elif MODE == 'asmr':
    HEAD = ('ADHD FOCUS TEST', 'ASMR EDITION', MINT)
    SEGS = [('game', 15.5, 16.0), ('end', 2.6, None)]
    LINES = [(0.2, "Let's see if this works on you...", "Let's see if this works on you."),
             (2.4, 'Only tap the green ones.', 'Only tap the green ones.'),
             (5.0, "Don't touch the red.", "Don't touch the red."),
             (9.0, 'Good... keep going.', 'Good. Keep going.'),
             (13.3, 'Now the rule flips.', 'Now. The rule flips.'),
             (15.0, 'Did you catch it?', 'Did you catch it?'),
             (16.4, None, 'Play free.')]
    VOICE, RATE, CALM, FLIPS = 'en-US-AvaNeural', '-14%', True, [14.5]
elif MODE in ('mib2', 'after2'):
    base = MODE[:-1]
    if base == 'mib':
        HEAD = ('ADHD FOCUS TEST', 'STARE AT THE GREEN DOT', MINT)
        SEGS = [('mib', 13.5, None), ('game2', 5.0, 'flip-3.2'), ('end', 2.6, None)]
        LINES = [(0.2, 'Stare at the green dot.', 'Stare at the green dot.'),
                 (2.6, "Don't look away.", "Don't look away."),
                 (5.0, 'Keep staring...', 'Keep staring.'),
                 (8.0, 'Did the yellow dots vanish?', 'Did the yellow dots just vanish?'),
                 (11.0, 'Your brain hid them from you.', 'Your brain hid them from you.'),
                 (13.6, 'Now try this one. The rule flips.', 'Now try this one. Watch, the rule flips.'),
                 (18.6, None, 'Free. Sixty seconds.')]
        FLIPS = [13.5, 16.7]
    else:
        HEAD = ('TRY NOT TO LOOK AWAY', 'STARE AT THE BLACK DOT', PINK)
        SEGS = [('stare', 10.0, None), ('blank', 5.0, None), ('game2', 5.5, 'flip-3.5'), ('end', 2.6, None)]
        LINES = [(0.2, 'Stare at the black dot. 10 seconds.', 'Stare at the black dot for ten seconds.'),
                 (3.8, "Don't look away.", "Don't look away."),
                 (7.0, 'Almost there...', 'Almost there.'),
                 (10.1, 'Now... what color do you see?', 'Now. What color do you see?'),
                 (13.2, 'GREEN. Green means GO.', 'Green. Green means go.'),
                 (15.1, 'Tap the green... until the rule flips.', 'In the ADHD focus game, you tap the green, until the rule flips.'),
                 (20.7, None, 'Play free.')]
        FLIPS = [10.0, 18.5]
    VOICE, RATE, CALM = 'en-US-AndrewNeural', '-3%', True
elif MODE == 'tests':
    HEAD = ('4 FOCUS TESTS', 'HOW MANY CAN YOU PASS?', YEL)
    SEGS = [('stroop', 4.8, None), ('odd', 4.6, None), ('count', 4.4, None), ('game2', 6.2, 'flip-3.6'), ('end', 2.6, None)]
    LINES = [(0.1, 'TEST 1: Say the COLOR, not the word.', 'Test one. Say the color, not the word.'),
             (4.9, 'TEST 2: Find the Q.', 'Test two. Find the Q.'),
             (9.5, 'TEST 3: How many GREEN dots?', 'Test three. How many green dots?'),
             (12.6, 'Seven.', 'Seven.'),
             (13.9, 'TEST 4: Tap green. The rule will flip.', 'Test four. The ADHD focus game. Tap the green, the rule will flip.'),
             (20.2, None, 'Play free.')]
    VOICE, RATE, CALM, FLIPS = 'en-US-AndrewNeural', '+4%', False, [4.8, 9.4, 13.8, 17.6]
else:
    sys.exit('modo?')
TOTAL = sum(s[1] for s in SEGS)

# ---------------- voz ----------------
def tts(text, path):
    subprocess.run(['edge-tts', '--voice', VOICE, '--rate=' + RATE, '--text', text,
                    '--write-media', path + '.mp3'], check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path + '.mp3', '-ar', '44100', '-ac', '1', path],
                   check=True)
    w = wave.open(path); x = np.frombuffer(w.readframes(w.getnframes()), '<i2') / 32767
    return x
SR = 44100
voice = np.zeros(int(TOTAL * SR) + SR)
for i, (t, _, fala) in enumerate(LINES):
    if not fala: continue
    x = tts(fala, f'v{i}.wav')
    a = int(t * SR); voice[a:a + len(x)] += x[: len(voice) - a]
voice = voice[: int(TOTAL * SR)]

# ---------------- musica ----------------
subprocess.run(['python3', os.path.join(HERE, 'som.py'), str(TOTAL), 'mus.wav', '--bpm', '96' if CALM else '124',
                '--flips', ','.join(str(f) for f in FLIPS), '--end', str(TOTAL - 2.5)] + (['--calm'] if CALM else []),
               check=True, capture_output=True)
w = wave.open('mus.wav'); mus = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2) / 32767
mus = mus[: len(voice)]
# ducking da musica quando ha voz
envv = np.convolve(np.abs(voice), np.ones(4410) / 4410, 'same')
duck = 1 - 0.55 * np.clip(envv / 0.05, 0, 1)
mix = mus * (0.55 * duck)[:, None] + voice[:, None] * 1.0
mix = mix / max(1e-6, np.max(np.abs(mix))) * 0.9
with wave.open('mix.wav', 'wb') as o:
    o.setnchannels(2); o.setsampwidth(2); o.setframerate(SR)
    o.writeframes((mix * 32767).astype('<i2').tobytes())

# ---------------- imagem ----------------
def font(s): return ImageFont.truetype(FB, s)
def fit(d, text, size, maxw):
    while size > 20:
        f = font(size)
        if d.textlength(text, font=f) <= maxw: return f
        size -= 2
    return font(size)

def header(img):
    d = ImageDraw.Draw(img)
    d.rectangle([0, 92, W, 264], fill=(0, 0, 0))
    for i, (t, col) in enumerate([(HEAD[0], WHITE), (HEAD[1], HEAD[2])]):
        f = fit(d, t, 70 if i == 0 else 58, 660)
        tw = d.textlength(t, font=f)
        d.text(((W - tw) / 2, 104 + i * 80), t, font=f, fill=col)

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ''
    for wd in words:
        nxt = (cur + ' ' + wd).strip()
        if d.textlength(nxt, font=f) <= maxw: cur = nxt
        else: lines.append(cur); cur = wd
    if cur: lines.append(cur)
    return lines

def caption(img, text, y=920):
    if not text: return
    d = ImageDraw.Draw(img); f = font(46)
    lines = wrap(d, text, f, 620)
    for i, ln in enumerate(lines):
        tw = d.textlength(ln, font=f); x = (W - tw) / 2; yy = y + i * 62
        d.rounded_rectangle([x - 16, yy - 8, x + tw + 16, yy + 56], 14, fill=(255, 255, 255))
        d.text((x, yy), ln, font=f, fill=(10, 14, 34))

def footer(img):
    d = ImageDraw.Draw(img); f = font(20); t = 'For fun. Not a medical test or diagnosis.'
    tw = d.textlength(t, font=f); d.text(((W - tw) / 2, H - 70), t, font=f, fill=(170, 176, 200))

def cap_at(t):
    cur = None
    for (lt, txt, _) in LINES:
        if t >= lt: cur = txt
    return cur

# ---- ilusao: motion-induced blindness ----
CX, CY = W // 2, 640
def frame_mib(t):
    img = Image.new('RGB', (W, H), (0, 0, 0)); d = ImageDraw.Draw(img)
    ang = t * 0.9; step = 54; R = 300
    ca, sa = math.cos(ang), math.sin(ang)
    for gx in range(-6, 7):
        for gy in range(-6, 7):
            px, py = gx * step, gy * step
            if px * px + py * py > R * R: continue
            x = CX + px * ca - py * sa; y = CY + px * sa + py * ca
            for dx, dy in ((1, 0), (0, 1)):
                ex, ey = (dx * ca - dy * sa) * 11, (dx * sa + dy * ca) * 11
                d.line([x - ex, y - ey, x + ex, y + ey], fill=(70, 110, 255), width=4)
    for k in range(3):
        a = -math.pi / 2 + k * 2 * math.pi / 3
        x, y = CX + 170 * math.cos(a), CY + 170 * math.sin(a)
        d.ellipse([x - 13, y - 13, x + 13, y + 13], fill=YEL)
    g = MINT if int(t * 4) % 2 == 0 else (30, 150, 120)
    d.ellipse([CX - 11, CY - 11, CX + 11, CY + 11], fill=g)
    return img

# ---- ilusao: pos-imagem (afterimage) ----
BG = (232, 235, 242)
def frame_stare(t):
    img = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(img)
    d.ellipse([CX - 230, CY - 230, CX + 230, CY + 230], fill=(235, 30, 60))
    d.ellipse([CX - 9, CY - 9, CX + 9, CY + 9], fill=(0, 0, 0))
    n = max(0, 10 - int(t)); f = font(64); s = str(n)
    d.text((CX - d.textlength(s, font=f) / 2, CY + 250), s, font=f, fill=(10, 14, 34))
    return img
def frame_blank(t):
    img = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(img)
    d.ellipse([CX - 9, CY - 9, CX + 9, CY + 9], fill=(0, 0, 0))
    return img


# ---- testes de foco (originais, genericos) ----
import random as _r
COLS = {'RED': (255, 70, 90), 'GREEN': (62, 230, 150), 'BLUE': (80, 140, 255), 'YELLOW': (255, 214, 60)}
_r.seed(11)
STROOP = []
for i in range(9):
    w = _r.choice(list(COLS)); c = _r.choice([k for k in COLS if k != w]); STROOP.append((w, c))
def bar(d, frac, col):
    d.rounded_rectangle([110, 1150, 610, 1166], 8, fill=(40, 46, 70))
    d.rounded_rectangle([110, 1150, 110 + int(500 * max(0, frac)), 1166], 8, fill=col)
def label(img, txt):
    d = ImageDraw.Draw(img); f = font(30); tw = d.textlength(txt, font=f)
    d.rounded_rectangle([W - tw - 52, 284, W - 20, 330], 12, fill=YEL); d.text((W - tw - 36, 289), txt, font=f, fill=(10, 14, 34))
def frame_stroop(t):
    img = Image.new('RGB', (W, H), (12, 16, 36)); d = ImageDraw.Draw(img); f = font(70)
    n = min(9, 1 + int(t / 0.35))
    for i in range(n):
        w, c = STROOP[i]; x = 70 + (i % 3) * 200; y = 400 + (i // 3) * 140
        tw = d.textlength(w, font=fit(d, w, 70, 190)); d.text((x + (190 - tw) / 2, y), w, font=fit(d, w, 70, 190), fill=COLS[c])
    bar(d, 1 - t / 4.8, YEL); label(img, 'TEST 1/4'); return img
_r.seed(5); ODD = (_r.randrange(9), _r.randrange(10))
def frame_odd(t):
    img = Image.new('RGB', (W, H), (12, 16, 36)); d = ImageDraw.Draw(img); f = font(54)
    for gx in range(9):
        for gy in range(10):
            ch = 'Q' if (gx, gy) == ODD else 'O'; x = 52 + gx * 70; y = 350 + gy * 66
            d.text((x, y), ch, font=f, fill=(230, 234, 255))
    if t > 3.6:
        x = 52 + ODD[0] * 70 + 20; y = 350 + ODD[1] * 66 + 30
        d.ellipse([x - 40, y - 40, x + 40, y + 40], outline=YEL, width=7)
    bar(d, 1 - t / 3.6, YEL); label(img, 'TEST 2/4'); return img
_r.seed(9); DOTS = [(_r.randint(90, 630), _r.randint(380, 1050), i < 7) for i in range(16)]
def frame_count(t):
    img = Image.new('RGB', (W, H), (12, 16, 36)); d = ImageDraw.Draw(img)
    if t < 1.3:
        for x, y, g in DOTS:
            d.ellipse([x - 30, y - 30, x + 30, y + 30], fill=MINT if g else PINK)
    elif t < 3.0:
        f = font(160); d.text((W / 2 - d.textlength('?', font=f) / 2, 560), '?', font=f, fill=WHITE)
    else:
        f = font(200); d.text((W / 2 - d.textlength('7', font=f) / 2, 520), '7', font=f, fill=MINT)
    label(img, 'TEST 3/4'); return img

def find_flip(path):
    p = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vf', 'fps=4,scale=72:128,format=rgb24', '-f', 'rawvideo', '-'],
                       capture_output=True).stdout
    fr = 72 * 128 * 3; n = len(p) // fr
    for i in range(n):
        a = np.frombuffer(p[i * fr:(i + 1) * fr], np.uint8).reshape(-1, 3).astype(int)
        if i / 4 > 8 and (a.max(1) - a.min(1)).mean() < 8: return i / 4
    return 28.0
def zoom(img, z):
    if z <= 1.001: return img
    w2, h2 = int(W / z), int(H / z); x0, y0 = (W - w2) // 2, (H - h2) // 2
    return img.crop((x0, y0, x0 + w2, y0 + h2)).resize((W, H), Image.BILINEAR)

# ---- video do jogo / cartao final ----
def reader(path, start, dur, vf):
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-ss', str(start), '-t', str(dur), '-i', path,
                          '-vf', vf + f',fps={FPS},format=rgb24', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        yield Image.frombytes('RGB', (W, H), b)

enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-i', 'mix.wav', '-c:v', 'libx264', '-preset', 'medium',
                        '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest',
                        '-movflags', '+faststart', OUT], stdin=subprocess.PIPE)
t0 = 0.0
for kind, dur, extra in SEGS:
    nfr = int(round(dur * FPS))
    if kind in ('mib', 'stare', 'blank', 'stroop', 'odd', 'count'):
        fn = {'mib': frame_mib, 'stare': frame_stare, 'blank': frame_blank,
              'stroop': frame_stroop, 'odd': frame_odd, 'count': frame_count}[kind]
        frames = (fn(i / FPS) for i in range(nfr))
    elif kind == 'game2':
        st = extra
        if isinstance(st, str) and st.startswith('flip'):
            st = max(0.0, find_flip('gp3.mp4') + float(st[4:]))
        flip_rel = find_flip('gp3.mp4') - st
        def gen2(st=st, fr_=flip_rel):
            for k, im in enumerate(reader('gp3.mp4', st, dur, 'scale=720:1280')):
                tt = k / FPS; z = 1.0 + 0.06 * tt / max(dur, 0.1)
                if abs(tt - fr_) < 0.35: z += 0.12 * (1 - abs(tt - fr_) / 0.35)
                yield zoom(im, z)
        frames = gen2()
    elif kind == 'game':
        frames = reader('raw.mp4', extra, dur, 'crop=1080:1920:0:209,scale=720:1280')
    else:
        frames = reader('a.mp4', 18.2, dur, 'scale=720:1280')
    for i, img in enumerate(frames):
        if i >= nfr: break
        t = t0 + i / FPS
        if kind != 'end':
            header(img)
            caption(img, cap_at(t), 900 if kind not in ('game', 'game2') else 980)
            footer(img)
        enc.stdin.write(img.tobytes())
    t0 += dur
enc.stdin.close(); enc.wait()
print('ok', OUT, TOTAL)
