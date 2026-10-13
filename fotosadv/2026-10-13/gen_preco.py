# FOTOSADV – ângulo novo "preço-âncora" (ensaio profissional custa caro; aqui R$ 39,90). 100% código (Pillow), 0 crédito.
# Visual, prova e barra de preço idênticos ao estático H01 v2 (o estático que mais vende); entre as 3 peças muda SÓ o hook.
import os, sys
D = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.join(D, '..', '2026-10-12'))
import gen_realismo as r

if __name__ == '__main__':
    o = lambda n: os.path.join(D, n)
    r.peca(['Ensaio profissional', 'por R$ 39,90.'], o('FOTOSADV_preco_H24_v1.png'))
    r.peca(['Quanto custa um ensaio?', 'Aqui, R$ 39,90.'], o('FOTOSADV_preco_H25_v1.png'))
    r.peca(['Custa menos que um', 'almoço de negócios.'], o('FOTOSADV_preco_H26_v1.png'))
    print('ok')
