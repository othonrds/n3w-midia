#!/bin/bash
# Baixa em qualidade original os vídeos dos 5 criativos que mais venderam.
set -u
mkdir -p estudio/top5
while read -r nome url; do
  [ -z "$nome" ] && continue
  curl -fsSL --retry 4 -A "Mozilla/5.0" "$url" -o "estudio/top5/$nome.mp4" < /dev/null && echo "ok $nome" || echo "falhou $nome"
done < estudio/top5.txt
rm -f estudio/top5.txt
