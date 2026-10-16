set -e
O=fotosadv/2026-10-16-variacoes/lp; mkdir -p $O
curl -sSfL -A "Mozilla/5.0" https://viralizeshop.com/business-photo -o $O/page.html
grep -oE '(src|href)="[^"]+\.js[^"]*"' $O/page.html | sed -E 's/^(src|href)="//;s/"$//' | sort -u > $O/js.txt || true
i=0; while read -r u; do case "$u" in http*) url="$u";; /*) url="https://viralizeshop.com$u";; *) url="https://viralizeshop.com/$u";; esac; i=$((i+1)); curl -sSfL -A "Mozilla/5.0" "$url" -o $O/js_$i.js || true; done < $O/js.txt
ls -la $O
