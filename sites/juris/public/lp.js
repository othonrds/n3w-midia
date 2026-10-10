// Juris Páginas — renderização da landing page do advogado.
// Usado no navegador (prévia e página publicada) e no servidor (api/lp.js). Sem dependências.
// Textos seguem o Provimento 205/2021 da OAB: informativos, sem promessa de resultado, sem honorários, OAB visível.

export const AREAS = {
 familia:{n:"Direito de Família",k:"Família e Sucessões",h:"Orientação jurídica clara para os momentos mais delicados da sua família",s:"Divórcio, guarda, pensão alimentícia e inventário conduzidos com discrição, escuta e conhecimento técnico.",sv:[["Divórcio e dissolução de união estável","Consensual ou litigioso, judicial ou em cartório, com atenção à partilha de bens."],["Guarda e convivência","Definição de guarda compartilhada ou unilateral e regime de convivência com os filhos."],["Pensão alimentícia","Fixação, revisão e execução de alimentos, considerando necessidade e possibilidade."],["Inventário e partilha","Inventário judicial ou extrajudicial e planejamento sucessório."],["Reconhecimento de paternidade","Ações de investigação e reconhecimento de vínculo."],["Pacto antenupcial","Escolha e formalização do regime de bens antes do casamento."]],f:[["O divórcio pode ser feito em cartório?","Sim, quando há acordo entre o casal e não há filhos menores ou incapazes, com a presença obrigatória de advogado."],["Quanto tempo demora um inventário?","Depende da existência de acordo entre herdeiros e da documentação. Na consulta, é feita uma estimativa para o seu caso."],["A pensão pode ser revista?","Sim, quando há mudança na situação financeira de quem paga ou na necessidade de quem recebe."]]},
 trabalhista:{n:"Direito do Trabalho",k:"Direito Trabalhista",h:"Seus direitos trabalhistas analisados com atenção e transparência",s:"Atendimento a trabalhadores em rescisões, horas extras, assédio e acidentes de trabalho.",sv:[["Rescisão e verbas rescisórias","Conferência dos valores pagos na demissão e cobrança do que estiver em aberto."],["Horas extras","Análise de jornada, intervalos e adicionais não pagos."],["Assédio moral","Orientação e medidas em casos de abuso no ambiente de trabalho."],["Acidente e doença do trabalho","Estabilidade, indenizações e encaminhamentos junto ao INSS."],["Reconhecimento de vínculo","Para quem trabalhou sem carteira assinada ou como PJ de forma irregular."],["FGTS e seguro-desemprego","Verificação de depósitos e acesso aos benefícios."]],f:[["Qual o prazo para entrar com ação trabalhista?","Até dois anos após o fim do contrato, podendo cobrar os últimos cinco anos trabalhados."],["Preciso de testemunhas?","Ajudam bastante, mas documentos, mensagens e registros também servem como prova."],["Posso ser demitido por buscar meus direitos?","A retaliação é vedada. Na consulta, você recebe orientação sobre como agir."]]},
 previdenciario:{n:"Direito Previdenciário",k:"Direito Previdenciário",h:"Orientação para sua aposentadoria e benefícios do INSS",s:"Planejamento previdenciário, aposentadorias, BPC/LOAS e recursos de benefícios negados.",sv:[["Planejamento de aposentadoria","Cálculo das regras de transição para encontrar a melhor data e o melhor valor."],["Benefício negado","Recurso administrativo e ação judicial contra indeferimentos do INSS."],["Auxílio por incapacidade","Auxílio-doença e aposentadoria por incapacidade permanente."],["BPC/LOAS","Benefício assistencial para idosos e pessoas com deficiência de baixa renda."],["Pensão por morte","Requerimento e defesa do direito de dependentes."],["Revisão de benefício","Análise de erros de cálculo em benefícios já concedidos."]],f:[["O INSS negou meu pedido. E agora?","É possível recorrer administrativamente ou ir à Justiça. O caminho depende do motivo da negativa."],["Vale a pena fazer planejamento?","Ele mostra as regras aplicáveis e o momento de pedir, evitando escolhas que reduzem o benefício."],["Atende pessoas de outras cidades?","Sim, boa parte do trabalho previdenciário pode ser feita de forma online."]]},
 criminal:{n:"Direito Criminal",k:"Direito Penal",h:"Defesa criminal técnica, com sigilo e atendimento ágil",s:"Atuação em inquéritos, flagrantes, audiências de custódia e processos criminais.",sv:[["Prisão em flagrante","Acompanhamento na delegacia e na audiência de custódia."],["Inquérito policial","Defesa desde a fase de investigação."],["Processo criminal","Defesa técnica em todas as fases da ação penal."],["Habeas corpus","Medidas contra prisões e constrangimentos ilegais."],["Crimes de trânsito","Defesa em casos de lesão, embriaguez e homicídio culposo."],["Execução penal","Progressão de regime, livramento condicional e benefícios."]],f:[["Fui intimado para depor. Preciso de advogado?","É recomendável comparecer acompanhado, mesmo como testemunha ou investigado."],["O atendimento é sigiloso?","Sim. O sigilo profissional é dever do advogado e garantia do cliente."],["Atende fora do horário comercial?","Situações de flagrante podem ser atendidas pelo WhatsApp informado nesta página."]]},
 consumidor:{n:"Direito do Consumidor",k:"Direito do Consumidor",h:"Problemas com empresas, bancos ou companhias aéreas? Entenda seus direitos",s:"Orientação e atuação em cobranças indevidas, negativação, voos cancelados e planos de saúde.",sv:[["Negativação indevida","Retirada do nome de cadastros de inadimplentes e reparação."],["Problemas com voos","Atrasos, cancelamentos, overbooking e extravio de bagagem."],["Plano de saúde","Negativas de cobertura, reajustes e cancelamentos."],["Cobranças bancárias","Tarifas, juros e descontos não reconhecidos."],["Produtos com defeito","Troca, conserto ou devolução do valor pago."],["Golpes e fraudes","Responsabilidade de bancos em transações não autorizadas."]],f:[["Qual o prazo para reclamar?","Varia conforme o caso, entre 90 dias e 5 anos. Guarde notas, prints e protocolos."],["Precisa ir ao fórum?","Muitos casos tramitam de forma eletrônica, com audiências por vídeo."],["Vale tentar acordo antes?","Sim, e a tentativa registrada ajuda como prova caso o processo seja necessário."]]},
 imobiliario:{n:"Direito Imobiliário",k:"Direito Imobiliário",h:"Segurança jurídica na compra, venda e locação de imóveis",s:"Análise de contratos, regularização de imóveis, usucapião e questões de locação.",sv:[["Due diligence na compra","Análise de matrícula, certidões e riscos antes de fechar negócio."],["Contratos","Elaboração e revisão de compra e venda, permuta e locação."],["Usucapião","Judicial ou extrajudicial, para regularizar a posse."],["Despejo e locação","Ações de despejo, revisional e renovatória."],["Distrato com construtora","Atrasos de obra e devolução de valores pagos."],["Condomínio","Cobranças, assembleias e conflitos entre condôminos."]],f:[["Preciso de advogado para comprar imóvel?","Não é obrigatório, mas a análise prévia reduz o risco de comprar com dívidas ou pendências."],["Usucapião pode ser feita em cartório?","Sim, na modalidade extrajudicial, quando os requisitos estão presentes."],["A construtora atrasou a obra. O que fazer?","Verifique o prazo de tolerância do contrato e procure orientação antes de assinar distrato."]]},
 tributario:{n:"Direito Tributário",k:"Direito Tributário",h:"Gestão tributária para empresas que querem pagar o correto",s:"Planejamento tributário, recuperação de créditos e defesa em autuações fiscais.",sv:[["Planejamento tributário","Escolha do regime e estrutura mais adequada ao negócio."],["Recuperação de créditos","Identificação de tributos pagos a maior nos últimos cinco anos."],["Defesa em autuações","Impugnação de autos de infração na esfera administrativa e judicial."],["Parcelamentos e transação","Negociação de débitos com Receita, PGFN e estados."],["Reforma tributária","Adequação às mudanças de IBS e CBS."],["Execução fiscal","Defesa em cobranças judiciais de tributos."]],f:[["Atende pequenas empresas?","Sim, inclusive empresas do Simples Nacional."],["Como funciona a recuperação de créditos?","Começa com uma análise dos documentos fiscais para identificar valores pagos indevidamente."],["A reforma tributária afeta minha empresa?","Afeta todos os setores, em ritmos diferentes. Uma análise mostra o impacto no seu caso."]]},
 bancario:{n:"Direito Bancário",k:"Direito Bancário",h:"Dívidas com bancos e financeiras? Entenda seus direitos antes de assinar qualquer acordo",s:"Análise de contratos de empréstimo, financiamento e cartão, superendividamento e busca e apreensão de veículos.",sv:[["Revisão de contratos","Análise de juros, tarifas e encargos de empréstimos, financiamentos e cartão de crédito."],["Superendividamento","Orientação com base na Lei 14.181/2021 para reorganizar dívidas preservando o mínimo existencial."],["Busca e apreensão de veículo","Defesa e orientação em ações de busca e apreensão de veículos financiados."],["Descontos indevidos","Contestação de descontos não autorizados em conta, salário ou benefício do INSS."],["Empréstimo consignado","Análise de margem, contratos não reconhecidos e cartão de crédito consignado (RMC)."],["Negociação com bancos","Acompanhamento técnico em propostas de acordo e renegociação de dívidas."]],f:[["Como saber se os juros do meu contrato são abusivos?","A análise compara o contrato com as taxas médias divulgadas pelo Banco Central para o mesmo tipo de operação e período."],["O que é a Lei do Superendividamento?","É a Lei 14.181/2021, que prevê a repactuação de dívidas de consumo preservando o mínimo necessário para viver."],["O banco pode tomar meu carro?","Em contratos com alienação fiduciária, o banco pode pedir a busca e apreensão em caso de atraso. Há prazos e defesas que precisam ser avaliados logo."]]},
 empresarial:{n:"Direito Empresarial",k:"Direito Empresarial",h:"Assessoria jurídica para empresas crescerem com segurança",s:"Contratos, societário, recuperação de empresas e consultoria preventiva.",sv:[["Contratos empresariais","Elaboração e revisão de contratos com fornecedores e clientes."],["Societário","Abertura, alteração, acordo de sócios e saída de sócios."],["Assessoria mensal","Consultoria jurídica contínua para o dia a dia da empresa."],["Recuperação judicial","Reestruturação de empresas em dificuldade financeira."],["Marcas e registros","Registro de marca no INPI e proteção de propriedade intelectual."],["LGPD","Adequação à Lei Geral de Proteção de Dados."]],f:[["Por que fazer acordo de sócios?","Ele define regras para decisões, saídas e conflitos antes que eles aconteçam."],["Como funciona a assessoria mensal?","A empresa conta com atendimento recorrente para dúvidas, contratos e revisões."],["Registrar a marca é obrigatório?","Não, mas sem registro a empresa não tem exclusividade sobre o nome."]]}
};
// Teses: páginas focadas num problema específico dentro da área (título, serviços e dúvidas próprios).
export const TESES = {
 previdenciario:[
  {id:"auxilio",n:"Auxílio por incapacidade",k:"Auxílio-doença",h:"Afastado por doença e com o auxílio negado ou cortado? Entenda seus direitos",s:"Orientação sobre auxílio por incapacidade temporária (auxílio-doença), perícia do INSS, prorrogação e aposentadoria por incapacidade.",sv:[["Auxílio negado","Análise do indeferimento e dos laudos apresentados."],["Benefício cortado","Pedido de prorrogação e recurso contra a cessação."],["Perícia médica","Orientação sobre documentos e preparo para a perícia."],["Doença do trabalho","Auxílio acidentário e reflexos na estabilidade."],["Aposentadoria por incapacidade","Quando a incapacidade é permanente."],["Ação judicial","Pedido na Justiça Federal com perícia judicial."]],f:[["Quais documentos levar à perícia?","Laudos, exames, receitas e atestados recentes que descrevam a doença e a limitação para o trabalho."],["O INSS cortou meu benefício. E agora?","É possível pedir prorrogação dentro do prazo ou recorrer, conforme o caso."],["Preciso de carência?","Em regra, 12 contribuições. Algumas doenças e acidentes dispensam a carência."]]},
  {id:"bpc-loas",n:"BPC/LOAS negado",k:"BPC/LOAS",h:"BPC/LOAS negado pelo INSS? Entenda o que ainda pode ser feito",s:"Orientação sobre o benefício assistencial para idosos a partir de 65 anos e pessoas com deficiência de baixa renda: requisitos, recurso e ação judicial.",sv:[["Análise da negativa","Leitura da carta do INSS para entender o motivo do indeferimento."],["Critério de renda","Verificação da renda familiar e das despesas que podem ser consideradas."],["Perícia e avaliação social","Orientação sobre a avaliação médica e social da deficiência."],["Recurso administrativo","Recurso ao Conselho de Recursos da Previdência Social."],["Ação judicial","Pedido na Justiça Federal quando esse for o caminho mais adequado."],["Cadastro Único","Orientação sobre a atualização do CadÚnico, exigida para o benefício."]],f:[["Quem tem direito ao BPC/LOAS?","Idosos a partir de 65 anos e pessoas com deficiência de longo prazo, em situação de baixa renda, conforme os critérios da Lei 8.742/1993."],["O BPC paga 13º?","Não. É um benefício assistencial, sem 13º salário e sem pensão por morte."],["Posso pedir de novo depois de negado?","Sim. É possível recorrer ou fazer novo pedido, conforme o motivo da negativa e a mudança da situação."]]},
  {id:"aposentadoria",n:"Planejamento de aposentadoria",k:"Aposentadoria",h:"Aposentadoria: descubra qual regra se aplica a você antes de pedir ao INSS",s:"Planejamento previdenciário com conferência do CNIS, comparação das regras de transição e orientação para o pedido.",sv:[["Conferência do CNIS","Revisão do extrato de contribuições para encontrar vínculos e salários faltantes."],["Regras de transição","Comparação das regras da Reforma da Previdência aplicáveis ao seu histórico."],["Tempo especial","Análise de atividades insalubres ou perigosas que podem contar de forma diferenciada."],["Tempo rural","Comprovação do trabalho no campo para fins de aposentadoria."],["Pedido ao INSS","Acompanhamento do requerimento pelo Meu INSS."],["Aposentadoria negada","Recurso administrativo e ação judicial contra o indeferimento."]],f:[["O que é o CNIS?","É o extrato que o INSS usa para calcular o benefício. Erros nele podem reduzir o valor."],["Vale esperar para me aposentar?","Depende das regras aplicáveis e do seu histórico. O planejamento mostra os cenários possíveis."],["Trabalhei em atividade insalubre. Conta diferente?","Pode contar, se houver comprovação por documentos como o PPP."]]}],
 trabalhista:[
  {id:"assedio",n:"Assédio moral no trabalho",k:"Assédio moral",h:"Humilhações e pressão no trabalho? Entenda o que caracteriza assédio moral",s:"Orientação para trabalhadores sobre assédio moral, provas, rescisão indireta e reparação.",sv:[["Identificação do assédio","Análise das situações vividas e de sua repetição."],["Provas","Orientação sobre mensagens, e-mails, testemunhas e registros."],["Rescisão indireta","Quando o empregado pode encerrar o contrato por falta grave do empregador."],["Reparação","Pedido de indenização por danos morais."],["Afastamento","Orientação sobre saúde mental e afastamento pelo INSS."],["Assédio sexual","Acolhimento e medidas cabíveis com sigilo."]],f:[["O que é assédio moral?","Condutas abusivas e repetidas que humilham ou constrangem o trabalhador e afetam sua dignidade."],["Como provar?","Mensagens, e-mails, áudios, testemunhas e registros médicos ajudam a demonstrar o que aconteceu."],["Posso sair da empresa e manter direitos?","Em alguns casos, pela rescisão indireta. É preciso avaliar antes de tomar a decisão."]]},
  {id:"horas-extras",n:"Horas extras não pagas",k:"Horas extras",h:"Fazia horas extras e não recebia? Entenda seus direitos",s:"Análise de jornada, banco de horas, intervalos e adicionais para quem trabalhou com ou sem controle de ponto.",sv:[["Cálculo de horas extras","Levantamento das horas além da jornada e dos reflexos em férias, 13º e FGTS."],["Intervalo de almoço","Análise de intervalos suprimidos ou reduzidos."],["Banco de horas","Verificação da validade do banco de horas e da compensação."],["Adicional noturno","Conferência do pagamento do trabalho noturno."],["Domingos e feriados","Análise do pagamento em dobro e das folgas."],["Provas da jornada","Orientação sobre mensagens, registros de acesso e testemunhas."]],f:[["E se a empresa não tinha ponto?","A jornada pode ser comprovada por outros meios, como mensagens, e-mails e testemunhas."],["Qual o prazo para cobrar?","Até dois anos após o fim do contrato, alcançando os últimos cinco anos trabalhados."],["Cargo de confiança recebe hora extra?","Depende das atribuições reais e da gratificação. Cada caso precisa ser analisado."]]},
  {id:"rescisao",n:"Demissão e verbas rescisórias",k:"Rescisão",h:"Foi demitido? Confira se a sua rescisão foi paga corretamente",s:"Conferência do termo de rescisão, aviso prévio, multa do FGTS, férias e 13º proporcionais.",sv:[["Conferência da rescisão","Análise do termo de rescisão (TRCT) e dos valores pagos."],["Aviso prévio","Cálculo do aviso prévio proporcional ao tempo de serviço."],["Multa de 40% do FGTS","Verificação dos depósitos e da multa rescisória."],["Justa causa","Análise dos motivos e da possibilidade de reversão."],["Estabilidade","Gestantes, acidentados e membros da CIPA."],["Seguro-desemprego","Orientação sobre requisitos e prazos."]],f:[["Qual o prazo para a empresa pagar a rescisão?","Até 10 dias após o término do contrato."],["Assinei a rescisão. Ainda posso questionar?","Sim. A assinatura não impede a conferência e a cobrança de valores devidos."],["Fui demitido por justa causa. O que fazer?","Reúna documentos e procure orientação logo, porque há prazos para questionar."]]}],
 consumidor:[
  {id:"plano-saude",n:"Plano de saúde negou cobertura",k:"Plano de saúde",h:"Plano de saúde negou exame, cirurgia ou tratamento? Conheça seus direitos",s:"Orientação em negativas de cobertura, reajustes, cancelamentos e reembolsos de planos de saúde.",sv:[["Negativa de cobertura","Exames, cirurgias, terapias e medicamentos."],["Pedidos urgentes","Medidas para casos que não podem esperar."],["Reajuste abusivo","Análise de aumentos por faixa etária e anuais."],["Cancelamento do plano","Rescisão unilateral e manutenção do tratamento."],["Reembolso","Valores pagos fora da rede credenciada."],["Home care e terapias","Cobertura de tratamentos contínuos."]],f:[["O que fazer quando o plano nega?","Peça a negativa por escrito, com o motivo e o número do protocolo."],["Rol da ANS limita a cobertura?","Há regras e exceções definidas em lei. Cada caso precisa de análise."],["Posso reclamar na ANS?","Sim, e o protocolo da reclamação pode ajudar como prova."]]},
  {id:"voo",n:"Voo cancelado ou atrasado",k:"Direito do passageiro",h:"Voo cancelado, atrasado ou bagagem extraviada? Conheça seus direitos",s:"Orientação para passageiros em atrasos, cancelamentos, overbooking e problemas com bagagem.",sv:[["Atraso de voo","Assistência material e direitos conforme o tempo de espera."],["Cancelamento","Reacomodação, reembolso e assistência."],["Overbooking","Preterição de embarque e compensações previstas."],["Bagagem extraviada","Prazos para localização e indenização."],["Bagagem danificada","Registro e reparação de danos."],["Conexão perdida","Responsabilidade da companhia em voos com escala."]],f:[["O que guardar como prova?","Cartão de embarque, mensagens da companhia, comprovantes de gastos e o registro de bagagem."],["Qual o prazo para reclamar?","Varia conforme o caso. Quanto antes, mais fácil reunir as provas."],["Voo internacional segue as mesmas regras?","Em parte. Convenções internacionais podem se aplicar a alguns pontos."]]},
  {id:"negativacao",n:"Nome negativado indevidamente",k:"Negativação indevida",h:"Nome negativado por uma dívida que você não reconhece? Entenda o que fazer",s:"Orientação em negativações indevidas, cobranças de dívidas pagas ou desconhecidas e fraudes em seu nome.",sv:[["Negativação indevida","Retirada do nome de cadastros quando a inclusão não tem fundamento."],["Dívida já paga","Cobrança e negativação de valores quitados."],["Fraude em seu nome","Contas e contratos abertos por terceiros com os seus dados."],["Falta de aviso","A inclusão em cadastro deve ser comunicada antes."],["Cobranças abusivas","Ligações excessivas e situações de constrangimento."],["Dívidas antigas","Orientação sobre o prazo máximo de negativação."]],f:[["Como saber se meu nome está negativado?","Consulte gratuitamente Serasa, SPC e Boa Vista com o seu CPF."],["A empresa precisava me avisar?","Sim. O consumidor deve ser comunicado antes da inclusão no cadastro."],["Quanto tempo o nome fica negativado?","No máximo cinco anos, contados do vencimento da dívida."]]}],
};
export const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export const PALS = [["#1B2A41","#C9A227"],["#0F3D3E","#E0B04A"],["#3B1F2B","#D9A5A0"],["#1E3A8A","#F59E0B"],["#2E2E2E","#B48A5A"],["#14532D","#A3E635"]];
export const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;800&display=swap";

// Modelos: [id, nome, descrição curta, tipo, paleta sugerida [principal, destaque]].
export const TPLS = [
 ["classico","Clássico","Site completo e sóbrio","base",["#1B2A41","#C9A227"]],
 ["moderno","Moderno","Topo escuro, sem serifa","base",["#1E3A8A","#F59E0B"]],
 ["minimal","Minimal","Limpo, linhas retas","base",["#2E2E2E","#B48A5A"]],
 ["bio","Bio Link","1 tela para o link da bio","viral",["#3A2A1E","#B8915A"]],
 ["hub","Hub","Escuro, estilo linktree","viral",["#121214","#D4AF37"]],
 ["impacto","Impacto","Topo forte e botão flutuante","top",["#0B1B33","#C9A227"]],
 ["editorial","Editorial","Revista, premium","top",["#1F1A17","#9C7A4B"]],
];
const TPL_IDS = TPLS.map(t => t[0]);
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const slugDe = s => String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/^(dr|dra)\.?\s+/,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,50);
const iniciais = n => String(n).replace(/^(Dr|Dra)\.?\s+/i,"").split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase();
const primeiroNome = n => { const p = String(n).split(" "); return /^dra?\.?$/i.test(p[0]) ? p.slice(0,2).join(" ") : p[0]; };
export const areaCurta = a => a.n.replace(/^Direito (de |do )?/, "");
const corOk = (c, d) => /^#[0-9a-fA-F]{6}$/.test(c||"") ? c : d;

// Completa os textos padrão a partir dos dados do formulário.
export function textos(d) {
  const base = AREAS[d.area] || AREAS.familia, ts = (TESES[d.area] || []).find(x => x.id === d.tese);
  const a = ts ? { ...base, k: base.k + " · " + ts.k, h: ts.h, s: ts.s, sv: ts.sv, f: ts.f } : base, online = String(d.atend||"").startsWith("Somente online");
  const prof = d.genero === "o" ? "advogado inscrito" : "advogada inscrita";
  return {
    a, online, tese: ts ? ts.n : "",
    h1: d.h1 || a.h,
    sub: d.sub || (a.s + (online ? " Atendimento online para todo o Brasil." : d.cidade ? ` Atendimento em ${d.cidade} e região.` : "")),
    bio: d.bio || `${d.nome || "Seu Nome"} é ${prof} na OAB/${d.uf||"UF"}${d.oab ? " sob o nº " + d.oab : ""}${d.anos ? `, com ${d.anos} anos de atuação` : ""} em ${a.n}. Atende com foco em explicar cada etapa do processo em linguagem simples, para que o cliente tome decisões informadas.`,
  };
}

export const CSS = `
.lp{--p:#1B2A41;--a:#C9A227;--t:#1F2328;--bgp:#FFFFFF;--soft:#F4F5F7;background:var(--bgp);color:var(--t);font:15px/1.6 "Manrope",system-ui,sans-serif;position:relative;overflow:hidden;container-type:inline-size}
.lp *{box-sizing:border-box}
.lp img{max-width:100%}
.lp .wm{position:absolute;inset:0;pointer-events:none;z-index:5;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='170'%3E%3Ctext x='10' y='95' transform='rotate(-22 140 85)' font-family='monospace' font-size='15' fill='rgba(0,0,0,0.10)'%3EPR%C3%89VIA %E2%80%A2 JURIS P%C3%81GINAS%3C/text%3E%3C/svg%3E")}
.lp .nav{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 6%}
.lp .nav .cta{flex:none}.lp .logo{min-width:0}.lp .logo>span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lp .logo{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--p)}
.lp .logo img{height:36px;width:auto}
.lp .mark{width:36px;height:36px;border-radius:50%;background:var(--p);color:#fff;display:grid;place-items:center;font:700 14px "Playfair Display",serif}
.lp .cta{display:inline-block;background:var(--a);color:#111;font-weight:800;text-decoration:none;padding:13px 20px;border-radius:6px;font-size:14px}
.lp .cta.sm{padding:9px 14px;font-size:13px}
.lp .h{display:grid;grid-template-columns:1.2fr .8fr;gap:28px;align-items:center;padding:34px 6% 44px}
@container (max-width:620px){.lp .h{grid-template-columns:1fr}.lp .grid3{grid-template-columns:1fr!important}.lp .about{grid-template-columns:1fr!important}.lp .h .photo{max-width:280px}}
.lp .kicker{font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--a)}
.lp h1{font:700 clamp(28px,5cqi,44px)/1.1 "Playfair Display",Georgia,serif;margin:10px 0 14px;color:var(--p);text-wrap:balance}
.lp h2{font:700 clamp(22px,3.6cqi,30px)/1.2 "Playfair Display",Georgia,serif;margin:0 0 18px;color:var(--p);text-wrap:balance}
.lp .lead{font-size:16px;opacity:.85;margin:0 0 22px;max-width:52ch}
.lp .photo{aspect-ratio:4/5;width:100%;border-radius:10px;background:var(--soft);overflow:hidden;display:grid;place-items:center;color:#8a8f98;font-size:12px;text-align:center}
.lp .photo .mono{font:700 clamp(48px,12cqi,96px)/1 "Playfair Display",Georgia,serif;color:#fff}
.lp .photo:has(.mono){background:var(--p)}
.lp .photo img{width:100%;height:100%;object-fit:cover;display:block}
.lp section{padding:44px 6%}
.lp .soft{background:var(--soft)}
.lp .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.lp .card{background:var(--bgp);border:1px solid rgba(0,0,0,.08);border-radius:8px;padding:18px}
.lp .card h3{margin:0 0 6px;font-size:16px;color:var(--p)}
.lp .card p{margin:0;font-size:14px;opacity:.8}
.lp .about{display:grid;grid-template-columns:.7fr 1.3fr;gap:28px;align-items:center}
.lp details{border-bottom:1px solid rgba(0,0,0,.1);padding:12px 0}
.lp summary{font-weight:700;cursor:pointer;color:var(--p)}
.lp .final{background:var(--p);color:#fff;text-align:center}
.lp .final h2{color:#fff}
.lp .contato{display:flex;flex-wrap:wrap;gap:6px 18px;justify-content:center;font-size:14px;opacity:.9;margin-top:18px}
.lp .contato a{color:inherit}
.lp footer{padding:22px 6%;font-size:12px;opacity:.75;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
.lp footer a{color:inherit}
.lp.semfoto .h,.lp.semfoto .about{grid-template-columns:1fr}.lp.semfoto .h{padding-block:48px 56px}.lp.semfoto .h .lead{max-width:60ch}
.lp.t-moderno{--soft:#EEF2F6}
.lp.t-moderno h1,.lp.t-moderno h2{font-family:"Manrope",sans-serif;font-weight:800;letter-spacing:-.02em}
.lp.t-moderno .h{background:var(--p);color:#fff}.lp.t-moderno .h h1{color:#fff}
.lp.t-moderno .nav{background:var(--p)}.lp.t-moderno .logo{color:#fff}.lp.t-moderno .mark{background:var(--a);color:#111}
.lp.t-minimal .cta{background:var(--p);color:#fff;border-radius:0}
.lp.t-minimal .card{border:0;border-top:2px solid var(--p);border-radius:0;padding-left:0;background:transparent}
.lp.t-minimal .soft{background:transparent}
.lp.t-minimal .photo{border-radius:0}
.lp .ico{width:18px;height:18px;flex:none;fill:currentColor}
.lp .sigilo{font-size:12px;opacity:.7;text-align:center;max-width:46ch;margin:0 auto}
.lp .fab{position:fixed;right:18px;bottom:18px;z-index:20;width:58px;height:58px;border-radius:50%;background:#25D366;color:#fff;display:grid;place-items:center;box-shadow:0 8px 24px rgba(0,0,0,.25)}
.lp .fab .ico{width:30px;height:30px}
.lp.emb .fab{position:absolute}
/* Bio Link: uma tela, para o link da bio do Instagram */
.lp.t-bio{background:radial-gradient(120% 70% at 50% 0%,#fff 0%,#F5EEE4 55%,#EADFCF 100%);min-height:100vh;display:grid;place-items:start center;padding:34px 18px 26px;text-align:center;color:#2b2622}
.lp.t-bio .bx{width:100%;max-width:440px;display:grid;justify-items:center;gap:14px}
.lp.t-bio .pill{display:inline-flex;align-items:center;gap:7px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;padding:7px 14px;border-radius:99px;background:rgba(255,255,255,.75);border:1px solid rgba(0,0,0,.07)}
.lp .dot{width:8px;height:8px;border-radius:50%;background:#22C55E;box-shadow:0 0 0 3px rgba(34,197,94,.2)}
.lp.t-bio .av{position:relative;width:148px;height:148px;border-radius:50%;padding:4px;background:linear-gradient(135deg,var(--a),#fff 50%,var(--a))}
.lp.t-bio .av>div{width:100%;height:100%;border-radius:50%;overflow:hidden;background:var(--p);display:grid;place-items:center;color:#fff;font:700 46px "Playfair Display",serif;border:3px solid #fff}
.lp.t-bio .av>div span:not(.mono){font:600 11px "Manrope",sans-serif;padding:10px;color:#fff}
.lp.t-bio .av img{width:100%;height:100%;object-fit:cover}
.lp.t-bio h1{font:700 32px/1.1 "Playfair Display",Georgia,serif;margin:6px 0 0;color:var(--p)}
.lp.t-bio .tit{margin:0;font-size:15px;opacity:.8}
.lp.t-bio .esc{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--a)}
.lp.t-bio .big{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:18px;border-radius:14px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;font-weight:800;font-size:17px;text-decoration:none;box-shadow:0 10px 26px rgba(18,140,126,.3)}
.lp.t-bio .big .ico{width:24px;height:24px}
.lp.t-bio .lk{display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border-radius:12px;background:rgba(255,255,255,.8);border:1px solid rgba(0,0,0,.07);color:var(--p);font-weight:700;text-decoration:none;text-align:left}
.lp.t-bio .lk small{display:block;font-weight:400;opacity:.65;font-size:12px}
.lp.t-bio .lk .ico{color:var(--a)}
.lp.t-bio .txt{margin:0;font-size:14px;opacity:.75;max-width:40ch}
.lp.t-bio .oab{font-size:12px;font-weight:700;opacity:.7}
/* Hub: escuro, estilo linktree, com carrossel e botões por serviço */
.lp.t-hub{background:#0c0c0e;color:#f2f2f2;min-height:100vh}
.lp.t-hub .hx{max-width:520px;margin:0 auto;padding-bottom:30px}
.lp.t-hub .hero{position:relative;aspect-ratio:4/4.4;max-height:560px;width:100%;overflow:hidden;background:radial-gradient(90% 80% at 50% 30%,var(--p),#0c0c0e)}
.lp.t-hub .hero img{width:100%;height:100%;object-fit:cover;display:block}
.lp.t-hub .hero .mono{position:absolute;inset:0;display:grid;place-items:center;font:700 110px "Playfair Display",serif;color:rgba(255,255,255,.14)}
.lp.t-hub .hero>span:not(.mono){position:absolute;inset:0;display:grid;place-items:center;font-size:13px;opacity:.6}
.lp.t-hub .hero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,#0c0c0e 97%)}
.lp.t-hub .id{position:relative;z-index:2;margin-top:-110px;text-align:center;padding:0 20px}
.lp.t-hub h1{font:700 34px/1.1 "Playfair Display",Georgia,serif;color:#fff;margin:0}
.lp.t-hub .tit{margin:8px 0 0;opacity:.75;font-size:14px}.lp.t-hub .tit b{display:block;font-size:12px;font-weight:700;letter-spacing:.06em;margin-top:2px}
.lp.t-hub .soc{display:flex;justify-content:center;gap:12px;margin:16px 0 4px}
.lp.t-hub .soc a{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);color:#fff}
.lp.t-hub h2{color:#fff;font:700 13px "Manrope",sans-serif;letter-spacing:.14em;text-transform:uppercase;margin:26px 20px 12px;opacity:.7}
.lp.t-hub .car{display:flex;gap:12px;overflow-x:auto;padding:0 20px 6px;scroll-snap-type:x mandatory;scroll-padding:0 20px;scrollbar-width:none}
.lp.t-hub .car::-webkit-scrollbar{display:none}
.lp.t-hub .cc{flex:0 0 72%;scroll-snap-align:start;border-radius:16px;overflow:hidden;background:#F4EEE4;color:#1d1a17;text-decoration:none}
.lp.t-hub .cc .cv{aspect-ratio:16/9;background:radial-gradient(120% 90% at 100% 0%,color-mix(in srgb,var(--a) 45%,transparent),transparent 60%),linear-gradient(135deg,color-mix(in srgb,var(--p) 70%,#333),#050505);color:#fff;padding:16px;display:flex;flex-direction:column;justify-content:flex-end}
.lp.t-hub .cc .cv b{font:700 20px/1.15 "Playfair Display",serif}
.lp.t-hub .cc .cv i{font-style:normal;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--a);margin-bottom:6px}
.lp.t-hub .cc p{margin:0;padding:12px 16px 16px;font-size:13px;line-height:1.5}
.lp.t-hub .bts{display:grid;gap:10px;padding:0 20px}
.lp.t-hub .bt{display:flex;align-items:center;gap:12px;padding:15px 18px;border-radius:99px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);color:#fff;text-decoration:none;font-weight:700;font-size:15px;backdrop-filter:blur(6px)}
.lp.t-hub .bt.zap{background:var(--a);color:#111;border-color:transparent}
.lp.t-hub .bt span{flex:1}
.lp.t-hub .bt:after{content:"›";font-size:22px;line-height:1;opacity:.6}
.lp.t-hub details{border-color:rgba(255,255,255,.12);margin:0 20px}
.lp.t-hub summary{color:#fff}
.lp.t-hub .sigilo{margin-top:24px;padding:0 20px}
/* Impacto: topo escuro com headline forte, faixa de confiança e botão flutuante */
.lp.t-impacto .nav{background:var(--p);position:relative;z-index:2}
.lp.t-impacto .logo{color:#fff}.lp.t-impacto .mark{background:var(--a);color:#111}
.lp.t-impacto .ih{background:radial-gradient(80% 120% at 85% 0%,color-mix(in srgb,var(--a) 22%,transparent),transparent 60%),linear-gradient(160deg,var(--p) 30%,#05080f);color:#fff;padding:56px 6% 64px;display:grid;grid-template-columns:1.25fr .75fr;gap:34px;align-items:center}
.lp.t-impacto .ih h1{color:#fff;font-size:clamp(32px,6cqi,56px);line-height:1.05}
.lp.t-impacto .ih h1 em{font-style:normal;color:var(--a)}
.lp.t-impacto .ih .lead{opacity:.85}
.lp.t-impacto .ih .photo{border-radius:200px 200px 14px 14px;border:3px solid color-mix(in srgb,var(--a) 70%,transparent)}
.lp.t-impacto .ghost{display:inline-block;margin-left:10px;color:#fff;font-weight:700;text-decoration:none;padding:13px 16px;font-size:14px;border:1px solid rgba(255,255,255,.3);border-radius:6px}
.lp.t-impacto .faixa{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 28px;padding:16px 6%;background:var(--a);color:#111;font-weight:800;font-size:13px;letter-spacing:.04em}
.lp.t-impacto .card{border:0;border-left:4px solid var(--a);box-shadow:0 6px 20px rgba(0,0,0,.06)}
.lp.t-impacto .num{counter-reset:n}.lp.t-impacto .num .card:before{counter-increment:n;content:"0" counter(n);display:block;font:700 26px "Playfair Display",serif;color:var(--a);margin-bottom:6px}
.lp.t-impacto .final{background:linear-gradient(160deg,var(--p),#05080f)}
.lp.t-impacto.semfoto .ih{grid-template-columns:1fr}
@container (max-width:620px){.lp.t-impacto .ih{grid-template-columns:1fr;padding-top:40px}.lp.t-impacto .ih .photo{max-width:260px}.lp.t-impacto .ghost{margin:10px 0 0}}
/* Editorial: papel creme, tipografia de revista, serviços numerados */
.lp.t-editorial{--bgp:#F7F2EA;--soft:#EFE7DA;color:#2a241f}
.lp.t-editorial .nav{border-bottom:1px solid rgba(0,0,0,.12)}
.lp.t-editorial .cta{background:var(--p);color:#fff;border-radius:99px}
.lp.t-editorial .eh{padding:52px 6% 40px;display:grid;grid-template-columns:1.3fr .7fr;gap:36px;align-items:end;border-bottom:1px solid rgba(0,0,0,.12)}
.lp.t-editorial .eh h1{font-size:clamp(34px,6.4cqi,64px);line-height:1.02;font-weight:600;letter-spacing:-.01em}
.lp.t-editorial .eh h1 em{color:var(--a)}
.lp.t-editorial .eh .photo{border-radius:999px 999px 0 0;aspect-ratio:3/4}
.lp.t-editorial .lista{display:grid;grid-template-columns:1fr 1fr;gap:0 40px}
.lp.t-editorial .it{display:grid;grid-template-columns:44px 1fr;gap:10px;padding:18px 0;border-top:1px solid rgba(0,0,0,.14)}
.lp.t-editorial .it b{font:600 22px "Playfair Display",serif;color:var(--a)}
.lp.t-editorial .it h3{margin:0 0 4px;font:600 19px "Playfair Display",serif;color:var(--p)}
.lp.t-editorial .it p{margin:0;font-size:14px;opacity:.75}
.lp.t-editorial .quote{font:italic 500 clamp(20px,3.4cqi,28px)/1.45 "Playfair Display",Georgia,serif;color:var(--p);max-width:34ch;margin:0 0 18px}
.lp.t-editorial .final{background:var(--p)}.lp.t-editorial .final .cta{background:var(--a);color:#111}
.lp.t-editorial.semfoto .eh{grid-template-columns:1fr}
@container (max-width:620px){.lp.t-editorial .eh{grid-template-columns:1fr}.lp.t-editorial .eh .photo{max-width:240px}.lp.t-editorial .lista{grid-template-columns:1fr}}
`;


const IC = {
  zap: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.8-1.2s.2-1.1.1-1.2z"/></svg>',
  insta: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.3A4.7 4.7 0 1 0 16.7 12 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm4.9-9.1a1.1 1.1 0 1 0 1.1 1.1 1.1 1.1 0 0 0-1.1-1.1zM20 7.5c-.1-1.5-.4-2.8-1.5-3.9S16 2.1 14.5 2c-1.5-.1-6-.1-7.5 0-1.5.1-2.8.4-3.9 1.5S1.6 6 1.5 7.5c-.1 1.5-.1 6 0 7.5.1 1.5.4 2.8 1.5 3.9s2.4 1.4 3.9 1.5c1.5.1 6 .1 7.5 0 1.5-.1 2.8-.4 3.9-1.5s1.4-2.4 1.5-3.9c.1-1.5.1-6 0-7.5zm-2 9.6a3.1 3.1 0 0 1-1.7 1.7c-1.2.5-4 .4-5.3.4s-4.1.1-5.3-.4a3.1 3.1 0 0 1-1.7-1.7c-.5-1.2-.4-4-.4-5.3s-.1-4.1.4-5.3a3.1 3.1 0 0 1 1.7-1.7c1.2-.5 4-.4 5.3-.4s4.1-.1 5.3.4a3.1 3.1 0 0 1 1.7 1.7c.5 1.2.4 4 .4 5.3s.1 4.1-.4 5.3z"/></svg>',
  mail: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.3V17h16V7.3zM5.3 7l6.7 4.1L18.7 7z"/></svg>',
  pin: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 14.5 9 2.5 2.5 0 0 1 12 11.5z"/></svg>',
  balanca: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 3h2v2.1l5.4 1.5L21 13a3.5 3.5 0 0 1-7 0l2.4-5.5-3.4-.9V19h4v2H7v-2h4V6.6l-3.4.9L10 13a3.5 3.5 0 0 1-7 0l2.6-6.4L11 5.1zM6.5 9.2 5 13h3zm11 0L16 13h3z"/></svg>',
};
// Destaca o final do título (usado nos modelos Impacto e Editorial).
const destaque = h => { const w = String(h).split(" "); if (w.length < 4) return esc(h); const k = Math.max(2, Math.ceil(w.length / 3)); return esc(w.slice(0, -k).join(" ")) + " <em>" + esc(w.slice(-k).join(" ")) + "</em>"; };

// Devolve {cls, style, html}: o conteúdo de <div class="lp ...">.
// app=true quando a página é mostrada dentro do gerador/painel (o botão flutuante fica preso à prévia).
export function renderLP(d, { previa = false, fotoVazia = "Sua foto aqui", app = false } = {}) {
  const t = textos(d), a = t.a, nome = d.nome || "Seu Nome", tpl = TPL_IDS.includes(d.tpl) ? d.tpl : "classico";
  const zap = String(d.zap||"").replace(/\D/g,"");
  const waMsg = m => zap ? `https://wa.me/55${zap}?text=${encodeURIComponent(m)}` : "#";
  const wa = waMsg("Olá, vim pelo site e gostaria de agendar uma consulta.");
  const ext = 'target="_blank" rel="noopener"';
  const logo = d.logo ? `<img src="${esc(d.logo)}" alt="Logo ${esc(nome)}">` : `<span class="mark">${esc(iniciais(nome))}</span>`;
  const foto = d.foto ? `<img src="${esc(d.foto)}" alt="${esc(nome)}" loading="eager">` : previa ? `<span>${esc(fotoVazia)}</span>` : `<span class="mono">${esc(iniciais(nome))}</span>`;
  const local = t.online ? "Atendimento online" : [d.cidade, d.uf].filter(Boolean).map(esc).join("/");
  const oab = `OAB/${esc(d.uf||"UF")} ${esc(d.oab||"")}`;
  const insta = d.insta ? String(d.insta).replace(/^@/,"") : "";
  const instaUrl = insta ? `https://instagram.com/${esc(insta)}` : "";
  const mapa = d.end ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.end + (d.cidade ? ", " + d.cidade : ""))}` : "";
  const escr = d.escritorio ? esc(d.escritorio) : "";
  const prof = d.genero === "o" ? "Advogado" : "Advogada";
  const contato = [
    d.end ? `<span>${esc(d.end)}</span>` : "",
    d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : "",
    insta ? `<a href="${instaUrl}" ${ext}>@${esc(insta)}</a>` : "",
  ].join("");
  const semFoto = !d.foto && !previa; // publicada sem foto: layout de coluna única, nunca "Sua foto aqui"
  const wm = previa ? '<div class="wm"></div>' : "";
  const sigilo = `Atendimento individual e sigiloso. Sigilo profissional resguardado pelo Código de Ética e Disciplina da OAB.`;
  const faq = a.f.map(q=>`<details><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join("");
  const passos = `<div class="card"><h3>Primeiro contato</h3><p>Você envia uma mensagem e agenda um horário.</p></div>
    <div class="card"><h3>Consulta</h3><p>Análise do seu caso e dos documentos, ${t.online ? "por videochamada" : "no escritório ou por vídeo"}.</p></div>
    <div class="card"><h3>Acompanhamento</h3><p>Você recebe atualizações sobre cada etapa.</p></div>`;
  const atendFinal = t.online ? "online para todo o Brasil" : (d.cidade ? "em " + esc(d.cidade) + " e online" : "presencial e online");
  const final = (titulo = "Tire suas dúvidas sobre o seu caso") => `<section class="final"><h2>${titulo}</h2><p>Atendimento ${atendFinal}.</p><a class="cta" href="${wa}" ${ext}>Falar com ${esc(primeiroNome(nome))}</a>${contato ? `<div class="contato">${contato}</div>` : ""}</section>`;
  const rodape = `<footer><span>${esc(nome)}${escr ? " · " + escr : ""} · ${oab}</span><span>${d.zap ? "WhatsApp " + esc(d.zap) : ""}</span></footer>`;
  const nav = (btn = "Fale pelo WhatsApp") => `<div class="nav"><div class="logo">${logo}<span>${escr || esc(nome)}</span></div><a class="cta sm" href="${wa}" ${ext}>${btn}</a></div>`;
  const fab = `<a class="fab" href="${wa}" ${ext} aria-label="Falar pelo WhatsApp">${IC.zap}</a>`;
  let html;

  if (tpl === "bio") {
    html = `${wm}<div class="bx">
    <span class="pill"><span class="dot"></span>${t.online ? "Atendimento online" : "Atendimento presencial e online"}</span>
    <div class="av"><div>${foto}</div></div>
    <div><h1>${esc(nome)}</h1><p class="tit">${prof} · ${esc(a.n)}</p>${t.tese ? `<p class="tit" style="font-weight:700;color:var(--a)">${esc(t.tese)}</p>` : ""}</div>
    ${escr ? `<div class="esc">${escr}</div>` : ""}
    <a class="big" href="${wa}" ${ext}>${IC.zap}Entrar em contato</a>
    <p class="txt">${esc(t.sub)}</p>
    ${insta ? `<a class="lk" href="${instaUrl}" ${ext}>${IC.insta}<span>Instagram<small>@${esc(insta)}</small></span></a>` : ""}
    ${d.email ? `<a class="lk" href="mailto:${esc(d.email)}">${IC.mail}<span>E-mail<small>${esc(d.email)}</small></span></a>` : ""}
    ${d.end ? `<a class="lk" href="${mapa}" ${ext}>${IC.pin}<span>Escritório<small>${esc(d.end)}</small></span></a>` : ""}
    <a class="lk" href="${waMsg("Olá, gostaria de entender melhor as áreas em que você atua.")}" ${ext}>${IC.balanca}<span>Áreas de atuação<small>${esc(a.sv.slice(0,3).map(s=>s[0]).join(" · "))}</small></span></a>
    <div class="oab">${esc(nome)} · ${oab}</div>
    <p class="sigilo">${sigilo}</p></div>`;
  } else if (tpl === "hub") {
    const soc = [zap ? `<a href="${wa}" ${ext} aria-label="WhatsApp">${IC.zap}</a>` : "", insta ? `<a href="${instaUrl}" ${ext} aria-label="Instagram">${IC.insta}</a>` : "", d.email ? `<a href="mailto:${esc(d.email)}" aria-label="E-mail">${IC.mail}</a>` : "", d.end ? `<a href="${mapa}" ${ext} aria-label="Endereço">${IC.pin}</a>` : ""].join("");
    html = `${wm}<div class="hx">
    <div class="hero">${d.foto ? foto : previa ? foto : `<span class="mono">${esc(iniciais(nome))}</span>`}</div>
    <div class="id"><h1>${esc(nome)}</h1><p class="tit">${prof} · ${esc(areaCurta(a))}${escr ? " · " + escr : ""}<b>${oab}</b></p>${soc ? `<div class="soc">${soc}</div>` : ""}</div>
    <h2>Como posso ajudar</h2>
    <div class="car">${a.sv.slice(0,4).map(s=>`<a class="cc" href="${waMsg(`Olá, gostaria de orientação sobre ${s[0].toLowerCase()}.`)}" ${ext}><div class="cv"><i>${esc(a.k)}</i><b>${esc(s[0])}</b></div><p>${esc(s[1])}</p></a>`).join("")}</div>
    <h2>Fale comigo</h2>
    <div class="bts"><a class="bt zap" href="${wa}" ${ext}>${IC.zap}<span>WhatsApp | Agendar consulta</span></a>
    ${a.sv.slice(4).concat(a.sv.slice(0,2)).map(s=>`<a class="bt" href="${waMsg(`Olá, gostaria de orientação sobre ${s[0].toLowerCase()}.`)}" ${ext}>${IC.balanca}<span>${esc(s[0])}</span></a>`).join("")}
    ${insta ? `<a class="bt" href="${instaUrl}" ${ext}>${IC.insta}<span>Conteúdos no Instagram</span></a>` : ""}</div>
    <h2>Dúvidas frequentes</h2>${faq}
    <p class="sigilo">${local ? local + " · " : ""}${sigilo}</p></div>`;
  } else if (tpl === "impacto") {
    html = `${wm}${nav("WhatsApp")}
  <div class="ih"><div><div class="kicker">${esc(a.k)}${local ? " · " + local : ""}</div>
    <h1>${destaque(t.h1)}</h1><p class="lead">${esc(t.sub)}</p>
    <a class="cta" href="${wa}" ${ext}>Agendar uma consulta</a><a class="ghost" href="#areas">Ver áreas de atuação</a></div>
    ${semFoto ? "" : `<div class="photo">${foto}</div>`}</div>
  <div class="faixa"><span>${oab}</span><span>${t.online ? "Atendimento online em todo o Brasil" : esc(d.atend||"Presencial e online")}</span><span>Atendimento sigiloso</span></div>
  <section id="areas"><div class="kicker">Áreas de atuação</div><h2>Como posso ajudar</h2><div class="grid3">${a.sv.map(s=>`<div class="card"><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join("")}</div></section>
  <section class="soft"><div class="about">${semFoto ? "" : `<div class="photo">${foto}</div>`}<div><div class="kicker">Quem vai te atender</div><h2>${esc(nome)}</h2><p>${esc(t.bio)}</p>
    <p><strong>${oab}</strong>${escr ? " · " + escr : ""} · ${esc(d.atend||"")}</p><a class="cta" href="${wa}" ${ext}>Conversar pelo WhatsApp</a></div></div></section>
  <section><h2>Como funciona o atendimento</h2><div class="grid3 num">${passos}</div></section>
  <section class="soft"><h2>Perguntas frequentes</h2>${faq}</section>
  ${final("Converse sobre o seu caso com quem entende do assunto")}${rodape}${fab}`;
  } else if (tpl === "editorial") {
    html = `${wm}${nav("Agendar consulta")}
  <div class="eh"><div><div class="kicker">${esc(a.k)}${local ? " · " + local : ""}</div><h1>${destaque(t.h1)}</h1><p class="lead">${esc(t.sub)}</p>
    <a class="cta" href="${wa}" ${ext}>Agendar uma consulta</a></div>${semFoto ? "" : `<div class="photo">${foto}</div>`}</div>
  <section><div class="kicker">Áreas de atuação</div><h2>Como posso ajudar</h2><div class="lista">${a.sv.map((s,i)=>`<div class="it"><b>${String(i+1).padStart(2,"0")}</b><div><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div></div>`).join("")}</div></section>
  <section class="soft"><div class="kicker">Sobre</div><p class="quote">${esc(t.bio)}</p><p><strong>${esc(nome)}</strong> · ${oab}${escr ? " · " + escr : ""}</p></section>
  <section><h2>Como funciona o atendimento</h2><div class="grid3">${passos}</div></section>
  <section class="soft"><h2>Perguntas frequentes</h2>${faq}</section>
  ${final()}${rodape}`;
  } else {
    html = `${wm}${nav()}
  <div class="h"><div><div class="kicker">${esc(a.k)}${local ? " · " + local : ""}</div>
    <h1>${esc(t.h1)}</h1><p class="lead">${esc(t.sub)}</p>
    <a class="cta" href="${wa}" ${ext}>Agendar uma consulta</a></div>
    ${semFoto ? "" : `<div class="photo">${foto}</div>`}</div>
  <section class="soft"><h2>Como posso ajudar</h2><div class="grid3">${a.sv.map(s=>`<div class="card"><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join("")}</div></section>
  <section><div class="about">${semFoto ? "" : `<div class="photo">${foto}</div>`}<div><div class="kicker">Sobre</div><h2>${esc(nome)}</h2><p>${esc(t.bio)}</p>
    <p><strong>${oab}</strong>${escr ? " · " + escr : ""} · ${esc(d.atend||"")}</p></div></div></section>
  <section class="soft"><h2>Como funciona o atendimento</h2><div class="grid3">${passos}</div></section>
  <section><h2>Perguntas frequentes</h2>${faq}</section>
  ${final()}${rodape}`;
  }
  return { cls: "lp t-" + tpl + (semFoto ? " semfoto" : "") + (app ? " emb" : ""), style: `--p:${corOk(d.p,"#1B2A41")};--a:${corOk(d.a,"#C9A227")}`, html };
}
