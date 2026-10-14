# FOTOSADV – ângulo novo "foto desatualizada" (a foto de perfil é antiga: formatura, 10 anos atrás). 100% código (Pillow), 0 crédito.
# Visual, prova e barra de preço idênticos ao estático H01 v2 (o estático que mais vende); entre as 3 peças muda SÓ o hook.
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(D, '..', '2026-10-12'))
import gen_realismo as r

if __name__ == '__main__':
    o = lambda n: os.path.join(D, n)
    r.peca(['Sua foto de perfil', 'tem quantos anos?'], o('FOTOSADV_desatualizada_H27_v1.png'))
    r.peca(['Você mudou.', 'Sua foto de perfil, não.'], o('FOTOSADV_desatualizada_H28_v1.png'))
    r.peca(['Foto da formatura não', 'é foto profissional.'], o('FOTOSADV_desatualizada_H29_v1.png'))
    print('ok')
