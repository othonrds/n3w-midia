# Exemplos do Ensaio de aniversário

A página `/aniversario/` procura `/aniversario/ex/<id>.jpg` para cada cenário:
baloes, bolo, confete, brinde, piquenique, gala, pb, flores, presentes (mesmos ids de `motor_cenas`, produto `aniversario`).

Regras: só pessoas FICTÍCIAS geradas por IA (origem_rosto = "sintetico" no motor). Nunca foto de pessoa real da internet nem de cliente.
Formato: JPG vertical 2:3 (ex.: 1024×1536 reduzido para ~800×1200), até ~150 KB cada para a página continuar rápida no celular.
Enquanto o arquivo não existir, a página mostra um espaço reservado marcado "exemplo em produção".
