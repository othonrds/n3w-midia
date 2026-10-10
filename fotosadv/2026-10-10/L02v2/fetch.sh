#!/bin/bash
# Traz as pecas L02v2 (compostas no sandbox Higgsfield a partir de fontes 2k, sem ampliacao) para o repo.
set -e
D=fotosadv/2026-10-10/L02v2
mkdir -p $D
B=https://d2ol7oe51mr4n9.cloudfront.net/user_38lL1t3zHzVQDjU5qT29V8iXM0u
g(){ curl -sfL -o "$D/$1" "$B/$2"; echo "$1 $(stat -c %s $D/$1)"; }
g L02v2-1_reels_selfie-6-ensaios_13s.mp4 bf7a15d4-13d0-4374-90b1-90cef03b673f.mp4
g L02v2-3_mashup_4-personas_14s.mp4 1fee881d-5aef-4a4b-8827-03fff9414736.mp4
g L02v2-6_texto-cinetico_8s.mp4 ce626967-606d-40ea-99a2-d9fb8a212adf.mp4
g L02v2-7_V02-hook-novo_18s.mp4 0e6ee4b6-ca12-4d64-85c8-65d3140e37d5.mp4
g L02v2-8_advogada_estrutura-V02_16s.mp4 2d54b367-0678-4936-ad33-5f32d4fd9fda.mp4
g L02v2-2_carrossel_card1.png 897aa843-675c-4eae-a8a1-b71461fa3df5.png
g L02v2-2_carrossel_card2.png c0405997-c436-4d61-b7d7-64db3450af37.png
g L02v2-2_carrossel_card3.png b1570133-106a-4d5b-bf76-6caba152fbd3.png
g L02v2-2_carrossel_card4.png c3ffa43e-3d66-4e16-9af1-7f2101c5cbbc.png
g L02v2-2_carrossel_card5.png b006cb4a-1cd3-4f9b-8e69-e00471e430cd.png
g L02v2-4_grade3x3.png ec2339b8-cc45-4de1-8265-287a5e66b4b2.png
g L02v2-5_print-perfil.png f654a754-5346-4201-a27b-55b756ee16db.png
ffmpeg -v error -y -ss 0.8 -i $D/L02v2-1_reels_selfie-6-ensaios_13s.mp4 -frames:v 1 -q:v 2 $D/L02v2-1_thumb.jpg
ffmpeg -v error -y -ss 1.6 -i $D/L02v2-3_mashup_4-personas_14s.mp4 -frames:v 1 -q:v 2 $D/L02v2-3_thumb.jpg
ffmpeg -v error -y -ss 7.0 -i $D/L02v2-6_texto-cinetico_8s.mp4 -frames:v 1 -q:v 2 $D/L02v2-6_thumb.jpg
ffmpeg -v error -y -ss 0.6 -i $D/L02v2-7_V02-hook-novo_18s.mp4 -frames:v 1 -q:v 2 $D/L02v2-7_thumb.jpg
ffmpeg -v error -y -ss 1.8 -i $D/L02v2-8_advogada_estrutura-V02_16s.mp4 -frames:v 1 -q:v 2 $D/L02v2-8_thumb.jpg
ls -la $D
