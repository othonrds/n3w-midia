from PIL import Image, ImageDraw, ImageFont, ImageFilter
import sys
R='/home/claude/n3w-midia/fotosadv/2026-10-07/'
F='/usr/share/fonts/truetype/google-fonts/Poppins-'
def f(w,s): return ImageFont.truetype(F+w+'.ttf',s)
BG=(14,18,32); GOLD=(232,186,72); WHITE=(255,255,255); GREY=(150,158,175); GREEN=(37,211,102)
src=Image.open(R+'FOTOSADV_dor-selfie_H02_v1_r3.png').convert('RGB')
before=src.crop((50,440,530,920))   # rosto selfie
after=src.crop((640,295,1000,655))  # rosto/peito profissional
def circ(im,d):
    im=im.resize((d,d),Image.LANCZOS); m=Image.new('L',(d*4,d*4),0)
    ImageDraw.Draw(m).ellipse((0,0,d*4-1,d*4-1),fill=255); m=m.resize((d,d),Image.LANCZOS)
    o=Image.new('RGBA',(d,d)); o.paste(im,(0,0),m); return o
def ctext(d,y,t,font,fill,W=1080):
    w=d.textlength(t,font=font); d.text(((W-w)/2,y),t,font=font,fill=fill)
def hook(d,lines,y0=70,size=74,colors=None):
    y=y0
    for i,l in enumerate(lines):
        c=(colors[i] if colors else WHITE); ctext(d,y,l,f('Bold',size),c); y+=size+16
    return y
def pricebar(img,y=1130):
    d=ImageDraw.Draw(img); d.rounded_rectangle((60,y,1020,y+160),28,fill=WHITE)
    d.line((540,y+30,540,y+130),fill=(220,222,228),width=3)
    for cx,a,b in [(300,'3 fotos','R$ 39,90'),(780,'15 fotos','R$ 89')]:
        fa=f('Regular',34); fb=f('Bold',58)
        d.text((cx-d.textlength(a,font=fa)/2,y+22),a,font=fa,fill=(90,96,110))
        d.text((cx-d.textlength(b,font=fb)/2,y+66),b,font=fb,fill=BG)
def phone_card(img,x,y,w,h,face,tag,good):
    d=ImageDraw.Draw(img)
    d.rounded_rectangle((x,y,x+w,y+h),36,fill=(242,244,247))
    d.rounded_rectangle((x,y,x+w,y+92),36,fill=(7,94,84)); d.rectangle((x,y+50,x+w,y+92),fill=(7,94,84))
    d.text((x+28,y+22),'Contato',font=f('Medium',32),fill=WHITE)
    D=300; c=circ(face,D); img.paste(c,(x+(w-D)//2,y+145),c)
    nm='Advogado(a)'; fn=f('Bold',40); d.text((x+(w-d.textlength(nm,font=fn))/2,y+485),nm,font=fn,fill=BG)
    st='online'; fs=f('Regular',30); d.text((x+(w-d.textlength(st,font=fs))/2,y+538),st,font=fs,fill=GREY)
    # botoes ilustrativos (sem parecer clicaveis): barras cinza
    d.rounded_rectangle((x+40,y+605,x+w-40,y+675),20,fill=(225,228,234))
    fl=f('Bold',34); col=(GREEN if good else (200,70,70))
    d.text((x+(w-d.textlength(tag,font=fl))/2,y+619),tag,font=fl,fill=col)
def foot(d,t='Imagem ilustrativa · fotos feitas a partir de selfies'):
    ctext(d,1300,t,f('Regular',24),GREY)

def v_cards(hl,cols,out):
    img=Image.new('RGB',(1080,1350),BG); d=ImageDraw.Draw(img)
    y=hook(d,hl,colors=cols)
    top=max(y+30,350)
    phone_card(img,60,top,465,720,before,'Selfie',False)
    phone_card(img,555,top,465,720,after,'Foto profissional',True)
    pricebar(img); foot(ImageDraw.Draw(img)); img.save(out)

def v_list(hl,cols,out):
    img=Image.new('RGB',(1080,1350),BG); d=ImageDraw.Draw(img)
    y=hook(d,hl,colors=cols); top=max(y+30,350)
    d.rounded_rectangle((60,top,1020,top+690),36,fill=(242,244,247))
    d.text((100,top+30),'Advogados encontrados',font=f('Bold',36),fill=BG)
    d.text((100,top+80),'Resultado ilustrativo',font=f('Regular',26),fill=GREY)
    rows=[(after,'Advogado(a) A','Foto profissional',True),(before,'Advogado(a) B','Selfie',False)]
    ry=top+140
    for face,nm,tag,good in rows:
        if good: d.rounded_rectangle((84,ry-14,996,ry+246),26,fill=WHITE,outline=GREEN,width=5)
        D=220; c=circ(face,D)
        if not good:
            c2=c.convert('RGB'); c2=Image.blend(c2,Image.new('RGB',c2.size,(242,244,247)),0.15); 
            m=c.split()[3]; c=c2.convert('RGBA'); c.putalpha(m)
        img.paste(c,(110,ry+4),c)
        d.text((360,ry+50),nm,font=f('Bold',42),fill=BG)
        d.text((360,ry+110),tag,font=f('Medium',34),fill=(GREEN if good else (200,70,70)))
        if good:
            d.text((360,ry+160),'O cliente liga para este',font=f('Regular',30),fill=(90,96,110))
        else:
            d.text((360,ry+160),'O cliente passa direto',font=f('Regular',30),fill=(90,96,110))
        ry+=290
    pricebar(img); foot(ImageDraw.Draw(img)); img.save(out)

O='/home/claude/criacao/'
v_cards(['Mesmo advogado.','Qual você chamaria?'],[WHITE,GOLD],O+'FOTOSADV_primeira-impressao_H08_v1.png')
v_cards(['O cliente escolhe','pela sua foto.'],[WHITE,GOLD],O+'FOTOSADV_primeira-impressao_H09_v1.png')
v_list(['Mesmo advogado.','Qual você chamaria?'],[WHITE,GOLD],O+'FOTOSADV_primeira-impressao_H08_v2.png')
