exec(open('est2.py').read().split("um('JURIS_prev-bpc")[0])
from PIL import Image
def leque(c,shots,top,hh):
    w=int(hh*0.5); pad=max(12,w//26); h2=hh-2*pad
    pos=[(W//2-255,top+70,-5),(W//2+255,top+70,5),(W//2,top,0)]
    for (cx,t,ang),sh in zip(pos,shots):
        layer=Image.new('RGBA',(W,H),(0,0,0,0)); tmp=Image.new('RGB',(W,H)); 
        base_=c.copy(); phone(base_,'shots/'+sh+'.png',cx,t,w,h2)
        m=Image.new('L',(W,H),0); ImageDraw.Draw(m).rounded_rectangle((cx-w//2-pad-50,t-50,cx+w//2+pad+50,t+h2+2*pad+70),70,fill=255)
        rot=base_.rotate(ang,center=(cx,t+hh//2),resample=Image.BICUBIC); mr=m.rotate(ang,center=(cx,t+hh//2))
        c.paste(rot,(0,0),mr)
# A: sem preço, bio link
c,d=base(); y=hook(d,80,'Seu cliente te achou no Instagram. E o link da bio?',hl='link da bio?'); y=center(d,y+10,'Uma página com a sua área, a sua foto e o botão do WhatsApp. Pronta em 30 segundos.',f(32,'Regular'),MUT)
t0=y+40; hh=1130-t0; w=int(hh*0.5); phone(c,'shots/bio-ana.png',W//2,t0,w,hh-2*max(12,w//26)); chip(d,1168,'Veja a sua grátis'); rodape(d); save(c,'JURIS_v2-bio_H08_semPreco')
# B: sem preço, 7 modelos em leque
c,d=base(); y=hook(d,80,'7 modelos de página prontos para advogados',hl='7 modelos'); y=center(d,y+10,'Do link da bio ao site completo, com textos da sua área e nas regras da OAB.',f(32,'Regular'),MUT)
leque(c,['hub-ana','edi-prev','imp-trab'],y+50,1110-(y+50)); d=ImageDraw.Draw(c); chip(d,1168,'Escolha o seu'); rodape(d); save(c,'JURIS_v2-modelos_H09_semPreco')
# C: com preço, a partir de 97
c,d=base(); y=hook(d,80,'Sua página de advocacia a partir de R$ 97',hl='R$ 97'); y=center(d,y+10,'Pagamento único no Pix, 12 meses de hospedagem. Veja pronta antes de pagar.',f(32,'Regular'),MUT)
t0=y+40; hh=1130-t0; w=int(hh*0.5); phone(c,'shots/imp-trab.png',W//2,t0,w,hh-2*max(12,w//26)); chip(d,1168,'Gere a sua grátis'); rodape(d); save(c,'JURIS_v2-97_H10_comPreco')
# D: com preço, 3 por 199
c,d=base(); y=hook(d,80,'3 páginas de advocacia por R$ 199',hl='R$ 199'); y=center(d,y+10,'A área e mais duas teses, cada uma com seu link. Pagamento único no Pix.',f(32,'Regular'),MUT)
leque(c,['prev-apos','prev-bpc','edi-prev'],y+50,1110-(y+50)); d=ImageDraw.Draw(c); chip(d,1168,'Gere a sua grátis'); rodape(d); save(c,'JURIS_v2-199_H11_comPreco')
