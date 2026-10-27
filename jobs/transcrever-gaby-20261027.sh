O=fotosadv/2026-10-27-voz; mkdir -p $O/src
{
git fetch -q --depth=1 origin estudio-midia:refs/remotes/origin/estudio-midia
for f in 3_V01_selfie-vira-ensaio 4_Gaby01_v1; do git show origin/estudio-midia:estudio/top5/$f.mp4 > $O/src/$f.mp4; done
ls -la $O/src
python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -q faster-whisper
/tmp/venv/bin/python - <<'PY'
from faster_whisper import WhisperModel
m=WhisperModel("small", device="cpu", compute_type="int8")
out=open("fotosadv/2026-10-27-voz/transcricao.txt","w")
for f in ["3_V01_selfie-vira-ensaio","4_Gaby01_v1"]:
    segs,_=m.transcribe(f"fotosadv/2026-10-27-voz/src/{f}.mp4", language="pt", word_timestamps=True)
    out.write(f"== {f}\n")
    for s in segs:
        out.write(f"{s.start:6.2f}-{s.end:6.2f} {s.text}\n")
        out.write("   W: "+" ".join(f"{w.word.strip()}@{w.start:.2f}" for w in s.words)+"\n")
out.close()
PY
} > $O/job.log 2>&1
rm -rf $O/src
exit 0
