import json, subprocess, sys, os, re
from PIL import Image, ImageDraw, ImageFont
W, H, FPS = 1080, 1920, 30
FONT = '/usr/share/fonts/truetype/higgsfield/Montserrat-ExtraBold.ttf'
ACC = (255, 196, 0)
cfg = json.load(open(sys.argv[1])); OUT = sys.argv[2]
os.makedirs(OUT, exist_ok=True)
_fc = {}
def font(s):
    if s not in _fc: _fc[s] = ImageFont.truetype(FONT, s)
    return _fc[s]
IM = {}
def img(k):
    if k not in IM: IM[k] = Image.open('img/' + k).convert('RGB')
    return IM[k]
def sm(p): return p * p * (3 - 2 * p)
def kb(im, fx, fy, z, w=W, h=H):
    iw, ih = im.size; s = max(w / iw, h / ih) * z; cw, ch = w / s, h / s
    x0 = min(max(fx * iw - cw / 2, 0), iw - cw); y0 = min(max(fy * ih - ch / 2, 0), ih - ch)
    return im.resize((w, h), Image.BICUBIC, box=(x0, y0, x0 + cw, y0 + ch))
def words(t):
    out, acc = [], False
    for w in t.split(' '):
        a = acc or w.startswith('*')
        if w.startswith('*'): acc = True
        if w.endswith('*') or w.endswith('*.') or w.endswith('*?'): acc = False
        out.append((w.replace('*', ''), a))
    return out
def block(d, t, size, y, anchor, maxw=880, cx=540, sw=None):
    f = font(size); sw = sw or max(4, size // 11); sp = f.getlength(' ')
    lines, cur, cw = [], [], 0
    for w, a in words(t):
        wl = f.getlength(w)
        if cur and cw + sp + wl > maxw: lines.append((cur, cw)); cur, cw = [], 0
        cw = cw + (sp if cur else 0) + wl; cur.append((w, a, wl))
    if cur: lines.append((cur, cw))
    lh = int(size * 1.18); th = lh * len(lines)
    y0 = y if anchor == 'top' else (y - th if anchor == 'bottom' else y - th // 2)
    for i, (ln, lw) in enumerate(lines):
        x = cx - lw / 2
        for w, a, wl in ln:
            d.text((x, y0 + i * lh), w, font=f, fill=ACC if a else (255, 255, 255), stroke_width=sw, stroke_fill=(0, 0, 0))
            x += wl + sp
    return y0 + th
def pill(d, x, y, t, size=44, bg=ACC, fg=(0, 0, 0)):
    f = font(size); w = f.getlength(t)
    d.rounded_rectangle((x, y, x + w + 44, y + size + 30), radius=(size + 30) // 2, fill=bg)
    d.text((x + 22, y + 13), t, font=f, fill=fg)
def overlay(s):
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    if s.get('dark'): d.rectangle((0, 0, W, H), fill=(0, 0, 0, int(255 * s['dark'])))
    if s.get('tag'): pill(d, 70, 235, s['tag'])
    if s.get('ai'):
        f = font(28); t = 'Exemplo criado com IA'
        d.text((1010 - f.getlength(t), 250), t, font=f, fill=(255, 255, 255), stroke_width=3, stroke_fill=(0, 0, 0))
    if s.get('text'):
        pos = s.get('pos', 'top'); size = s.get('size', 88 if pos == 'top' else 80)
        if pos == 'top': yb = block(d, s['text'], size, 345, 'top')
        elif pos == 'low': yb = block(d, s['text'], size, 1500, 'bottom')
        else: yb = block(d, s['text'], size, s.get('y', 900), 'mid')
        if s.get('text2'): block(d, s['text2'], s.get('size2', 54), yb + 40, 'top')
    return ov
def base(s, p):
    z0, z1 = s.get('z', [1.0, 1.08]); z = z0 + (z1 - z0) * sm(p)
    f0 = s.get('f0', s.get('f', [0.5, 0.4])); f1 = s.get('f1', f0)
    fx = f0[0] + (f1[0] - f0[0]) * sm(p); fy = f0[1] + (f1[1] - f0[1]) * sm(p)
    if 'grid' in s:
        fr = Image.new('RGB', (W, H), (0, 0, 0)); d = ImageDraw.Draw(fr); rh = H // 3
        for i, k in enumerate(s['grid']):
            g = s.get('foc', [[0.5, 0.3]] * 3)[i]
            fr.paste(kb(img(k), g[0], g[1], z, W, rh - 6), (0, i * rh + 3))
            if s.get('lab'): pill(d, 60, i * rh + 40, s['lab'][i], 60)
        return fr
    fr = kb(img(s['img']), fx, fy, z)
    if s.get('wipe'):
        a, b = s.get('wt', [0.0, 0.3]); q = min(max((p - a) / (b - a), 0), 1)
        x = int(W * sm(q))
        if x > 0:
            f2 = kb(img(s['wipe']), fx, fy, z); fr.paste(f2.crop((0, 0, x, H)), (0, 0))
            if x < W: ImageDraw.Draw(fr).rectangle((x - 5, 0, x + 5, H), fill=(255, 255, 255))
    return fr
# ---- TTS + timeline
t = 0.0; plan = []
for i, l in enumerate(cfg['lines']):
    raw = f'{OUT}/r{i}.mp3'; mp = f'{OUT}/v{i}.wav'
    subprocess.run(['edge-tts', '--voice', 'pt-BR-AntonioNeural', '--rate', cfg.get('rate', '+10%'), '--text', l['tts'], '--write-media', raw], check=True, capture_output=True)
    st = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', f'{st},areverse,{st},areverse', '-ar', '48000', '-ac', '1', mp], check=True)
    vd = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp]))
    dur = max(vd + l.get('pad', 0.22), l.get('min', 0))
    ws = sum(s.get('w', 1) for s in l['shots']); st = t
    for s in l['shots']:
        sd = dur * s.get('w', 1) / ws; plan.append((st, st + sd, s)); st += sd
    l['t0'] = t; t += dur
TOT = t; print('total', round(TOT, 2))
# ---- video
NF = round(TOT * FPS)
ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', f'{OUT}/video.mp4'], stdin=subprocess.PIPE)
ovc = {}
for n in range(NF):
    tt = n / FPS
    k = next(i for i, (a, b, s) in enumerate(plan) if tt < b or i == len(plan) - 1)
    a, b, s = plan[k]; p = min(max((tt - a) / (b - a), 0), 1)
    fr = base(s, p)
    if k not in ovc:
        o = overlay(s); ovc[k] = (o, o.getbbox())
    o, bb = ovc[k]
    if bb:
        dy = 0 if s.get('keep') else int(36 * (1 - min((tt - a) * FPS / 5, 1)) ** 2)
        reg = o.crop(bb); fr.paste(reg, (bb[0], bb[1] + dy), reg)
    if s.get('flash') and tt - a < 0.2:
        fr = Image.blend(fr, Image.new('RGB', (W, H), (255, 255, 255)), 0.8 * (1 - (tt - a) / 0.2))
    ImageDraw.Draw(fr).rectangle((0, 0, int(W * (n + 1) / NF), 10), fill=ACC)
    ff.stdin.write(fr.tobytes())
ff.stdin.close(); ff.wait()
# ---- cover
c = cfg['cover']; fr = base(c, 0.3); o = overlay(c); fr.paste(o, (0, 0), o)
fr.save(f'{OUT}/cover.jpg', quality=90)
# ---- audio
B = 60 / 108.0
music = (f"0.45*sin(2*PI*(45+90*exp(-mod(t,{B})*25))*mod(t,{B}))*exp(-mod(t,{B})*9)"
         f"+0.05*(random(0)*2-1)*exp(-mod(t+{B/2},{B})*60)"
         f"+0.03*(sin(2*PI*220*t)+sin(2*PI*261.63*t)+sin(2*PI*329.63*t))*(0.7+0.3*sin(2*PI*0.2*t))")
ins, fl = [], []
for i, l in enumerate(cfg['lines']):
    ins += ['-i', f'{OUT}/v{i}.wav']; ms = int(l['t0'] * 1000)
    fl.append(f'[{i}:a]aresample=48000,aformat=channel_layouts=mono,adelay={ms}[a{i}]')
n = len(cfg['lines'])
fl.append(''.join(f'[a{i}]' for i in range(n)) + f'amix=inputs={n}:normalize=0[vo]')
fl.append(f"aevalsrc='{music}':s=48000:d={TOT:.3f},volume={cfg.get('mvol', 0.22)},afade=t=out:st={TOT-0.8:.3f}:d=0.8[mu]")
fl.append('[vo][mu]amix=inputs=2:normalize=0,apad,atrim=0:' + f'{TOT:.3f}[out]')
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error'] + ins + ['-filter_complex', ';'.join(fl), '-map', '[out]', '-ac', '2', f'{OUT}/mix.wav'], check=True)
r = subprocess.run(['ffmpeg', '-i', f'{OUT}/mix.wav', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
m = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
ln = (f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{OUT}/video.mp4', '-i', f'{OUT}/mix.wav', '-af', ln + ',aresample=48000,aformat=channel_layouts=stereo', '-ac', '2',
                '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', f'{OUT}/final.mp4'], check=True)
r = subprocess.run(['ffmpeg', '-i', f'{OUT}/final.mp4', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
print('LUFS', re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)[-1])
r = subprocess.run(['ffmpeg', '-i', f'{OUT}/final.mp4', '-af', 'volumedetect', '-f', 'null', '-'], capture_output=True, text=True)
print('mean', re.findall(r'mean_volume: (\S+)', r.stderr), 'max', re.findall(r'max_volume: (\S+)', r.stderr))
# ---- review frames
sh = Image.new('RGB', (1440, 640))
for i, f in enumerate([0.12, 0.38, 0.62, 0.9]):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', f'{TOT*f:.2f}', '-i', f'{OUT}/final.mp4', '-frames:v', '1', f'{OUT}/q{i}.png'], check=True)
    q = Image.open(f'{OUT}/q{i}.png').convert('RGB'); q.thumbnail((360, 640)); sh.paste(q, (i * 360, 0))
sh.save(f'{OUT}/review.jpg', quality=72)
print('ok', OUT)
