O=fotosadv/2026-10-29-gerando/vozes; mkdir -p $O
U=https://d8j0ntlcm91z4.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/hf_20261030_023204_
{
set -- 01_andre:38f2d3a0-c401-48d3-805e-38a69d50dff8 02_leo:90c499f9-550f-4c97-8e91-b4b40ab7f101 03_julian:c7fc1983-ba66-4bcf-a618-f591597a238b 04_marcus:1bf15eea-9247-4adc-b680-c3dc8930a6ca 05_mark:6a5bc2aa-63a6-4b50-850d-f50606dcde2c 06_livia:ae476a0c-7504-40af-883a-c958a7482684 07_isabella:32153ae0-9759-4100-98fa-61bf3745eed8 08_amanda:a2349390-24b7-4bef-9d50-2aac4df8cd2d 09_helena:03f84978-629d-47ef-ac9b-ce7697eddcc3 10_luna:dd7b661e-69cf-4dc8-ae23-efe928a8ea6e
for p in "$@"; do n=${p%%:*}; id=${p#*:}; curl -sSL -o $O/$n.mp3 -w "$n %{http_code} %{size_download}\n" $U$id.mp3; done
python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -q faster-whisper
/tmp/venv/bin/python - <<'PY'
from faster_whisper import WhisperModel
import subprocess, numpy as np, glob
def load(f):
    raw=subprocess.run(["ffmpeg","-nostdin","-loglevel","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768
m=WhisperModel("small", device="cpu", compute_type="int8")
out=open("fotosadv/2026-10-29-gerando/vozes/analise.txt","w")
for f in sorted(glob.glob("fotosadv/2026-10-29-gerando/vozes/*.mp3")):
    a=load(f); segs,info=m.transcribe(a)
    txt=" ".join(s.text.strip() for s in segs)
    out.write(f"{f.split('/')[-1]} | dur {len(a)/16000:.1f}s | lang {info.language} {info.language_probability:.2f} | {txt}\n")
out.close()
PY
} > $O/job.log 2>&1
exit 0
