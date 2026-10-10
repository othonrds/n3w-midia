set -e
B=https://n3w-meta.othon-rdss.workers.dev/m/fotosadv/criativos
O=fotosadv/2026-10-10-aberturas/insumos
mkdir -p $O /tmp/in
curl -sSfL $B/V01-selfie-ensaio/video.mp4 -o /tmp/in/V01.mp4
for h in H4 H6 H7; do curl -sSfL $B/V03-$h/video.mp4 -o /tmp/in/$h.mp4; done
for f in V01 H4 H6 H7; do
  ffprobe -v error -show_entries stream=codec_type,width,height,r_frame_rate,duration -of compact /tmp/in/$f.mp4 > $O/$f.probe.txt
  ffmpeg -v error -y -i /tmp/in/$f.mp4 -vf "fps=2,scale=180:-2,tile=8x4" -frames:v 1 $O/$f-folha.jpg
  ffmpeg -v error -y -ss 0 -t 4 -i /tmp/in/$f.mp4 -vf "fps=4,scale=270:-2,tile=8x2" -frames:v 1 $O/$f-abertura.jpg
done
