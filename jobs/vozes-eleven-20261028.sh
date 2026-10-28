O=fotosadv/2026-10-27-voz; mkdir -p $O
{
curl -sSL -o $O/voz_livia.mp3 "https://d8j0ntlcm91z4.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/hf_20261028_031959_f66ba4b1-f2f2-48e8-8ddc-501f3123cc4b.mp3"
curl -sSL -o $O/voz_andre.mp3 "https://d8j0ntlcm91z4.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u/hf_20261028_031958_b36f7b4e-1e1c-4acc-aca2-3831caeec626.mp3"
for v in livia andre; do ffmpeg -nostdin -loglevel error -y -i $O/voz_$v.mp3 -ac 1 -ar 44100 $O/voz_$v.wav; done
python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -q faster-whisper
/tmp/venv/bin/python - <<'PY'
from faster_whisper import WhisperModel
import subprocess, numpy as np
def load(f):
    raw=subprocess.run(["ffmpeg","-nostdin","-loglevel","error","-i",f,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    return np.frombuffer(raw,np.int16).astype(np.float32)/32768
m=WhisperModel("small", device="cpu", compute_type="int8")
out=open("fotosadv/2026-10-27-voz/transcricao_eleven.txt","w")
for v in ["livia","andre"]:
    segs,_=m.transcribe(load(f"fotosadv/2026-10-27-voz/voz_{v}.wav"), language="pt", word_timestamps=True)
    out.write(f"== {v}\n")
    for s in segs:
        out.write(f"{s.start:6.2f}-{s.end:6.2f} {s.text}\n")
        out.write("   W: "+" ".join(f"{w.word.strip()}@{w.start:.2f}-{w.end:.2f}" for w in s.words)+"\n")
out.close()
PY
} > $O/job_eleven.log 2>&1
exit 0
