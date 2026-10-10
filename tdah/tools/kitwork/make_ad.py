#!/usr/bin/env python3
"""Builds one vertical ad from a screencast recording: python3 make_ad.py GAME"""
import json, sys, os, subprocess, math, bisect, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from fontTools.ttLib import TTFont

W, H, FPS = 1080, 1920, 30
WK = os.path.dirname(os.path.abspath(__file__))
OUTD = os.path.join(os.path.dirname(WK), 'kit-ads')
FD = os.path.join(os.path.dirname(WK), 'fonts')
ANTON = FD + '/fontsource-anton/files/anton-latin-400-normal.woff'
ARCH = FD + '/fontsource-archivo-black/files/archivo-black-latin-400-normal.woff'
RUBIK = FD + '/fontsource-rubik/files/rubik-latin-700-normal.woff'
RUBIK5 = FD + '/fontsource-rubik/files/rubik-latin-500-normal.woff'
DEJAVU = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
NAVY, MINT, CORAL, SUN, WHITE = (10, 14, 34), (34, 240, 195), (255, 92, 119), (255, 216, 77), (255, 255, 255)
SOFT = (174, 185, 221)
_cmaps = {}
def has_glyph(path, ch):
    if path not in _cmaps: _cmaps[path] = set(TTFont(path).getBestCmap().keys())
    return ord(ch) in _cmaps[path]
_fc = {}
def font(path, size):
    k = (path, size)
    if k not in _fc: _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]

def rich(lines, path, size, stroke=0, stroke_fill=(0, 0, 0), spacing=1.08, align='center', maxw=None, shadow=False):
    """lines: list of list of (text, color) or (text, color, size_mult). Returns RGBA image tight-ish."""
    rendered = []
    for line in lines:
        runs = []
        for seg in line:
            txt, col = seg[0], seg[1]; sz = int(size * (seg[2] if len(seg) > 2 else 1))
            cur, curf = '', None
            for ch in txt:
                fp = path if (ch == ' ' or has_glyph(path, ch)) else DEJAVU
                if fp != curf and cur:
                    runs.append((cur, col, curf, sz)); cur = ''
                curf = fp; cur += ch
            if cur: runs.append((cur, col, curf, sz))
        lw, lh, asc = 0, 0, 0
        for r in runs:
            f = font(r[2], int(r[3] * (1.0 if r[2] == DEJAVU else 1)))
            bb = f.getbbox(r[0], stroke_width=stroke)
            lw += f.getlength(r[0]) + 0
            a, d = f.getmetrics(); asc = max(asc, a); lh = max(lh, a + d)
        rendered.append((runs, lw, lh, asc))
    tw = int(max(r[1] for r in rendered) + stroke * 2 + 20)
    th = int(sum(r[2] * spacing for r in rendered) + stroke * 2 + 20)
    im = Image.new('RGBA', (tw, th), (0, 0, 0, 0)); dr = ImageDraw.Draw(im)
    y = stroke + 10
    for runs, lw, lh, asc in rendered:
        x = (tw - lw) / 2 if align == 'center' else stroke + 10
        for txt, col, fp, sz in runs:
            f = font(fp, int(sz * (1.0 if fp == DEJAVU else 1)))
            a, d = f.getmetrics()
            yy = y + (asc - a) + (asc * 0.10 if fp == DEJAVU else 0)
            dr.text((x, yy), txt, font=f, fill=col, stroke_width=stroke, stroke_fill=stroke_fill)
            x += f.getlength(txt)
        y += lh * spacing
    bb = im.getbbox()
    if bb: im = im.crop((max(0, bb[0] - 4), max(0, bb[1] - 4), min(tw, bb[2] + 4), min(th, bb[3] + 4)))
    if maxw and im.width > maxw:
        im = im.resize((maxw, int(im.height * maxw / im.width)), Image.LANCZOS)
    if shadow:
        sh = Image.new('RGBA', (im.width + 40, im.height + 40), (0, 0, 0, 0))
        a = im.split()[3].point(lambda v: int(v * 0.55))
        blk = Image.new('RGBA', im.size, (0, 0, 0, 255)); blk.putalpha(a)
        sh.paste(blk, (20, 28), blk); sh = sh.filter(ImageFilter.GaussianBlur(10))
        sh.alpha_composite(im, (20, 20)); im = sh
    return im

def rounded(size, r, fill):
    im = Image.new('RGBA', size, (0, 0, 0, 0)); ImageDraw.Draw(im).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), r, fill=fill); return im

def pill(text, fg=MINT, bg=(10, 14, 34, 235), size=38, border=None):
    t = rich([[(text, fg)]], ARCH, size)
    pw, ph = t.width + 64, t.height + 34
    im = rounded((pw, ph), ph // 2, bg)
    if border: ImageDraw.Draw(im).rounded_rectangle((1, 1, pw - 2, ph - 2), ph // 2, outline=border, width=4)
    im.alpha_composite(t, ((pw - t.width) // 2, (ph - t.height) // 2)); return im

def pop_caption(text, col=SUN, size=120):
    return rich([[(text, col)]], ANTON, size, stroke=9, shadow=True, maxw=980)

def ease_out_back(x):
    c1, c3 = 1.70158, 2.70158; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2
def smooth(x): x = min(1, max(0, x)); return x * x * (3 - 2 * x)

def paste_center(base, im, cx, cy, scale=1.0, alpha=1.0):
    if scale <= 0.01 or alpha <= 0.01: return
    if abs(scale - 1) > 0.01: im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.BILINEAR)
    if alpha < 0.99:
        im = im.copy(); a = im.split()[3].point(lambda v: int(v * alpha)); im.putalpha(a)
    base.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))

# ---------------------------------------------------------------- recording access
class Rec:
    def __init__(self, d):
        self.d = d; j = json.load(open(d + '/rec.json'))
        self.frames = j['frames']; self.t0 = self.frames[0]['t']
        self.ts = [f['t'] - self.t0 for f in self.frames]
        self.ev = [dict(e, t=e['t'] - self.t0) for e in j['ev']]; self.res = j.get('res')
        self._c = (None, None)
    def frame(self, s):
        i = max(0, bisect.bisect_right(self.ts, s) - 1)
        if self._c[0] != i:
            self._c = (i, Image.open(self.d + '/f/' + self.frames[i]['f']).convert('RGB'))
        return self._c[1]
    def evs(self, typ): return [e for e in self.ev if e['type'] == typ]

class TL:
    """piecewise time map: segs = [(src_a, src_b, speed)]"""
    def __init__(self, segs):
        self.segs = []; o = 0
        for a, b, sp in segs: self.segs.append((o, a, b, sp)); o += (b - a) / sp
        self.G = o
    def src(self, t):
        for o, a, b, sp in self.segs:
            if t < o + (b - a) / sp or (o, a, b, sp) == self.segs[-1]: return min(b, a + (t - o) * sp)
    def out(self, s):
        for o, a, b, sp in self.segs:
            if a <= s <= b: return o + (s - a) / sp
        return None
    def speed(self, t):
        for o, a, b, sp in self.segs:
            if t < o + (b - a) / sp: return sp
        return self.segs[-1][3]

# ---------------------------------------------------------------- games
GAMES = {}
def game(fn): GAMES[fn.__name__.replace('_', '-')] = fn; return fn

@game
def number_hunt(r):
    go = r.evs('go')[0]['t']; fin = r.evs('finish')[0]['t']
    segs = [(go - 0.6, fin + 2.55, 1.0)]
    hits = r.evs('hit')
    tm = r.res['time'].replace('s', '')
    return dict(
        segs=segs, bpm=128,
        hook=[[('Find 1 ', WHITE), ('→', WHITE), (' 25.', WHITE)], [('Most people take', WHITE, .78)], [('40+ seconds.', CORAL, .98)]],
        pills=[(go, fin + 0.1, '5×5 GRID · NO MISSES')],
        pops=[(hits[11]['t'], 'HALFWAY!', MINT), (fin + 0.25, f'{tm} SECONDS', SUN)],
        zooms=[(hits[14]['t'] - 0.3, 1.0, 1.14, (540, 1150)), (fin + 0.75, 1.3, 1.2, (540, 560))],
        flips=[fin + 0.25], thumb=hits[16]['t'], pop_y=1340,
    )

@game
def color_clash(r):
    flip = r.evs('flip')[0]['t']; unflip = r.evs('unflip')[0]['t']
    a = 0.85; b = unflip + 2.6
    st = r.evs('streak')
    pops = [(e['t'] + 0.05, 'STREAK ' + e['v'] + '!', SUN) for e in st if e['t'] > a + 2.1 and e['t'] < b - 0.6 and abs(e['t'] - flip) > 1.2]
    pops.append((flip + 1.55, 'NOW TAP THE WORD!', CORAL))
    return dict(
        segs=[(a, b, 1.0)], bpm=132,
        hook=[[('Say the ', WHITE), ('C', (255, 92, 119)), ('O', (76, 141, 255)), ('L', (62, 220, 107)), ('O', SUN), ('R', (255, 92, 119)), (',', WHITE)], [('not the word.', WHITE)]],
        pills=[],
        pops=[p for p in pops if 'x5' in p[1] or 'WORD' in p[1]],
        zooms=[(flip - 0.05, 1.5, 1.16, (540, 820))],
        flips=[flip], thumb=flip + 2.5, pop_y=950,
    )

@game
def block_drop(r):
    go = r.evs('go')[0]['t']; pl = r.evs('place')
    a = go + 0.1; b = pl[-1]['t'] + 1.2
    pops = []
    for e in pl:
        if e['n'] >= 2: pops.append((e['t'] + 0.05, f"{e['n']} LINES · COMBO x{e['combo']}!", MINT))
        elif e['n'] and e['combo'] in (3, 6, 9, 11): pops.append((e['t'] + 0.05, f"COMBO x{e['combo']}!", SUN))
    big = [e for e in pl if e['n'] >= 2][0]
    return dict(
        segs=[(a, b, 1.25)], bpm=92, calm=True,
        hook=[[('The most relaxing', WHITE)], [('60 seconds', MINT, 1.22)], [('of your day.', WHITE)]],
        pills=[],
        pops=pops,
        zooms=[(pl[2]['t'] - 0.25, 1.1, 1.13, (pl[2]['x'] * 3, pl[2]['y'] * 3)), (big['t'] - 0.25, 1.3, 1.16, (540, big['y'] * 3))],
        flips=[big['t']], thumb=pl[4]['t'] - 0.3, pop_y=300,
    )

@game
def merge_up(r):
    go = r.evs('go')[0]['t']; mv = r.evs('move')
    a = go - 0.25; b = mv[-1]['t'] + 1.6
    labels = {4: '128!', 5: '256!', 6: '512!', 7: '1024!'}
    pops = [(mv[i]['t'] - 0.05, labels[i], MINT) for i in labels]
    pops.append((mv[8]['t'] - 0.02, '2048!!', SUN))
    return dict(
        segs=[(a, b, 1.0)], bpm=116,
        hook=[[('One more move…', WHITE)], [("(you'll say it 50 times)", SUN, .62)]],
        pills=[(a + 2.1, mv[8]['t'] - 0.1, 'SWIPE · MERGE · REPEAT')],
        pops=pops,
        zooms=[(mv[6]['t'] - 0.2, 1.0, 1.15, (540, 700)), (mv[7]['t'] - 0.15, 1.15, 1.22, (380, 700))],
        flips=[mv[8]['t']], thumb=mv[3]['t'] - 0.2, pop_y=870,
    )

@game
def echo_lights(r):
    sh = {e['v']: e['t'] for e in r.evs('show')}; cl = {e['v']: e['t'] for e in r.evs('cleared')}; inp = {e['v']: e['t'] for e in r.evs('input')}
    a = sh[8] - 0.4; m = sh[10] - 0.2; b = cl[10] + 0.8
    sp = (m - a) / 3.0
    return dict(
        segs=[(a, m, sp), (m, b, 1.0)], bpm=124, sfx_max_speed=1.5,
        hook=[[('Level 10', SUN, 1.15)], [('breaks most brains.', WHITE, .85)]],
        pills=[(a, m - 0.05, f'FAST-FORWARD ▸▸ x{sp:.0f}'), (m + 0.05, inp[10], 'WATCH… 10 LIGHTS'), (inp[10], b, 'NOW REPEAT IT')],
        pops=[(sh[9] - 0.1, 'LEVEL 9', MINT), (m + 0.15, 'LEVEL 10', SUN), (cl[10] + 0.05, '10 / 10. CLEAN.', MINT)],
        zooms=[(inp[10] + 0.3, 2.2, 1.12, (540, 1000))],
        flips=[m + 0.15, cl[10] + 0.05], thumb=sh[10] + 1.2, pop_y=330,
    )

@game
def pour_sort(r):
    go = r.evs('go')[0]['t']; pr = r.evs('pour'); fu = r.evs('full'); win = r.evs('win')[0]['t']
    a = go - 0.2; m1 = pr[2]['t'] - 0.3; m2 = pr[-3]['t'] - 0.3; b = win + 1.5
    segs = [(a, m1, 1.0), (m1, m2, 2.2), (m2, b, 1.0)]
    pops = [(e['t'] + 0.05, f"{e['n']}/5 SORTED", MINT) for e in fu[:-1] if e['t'] > a + 2.2]
    pops.append((win + 0.05, 'ALL SORTED!', SUN))
    return dict(
        segs=segs, bpm=96, calm=True, sfx_max_speed=2.0,
        hook=[[('Only ', WHITE), ('2%', CORAL, 1.15), (' sort this', WHITE)], [('without a hint.', WHITE)]],
        pills=[(a + 2.1, b, 'LEVEL 13 · 5 COLORS')],
        pops=pops,
        zooms=[(pr[1]['t'] - 0.1, 1.1, 1.13, (540, 760)), (win - 0.6, 1.6, 1.12, (540, 760))],
        flips=[win + 0.05], thumb=pr[5]['t'] + 0.5, pop_y=300,
    )

DIRS = {'number-hunt': 'nh', 'color-clash': 'cc', 'block-drop': 'bd', 'merge-up': 'mu', 'echo-lights': 'el', 'pour-sort': 'ps'}
ORDER = ['number-hunt', 'color-clash', 'block-drop', 'merge-up', 'echo-lights', 'pour-sort']

# ---------------------------------------------------------------- end card
def thumbs():
    out = []
    for g in ORDER:
        p = os.path.join(WK, 'thumbs', g + '.jpg')
        if not os.path.exists(p):
            r = Rec(os.path.join(WK, DIRS[g])); cfg = GAMES[g](r)
            im = r.frame(cfg['thumb']).crop((0, 150, 1080, 1920 - 90))
            os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p, quality=92)
        out.append(Image.open(p).convert('RGB'))
    return out

def end_layers():
    L = {}
    L['t1'] = rich([[('6 focus games', MINT)]], ANTON, 160, stroke=0)
    L['t2'] = rich([[('+ 47-page ', WHITE), ('ADHD Focus Kit', WHITE)]], ANTON, 104, maxw=980)
    L['price'] = rich([[('$9.90', SUN), (' · instant access', WHITE, .8)]], ARCH, 76)
    bt = rich([[('Get the kit', NAVY)]], ARCH, 72)
    bw, bh = 640, 156
    btn = Image.new('RGBA', (bw + 40, bh + 60), (0, 0, 0, 0))
    glow = rounded((bw, bh), bh // 2, MINT + (150,)).filter(ImageFilter.GaussianBlur(0))
    sh = Image.new('RGBA', btn.size, (0, 0, 0, 0)); sh.alpha_composite(rounded((bw, bh), bh // 2, (34, 240, 195, 120)), (20, 34)); sh = sh.filter(ImageFilter.GaussianBlur(16))
    btn.alpha_composite(sh); btn.alpha_composite(rounded((bw, bh), bh // 2, (13, 154, 124, 255)), (20, 30)); btn.alpha_composite(rounded((bw, bh), bh // 2, MINT + (255,)), (20, 18))
    btn.alpha_composite(bt, (20 + (bw - bt.width) // 2, 18 + (bh - bt.height) // 2)); L['btn'] = btn
    L['foot'] = rich([[('For fun & focus. Not a medical test.', SOFT)]], RUBIK5, 38)
    tw, th = 216, 336
    row = Image.new('RGBA', (3 * tw + 2 * 22 + 20, 2 * th + 22 + 20), (0, 0, 0, 0))
    for i, im in enumerate(thumbs()):
        im = im.resize((tw, int(im.height * tw / im.width)), Image.LANCZOS).crop((0, 0, tw, th)).convert('RGBA')
        m = Image.new('L', (tw, th), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, tw - 1, th - 1), 20, fill=255)
        card = Image.new('RGBA', (tw, th), (0, 0, 0, 0)); card.paste(im, (0, 0), m)
        ImageDraw.Draw(card).rounded_rectangle((0, 0, tw - 1, th - 1), 20, outline=(255, 255, 255, 70), width=3)
        row.alpha_composite(card, (10 + (i % 3) * (tw + 22), 10 + (i // 3) * (th + 22)))
    L['row'] = row
    return L

def end_bg(last):
    bg = last.resize((W // 6, H // 6), Image.BILINEAR).filter(ImageFilter.GaussianBlur(6)).resize((W, H), Image.BILINEAR)
    ov = Image.new('RGB', (W, H), NAVY)
    return Image.blend(bg, ov, 0.78).convert('RGBA')

# ---------------------------------------------------------------- audio
SR = 44100
def blip(freq, dur=0.07, vol=0.5, decay=0.025):
    n = int(dur * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)) * np.exp(-t / decay) * np.minimum(1, t / 0.002) * vol

def build_audio(game, D, flips, end_t, bpm, calm, taps, pops, out_wav):
    mus = os.path.join(WK, game + '_mus.wav')
    cmd = ['python3', '/home/claude/n3w-midia/tdah/tools/som.py', f'{D:.2f}', mus, '--flips', ','.join(f'{f:.2f}' for f in flips), '--end', f'{end_t:.2f}', '--bpm', str(bpm)]
    if calm: cmd.append('--calm')
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL)
    with wave.open(mus) as w: x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).astype(np.float64) / 32767
    N = int(D * SR); mix = np.zeros((N, 2)); n = min(N, len(x)); mix[:n] = x[:n] * 0.8
    notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]
    for k, t in enumerate(taps):
        s = blip(notes[k % len(notes)] * (1 if not calm else 0.75), vol=0.28 if not calm else 0.2)
        i = int(t * SR)
        if 0 <= i < N: m = min(len(s), N - i); mix[i:i + m] += s[:m, None]
    for t in pops:
        s = blip(1318.5, 0.25, 0.22, 0.08) + np.pad(blip(1975.5, 0.2, 0.14, 0.06), (int(0.05 * SR), 0))[:int(0.25 * SR)]
        i = int(t * SR)
        if 0 <= i < N: m = min(len(s), N - i); mix[i:i + m] += s[:m, None]
    mix /= max(1e-6, np.max(np.abs(mix))) / 0.9
    with wave.open(out_wav, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((mix * 32767).astype('<i2').tobytes())

def loudnorm(inp, out):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', '-i', inp, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    js = json.loads(r[r.rindex('{'):r.rindex('}') + 1])
    af = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,aresample=44100"
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', inp, '-af', af, '-ar', '44100', out], check=True)

# ---------------------------------------------------------------- main render
def render(game):
    r = Rec(os.path.join(WK, DIRS[game])); cfg = GAMES[game](r); tl = TL(cfg['segs'])
    G = tl.G; END = 3.0; D = G + END; HOOK = 2.0
    nF = int(round(D * FPS))
    print(game, 'gameplay %.2fs total %.2fs' % (G, D))
    # map events into output time
    def o(s): return tl.out(s)
    pops = [(o(t), txt, col) for t, txt, col in cfg['pops'] if o(t) is not None and o(t) >= HOOK + 0.15 and o(t) < G - 0.3]
    pills = [(max(HOOK, o(a) or HOOK), o(b) or G, txt) for a, b, txt in cfg['pills']]
    zooms = [(o(t), dur, z, c) for t, dur, z, c in cfg['zooms'] if o(t) is not None]
    smax = cfg.get('sfx_max_speed', 1.01)
    taps = [o(e['t']) for e in r.evs('tap') if o(e['t']) is not None and tl.speed(o(e['t'])) <= smax]
    flips = [HOOK] + [o(f) for f in cfg['flips'] if o(f) is not None and o(f) < G - 0.3 and o(f) > HOOK + 0.8]
    # prerender
    hook_im = rich(cfg['hook'], ANTON, 132, stroke=11, shadow=True, maxw=960)
    pop_ims = [(t, pop_caption(txt, col, 104)) for t, txt, col in pops]
    pill_ims = [(a, b, pill(txt)) for a, b, txt in pills]
    EL = end_layers()
    grad = np.zeros((H, W), np.uint8); gy = np.clip(1 - np.arange(H) / 1250.0, 0, 1) ** 1.3 * 205; grad[:] = gy[:, None].astype(np.uint8)
    hook_grad = Image.new('RGBA', (W, H), (0, 0, 0, 0)); hook_grad.putalpha(Image.fromarray(grad))
    os.makedirs(OUTD, exist_ok=True)
    tmpv = os.path.join(WK, game + '_v.mp4')
    ff = subprocess.Popen(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', tmpv], stdin=subprocess.PIPE)
    last_game = None; bg_end = None; hook_y = 232
    for fi in range(nF):
        t = fi / FPS
        if t < G:
            src = tl.src(t); fr = r.frame(src)
            # zoom
            z, cx, cy = 1.0, W / 2, H / 2
            for zt, zd, zz, (zx, zy) in zooms:
                if zt - 0.0 <= t <= zt + zd + 0.3:
                    k = smooth((t - zt) / 0.22) * (1 - smooth((t - (zt + zd)) / 0.3))
                    z = 1 + (zz - 1) * k; cx = W / 2 + (zx - W / 2) * k; cy = H / 2 + (zy - H / 2) * k
            if z > 1.001:
                cw, ch = W / z, H / z
                x0 = min(max(cx - cw / 2, 0), W - cw); y0 = min(max(cy - ch / 2, 0), H - ch)
                fr = fr.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))
            img = fr.convert('RGBA'); last_game = fr
            # hook
            if t < HOOK:
                ga = 1 - smooth((t - (HOOK - 0.15)) / 0.15)
                if ga > 0:
                    if ga < 1:
                        hg = hook_grad.copy(); hg.putalpha(Image.fromarray((grad * ga).astype(np.uint8))); img.alpha_composite(hg)
                    else: img.alpha_composite(hook_grad)
                k = min(1, t / 0.28); sc = 0.72 + 0.28 * ease_out_back(k) if k < 1 else 1.0
                paste_center(img, hook_im, W / 2, hook_y + hook_im.height / 2, sc, ga * min(1, t / 0.08 + 0.3))
            # flash on cut
            if HOOK <= t < HOOK + 0.1:
                img = Image.blend(img, Image.new('RGBA', (W, H), (255, 255, 255, 255)), 0.35 * (1 - (t - HOOK) / 0.1))
            # pills
            for a, b, p in pill_ims:
                if a <= t < b:
                    k = smooth((t - a) / 0.25) * (1 - smooth((t - (b - 0.2)) / 0.2))
                    paste_center(img, p, W / 2, 222 + (1 - k) * -30, 1.0, k)
            # pops
            py = cfg.get('pop_y', 330) + 130
            act = [(pt, pim) for pt, pim in pop_ims if pt <= t < pt + 1.05]
            if act:
                pt, pim = act[-1]; u = t - pt
                sc = 0.5 + 0.5 * ease_out_back(min(1, u / 0.22)); al = 1 - smooth((u - 0.85) / 0.2)
                paste_center(img, pim, W / 2, py, sc, al)
        else:
            u = t - G
            if bg_end is None: bg_end = end_bg(last_game)
            gk = smooth(u / 0.3)
            base = Image.blend(last_game.convert('RGBA'), bg_end, gk) if gk < 1 else bg_end.copy()
            img = base
            def el(key, cy, delay, mode='up'):
                k = smooth((u - delay) / 0.3)
                if k <= 0: return
                im = EL[key]
                if mode == 'pop': paste_center(img, im, W / 2, cy, 0.6 + 0.4 * ease_out_back(min(1, (u - delay) / 0.3)), k)
                else: paste_center(img, im, W / 2, cy + (1 - k) * 50, 1.0, k)
            el('t1', 330, 0.05); el('t2', 480, 0.15); el('row', 905, 0.25)
            el('price', 1340, 0.4)
            if u > 0.55:
                pulse = 1 + 0.035 * math.sin((u - 0.55) * 2 * math.pi * 1.4) * smooth((u - 0.85) / 0.2)
                k = min(1, (u - 0.55) / 0.3)
                paste_center(img, EL['btn'], W / 2, 1490, (0.6 + 0.4 * ease_out_back(k)) * pulse, smooth(k * 1.5))
            el('foot', 1640, 0.7)
            # final fade
            if u > END - 0.25: img = Image.blend(img, Image.new('RGBA', (W, H), (0, 0, 0, 255)), 0.0)
        ff.stdin.write(img.convert('RGB').tobytes())
        if abs(t - 1.0) < 0.5 / FPS: img.convert('RGB').save(os.path.join(OUTD, f'KIT_{game.upper().replace("-", "_")}_v1_thumb.jpg'), quality=90)
        for name, tt in (('hook', 1.0), ('mid', G * 0.55), ('end', D - 0.4)):
            if abs(t - tt) < 0.5 / FPS: img.convert('RGB').save(os.path.join(WK, f'sheet_{game}_{name}.jpg'), quality=88)
    ff.stdin.close(); ff.wait()
    # audio
    raw = os.path.join(WK, game + '_raw.wav'); norm = os.path.join(WK, game + '_norm.wav')
    build_audio(game, D, flips, G, cfg['bpm'], cfg.get('calm', False), taps, [p[0] for p in pops] + [G + 0.6], raw)
    loudnorm(raw, norm)
    out = os.path.join(OUTD, f'KIT_{game.upper().replace("-", "_")}_v1.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmpv, '-i', norm, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '44100',
                    '-shortest', '-movflags', '+faststart', out], check=True)
    print('wrote', out)

if __name__ == '__main__':
    for g in sys.argv[1:]: render(g)
