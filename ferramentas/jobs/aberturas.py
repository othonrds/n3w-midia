# Aberturas novas (0-2 s) sobre o V01 'selfie vira ensaio' - corpo e audio identicos ao controle
import subprocess, os, glob
from PIL import Image, ImageDraw, ImageFont, ImageFilter
B='https://n3w-meta.othon-rdss.workers.dev/m/fotosadv/criativos'
O='fotosadv/2026-10-10-aberturas'; T='/tmp/ab'; os.makedirs(T,exist_ok=True)
def sh(*a): subprocess.run(a,check=True)
sh('curl','-sSfL',B+'/V01-selfie-ensaio/video.mp4','-o',T+'/V01.mp4')
sh('curl','-sSfL',B+'/V03-H4/video.mp4','-o',T+'/H4.mp4')
for nm,t in (('w1',4.2),('w2',9.0)):
    sh('ffmpeg','-v','error','-y','-ss',str(t),'-i',T+'/H4.mp4','-frames:v','1',f'{T}/{nm}.png')
def font(sz):
    for p in glob.glob('/usr/share/fonts/**/Montserrat-ExtraBold.ttf',recursive=True)+glob.glob('/usr/share/fonts/**/Montserrat-Bold.ttf',recursive=True)+['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']:
        if os.path.exists(p): return ImageFont.truetype(p,sz)
W,H=720,1280; FPS=30; DUR=2.0; CUT=0.9
Y=(245,184,46); WH=(255,255,255)
def halves(src):
    im=Image.open(src).convert('RGB')  # 1080x1920, selfie em cima, ensaio embaixo
    top=im.crop((0,110,1080,890)); bot=im.crop((0,1060,1080,1800))
    return top,bot
def cover(im,z):
    w,h=im.size; s=max(W/w,H/h)*z; im2=im.resize((int(w*s)+1,int(h*s)+1),Image.LANCZOS)
    x=(im2.width-W)//2; y=(im2.height-H)//2; return im2.crop((x,y,x+W,y+H))
def text_block(d,lines,y0,sz=48):
    f=font(sz); lh=int(sz*1.22)
    for i,segs in enumerate(lines):
        tw=sum(f.getlength(s) for s,_ in segs); x=(W-tw)/2; y=y0+i*lh
        for s,c in segs:
            d.text((x,y),s,font=f,fill=Y if c else WH,stroke_width=5,stroke_fill=(0,0,0)); x+=f.getlength(s)
def chip(d,txt,y,bg,fg):
    f=font(24); tw=f.getlength(txt); x=(W-tw)/2
    d.rounded_rectangle((x-16,y-8,x+tw+16,y+34),10,fill=bg); d.text((x,y),txt,font=f,fill=fg)
def build(name,src,lines):
    top,bot=halves(src); out=f'{T}/{name}_open.mp4'
    ff=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-c:v','libx264','-crf','18','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
    N=int(DUR*FPS)
    for i in range(N):
        t=i/FPS
        if t<CUT: fr=cover(top,1.0+0.05*t/CUT); lab=('SELFIE',(0,0,0),WH)
        else: fr=cover(bot,1.04-0.04*(t-CUT)/(DUR-CUT)); lab=('ENSAIO COM IA',Y,(0,0,0))
        # faixa escura no topo para leitura
        g=Image.new('L',(1,H)); 
        for yy in range(H): g.putpixel((0,yy),int(170*max(0,1-yy/520)))
        fr=Image.composite(Image.new('RGB',(W,H),(0,0,0)),fr,g.resize((W,H)))
        d=ImageDraw.Draw(fr)
        f=font(16); s='Imagem ilustrativa · gerada por IA'; d.text(((W-f.getlength(s))/2,214),s,font=f,fill=(230,230,230))
        text_block(d,lines,250)
        chip(d,lab[0],1040,lab[1],lab[2])
        ff.stdin.write(fr.tobytes())
        if i==10: fr.save(f'{O}/{name}/frame-selfie.jpg',quality=88)
        if i==50: fr.save(f'{O}/{name}/frame-ensaio.jpg',quality=88)
    ff.stdin.close(); ff.wait(); return out
V=[('A-julgou','w1',[[('Antes de ler o seu',0)],[('nome, o cliente já',0)],[('julgou',1),(' a sua foto.',0)]]),
   ('B-whatsapp','w1',[[('Ainda usando foto de',0)],[('festa',1),(' no WhatsApp',0)],[('do escritório?',0)]]),
   ('C-sem-sair','w2',[[('Ensaio profissional',0)],[('sem fotógrafo',1),(' e',0)],[('sem sair do escritório.',0)]])]
for name,src,lines in V:
    os.makedirs(f'{O}/{name}',exist_ok=True)
    op=build(name,f'{T}/{src}.png',lines)
    fc='[1:v]trim=start=2,setpts=PTS-STARTPTS,fps=30,format=yuv420p[b];[0:v]fps=30,format=yuv420p[a];[a][b]concat=n=2:v=1:a=0[v]'
    v916=f'{O}/{name}/video-9x16.mp4'
    sh('ffmpeg','-v','error','-y','-i',op,'-i',T+'/V01.mp4','-filter_complex',fc,'-map','[v]','-map','1:a','-c:v','libx264','-crf','20','-preset','medium','-c:a','aac','-b:a','128k','-shortest','-movflags','+faststart',v916)
    sh('ffmpeg','-v','error','-y','-i',v916,'-vf','scale=1080:1920:flags=lanczos,crop=1080:1350:0:285','-c:v','libx264','-crf','20','-c:a','copy','-movflags','+faststart',f'{O}/{name}/video-4x5.mp4')
    sh('ffmpeg','-v','error','-y','-ss','0.3','-i',v916,'-frames:v','1','-q:v','3',f'{O}/{name}/thumb.jpg')
    sh('ffmpeg','-v','error','-y','-t','5','-i',v916,'-vf','fps=4,scale=180:-2,tile=10x2','-frames:v','1',f'{O}/{name}/folha.jpg')
    sh('ffmpeg','-v','error','-y','-t','4','-i',f'{O}/{name}/video-4x5.mp4','-vf','fps=2,scale=216:-2,tile=8x1','-frames:v','1',f'{O}/{name}/folha-4x5.jpg')
    p=subprocess.run(['ffprobe','-v','error','-show_entries','format=duration,size','-of','compact',v916],capture_output=True,text=True).stdout
    open(f'{O}/{name}/probe.txt','w').write(p)
