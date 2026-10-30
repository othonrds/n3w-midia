import wave, numpy as np, sys, json
V,K,CUT,OUT=sys.argv[1],json.loads(sys.argv[2]),float(sys.argv[3]),sys.argv[4]
SR=44100; D=K['end']+2.0; N=int(D*SR); rng=np.random.default_rng(7)
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
    add(mus,kick(),t,.55 if t<K['pr'] else .4)
    add(mus,hat(),t+beat/2,.12)
    if k%4==0:
        c=chords[(k//4)%4]; n=int(beat*4*SR); tt=np.arange(n)/SR
        pad=sum(np.sin(2*np.pi*f*tt)+.3*np.sin(2*np.pi*2*f*tt) for f in c)/3
        pad*=np.minimum(1,tt/.6)*np.minimum(1,(n/SR-tt)/.6); add(mus,pad,t,.10)
    t+=beat; k+=1
# ---- efeitos
sfx=np.zeros(N)
n=int(.12*SR); FL=(K['s0']+K['s1'])/2; add(sfx,rng.standard_normal(n)*env(n,.001,.02),FL-.02,.5)          # obturador
add(sfx,rng.standard_normal(int(.08*SR))*env(int(.08*SR),.001,.03),FL+.05,.35)
n=int(.08*SR); tt=np.arange(n)/SR; add(sfx,np.sin(2*np.pi*1800*tt)*env(n,.001,.02),(K['p0']+K['p1'])/2,.35)   # toque
T0=K['g0']+0.2; DT=(K['g1']-K['g0']-0.7)/8
for i in range(8):                                                                 # pops das fotos
    n=int(.18*SR); tt=np.arange(n)/SR; f=500+i*70+900*np.exp(-tt*30)
    add(sfx,np.sin(2*np.pi*np.cumsum(f)/SR)*env(n,.002,.05),T0+i*DT,.45)
n=int(1.4*SR); tt=np.arange(n)/SR                                                  # ding
add(sfx,(np.sin(2*np.pi*1318.5*tt)+.6*np.sin(2*np.pi*1975.5*tt))*env(n,.002,.45),K['g1']-0.15,.35)
for at,g in [(K['g1']+0.25,.35),(K['pr']-0.1,.3)]:                                                # whoosh
    n=int(.7*SR); x=rng.standard_normal(n); y=np.convolve(x,np.ones(40)/40,'same'); tt=np.arange(n)/SR
    add(sfx,y*np.sin(np.pi*tt/(n/SR))**2,at,g*3)
# ---- voz
v=rd(V); voz=np.zeros(N); c=int(CUT*SR)
A=v[:c].copy(); B=v[c:].copy(); f=int(.015*SR); A[-f:]*=np.linspace(1,0,f); B[:f]*=np.linspace(0,1,f)
add(voz,A,0.15); add(voz,B,0.15+CUT+1.3)
voz=voz/np.max(np.abs(voz))*0.95
e=np.convolve(np.abs(voz),np.ones(4410)/4410,'same'); duck=np.convolve(np.where(e>0.01,0.45,1.0),np.ones(8820)/8820,'same')
mus=mus/np.max(np.abs(mus))
mix=voz+mus*0.32*duck+sfx*0.8
fade=np.ones(N); fl=int(.6*SR); fade[-fl:]=np.linspace(1,0,fl); mix*=fade
mix=mix/max(1,np.max(np.abs(mix)))*0.95
st=(np.stack([mix,mix],1)*32767).astype(np.int16)
w=wave.open(OUT,'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes()); w.close()
print('ok')
