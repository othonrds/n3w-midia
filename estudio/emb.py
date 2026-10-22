import open_clip, torch, json, glob, os
from PIL import Image
m, _, pre = open_clip.create_model_and_transforms('ViT-B-32', pretrained='laion2b_s34b_b79k'); m.eval()
out = {}
files = sorted(glob.glob('estudio/f/*.jpg') + glob.glob('estudio/img/*.jpg'))
with torch.no_grad():
    for i in range(0, len(files), 32):
        b = files[i:i+32]
        x = torch.stack([pre(Image.open(f).convert('RGB')) for f in b])
        e = m.encode_image(x); e = e / e.norm(dim=-1, keepdim=True)
        for f, v in zip(b, e.tolist()): out[os.path.relpath(f, 'estudio')] = [round(t, 5) for t in v]
json.dump(out, open('estudio/emb.json', 'w'))
print(len(out), 'embeddings')
