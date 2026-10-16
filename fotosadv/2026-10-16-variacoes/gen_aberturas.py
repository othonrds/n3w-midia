# FOTOSADV 16/10 — 2 aberturas novas de 3 s para V01 e V04, reeditando frames do próprio vídeo.
# Corpo (3,0 s em diante) e áudio idênticos ao original. 0 crédito.
import os, subprocess
from PIL import Image, ImageDraw, ImageFont
D = os.path.dirname(os.path.abspath(__file__)); I = os.path.join(D, 'insumos'); T = '/tmp/ab16'; os.makedirs(T, exist_ok=True)
F = '/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(s, w='Bold'): return ImageFont.truetype(F + w + '.ttf', s)
W, H, FPS, DUR = 720, 1280, 30, 3.0
GOLD = (245, 184, 46); WH = (255, 255, 255); BK = (0, 0, 0)
def sh(*a): subprocess.run(a, check=True)
def frame(src, t):
    p = f'{T}/{os.path.basename(src)}_{t}.png'; sh('ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-i', src, '-frames:v', '1', p)
    return Image.open(p).convert('RGB')
V01 = os.path.join(I, 'V01.mp4'); V04 = os.path.join(I, 'V04.mp4')
SELFIE = frame(V01, 4.2).crop((165, 200, 555, 890))
ENSAIO = frame(V01, 6.6).crop((190, 250, 530, 860))
GRADE = frame(V01, 11.6).crop((28, 104, 692, 940))
RETRATO = frame(V01, 16.6).crop((0, 0, 720, 940))
def cover(im, z=1.0, cy=0.5):
    s = max(W / im.width, H / im.height) * z; im2 = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    x = (im2.width - W) // 2; y = int((im2.height - H) * cy); return im2.crop((x, y, x + W, y + H))
GRAD = Image.linear_gradient('L').resize((W, H)).point(lambda v: int(200 * max(0, 1 - v / 255 * 2.2)))
GRADB = GRAD.transpose(Image.FLIP_TOP_BOTTOM)
def shade(fr): return Image.composite(Image.new('RGB', (W, H), BK), fr, GRAD)
def lines(d, ls, y0, sz=60):
    fo = f(sz); lh = int(sz * 1.2)
    for i, segs in enumerate(ls):
        x = (W - sum(fo.getlength(s) for s, _ in segs)) / 2
        for s, c in segs:
            d.text((x, y0 + i * lh), s, font=fo, fill=GOLD if c else WH, stroke_width=5, stroke_fill=BK); x += fo.getlength(s)
def chip(d, t, y, bg, fg):
    fo = f(26); tw = fo.getlength(t); x = (W - tw) / 2
    d.rounded_rectangle((x - 18, y - 8, x + tw + 18, y + 38), 12, fill=bg); d.text((x, y - 2), t, font=fo, fill=fg)
def note(d): fo = f(18, 'Regular'); s = 'Imagem ilustrativa · gerada por IA'; d.text(((W - fo.getlength(s)) / 2, 1225), s, font=fo, fill=(225, 225, 225))
# cada abertura: lista de cenas (fim_s, imagem, zoom0, zoom1, cy, texto, chip)
A = {
 'V01-D-corte-seco': (V01, [(1.3, SELFIE, 1.0, 1.05, 0.35, [[('Mandou ', 0), ('1 selfie', 1), ('...', 0)]], ('SELFIE', BK, WH)),
                            (3.0, ENSAIO, 1.06, 1.0, 0.25, [[('...e recebeu', 0)], [('um ensaio.', 1)]], ('ENSAIO COM IA', GOLD, BK))]),
 'V01-E-autoridade': (V01, [(3.0, RETRATO, 1.0, 1.08, 0.2, [[('Sua foto passa a', 0)], [('autoridade', 1)], [('que você tem?', 0)]], None)]),
 'V04-C-resultado-primeiro': (V04, [(1.5, ENSAIO, 1.0, 1.05, 0.25, [[('Essa foto', 0)], [('de estúdio...', 0)]], ('ENSAIO COM IA', GOLD, BK)),
                                    (3.0, SELFIE, 1.05, 1.0, 0.35, [[('...saiu desta', 0)], [('selfie.', 1)]], ('SELFIE', BK, WH))]),
 'V04-D-15-por-89': (V04, [(3.0, GRADE, 1.12, 1.0, 0.3, [[('15 fotos assim', 0)], [('por R$ 89.', 1)]], ('FEITAS A PARTIR DE SELFIES', GOLD, BK))]),
}
for name, (src, cenas) in A.items():
    out = os.path.join(D, name); os.makedirs(out, exist_ok=True); op = f'{T}/{name}.mp4'
    ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                           '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', op], stdin=subprocess.PIPE)
    ini = 0.0
    for fim, im, z0, z1, cy, txt, ch in cenas:
        n = int(round((fim - ini) * FPS))
        for k in range(n):
            fr = cover(im, z0 + (z1 - z0) * k / max(1, n - 1), cy); fr = Image.composite(Image.new('RGB', (W, H), BK), fr, GRADB) if im is ENSAIO else shade(fr); d = ImageDraw.Draw(fr)
            lines(d, txt, 880 if im is ENSAIO else 150); note(d)
            if ch: chip(d, ch[0], 1120, ch[1], ch[2])
            ff.stdin.write(fr.tobytes())
            if k == n // 2: fr.save(f'{out}/frame-{int(ini*10):02d}.jpg', quality=88)
        ini = fim
    ff.stdin.close(); ff.wait()
    fc = '[1:v]trim=start=3,setpts=PTS-STARTPTS,fps=30,format=yuv420p[b];[0:v]fps=30,format=yuv420p[a];[a][b]concat=n=2:v=1:a=0[v]'
    v = f'{out}/video-9x16.mp4'
    sh('ffmpeg', '-v', 'error', '-y', '-i', op, '-i', src, '-filter_complex', fc, '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-crf', '20',
       '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', v)
    sh('ffmpeg', '-v', 'error', '-y', '-i', v, '-vf', 'scale=1080:1920:flags=lanczos,crop=1080:1350:0:285', '-c:v', 'libx264', '-crf', '20', '-c:a', 'copy', '-movflags', '+faststart', f'{out}/video-4x5.mp4')
    sh('ffmpeg', '-v', 'error', '-y', '-ss', '0.5', '-i', v, '-frames:v', '1', '-q:v', '3', f'{out}/thumb.jpg')
    sh('ffmpeg', '-v', 'error', '-y', '-t', '4', '-i', v, '-vf', 'scale=480:-2', '-c:v', 'libx264', '-crf', '28', '-an', '-movflags', '+faststart', f'{out}/preview-4s.mp4')
print('ok')
