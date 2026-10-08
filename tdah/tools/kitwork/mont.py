import json,sys
from PIL import Image
d=json.load(open(sys.argv[1]+'/rec.json'));fr=d['frames'];t0=fr[0]['t']
ts=[float(x) for x in sys.argv[2].split(',')]
ims=[]
for t in ts:
    i=max([k for k in range(len(fr)) if fr[k]['t']-t0<=t] or [0])
    ims.append(Image.open(sys.argv[1]+'/f/'+fr[i]['f']).convert('RGB').resize((360,640)))
m=Image.new('RGB',(360*len(ims),640))
for i,im in enumerate(ims): m.paste(im,(i*360,0))
m.save(sys.argv[3]); print(Image.open(sys.argv[1]+'/f/'+fr[0]['f']).size)
