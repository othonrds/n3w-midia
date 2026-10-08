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
    SEGS = [('mib', 14.5, None), ('game', 3.5, 13.0), ('end', 2.6, None)]
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
    SEGS = [('stare', 10.0, None), ('blank', 5.5, None), ('game', 5.0, 13.0), ('end', 2.6, None)]
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
    SEGS = [('game', 15.0, 19.0), ('end', 2.6, None)]
    LINES = [(0.2, "Let's see if this works on you...", "Let's see if this works on you."),
             (2.8, 'Only tap the green ones.', 'Only tap the green ones.'),
             (5.6, "Don't touch the red.", "Don't touch the red."),
             (8.0, 'Good... keep going.', 'Good. Keep going.'),
             (11.0, 'Now the rule flips.', 'Now. The rule flips.'),
             (13.4, 'Did you catch it?', 'Did you catch it?'),
             (15.2, None, 'The ADHD focus game. Free.')]
    VOICE, RATE, CALM, FLIPS = 'en-US-AvaNeural', '-14%', True, [11.5]
else:
    sys.exit('modo?')
TOTAL = sum(s[1] for s in SEGS)

# ---------------- voz ----------------
def tts(text, path):
    subprocess.run(['edge-tts', '--voice', VOICE, '--rate', RATE, '--text', text,
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
    if kind in ('mib', 'stare', 'blank'):
        fn = {'mib': frame_mib, 'stare': frame_stare, 'blank': frame_blank}[kind]
        frames = (fn(i / FPS) for i in range(nfr))
    elif kind == 'game':
        frames = reader('raw.mp4', extra, dur, 'crop=1080:1920:0:209,scale=720:1280')
    else:
        frames = reader('a.mp4', 18.2, dur, 'scale=720:1280')
    for i, img in enumerate(frames):
        if i >= nfr: break
        t = t0 + i / FPS
        if kind != 'end':
            header(img)
            caption(img, cap_at(t), 900 if kind != 'game' else 980)
            footer(img)
        enc.stdin.write(img.tobytes())
    t0 += dur
enc.stdin.close(); enc.wait()
print('ok', OUT, TOTAL)
