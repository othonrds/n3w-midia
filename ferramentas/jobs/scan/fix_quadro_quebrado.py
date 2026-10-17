# Troca o quadro quebrado (advogado na mesa, boca borrada, ~9–12,5 s) por uma foto boa do próprio vídeo.
import cv2, sys, subprocess, numpy as np
src, out = sys.argv[1], sys.argv[2]
tpl = cv2.imread('/home/claude/fix/tpl.png', cv2.IMREAD_GRAYSCALE)
rep = cv2.imread('/home/claude/fix/f8.png')[220:870, 130:600]
rep = cv2.flip(rep, 1)
cap = cv2.VideoCapture(src); fps = cap.get(cv2.CAP_PROP_FPS); W = int(cap.get(3)); H = int(cap.get(4))
tmp = out + '.noaudio.mp4'
vw = cv2.VideoWriter(tmp, cv2.VideoWriter_fourcc(*'mp4v'), fps, (W, H))
i = 0; fixed = 0
while True:
    ok, fr = cap.read()
    if not ok: break
    t = i / fps
    if 8.8 <= t <= 12.8:
        g = cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY); best = (0, None)
        for s in np.arange(0.35, 1.45, 0.04):
            tt = cv2.resize(tpl, None, fx=s * W / 720, fy=s * W / 720)
            if tt.shape[0] >= H or tt.shape[1] >= W: continue
            r = cv2.matchTemplate(g, tt, cv2.TM_CCOEFF_NORMED); _, m, _, loc = cv2.minMaxLoc(r)
            if m > best[0]: best = (m, (loc, tt.shape))
        if best[0] > 0.62:
            (x, y), (h, w) = best[1]
            ins = max(4, int(w * 0.03))
            x0, y0, x1, y1 = x + ins, y + ins, x + w - ins, y + h - ins
            x0, y0 = max(0, x0), max(0, y0); x1, y1 = min(W, x1), min(H, y1)
            if x1 - x0 > 10 and y1 - y0 > 10:
                rr = rep; rh, rw = rr.shape[:2]; tw, th = x1 - x0, y1 - y0
                sc = max(tw / rw, th / rh); rr = cv2.resize(rr, (int(rw * sc) + 1, int(rh * sc) + 1))
                ox = (rr.shape[1] - tw) // 2; oy = int((rr.shape[0] - th) * 0.15)
                patch = rr[oy:oy + th, ox:ox + tw]
                # brilho igual ao do quadro original (acompanha fades)
                orig = fr[y0:y1, x0:x1].astype(np.float32); p = patch.astype(np.float32)
                p = np.clip(p * (orig.mean() / max(p.mean(), 1)), 0, 255).astype(np.uint8)
                fr[y0:y1, x0:x1] = p; fixed += 1
    vw.write(fr); i += 1
vw.release()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-i', src, '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', out], check=True)
subprocess.run(['rm', '-f', tmp])
print(out, 'quadros corrigidos:', fixed)
