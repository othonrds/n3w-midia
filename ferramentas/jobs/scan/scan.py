import cv2, sys, json
tpl0=cv2.imread(sys.argv[1],cv2.IMREAD_GRAYSCALE)
K=0.25
out=open('scan_log.txt','a')
for v in sys.argv[2:]:
    cap=cv2.VideoCapture(v); fps=cap.get(cv2.CAP_PROP_FPS) or 30; n=int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); step=max(1,int(fps/2))
    hits=[]; i=0
    while True:
        ok,fr=cap.read()
        if not ok: break
        if i%step==0:
            g=cv2.cvtColor(fr,cv2.COLOR_BGR2GRAY); g=cv2.resize(g,None,fx=K*720/g.shape[1],fy=K*720/g.shape[1])
            best=0
            for s in (0.2,0.3,0.42,0.55,0.7,0.85,1.0,1.15,1.3,1.5):
                t=cv2.resize(tpl0,None,fx=s*K,fy=s*K)
                if t.shape[0]>=g.shape[0] or t.shape[1]>=g.shape[1] or t.shape[0]<10: continue
                best=max(best,cv2.matchTemplate(g,t,cv2.TM_CCOEFF_NORMED).max())
            if best>0.6: hits.append((round(i/fps,1),round(float(best),2)))
        i+=1
    out.write(json.dumps({'v':v,'hits':hits})+'\n'); out.flush()
