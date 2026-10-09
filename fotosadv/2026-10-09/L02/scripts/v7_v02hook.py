from vlib import *
import subprocess
# 7) Variante do V02 com hook novo nos 2 primeiros segundos (miolo idêntico ao V02 a partir de 2,1 s).
# V02-S está no bucket, mas o proxy local bloqueia o domínio do bucket; base = V02 26s do repo n3w-midia.
V = ROOT + '/repo/fotosadv/ads-vid/2026-10-07/FOTOSADV_selfie-ensaio_V02_antes-depois_26s.mp4'
antes = Image.open(SRC + 'v02_antes.png').convert('RGB').crop((210, 480, 884, 1550))
depois = Image.open(SRC + 'v02_depois.png').convert('RGB').crop((200, 440, 890, 1550))
BG = (10, 10, 12)
def scene(im, cy):
    b = blur_bg(im, VW, VH, dark=0.3); b = Image.blend(b, Image.new('RGB', (VW, VH), BG), 0.3)
    c = cover(up(im, 1.3), 860, 1300, 0.5, cy)
    paste_round(b, c, ((VW - 860) // 2, 430), r=34)
    return b
D = scene(depois, 0.2); A = scene(antes, 0.3)
def s1(lt, dur, t):
    fr = zoom_frame(D, 1.12 - 0.08 * ease(lt / 0.9)).copy()
    pop_text(fr, VW / 2, 170, 'Esse ensaio aqui…', 88, WHITE, lt, 0.0, stroke=5)
    return fr
def s2(lt, dur, t):
    fr = zoom_frame(A, punch(lt, 0.1), dx=9 * math.sin(lt * 23), dy=6 * math.cos(lt * 19)).copy()
    pop_text(fr, VW / 2, 150, '…era ESSA selfie.', 92, GOLD, lt, 0.0, stroke=5)
    pop_text(fr, VW / 2, 270, '(tirada no carro)', 52, WHITE, lt, 0.25, stroke=3, w='Medium')
    return flash(fr, lt, 0.08)
sp = Image.new('RGBA', (VW, 120), (0, 0, 0, 0)); selo(sp, 60); sp.save(OUT + 'selo_tmp.png')
tl = TL().add(0, 1.0, s1).add(1.0, 2.0, s2)
sil = OUT + 'sil.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', V, '-t', '2', '-vn', sil], check=True)
hook = render(OUT + 'v7_hook_tmp', 2.0, tl, sil)
out = OUT + 'L02-7_V02-hook-novo_26s.mp4'
fc = ('[0:v]fps=30,format=yuv420p,setsar=1[h];'
      '[1:v]trim=start=2.1,setpts=PTS-STARTPTS,fps=30,format=yuv420p,setsar=1[m];'
      '[h][m]concat=n=2:v=1:a=0[vc];[vc][2:v]overlay=0:40[v];'
      '[1:a]atrim=0:2.0,asetpts=PTS-STARTPTS[a1];[1:a]atrim=start=2.1,asetpts=PTS-STARTPTS[a2];'
      '[a1][a2]acrossfade=d=0.05[a]')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', hook, '-i', V, '-i', OUT + 'selo_tmp.png', '-filter_complex', fc, '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out], check=True)
os.remove(hook)
print('ok')
