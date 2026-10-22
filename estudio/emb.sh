#!/bin/bash
# Estúdio de Criativos: embeddings visuais (CLIP) dos quadros e imagens, para medir o quanto os criativos se parecem.
set -e
pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -q open_clip_torch pillow
python3 estudio/emb.py
