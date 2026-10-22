#!/bin/bash
# Estúdio de Criativos: baixa os vídeos dos anúncios, gera versão leve (360p) e quadros para comparar criativos.
set -u
cd estudio; mkdir -p v f
while read -r id url; do
  [ -z "$id" ] && continue
  curl -fsSL "$url" -o /tmp/$id.mp4 || { echo "falhou $id"; continue; }
  ffmpeg -loglevel error -y -i /tmp/$id.mp4 -t 60 -vf "scale=-2:360" -c:v libx264 -crf 30 -preset veryfast -c:a aac -b:a 64k -movflags +faststart v/$id.mp4
  dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 /tmp/$id.mp4)
  for k in 0 1 2 3 4 5; do
    case $k in 0) t=0.3;; 1) t=1.5;; 2) t=3;; *) t=$(python3 -c "print(round($dur*($k-2)/4,2))");; esac
    ffmpeg -loglevel error -y -ss $t -i /tmp/$id.mp4 -frames:v 1 -vf "scale=256:-2" f/${id}_$k.jpg
  done
  echo "ok $id $dur"
done < urls.txt
rm -f urls.txt
