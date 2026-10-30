import wave, numpy as np
SR=44100; D=15.5; N=int(D*SR); rng=np.random.default_rng(7)
def rd(f):
    w=wave.open(f); x=np.frombuffer(w.readframes(w.getnframes()),np.int16).astype(np.float32)/32768
    return x.reshape(-1,w.getnchannels()).mean(1)
def add(buf,sig,at,g=1.0):
    i=int(at*SR); n=min(len(sig),N-i)
    if n>0: buf[i:i+n]+=sig[:n]*g
def env(n,a=0.005,d=0.2):
    t=np.arange(n)/SR; return np.minimum(1,t/a)*np.exp(-t/d)
# ---- trilha (100 bpm)
mus=np.zeros(N); beat=60/100
def kick():
    n=int(.35*SR); t=np.arange(n)/SR; f=110*np.exp(-t*18)+45
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def hat():
    n=int(.06*SR); x=rng.standard_normal(n); x=np.diff(np.r_[0,x]); return x*env(n,.001,.015)
chords=[[220,261.6,329.6],[174.6,220,261.6],[261.6,329.6,392],[196,246.9,293.7]]
t=0.0; k=0
while t<D:
    if t>=0.0: add(mus,kick(),t,.55 if t<12.4 else .4)
    add(mus,hat(),t+beat/2,.12)
    if k%4==0:
        c=chords[(k//4)%4]; n=int(beat*4*SR); tt=np.arange(n)/SR
        pad=sum(np.sin(2*np.pi*f*tt)+.3*np.sin(2*np.pi*2*f*tt) for f in c)/3
        pad*=np.minimum(1,tt/.6)*np.minimum(1,(n/SR-tt)/.6); add(mus,pad,t,.10)
    t+=beat; k+=1
# ---- efeitos
sfx=np.zeros(N)
n=int(.12*SR); add(sfx,rng.standard_normal(n)*env(n,.001,.02),1.15,.5)          # obturador
add(sfx,rng.standard_normal(int(.08*SR))*env(int(.08*SR),.001,.03),1.22,.35)
n=int(.08*SR); tt=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*1800*tt)*env(n,.001,.02),3.0,.35)   # toque
for i in range(8):                                                                 # pops das fotos
    n=int(.18*SR); tt=np.arange(n)/SR; f=500+i*70+900*np.exp(-tt*30)
    add(sfx,np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.002,.05),4.5+i*.6,.45)
n=int(1.4*SR); tt=np.arange(n)/SR                                                  # ding
add(sfx,(np.sin(2*np.pi*1318.5*tt)+.6*np.sin(2*np.pi*1975.5*tt))*env(n,.002,.45),9.2,.35)
for at,g in [(9.65,.35),(12.3,.3)]:                                                # whoosh
    n=int(.7*SR); x=rng.standard_normal(n); y=np.convolve(x,np.ones(40)/40,'same'); tt=np.arange(n)/SR
    add(sfx,y*np.sin(np.pi*tt/(n/SR))**2,at,g*3)
# ---- voz
v=rd('voz.wav'); voz=np.zeros(N)
for a,b,at in [(0.0,1.30,0.25),(1.72,3.05,2.15),(3.48,7.35,4.40),(7.68,9.40,12.70)]:
    seg=v[int(a*SR):int(b*SR)].copy(); f=int(.02*SR); seg[:f]*=np.linspace(0,1,f); seg[-f:]*=np.linspace(1,0,f); add(voz,seg,at)
voz=voz/np.max(np.abs(voz))*0.95
e=np.convolve(np.abs(voz),np.ones(4410)/4410,'same'); duck=np.convolve(np.where(e>0.01,0.45,1.0),np.ones(8820)/8820,'same')
mus=mus/np.max(np.abs(mus))
mix=voz+mus*0.32*duck+sfx*0.8
fade=np.ones(N); fl=int(.6*SR); fade[-fl:]=np.linspace(1,0,fl); mix*=fade
mix=mix/max(1,np.max(np.abs(mix)))*0.95
st=(np.stack([mix,mix],1)*32767).astype(np.int16)
w=wave.open('mix.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok')
