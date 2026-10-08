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
 empresarial:{n:"Direito Empresarial",k:"Direito Empresarial",h:"Assessoria jurídica para empresas crescerem com segurança",s:"Contratos, societário, recuperação de empresas e consultoria preventiva.",sv:[["Contratos empresariais","Elaboração e revisão de contratos com fornecedores e clientes."],["Societário","Abertura, alteração, acordo de sócios e saída de sócios."],["Assessoria mensal","Consultoria jurídica contínua para o dia a dia da empresa."],["Recuperação judicial","Reestruturação de empresas em dificuldade financeira."],["Marcas e registros","Registro de marca no INPI e proteção de propriedade intelectual."],["LGPD","Adequação à Lei Geral de Proteção de Dados."]],f:[["Por que fazer acordo de sócios?","Ele define regras para decisões, saídas e conflitos antes que eles aconteçam."],["Como funciona a assessoria mensal?","A empresa conta com atendimento recorrente para dúvidas, contratos e revisões."],["Registrar a marca é obrigatório?","Não, mas sem registro a empresa não tem exclusividade sobre o nome."]]}
};
export const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");
export const PALS = [["#1B2A41","#C9A227"],["#0F3D3E","#E0B04A"],["#3B1F2B","#D9A5A0"],["#1E3A8A","#F59E0B"],["#2E2E2E","#B48A5A"],["#14532D","#A3E635"]];
export const FONTS = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Manrope:wght@400;600;800&display=swap";

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const slugDe = s => String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/^(dr|dra)\.?\s+/,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,50);
const iniciais = n => String(n).replace(/^(Dr|Dra)\.?\s+/i,"").split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase();
const primeiroNome = n => { const p = String(n).split(" "); return /^dra?\.?$/i.test(p[0]) ? p.slice(0,2).join(" ") : p[0]; };
export const areaCurta = a => a.n.replace(/^Direito (de |do )?/, "");
const corOk = (c, d) => /^#[0-9a-fA-F]{6}$/.test(c||"") ? c : d;

// Completa os textos padrão a partir dos dados do formulário.
export function textos(d) {
  const a = AREAS[d.area] || AREAS.familia, online = String(d.atend||"").startsWith("Somente online");
  const prof = d.genero === "o" ? "advogado inscrito" : "advogada inscrita";
  return {
    a, online,
    h1: d.h1 || a.h,
    sub: d.sub || (a.s + (online ? " Atendimento online para todo o Brasil." : d.cidade ? ` Atendimento em ${d.cidade} e região.` : "")),
    bio: d.bio || `${d.nome || "Seu Nome"} é ${prof} na OAB/${d.uf||"UF"}${d.oab ? " sob o nº " + d.oab : ""}${d.anos ? `, com ${d.anos} anos de atuação` : ""} em ${areaCurta(a)}. Atende com foco em explicar cada etapa do processo em linguagem simples, para que o cliente tome decisões informadas.`,
  };
}

export const CSS = `
.lp{--p:#1B2A41;--a:#C9A227;--t:#1F2328;--bgp:#FFFFFF;--soft:#F4F5F7;background:var(--bgp);color:var(--t);font:15px/1.6 "Manrope",system-ui,sans-serif;position:relative;overflow:hidden;container-type:inline-size}
.lp *{box-sizing:border-box}
.lp img{max-width:100%}
.lp .wm{position:absolute;inset:0;pointer-events:none;z-index:5;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='170'%3E%3Ctext x='10' y='95' transform='rotate(-22 140 85)' font-family='monospace' font-size='15' fill='rgba(0,0,0,0.10)'%3EPR%C3%89VIA %E2%80%A2 JURIS P%C3%81GINAS%3C/text%3E%3C/svg%3E")}
.lp .nav{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 6%;flex-wrap:wrap}
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
.lp.t-moderno{--soft:#EEF2F6}
.lp.t-moderno h1,.lp.t-moderno h2{font-family:"Manrope",sans-serif;font-weight:800;letter-spacing:-.02em}
.lp.t-moderno .h{background:var(--p);color:#fff}.lp.t-moderno .h h1{color:#fff}
.lp.t-moderno .nav{background:var(--p)}.lp.t-moderno .logo{color:#fff}.lp.t-moderno .mark{background:var(--a);color:#111}
.lp.t-minimal .cta{background:var(--p);color:#fff;border-radius:0}
.lp.t-minimal .card{border:0;border-top:2px solid var(--p);border-radius:0;padding-left:0;background:transparent}
.lp.t-minimal .soft{background:transparent}
.lp.t-minimal .photo{border-radius:0}
`;

// Devolve {cls, style, html}: o conteúdo de <div class="lp ...">.
export function renderLP(d, { previa = false, fotoVazia = "Sua foto aqui" } = {}) {
  const t = textos(d), a = t.a, nome = d.nome || "Seu Nome";
  const zap = String(d.zap||"").replace(/\D/g,"");
  const wa = zap ? `https://wa.me/55${zap}?text=${encodeURIComponent("Olá, vim pelo site e gostaria de agendar uma consulta.")}` : "#";
  const logo = d.logo ? `<img src="${esc(d.logo)}" alt="Logo ${esc(nome)}">` : `<span class="mark">${esc(iniciais(nome))}</span>`;
  const foto = d.foto ? `<img src="${esc(d.foto)}" alt="${esc(nome)}" loading="eager">` : `<span>${esc(fotoVazia)}</span>`;
  const local = t.online ? "Atendimento online" : [d.cidade, d.uf].filter(Boolean).map(esc).join("/");
  const oab = `OAB/${esc(d.uf||"UF")} ${esc(d.oab||"")}`;
  const insta = d.insta ? String(d.insta).replace(/^@/,"") : "";
  const contato = [
    d.end ? `<span>${esc(d.end)}</span>` : "",
    d.email ? `<a href="mailto:${esc(d.email)}">${esc(d.email)}</a>` : "",
    insta ? `<a href="https://instagram.com/${esc(insta)}" target="_blank" rel="noopener">@${esc(insta)}</a>` : "",
  ].join("");
  const html = `${previa ? '<div class="wm"></div>' : ""}
  <div class="nav"><div class="logo">${logo}<span>${esc(nome)}</span></div><a class="cta sm" href="${wa}" target="_blank" rel="noopener">Fale pelo WhatsApp</a></div>
  <div class="h"><div><div class="kicker">${esc(a.k)}${local ? " · " + local : ""}</div>
    <h1>${esc(t.h1)}</h1><p class="lead">${esc(t.sub)}</p>
    <a class="cta" href="${wa}" target="_blank" rel="noopener">Agendar uma consulta</a></div>
    <div class="photo">${foto}</div></div>
  <section class="soft"><h2>Como posso ajudar</h2><div class="grid3">${a.sv.map(s=>`<div class="card"><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p></div>`).join("")}</div></section>
  <section><div class="about"><div class="photo">${foto}</div><div><div class="kicker">Sobre</div><h2>${esc(nome)}</h2><p>${esc(t.bio)}</p>
    <p><strong>${oab}</strong> · ${esc(d.atend||"")}</p></div></div></section>
  <section class="soft"><h2>Como funciona o atendimento</h2><div class="grid3">
    <div class="card"><h3>Primeiro contato</h3><p>Você envia uma mensagem e agenda um horário.</p></div>
    <div class="card"><h3>Consulta</h3><p>Análise do seu caso e dos documentos, ${t.online ? "por videochamada" : "no escritório ou por vídeo"}.</p></div>
    <div class="card"><h3>Acompanhamento</h3><p>Você recebe atualizações sobre cada etapa.</p></div></div></section>
  <section><h2>Perguntas frequentes</h2>${a.f.map(q=>`<details><summary>${esc(q[0])}</summary><p>${esc(q[1])}</p></details>`).join("")}</section>
  <section class="final"><h2>Tire suas dúvidas sobre o seu caso</h2><p>Atendimento ${t.online ? "online para todo o Brasil" : (d.cidade ? "em " + esc(d.cidade) + " e online" : "presencial e online")}.</p><a class="cta" href="${wa}" target="_blank" rel="noopener">Falar com ${esc(primeiroNome(nome))}</a>${contato ? `<div class="contato">${contato}</div>` : ""}</section>
  <footer><span>${esc(nome)} · ${oab}</span><span>${d.zap ? "WhatsApp " + esc(d.zap) : ""}</span></footer>`;
  return { cls: "lp t-" + (["classico","moderno","minimal"].includes(d.tpl) ? d.tpl : "classico"), style: `--p:${corOk(d.p,"#1B2A41")};--a:${corOk(d.a,"#C9A227")}`, html };
}
