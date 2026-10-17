# T3 (Othon 16/10): versão 9:16 dos estáticos novos para Reels/Stories. A peça 4:5 vai inteira na faixa segura
# (sem as áreas cobertas pela interface: ~12% em cima, ~30% embaixo). 0 crédito.
import os, glob
from PIL import Image
D = os.path.dirname(os.path.abspath(__file__)); BG = (15, 18, 32)
for f in sorted(glob.glob(os.path.join(D, 'FOTOSADV_*_v[2-5]_*.png'))):
    if f.endswith('_9x16.png'): continue
    im = Image.open(f).convert('RGB'); c = Image.new('RGB', (1080, 1920), BG)
    h = 1920 - 230 - 560; w = int(h * im.width / im.height)
    c.paste(im.resize((w, h), Image.LANCZOS), ((1080 - w) // 2, 230))
    c.save(f[:-4] + '_9x16.png'); print(os.path.basename(f[:-4] + '_9x16.png'))
