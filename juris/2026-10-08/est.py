from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
W,H=1080,1350; F='/usr/share/fonts/truetype/google-fonts/'
NAVY=(16,24,40); GOLD=(226,178,58); WH=(255,255,255); MUT=(170,182,204); INK=(20,24,36)
def f(sz,w='Bold'): return ImageFont.truetype(F+f'Poppins-{w}.ttf',sz)
def wrap(d,t,font,maxw):
    out=[];cur=''
    for w in t.split(' '):
        x=(cur+' '+w).strip()
        if d.textlength(x,font=font)<=maxw: cur=x
        else: out.append(cur); cur=w
    out.append(cur); return out
def hook(d,y,t,sz=74,col=WH,maxw=W-128,hl=None):
    font=f(sz); lines=wrap(d,t,font,maxw); hw=set((hl or '').split(' '))
    for l in lines:
        x=(W-d.textlength(l,font=font))/2
        for i,w in enumerate(l.split(' ')):
            tok=(' ' if i else '')+w; d.text((x,y),tok,font=font,fill=GOLD if w in hw else col); x+=d.textlength(tok,font=font)
        y+=int(sz*1.16)
    return y
def center(d,y,t,font,col):
    for l in wrap(d,t,font,W-160):
        d.text(((W-d.textlength(l,font=font))/2,y),l,font=font,fill=col); y+=int(font.size*1.4)
    return y
def rr(im,r):
    m=Image.new('L',im.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,im.size[0]-1,im.size[1]-1),r,fill=255); return m
def phone(c,shot,cx,top,w=430,h=820):
    s=Image.open(shot).convert('RGB'); s=s.resize((w,int(s.height*w/s.width)),Image.LANCZOS).crop((0,0,w,h))
    pad=18; body=Image.new('RGB',(w+2*pad,h+2*pad),(8,10,16))
    sh=Image.new('RGBA',(body.width+80,body.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((40,50,body.width+40,body.height+50),60,fill=(0,0,0,150))
    sh=sh.filter(ImageFilter.GaussianBlur(24)); c.paste(sh,(cx-body.width//2-40,top-40),sh)
    c.paste(body,(cx-body.width//2,top),rr(body,58)); c.paste(s,(cx-w//2,top+pad),rr(s,42))
    pass
def browser(c,shot,cx,top,w=900,h=560):
    s=Image.open(shot).convert('RGB'); s=s.resize((w,int(s.height*w/s.width)),Image.LANCZOS).crop((0,0,w,h))
    bar=46; fr=Image.new('RGB',(w,h+bar),(236,239,244)); d=ImageDraw.Draw(fr)
    for i,col in enumerate([(255,95,87),(254,188,46),(40,200,64)]): d.ellipse((18+i*24,15,32+i*24,29),fill=col)
    d.rounded_rectangle((110,10,w-30,36),13,fill=WH); d.text((128,13),'jurispaginas.com/rafael-moura',font=f(17,'Regular'),fill=(90,98,112))
    fr.paste(s,(0,bar)); c.paste(fr,(cx-w//2,top),rr(fr,18))
def base(): 
    c=Image.new('RGB',(W,H),NAVY); d=ImageDraw.Draw(c)
    for y in range(H): d.line((0,y,W,y),fill=(16+int(10*y/H),24+int(14*y/H),40+int(26*y/H)))
    return c,d
def rodape(d,txt='Juris Páginas'):
    d.text((64,H-70),txt,font=f(28,'Bold'),fill=GOLD)
    n='Exemplo ilustrativo · nomes fictícios'; fn=f(20,'Regular'); d.text((W-64-d.textlength(n,font=fn),H-64),n,font=fn,fill=MUT)
def chip(d,y,t):
    fn=f(30,'Medium'); w=d.textlength(t,font=fn)+56; x=(W-w)/2
    d.rounded_rectangle((x,y,x+w,y+64),32,fill=GOLD); d.text((x+28,y+12),t,font=fn,fill=INK)
OUT='out'; os.makedirs(OUT,exist_ok=True)
def save(c,n): c.save(f'{OUT}/{n}.png'); print(n)
# 1 demo 30s, celular
c,d=base(); y=hook(d,90,'Sua página de advogado em 30 segundos',hl='30 segundos')
y=center(d,y+14,'Preencha 4 campos e veja na hora. Grátis para gerar.',f(34,'Regular'),MUT)
t0=y+30; phone(c,'lp-helena-mob.png',W//2,t0,int((1150-t0)*0.53),1150-t0); chip(d,1160,'Gere a sua grátis'); rodape(d); save(c,'JURIS_demo-30s_H01_v1')
# 2 demo 30s, navegador
c,d=base(); y=hook(d,90,'Sua página de advogado em 30 segundos',hl='30 segundos')
y=center(d,y+14,'Preencha 4 campos e veja na hora. Grátis para gerar.',f(34,'Regular'),MUT)
browser(c,'lp-rafael-desk.png',W//2,y+50,920,1090-y-50-46); chip(d,1160,'Gere a sua grátis'); rodape(d); save(c,'JURIS_demo-30s_H01_v2')
# 3 preço
c,d=base(); y=hook(d,90,'3 páginas de advocacia por R$\u00a039,90',hl='R$\u00a039,90')
y=center(d,y+14,'Pagamento único no Pix. 12 meses de hospedagem inclusos.',f(34,'Regular'),MUT)
t0=y+30; phone(c,'lp-camila-mob.png',W//2,t0,int((1150-t0)*0.53),1150-t0); chip(d,1160,'Veja a sua antes de pagar'); rodape(d); save(c,'JURIS_preco_H02_v1')
# 4 sem agência
c,d=base(); y=hook(d,90,'Seu site de advogado sem pagar agência',hl='sem pagar agência')
y=center(d,y+14,'3 páginas completas por R$ 39,90 no Pix.',f(34,'Regular'),MUT)
t0=y+30; phone(c,'lp-rafael-mob.png',W//2,t0,int((1150-t0)*0.53),1150-t0); chip(d,1160,'Veja a sua antes de pagar'); rodape(d); save(c,'JURIS_preco_H03_v1')
# 5 OAB
c,d=base(); y=hook(d,90,'Site de advogado nas regras da OAB',hl='regras da OAB')
y=center(d,y+10,'Textos prontos para a sua área, escritos com base no Provimento 205/2021.',f(32,'Regular'),MUT)
cx=56;cy=y+40;d.rounded_rectangle((cx,cy,cx+560,cy+420),28,fill=WH)
d.text((cx+36,cy+30),'Checagem da página',font=f(32,'Bold'),fill=INK)
for i,t in enumerate(['Nome e nº da OAB visíveis','Sem promessa de resultado','Sem divulgar honorários','Tom informativo','Botão direto para o WhatsApp']):
    yy=cy+100+i*62; d.ellipse((cx+36,yy+4,cx+70,yy+38),fill=(31,122,58)); d.line((cx+45,yy+21,cx+51,yy+29,cx+62,yy+13),fill=WH,width=5); d.text((cx+86,yy),t,font=f(26,'Regular'),fill=INK)
phone(c,'lp-helena-mob.png',832,cy-10,340,620); chip(d,1160,'Gere a sua grátis'); rodape(d); save(c,'JURIS_oab_H04_v1')
# 6 pesquisa
c,d=base(); y=hook(d,90,'O cliente te pesquisou. O\u00a0que\u00a0achou?',hl='O\u00a0que\u00a0achou?')
y=center(d,y+14,'Uma página profissional com botão direto para o seu WhatsApp.',f(34,'Regular'),MUT)
t0=y+30; phone(c,'lp-helena-mob.png',W//2,t0,int((1150-t0)*0.53),1150-t0); chip(d,1160,'Gere a sua grátis'); rodape(d); save(c,'JURIS_pesquisa_H05_v1')
