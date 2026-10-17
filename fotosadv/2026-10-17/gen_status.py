# FOTOSADV – ângulo novo "desfecho de status" (a reação de quem vê a foto: parece estúdio caro, ninguém nota a selfie).
# Versão BR do molde dos gringos (Photoshoot/Roast Dating, monitor 17/10). 100% código (Pillow), 0 crédito.
# Visual, prova e barra de preço idênticos ao estático H01 v2 (CPA R$ 35,25 no 1-1-1); entre as 3 peças muda SÓ o hook.
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(D, '..', '2026-10-12'))
import gen_realismo as r

if __name__ == '__main__':
    o = lambda n: os.path.join(D, n)
    r.peca(['Vão perguntar', 'qual estúdio fez.'], o('FOTOSADV_status_H30_v1.png'))
    r.peca(['Ninguém vai saber', 'que foi selfie.'], o('FOTOSADV_status_H31_v1.png'))
    r.peca(['Cara de sócio de', 'escritório grande.'], o('FOTOSADV_status_H32_v1.png'))
    print('ok')
