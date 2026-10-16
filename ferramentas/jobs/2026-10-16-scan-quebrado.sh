set -e
pip install -q opencv-python-headless
O=fotosadv/2026-10-16-variacoes/scan; mkdir -p $O /tmp/v
while read -r p; do f=/tmp/v/$(echo "$p" | tr '/' '_'); curl -sSfL "https://n3w-meta.othon-rdss.workers.dev/m/$p" -o "$f" || echo "falhou $p"; done < ferramentas/jobs/scan/bucket_list.txt
cd /tmp/v && python3 $GITHUB_WORKSPACE/ferramentas/jobs/scan/scan.py $GITHUB_WORKSPACE/ferramentas/jobs/scan/tpl-quadro-quebrado.png *.mp4
cp /tmp/v/scan_log.txt $GITHUB_WORKSPACE/$O/bucket_scan.jsonl
