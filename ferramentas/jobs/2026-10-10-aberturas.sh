set -e
sudo apt-get install -y -qq fonts-montserrat >/dev/null || true
pip install -q pillow
python3 ferramentas/jobs/aberturas.py
