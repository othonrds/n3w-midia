# Simulados Banca ANAC – PP e PC: fontes e pontos de revisão

Arquivo: `questoes.json` (v1.0-mvp, 08/10/2026). São 120 questões originais: 80 de PP e 40 de PC. Nenhuma foi copiada de prova oficial nem de banco comercial.

## Fontes oficiais consultadas

| Fonte | URL | O que foi confirmado |
|---|---|---|
| RBAC 61 – Emenda 16 (15/08/2024), PDF ANAC/Pergamum | https://pergamum.anac.gov.br/arquivos/RBAC61EMD16.pdf | 61.73: PP com 18 anos e ensino médio. 61.19(b): classe 24 meses, tipo 12 meses. 61.21: 3 decolagens e 3 pousos em 90 dias. 61.33: tolerância de vencimento |
| Página do RBAC 61 na ANAC | https://www.anac.gov.br/assuntos/legislacao/legislacao-1/rbha-e-rbac/rbac/rbac-61 | Emenda vigente (EMD 16) |
| RBAC 61 – Emenda 13 (anexo do Boletim de Pessoal, 2020) | https://www.anac.gov.br/assuntos/legislacao/legislacao-1/boletim-de-pessoal/2020/12/anexo-vii-rbac-no-61-emenda-13 | Horas do PP (61.81). Usadas só como referência e **sem questão** |
| RBAC 91 – Emenda 08 (Res. 816, de 28/09/2026; publicada em 02/10/2026) | https://www.anac.gov.br/assuntos/legislacao/legislacao-1/boletim-de-pessoal/2026/bps-v-21-no-39-28-09-a-02-10-2026/rbac-91-emd-08/visualizar_ato_normativo | 91.3 (autoridade do PIC e desvio em emergência), 91.17 (álcool: qualquer concentração), 91.151 (VFR com 30 min de dia e 45 min à noite), 91.203, 91.205, 91.209, 91.211 (oxigênio) |
| Carta de Serviços gov.br: licença de Piloto Privado | https://www.gov.br/pt-br/servicos/obter-licenca-para-exercer-a-atividade-de-piloto-privado-aviao-ppr-helicoptero-pph-ou-dirigivel-ppd | PP: 18 anos, ensino médio, CMA de 2ª classe |
| Carta de Serviços gov.br: licença de Piloto Comercial | https://www.gov.br/pt-br/servicos/obter-licenca-para-exercer-a-atividade-de-piloto-comercial-aviao-pcm-helicoptero-pch-ou-dirigivel-pcd | PC: titular de PP, 18 anos, ensino médio, CMA de 1ª classe, experiência conforme 61.101 |
| ICA 100-12 – Regras do Ar (DECEA) | https://publicacoes.decea.mil.br/publicacao/ica-100-12 | Versão vigente desde 28/11/2024 (BCA 206, de 14/11/2024). Uma alteração entra em vigor em **26/11/2026**: https://publicacoes.decea.mil.br/version/2002 |
| ICA 100-37 – Serviços de Tráfego Aéreo (DECEA) | https://publicacoes.decea.mil.br/assunto/Tr%C3%A1fego%20A%C3%A9reo | Classes de espaço aéreo |
| Índice de publicações DECEA | https://publicacoes.decea.mil.br/publicacao/indice | MCA 105-16 (códigos METAR/TAF), ICA 96-1 e MCA 101-1 citados como referência de estudo |

Limitações da pesquisa:
- O texto completo da ICA 100-12 e da ICA 100-37 não pôde ser aberto, porque o PDF é carregado por script no portal do DECEA. As questões de Regras do Ar usam valores consagrados e estáveis: VMC 5 km / 1.500 m / 1.000 ft, teto de 1.500 ft com 5 km na CTR, alturas mínimas de 500 ft e de 1.000 ft num raio de 600 m, níveis VFR ímpar/par + 500, direito de passagem, sinais luminosos e códigos de transponder.
- As páginas de normas em gov.br/anac pediram CAPTCHA. Por isso o RBAC 61 foi lido no Pergamum, onde a leitura ficou truncada na seção 61.79.

## Assuntos deixados de fora de propósito (não foi possível confirmar o número vigente)
- Horas de voo exigidas para PP (61.81, EMD 16) e PC (61.101). A EMD 13 previa 40 h para PP (35 h em curso contínuo aprovado), 20 h em duplo comando, 10 h solo e navegação de 150 NM, mas não confirmei se as emendas 15 e 16 mudaram esses valores.
- Validade do CMA (RBAC 67), que teve alterações recentes.
- Altitude e nível de transição. Variam por TMA e não dá para fazer uma questão genérica sem ambiguidade.
- Erros da bússola em curvas para N/S. A regra se inverte no Hemisfério Sul, o que pode gerar confusão de gabarito.

## Questões para o instrutor revisar com atenção

| Questão | Motivo |
|---|---|
| PC-REG-007 (teto de 1.500 ft e visibilidade de 5 km na CTR/ATZ) e PP-REG-016 (mínimos VMC) | Valores da ICA 100-12 confirmados pelo conhecimento consolidado, não pelo PDF. Reconferir após a alteração de **26/11/2026** |
| PC-REG-006 (serviço prestado ao VFR na classe C) | Texto padrão do Anexo 11 da OACI, que a ICA 100-37 adota. Confirmar a redação |
| PP-REG-002 e PC-REG-001 (classes de CMA) | Os distratores “4ª classe” e “dispensa de CMA” devem continuar incorretos. Confirmar no RBAC 67 vigente |
| PC-TEC-005 (fonte estática alternativa) | Comportamento típico de monomotores não pressurizados. O manual de voo de cada aeronave prevalece |
| PP-MET-013 (gelo no carburador) e PC-MET-007 (gelo claro, de 0 a −10 °C) | Faixas aproximadas. Revisar a redação conforme a apostila usada pelo Rafael |
| PP-REG-006 (álcool) | Baseada no RBAC 91 EMD 08, publicado em 02/10/2026. Conferir a data de vigência da emenda |
| PP-NAV-014 (escala da WAC) | Confirmar que a escala 1:1.000.000 continua sendo a referência das cartas em uso no Brasil |
