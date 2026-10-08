# kitwork — vídeos de anúncio dos jogos do KIT ADHD

Pipeline usado em 08/10 para os 6 vídeos v1 (tdah/kit-ads/KIT_<JOGO>_v1.mp4).

1. Clonar os jogos: `git clone https://github.com/othonrds/adhd-reflex /home/claude/adhd-reflex` (rec.js lê `kit-5345843cc6/games/`).
2. Gravar: `K=5 node rec.js <jogo> <dir>` (Playwright em /opt/npm-tools/node_modules/playwright; bots em `bots/<jogo>.js`; jogo roda a 1/K da velocidade e é re-temporizado depois). Block Drop: `node bdplan.js` gera o tabuleiro pré-montado.
3. Editar: `python3 make_ad.py <jogo>` (gancho, zooms, end card, trilha via ../som.py, loudnorm -14 LUFS). Ajuste ganchos/textos no topo do arquivo.
4. `mont.py`: folha de contato.
Fontes: Anton/Archivo/Rubik (ver caminhos em make_ad.py; ajuste se mudar de máquina).
