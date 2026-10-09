from PIL import Image, ImageDraw
R='/tmp/claude-0/-home-claude/7be2a25d-8295-5915-b5e5-2e1a220a8c23/scratchpad/criacaoL02/repo/fotosadv/'
def o(p): return Image.open(R+p).convert('RGB')
a=o('2026-10-07/FOTOSADV_antes-depois_H01_v1_r3.png')
b=o('2026-10-07/FOTOSADV_antes-depois_H01_v2_r3.png')
c=o('2026-10-07/FOTOSADV_dor-selfie_H02_v1_r3.png')
e=o('2026-10-07/FOTOSADV_dor-selfie_H02_v2_r3.png')
d=o('2026-10-08-t25/FOTOSADV_T25_3_comecou-selfie.png')
h=o('2026-10-08-angulos/fotosadv_A_transformacao.jpg')
t=o('2026-10-08-t25/FOTOSADV_T25_5_ensaio-15.png')
C={
 'p1_selfie':(a,(66,300,526,1000)),'p1_ensaio':(a,(554,300,1013,1000)),
 'p2_selfie':(b,(66,300,526,1000)),'p2_ensaio':(b,(554,300,1013,1000)),
 'p3_selfie':(c,(66,300,526,1000)),'p3_ensaio':(c,(554,300,1013,1000)),
 'p4_selfie':(e,(66,300,526,1000)),'p4_ensaio':(e,(554,300,1013,1000)),
 'p3_ensaio2':(d,(452,250,1010,990)),
 'p5_selfie':(h,(60,276,462,800)),'p5_ensaio':(h,(622,276,1020,830)),
 'p5_escr':(h,(60,926,524,1092)),'p5_ext':(h,(560,926,1020,1092)),
}
names=['LinkedIn','Site','Forum','Reuniao','Retrato','WhatsApp','Cartao','Escritorio','Instagram']
for i,n in enumerate(names):
    x=[100,398,696][i%3]; y=[222,520,818][i//3]
    C['p6_'+n]=(t,(x+6,y+6,x+278,y+232))
for k,(im,box) in C.items(): im.crop(box).save('/tmp/claude-0/-home-claude/7be2a25d-8295-5915-b5e5-2e1a220a8c23/scratchpad/criacaoL02/work/src/'+k+'.png')
fs=list(C)
W=270;H=300
g=Image.new('RGB',(W*6,H*((len(fs)+5)//6)),'gray');dr=ImageDraw.Draw(g)
for i,k in enumerate(fs):
    im=Image.open('/tmp/claude-0/-home-claude/7be2a25d-8295-5915-b5e5-2e1a220a8c23/scratchpad/criacaoL02/work/src/'+k+'.png');s=im.size;im.thumbnail((W-4,H-24));g.paste(im,((i%6)*W,(i//6)*H));dr.text(((i%6)*W+2,(i//6)*H+H-20),f'{k} {s}',fill='yellow')
g.save('/tmp/claude-0/-home-claude/7be2a25d-8295-5915-b5e5-2e1a220a8c23/scratchpad/criacaoL02/frames/crops.jpg')
