import os, subprocess, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance, ImageOps

ROOT = '/tmp/claude-0/-home-claude/7be2a25d-8295-5915-b5e5-2e1a220a8c23/scratchpad/criacaoL02'
SRC = ROOT + '/work/src/'
OUT = ROOT + '/out/'
os.makedirs(OUT, exist_ok=True)
FD = '/usr/share/fonts/truetype/google-fonts/'
NAVY = (14, 17, 30); NAVY2 = (24, 29, 48); GOLD = (232, 184, 74); WHITE = (255, 255, 255)
CREAM = (246, 240, 228); RED = (226, 54, 54); GREY = (150, 155, 170); INK = (20, 22, 30)
SELO = 'Imagem ilustrativa · gerada por IA'

_fc = {}
def F(size, w='Bold'):
    k = (size, w)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FD + f'Poppins-{w}.ttf', size)
    return _fc[k]

def src(name):
    return Image.open(SRC + name + '.png').convert('RGB')

def up(im, scale):
    """Lanczos enlargement + mild unsharp (no AI). Personas are AI-generated, never client faces."""
    w, h = im.size
    im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    return im.filter(ImageFilter.UnsharpMask(radius=2, percent=60, threshold=2))

def cover(im, W, H, cx=0.5, cy=0.5, zoom=1.0):
    w, h = im.size
    s = max(W / w, H / h) * zoom
    nw, nh = w * s, h * s
    x0 = max(0.0, (nw - W) * cx); y0 = max(0.0, (nh - H) * cy)
    # crop in source coords then resize (cheaper)
    box = (x0 / s, y0 / s, min(w, (x0 + W) / s), min(h, (y0 + H) / s))
    return im.resize((W, H), Image.LANCZOS, box=box)

def blur_bg(im, W, H, r=40, dark=0.45):
    b = cover(im, W // 4, H // 4).filter(ImageFilter.GaussianBlur(r / 4)).resize((W, H), Image.BILINEAR)
    return ImageEnhance.Brightness(b).enhance(dark)

def rmask(size, r):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=255)
    return m

def paste_round(base, im, xy, r=28, shadow=True, border=None):
    x, y = xy
    if shadow:
        sh = Image.new('RGBA', (im.width + 80, im.height + 80), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((40, 50, 40 + im.width, 50 + im.height), r, fill=(0, 0, 0, 150))
        sh = sh.filter(ImageFilter.GaussianBlur(18))
        base.paste(sh, (x - 40, y - 40), sh)
    if border:
        bw, col = border
        bb = Image.new('RGB', (im.width + 2 * bw, im.height + 2 * bw), col)
        base.paste(bb, (x - bw, y - bw), rmask(bb.size, r + bw))
    base.paste(im, (x, y), rmask(im.size, r))

def tsize(d, text, font):
    b = d.textbbox((0, 0), text, font=font)
    return b[2] - b[0], b[3] - b[1], b

def text_c(d, cx, y, text, font, fill, stroke=0, sfill=(0, 0, 0)):
    w, h, b = tsize(d, text, font)
    d.text((cx - w / 2 - b[0], y - b[1]), text, font=font, fill=fill, stroke_width=stroke, stroke_fill=sfill)
    return h

def lines_c(d, cx, y, lines, gap=10):
    """lines: list of (text, font, fill[, stroke])"""
    for ln in lines:
        t, f, c = ln[:3]; st = ln[3] if len(ln) > 3 else 0
        h = text_c(d, cx, y, t, f, c, stroke=st)
        y += f.size * 1.12 + gap - 0
    return y

def pill(d, cx, cy, text, font, bg, fg, padx=36, pady=18, r=None):
    if '→' in text:
        return pill_arrow(d, cx, cy, text, font, bg, fg, padx, pady)
    w, h, b = tsize(d, text, font)
    x0, y0 = cx - w / 2 - padx, cy - h / 2 - pady
    x1, y1 = cx + w / 2 + padx, cy + h / 2 + pady
    d.rounded_rectangle((x0, y0, x1, y1), r if r is not None else (y1 - y0) / 2, fill=bg)
    d.text((cx - w / 2 - b[0], cy - h / 2 - b[1]), text, font=font, fill=fg)
    return (x0, y0, x1, y1)

def selo(img, y=None, dark=False):
    d = ImageDraw.Draw(img)
    f = F(max(20, img.width // 46), 'Medium')
    W, H = img.size
    yy = y if y is not None else H - 52
    pill(d, W / 2, yy, SELO, f, (255, 255, 255) if not dark else (0, 0, 0), INK if not dark else WHITE, padx=22, pady=9)

def tag(d, x, y, text, size=26, bg=NAVY, fg=WHITE):
    f = F(size, 'Bold')
    w, h, b = tsize(d, text, f)
    d.rounded_rectangle((x, y, x + w + 32, y + h + 22), 12, fill=bg)
    d.text((x + 16 - b[0], y + 11 - b[1]), text, font=f, fill=fg)

def grain(img, amt=6, seed=None):
    rng = np.random.default_rng(seed)
    a = np.asarray(img).astype(np.int16)
    n = rng.integers(-amt, amt + 1, size=a.shape[:2], dtype=np.int16)[..., None]
    return Image.fromarray(np.clip(a + n, 0, 255).astype(np.uint8))

def ease(x):
    x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3

def ease_back(x, s=1.7):
    x = max(0.0, min(1.0, x)) - 1; return 1 + (s + 1) * x ** 3 + s * x ** 2

# ---------------- video ----------------
def render(path_noext, dur, frame_fn, audio_wav, fps=30, W=1080, H=1920):
    raw = path_noext + '_noaudio.mp4'
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps),
                          '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', raw], stdin=subprocess.PIPE)
    n = int(round(dur * fps))
    for i in range(n):
        im = frame_fn(i / fps)
        if im.size != (W, H): im = im.resize((W, H))
        p.stdin.write(im.convert('RGB').tobytes())
    p.stdin.close(); p.wait()
    out = path_noext + '.mp4'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', raw, '-i', audio_wav, '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
                    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-c:a', 'aac', '-b:a', '160k', '-ar', '48000', '-shortest',
                    '-movflags', '+faststart', out], check=True)
    os.remove(raw)
    return out

# ---------------- music (procedural, royalty-free) ----------------
SR = 44100
def _env(n, a=0.002, r=0.2):
    t = np.arange(n) / SR
    return np.minimum(1, t / a) * np.exp(-t / r)

def kick(n=int(0.35 * SR)):
    t = np.arange(n) / SR
    f = 50 + 110 * np.exp(-t * 30)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * 0.9

def clap(n=int(0.25 * SR), seed=1):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    # bandpass-ish via diff
    x = np.diff(np.concatenate([[0], x]))
    return x * _env(n, 0.001, 0.06) * 0.35

def hat(n=int(0.06 * SR), seed=2):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], np.diff(np.concatenate([[0], x]))]))
    return x * _env(n, 0.001, 0.015) * 0.12

def tone(freq, dur, kind='saw', vol=0.15, a=0.01, r=None):
    n = int(dur * SR); t = np.arange(n) / SR
    if kind == 'saw':
        x = 2 * ((t * freq) % 1) - 1
        x = np.convolve(x, np.ones(6) / 6, mode='same')
    elif kind == 'sine':
        x = np.sin(2 * np.pi * freq * t)
    else:
        x = np.sign(np.sin(2 * np.pi * freq * t)) * 0.6
    env = np.minimum(1, t / a) * (np.exp(-t / r) if r else np.minimum(1, (dur - t) / 0.05))
    return x * env * vol

def impact(n=int(1.2 * SR), seed=3):
    rng = np.random.default_rng(seed)
    t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * (40 + 60 * np.exp(-t * 8)) * t) * np.exp(-t * 3) * 0.9
    nz = rng.standard_normal(n) * np.exp(-t * 12) * 0.25
    return boom + nz

def riser(dur, seed=4):
    rng = np.random.default_rng(seed)
    n = int(dur * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    k = 30
    nz = np.convolve(nz, np.ones(k) / k, mode='same') * 3
    sw = np.sin(2 * np.pi * np.cumsum(200 + 1800 * (t / dur) ** 2) / SR) * 0.15
    return (nz * 0.15 + sw) * (t / dur) ** 2

def whoosh(dur=0.35, seed=5):
    rng = np.random.default_rng(seed)
    n = int(dur * SR); t = np.arange(n) / SR
    nz = rng.standard_normal(n)
    nz = np.convolve(nz, np.ones(12) / 12, mode='same') * 2.5
    return nz * np.sin(np.pi * t / dur) ** 2 * 0.35

def add(buf, x, t):
    i = int(t * SR)
    if i >= len(buf): return
    m = min(len(x), len(buf) - i)
    buf[i:i + m] += x[:m]

def music(dur, bpm=120, events=None, start_full=0.0, key=0, quiet_until=0.0, out='/tmp/m.wav', seed=0):
    """Procedural 4-on-floor track. events: list of (time, 'impact'|'whoosh'|'riser:dur'|'stop:dur')."""
    buf = np.zeros(int((dur + 1.5) * SR))
    beat = 60 / bpm
    # chord progression (Am F C G) roots in Hz
    roots = [110.0, 87.31, 130.81, 98.0]
    roots = [r * 2 ** (key / 12) for r in roots]
    nb = int(dur / beat) + 1
    stops = []
    if events:
        for t, ev in events:
            if ev.startswith('stop:'):
                stops.append((t, t + float(ev.split(':')[1])))
    def stopped(t):
        return any(a <= t < b for a, b in stops)
    for b in range(nb):
        t = b * beat
        if stopped(t): continue
        full = t >= start_full
        if t >= quiet_until or b % 2 == 0:
            add(buf, kick(), t)
        if full and b % 2 == 1: add(buf, clap(seed=b), t)
        for k in (0, 0.5):
            if full or k == 0.5: add(buf, hat(seed=b * 2 + int(k * 2)), t + k * beat)
        bar = (b // 4) % 4
        r = roots[bar]
        # bass on offbeat 8ths
        add(buf, tone(r / 2, beat * 0.45, 'saw', 0.22, r=0.12), t + beat * 0.5)
        if b % 4 == 0:
            for mult in (2, 2 * 1.189, 2 * 1.498):  # minor-ish triad pad
                add(buf, tone(r * mult, beat * 4, 'saw', 0.035, a=0.2), t)
        # arp
        if full:
            for j, mult in enumerate((4, 4 * 1.498, 8, 4 * 1.189)):
                add(buf, tone(r * mult, beat / 4 * 0.9, 'sine', 0.05, r=0.06), t + j * beat / 4)
    if events:
        for t, ev in events:
            if ev == 'impact': add(buf, impact(), t)
            elif ev == 'whoosh': add(buf, whoosh(), max(0, t - 0.2))
            elif ev.startswith('riser:'):
                d = float(ev.split(':')[1]); add(buf, riser(d), t - d)
    buf = buf[:int(dur * SR)]
    # fade out
    fo = int(0.6 * SR); buf[-fo:] *= np.linspace(1, 0, fo)
    buf = buf / (np.abs(buf).max() + 1e-9) * 0.85
    st = np.stack([buf, buf], 1)
    import wave
    w = wave.open(out, 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype(np.int16).tobytes()); w.close()
    return out

def pill_arrow(d, cx, cy, text, font, bg, fg, padx=36, pady=18):
    a, c = [s.strip() for s in text.split('→')]
    wa, ha, ba = tsize(d, a, font); wc, hc, bc = tsize(d, c, font)
    hh = tsize(d, 'Ag', font)[1]
    aw = int(font.size * 1.1); gap = int(font.size * 0.45)
    tw = wa + gap + aw + gap + wc
    x0, y0 = cx - tw / 2 - padx, cy - hh / 2 - pady
    x1, y1 = cx + tw / 2 + padx, cy + hh / 2 + pady
    d.rounded_rectangle((x0, y0, x1, y1), (y1 - y0) / 2, fill=bg)
    x = cx - tw / 2
    ty = cy - hh / 2 - tsize(d, 'Ag', font)[2][1]
    d.text((x, ty), a, font=font, fill=fg); x += wa + gap
    t = max(3, font.size // 9); ay = cy - font.size * 0.06
    d.line((x, ay, x + aw - t, ay), fill=fg, width=t)
    d.polygon([(x + aw, ay), (x + aw - font.size * 0.38, ay - font.size * 0.3), (x + aw - font.size * 0.38, ay + font.size * 0.3)], fill=fg)
    x += aw + gap
    d.text((x, ty), c, font=font, fill=fg)
    return (x0, y0, x1, y1)

def arrow(d, x, y, size, fill):
    t = max(4, size // 8)
    d.line((x, y, x + size - t, y), fill=fill, width=t)
    d.polygon([(x + size, y), (x + size * 0.6, y - size * 0.32), (x + size * 0.6, y + size * 0.32)], fill=fill)
