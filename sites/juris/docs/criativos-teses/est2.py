from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
W,H=1080,1350; F='/usr/share/fonts/truetype/google-fonts/'
NAVY=(16,24,40); GOLD=(226,178,58); WH=(255,255,255); MUT=(178,190,210); INK=(20,24,36)
def f(sz,w='Bold'): return ImageFont.truetype(F+f'Poppins-{w}.ttf',sz)
def wrap(d,t,font,maxw):
    out=[];cur=''
    for w in t.split(' '):
        x=(cur+' '+w).strip()
        if d.textlength(x.replace(' ',' '),font=font)<=maxw: cur=x
        else: out.append(cur); cur=w
    out.append(cur); return out
def hook(d,y,t,sz=70,col=WH,maxw=W-128,hl=''):
    font=f(sz); lines=wrap(d,t,font,maxw); hw=set(hl.split(' '))
    for l in lines:
        x=(W-d.textlength(l,font=font))/2
        for i,w in enumerate(l.split(' ')):
            tok=(' ' if i else '')+w; d.text((x,y),tok,font=font,fill=GOLD if w in hw else col); x+=d.textlength(tok,font=font)
        y+=int(sz*1.17)
    return y
def center(d,y,t,font,col):
    for l in wrap(d,t,font,W-170):
        d.text(((W-d.textlength(l,font=font))/2,y),l,font=font,fill=col); y+=int(font.size*1.4)
    return y
def rr(im,r):
    m=Image.new('L',im.size,0); ImageDraw.Draw(m).rounded_rectangle((0,0,im.size[0]-1,im.size[1]-1),r,fill=255); return m
def phone(c,shot,cx,top,w,h):
    s=Image.open(shot).convert('RGB'); s=s.resize((w,int(s.height*w/s.width)),Image.LANCZOS).crop((0,0,w,h))
    pad=max(12,w//26); body=Image.new('RGB',(w+2*pad,h+2*pad),(8,10,16))
    sh=Image.new('RGBA',(body.width+80,body.height+80),(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((40,50,body.width+40,body.height+50),60,fill=(0,0,0,160))
    sh=sh.filter(ImageFilter.GaussianBlur(24)); c.paste(sh,(cx-body.width//2-40,top-40),sh)
    c.paste(body,(cx-body.width//2,top),rr(body,int(w*.13))); c.paste(s,(cx-w//2,top+pad),rr(s,int(w*.1)))
def base():
    c=Image.new('RGB',(W,H)); d=ImageDraw.Draw(c)
    for y in range(H): d.line((0,y,W,y),fill=(16+int(10*y/H),24+int(14*y/H),40+int(26*y/H)))
    return c,d
def rodape(d):
    d.text((64,H-72),'Juris Páginas',font=f(28,'Bold'),fill=GOLD)
    n='Exemplo ilustrativo · nomes fictícios'; fn=f(20,'Regular'); d.text((W-64-d.textlength(n,font=fn),H-64),n,font=fn,fill=MUT)
def chip(d,y,t,cx=W//2,sz=30,fill=GOLD,col=INK):
    fn=f(sz,'Medium'); w=d.textlength(t,font=fn)+56; x=cx-w/2
    d.rounded_rectangle((x,y,x+w,y+sz*2.1),sz*1.05,fill=fill); d.text((x+28,y+sz*.38),t,font=fn,fill=col)
OUT='out'; os.makedirs(OUT,exist_ok=True)
def save(c,n): c.save(f'{OUT}/{n}.png'); print(n)
def um(nome,hk,hl,sub,shot):
    c,d=base(); y=hook(d,80,hk,hl=hl); y=center(d,y+10,sub,f(32,'Regular'),MUT)
    t0=y+40; hh=1130-t0; w=int(hh*0.5); phone(c,'shots/'+shot+'.png',W//2,t0,w,hh-2*max(12,w//26)); chip(d,1168,'Gere a sua grátis'); rodape(d); save(c,nome)
def dois(nome,hk,hl,sub,a,b,la,lb):
    c,d=base(); y=hook(d,80,hk,hl=hl); y=center(d,y+10,sub,f(32,'Regular'),MUT)
    t0=y+100; hh=1130-t0; w=int(hh*0.5); hh-=2*max(12,w//26)
    for cx,sh,lab in ((W//2-232,a,la),(W//2+232,b,lb)):
        chip(d,t0-78,lab,cx,24,(255,255,255),INK); phone(c,'shots/'+sh+'.png',cx,t0,w,hh)
    chip(d,1168,'3 páginas por R$ 39,90'); rodape(d); save(c,nome)
um('JURIS_prev-bpc_H06_v1','Página de BPC/LOAS pronta em 30 segundos','BPC/LOAS','Para previdenciaristas: textos da tese, WhatsApp e regras da OAB.','prev-bpc')
dois('JURIS_prev-teses_H07_v1','Uma página para cada tese previdenciária','cada tese','BPC/LOAS, aposentadoria e mais, cada uma com seu link.','prev-bpc','prev-apos','BPC/LOAS','Aposentadoria')
um('JURIS_trab-he_H06_v1','Página de horas extras pronta em 30 segundos','horas extras','Para advogados trabalhistas: textos da tese, WhatsApp e regras da OAB.','trab-he')
dois('JURIS_trab-teses_H07_v1','Uma página para cada tese trabalhista','cada tese','Horas extras, rescisão e mais, cada uma com seu link.','trab-he','trab-resc','Horas extras','Rescisão')
um('JURIS_cons-voo_H06_v1','Página de voo cancelado pronta em 30 segundos','voo cancelado','Para quem atua no consumidor: atraso, cancelamento e bagagem.','cons-voo')
dois('JURIS_cons-teses_H07_v1','Uma página para cada tese do consumidor','cada tese','Voo, negativação e mais, cada uma com seu link.','cons-voo','cons-neg','Voo cancelado','Negativação')
