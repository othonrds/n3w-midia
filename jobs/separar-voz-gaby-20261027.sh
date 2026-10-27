O=fotosadv/2026-10-27-voz; mkdir -p $O/src
{
git fetch -q --depth=1 origin estudio-midia:refs/remotes/origin/estudio-midia
git show origin/estudio-midia:estudio/top5/3_V01_selfie-vira-ensaio.mp4 > $O/src/v01.mp4
ffmpeg -nostdin -loglevel error -y -i $O/src/v01.mp4 -ac 2 -ar 44100 $O/src/v01.wav
python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -q torch torchaudio --index-url https://download.pytorch.org/whl/cpu && /tmp/venv/bin/pip install -q demucs soundfile
/tmp/venv/bin/python -m demucs --two-stems=vocals -n htdemucs -o $O/sep $O/src/v01.wav
ls -R $O/sep
ffmpeg -nostdin -loglevel error -y -i $O/sep/htdemucs/v01/vocals.wav -c:a pcm_s16le $O/v01_voz.wav
} > $O/job_sep.log 2>&1
rm -rf $O/src $O/sep
exit 0
