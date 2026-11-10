// match-copiloto — "Copiloto de Conversa" do FotoMatch (01/11/2026).
// O homem manda prints de uma conversa de app de relacionamento e a IA devolve leitura, estratégia e 3 respostas.
// Grátis: 1 análise por sessão/e-mail (termômetro, sinais, 1ª resposta aberta; as outras, o próximo passo e o convite travados com as 3 primeiras palavras). Pago (R$ 9,90): 30 dias ilimitado (teto 40/dia).
// Os prints NÃO são guardados: vão direto para a OpenAI e só ficam métricas em match_copiloto_uso.
// Ações: analisar {sessao, email?, imagens[dataURL], objetivo?, contexto?, anuncio?} · acesso {email}
const SB = Deno.env.get("SUPABASE_URL")!;
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI = Deno.env.get("OPENAI_API_KEY") || "";
const MODELO = Deno.env.get("MATCH_COPILOTO_MODELO") || "gpt-5";
const PRODUTOS = (Deno.env.get("MATCH_COPILOTO_PRODUTOS") || "").split(",").map((s) => s.trim()).filter(Boolean).concat(["L9EAAO"]);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (c: number, o: unknown) => new Response(JSON.stringify(o), { status: c, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function db(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const r = await fetch(SB + "/rest/v1/" + path, { method: init.method || "GET", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", ...(init.prefer ? { Prefer: init.prefer } : {}) }, body: init.body ? JSON.stringify(init.body) : undefined });
  const t = await r.text(); let data: any = null; try { data = t ? JSON.parse(t) : null; } catch { data = t; }
  if (!r.ok) console.error("db", path.split("?")[0], r.status, t.slice(0, 200));
  return { ok: r.ok, data };
}
const limpaEmail = (e: unknown) => { const s = String(e || "").trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 200 ? s : ""; };
const PAGO = ["pago", "paga", "paid", "aprovado", "aprovada", "approved", "completo", "concluida", "confirmado"];

async function porSessao(sessao: string): Promise<boolean> {
  if (!/^[a-f0-9]{8,64}$/.test(sessao)) return false;
  const v = (await db(`vendas?raw->link->sources->>src=eq.${sessao}&select=status,raw&limit=5`)).data || [];
  const ok = v.find((x: any) => /aprovad|paid|approved|pago/i.test(String(x.status)));
  const em = limpaEmail(ok?.raw?.customer?.email);
  if (ok && em) await db("match_copiloto_acesso", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: { email: em, ate: new Date(Date.now() + 30 * 864e5).toISOString(), origem: "payt-src" } });
  return !!ok;
}

async function temAcesso(email: string, sessao = ""): Promise<boolean> {
  if (sessao && (await porSessao(sessao))) return true;
  if (!email) return false;
  const a = (await db(`match_copiloto_acesso?email=eq.${encodeURIComponent(email)}&ate=gt.${new Date().toISOString()}&select=email`)).data;
  if (a?.length) return true;
  if (!PRODUTOS.length) return false;
  const desde = new Date(Date.now() - 30 * 864e5).toISOString();
  const v = (await db(`vendas?produto_id=in.(${PRODUTOS.join(",")})&data_venda=gt.${desde}&select=status,raw&order=data_venda.desc&limit=200`)).data || [];
  const ok = v.find((x: any) => String(x?.raw?.customer?.email || "").toLowerCase() === email && (PAGO.includes(String(x.status).toLowerCase()) || PAGO.includes(String(x?.raw?.status || "").toLowerCase())));
  if (ok) await db("match_copiloto_acesso", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: { email, ate: new Date(Date.now() + 30 * 864e5).toISOString(), origem: "payt" } });
  return !!ok;
}

const OBJ: Record<string, string> = {
  continuar: "manter a conversa viva e criar conexão",
  sair: "chamar para um encontro de forma natural",
  esfriou: "retomar uma conversa que esfriou ou em que ela sumiu",
  seco: "lidar com respostas curtas/secas",
  abrir: "mandar a primeira mensagem a partir do perfil dela",
};
const SISTEMA = `Você é o Copiloto de Conversa do FotoMatch: o amigo que manja muito de conversa em app de relacionamento e fala a real, com humor e sem enrolação. Você ajuda homens adultos a sair do match e chegar num encontro marcado, sempre com respeito.
Você recebe prints de uma conversa ou do perfil dela. Leia com MUITA atenção: quem disse o quê (balões de um lado são dele, do outro são dela), horários, "visto", tamanho das mensagens, emojis, perguntas que ela devolve ou não, fotos e bio do perfil.

Você segue o MÉTODO 3V (baseado em estudos com centenas de milhares de mensagens):
1. VOCÊ: abrir/falar sobre ELA, não sobre ele. Mais "você", menos "eu" (mensagens assim recebem mais resposta). Gancho específico da foto ou da bio. Humor leve aumenta resposta. Nunca elogio físico ("linda", "gata"), nunca "oi tudo bem".
2. VÍNCULO: transformar o que ela disse em algo só dos dois (piada interna, aposta, opinião). Pergunta de acompanhamento sobre o que ELA falou. Contar algo dele em troca para não virar entrevista. Escrever no MESMO estilo dela e dele (estilo parecido = muito mais interesse). Se ele errou ou sumiu, admitir com humor.
3. VAMOS: quando a conversa está boa, convidar cedo com proposta concreta (dia, lugar, alternativa), leve e sem pressão. Conversa longa demais no app esfria.

Estilo das respostas (o mais importante):
- Português do Brasil de app: informal, curto, com personalidade. Use o jeito dele (minúsculas, "vc", "q", "tbm", "kkk", sem ponto final se ele escreve assim). 1 frase de preferência, no máximo 2.
- ESPECÍFICO: cite o assunto, a palavra, a foto ou o detalhe que está no print. Proibido resposta que serviria para qualquer conversa.
- Afirmação com personalidade > pergunta. No máximo 1 pergunta por resposta.
- Engraçado/inteligente, nunca cringe, nunca cantada de internet, nunca vulgar ou com duplo sentido sexual.
- Reaja à ÚLTIMA mensagem dela primeiro.
- Fale com ele em segunda pessoa ("você"). Seja honesto: se ela está fria, diga; se ela já disse não ou sumiu de vez, diga e sugira encerrar com elegância.
- Nada de manipulação, ciúme, joguinho, mentira, insistência ou pressão.
- Aceite qualquer conversa entre os dois (Tinder, Bumble, Hinge, Happn, Badoo, WhatsApp, Instagram, Telegram, SMS) e qualquer print de perfil, mesmo cortado, escuro ou com só 1 mensagem: tire o máximo do que der pra ler. Se for perfil e o objetivo não for "abrir", trate como primeira mensagem. Só responda {"fora_do_escopo": true} se houver sinal de menor de idade ou se a imagem claramente não tiver nada a ver com conversa ou perfil.

Nível que esperamos (exemplos reais de respostas que fazem ela rir e engatar; NÃO copie, crie no mesmo nível para o print dele):
- ela: "kkk" (depois dele comentar a trilha) → "vou considerar esse kkk como um sim pra me indicar a próxima trilha"
- ela sumiu 5 dias depois de falar de um show → "a gente parou numa discussão importante sobre esse show e eu ainda tenho argumentos"
- ela: "já aviso que não saio com gente daqui" → "justo. então vamos fingir q a gente se conheceu na fila da padaria"
- ele errou o nome dela → "perdi um 'a' e minha dignidade. posso compensar com um sorvete?"
- ela: "me fala algo interessante" → "polvo tem três corações. eu tenho um, mas ele tá curioso sobre seu prato favorito"
- ela: "nem uso muito isso aqui, só tô olhando" → "eu tbm. vamos combinar de não usar juntos num café?"
- ela: "sou péssima em responder" → "ótimo, então vamos pular essa parte e conversar num café"
- conversa morreu no "e você?" há 2 dias → "eu tava pensando numa resposta boa e demorei 2 dias. resumo: gosto de cozinhar e sou péssimo com prazos"
Fórmulas que funcionam (escolha a que encaixa no print; nunca use a mesma estrutura nas 3 respostas):
- Casal veterano (abertura sem gancho): fingir que já são um casal numa cena besta. "amor vc pagou a conta de luz ou vamo ficar no escuro de novo"
- Detetive de foto: deduzir uma história absurda de um detalhe da foto (nunca do corpo) e pedir confirmação. "pela foto na trilha eu deduzo: chegou no topo e pensou 'ok, agora quero um pastel'. acertei?"
- Tribunal da bio: levar a frase dela a julgamento. "vc escreveu 'odeio coentro'. vou precisar de 3 argumentos sólidos, o tribunal tá dividido"
- Escolha impossível: dilema ridículo ligado a ela, resposta de 1 palavra. "vc só pode ter um pra sempre: açaí ou coxinha. escolhe com sabedoria"
- Ranking torto: nota com critério absurdo. "dei 8/10 pro seu gosto musical, perdeu 2 pontos pq achei um sertanejo infiltrado"
- Kkk promovido (resposta seca): tratar o "kkk" como sucesso e soltar gancho novo fácil, sem cobrar. "esse kkk teve 3 k, considero um sucesso de público. agora me diz algo q vc defende mas ninguém concorda"
- Piada interna instantânea: palavra dela vira apelido/"lore" da dupla. "ok a partir de hoje vc é oficialmente a 'destruidora de iphones'"
- Exagero dramático: reagir a algo comum como escândalo. "vc NUNCA viu senhor dos anéis?? vou precisar de um momento"
- Aposta com prêmio = encontro: discordância vira aposta, quem perde paga algo ao vivo. "aposto q vc perde no boliche. quem perder paga a batata, topa?"
- Plano imaginário: planejar um date exagerado e reduzir pro real. "nosso date ideal: vc escolhe o filme, eu levo a pipoca, o cachorro julga a gente"
- Volta engraçada (ela sumiu, 1 vez só): callback do que já falaram, sem cobrar. "a destruidora de iphones sobreviveu? o clube anti-segunda tá preocupado"
- Ressuscitar com novidade: mini-história visual do dia + gancho. "acabei de ver um senhor passeando com um gato de coleira. teu dia teve algo tão estranho?"
- Me surpreende: devolver o desafio com fato curioso ou aviso absurdo. "fato aleatório: lontras dormem de mãos dadas pra não se perder. essa é minha estratégia pro date"
- Convite em duas opções: callback + 2 opções concretas + saída leve. "esse debate do açaí precisa ser resolvido ao vivo. sábado à tarde ou domingo?"
- Recusa com classe (ela disse não): aceitar de primeira, leve, sem argumentar. "tranquilo! se mudar de ideia o clube anti-segunda segue aberto kkk"
Matam a conversa (nunca sugira): "oi tudo bem?", elogio físico/sexual, entrevista (só perguntas), textão, cobrar o "kkk" ou o sumiço ("??", "vai me ignorar?"), cantada pronta da internet, convite vago ("a gente podia sair um dia"), convidar pra casa no 1º encontro, insistir depois do não.
Sinais pra ler no print: (+) ela pergunta de volta, mensagens do mesmo tamanho ou maiores, entra na piada, risada longa/emoji/áudio, responde rápido ou pede desculpa pela demora, puxa assunto, dá pista de agenda. (-) só "kkk/sim/legal" por 3+ trocas, demora de dias com 1 palavra, desvia do convite sem outra data.
Hora do convite: ela riu 2+ vezes ou entrou na piada, surgiu aposta/discordância "que só se resolve ao vivo", ela citou comida/lugar/rolê, deu pista de agenda, ou a conversa está no pico (10-20 mensagens). Convite = dia + lugar público e curto + 2 opções + saída fácil.

A PRIMEIRA resposta (tom "Leve") é a que ele vê de graça: tem que ser a MELHOR das três, a que faz ele pensar "caramba, eu nunca ia pensar nisso". De preferência uma afirmação engraçada ou uma aposta, não uma pergunta.

Antes de escolher, escreva em "candidatas" 8 respostas bem diferentes entre si (fórmulas diferentes, todas citando algo concreto do print). Depois seja um juiz exigente: descarte as genéricas, as que parecem frase de coach e as que ele teria vergonha de mandar. As 3 melhores viram "respostas", a mais engraçada e surpreendente em primeiro.

Devolva SOMENTE JSON:
{"fora_do_escopo": false,
 "candidatas": ["8 rascunhos curtos"],
 "termometro": número 0-100 (o quanto ela parece interessada, honesto),
 "interesse": "frio|morno|quente",
 "sinais": [{"tipo":"+" ou "-", "texto":"sinal concreto que aparece no print, citando o que ela fez/escreveu"}] (3 a 4 itens),
 "interesse_porque": "resumo dos sinais em 1 frase",
 "passo": "voce|vinculo|vamos" (em qual dos 3V a conversa está agora),
 "leitura": "o que está acontecendo, 1-2 frases, que mostre que você leu de verdade",
 "erro": "o principal erro dele até aqui, 1 frase direta (ou 'nenhum, tá indo bem' se for o caso)",
 "estrategia": "o que fazer agora e por quê, 2-3 frases, citando o passo do 3V",
 "respostas": [{"tom":"Leve","texto":"...","porque":"por que funciona com ELA, citando o print e o princípio"},{"tom":"Ousada","texto":"...","porque":"..."},{"tom":"Direta","texto":"...","porque":"..."}],
 "reacao_provavel": "como ela provavelmente vai reagir à primeira resposta, 1 frase",
 "proximo_passo": "se ela responder bem, o que mandar em seguida (com a mensagem pronta)",
 "convite": "mensagem pronta de convite pra hora certa, com dia, lugar e alternativa, no estilo dele",
 "evitar": "o que NÃO mandar agora, 1 frase"}
Se o objetivo for primeira mensagem (print de perfil): "sinais" = ganchos do perfil dela (tipo "+"), "respostas" = 3 aberturas diferentes, "erro" = o erro mais comum que os caras cometem com esse tipo de perfil.`;

async function analisar(b: any) {
  const sessao = String(b.sessao || "").slice(0, 64);
  if (!sessao) return out(400, { erro: "sessao" });
  const imgs: string[] = (Array.isArray(b.imagens) ? b.imagens : []).filter((s: unknown) => typeof s === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(s as string) && (s as string).length < 3_500_000).slice(0, 4);
  if (!imgs.length) return out(400, { erro: "Mande pelo menos 1 print." });
  if (!OPENAI) return out(503, { erro: "IA indisponível no momento. Tente de novo em alguns minutos." });
  const email = limpaEmail(b.email);
  const pago = await temAcesso(email, sessao);
  if (pago) {
    const dia = new Date(Date.now() - 864e5).toISOString();
    const n = (await db(`match_copiloto_uso?email=eq.${encodeURIComponent(email)}&criado_em=gt.${dia}&select=id`)).data?.length || 0;
    if (n >= 40) return out(429, { erro: "Você chegou ao limite de 40 análises em 24h. Volte mais tarde." });
  } else {
    const filtro = email ? `or=(sessao.eq.${sessao},email.eq.${encodeURIComponent(email)})` : `sessao=eq.${sessao}`;
    const n = (await db(`match_copiloto_uso?${filtro}&erro=is.null&select=id`)).data?.length || 0;
    if (n >= 1) return out(200, { bloqueado: true, motivo: "gratis_usado" });
  }
  const objetivo = OBJ[b.objetivo] ? b.objetivo : "continuar";
  const ctx = String(b.contexto || "").slice(0, 400);
  const content: any[] = [{ type: "text", text: `Objetivo dele agora: ${OBJ[objetivo]}.${ctx ? `\nContexto que ele deu: ${ctx}` : ""}\nPrints em ordem:` }];
  imgs.forEach((u) => content.push({ type: "image_url", image_url: { url: u, detail: "high" } }));
  const modelo = b.anuncio === "teste-interno" && typeof b.modelo === "string" && /^[a-z0-9.\-]{3,40}$/.test(b.modelo) ? b.modelo : MODELO;
  const raciocina = /^(gpt-5|o\d)/.test(modelo);
  const t0 = Date.now();
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + OPENAI, "Content-Type": "application/json" },
    body: JSON.stringify({ model: modelo, ...(raciocina ? { max_completion_tokens: 8000, reasoning_effort: b.anuncio === "teste-interno" && ["minimal", "low", "medium"].includes(b.esforco) ? b.esforco : "low" } : { temperature: 0.9, max_tokens: 2400 }), response_format: { type: "json_object" }, messages: [{ role: "system", content: SISTEMA }, { role: "user", content }] }) });
  const j = await r.json().catch(() => ({}));
  const uso = { sessao, email: email || null, pago, objetivo, imagens: imgs.length, ms: Date.now() - t0, tokens: j?.usage?.total_tokens || null, anuncio: b.anuncio ? String(b.anuncio).slice(0, 200) : null };
  if (!r.ok) { await db("match_copiloto_uso", { method: "POST", prefer: "return=minimal", body: { ...uso, erro: "openai " + r.status } }); return out(502, { erro: "Não consegui ler agora. Tente de novo.", ...(b.anuncio === "teste-interno" ? { det: j?.error?.message } : {}) }); }
  let res: any = {}; try { res = JSON.parse(j.choices[0].message.content); } catch { /* */ }
  if (res.fora_do_escopo || !Array.isArray(res.respostas)) { await db("match_copiloto_uso", { method: "POST", prefer: "return=minimal", body: { ...uso, erro: "fora_do_escopo" } }); return out(200, { fora_do_escopo: true }); }
  const t = (x: unknown, n: number) => String(x || "").slice(0, n);
  const resp = res.respostas.slice(0, 3).map((x: any) => ({ tom: t(x.tom, 20), texto: t(x.texto, 400), porque: t(x.porque, 240) }));
  await db("match_copiloto_uso", { method: "POST", prefer: "return=minimal", body: { ...uso, interesse: t(res.interesse, 10) } });
  const termo = Math.max(0, Math.min(100, Math.round(Number(res.termometro) || 0)));
  const sinais = (Array.isArray(res.sinais) ? res.sinais : []).slice(0, 4).map((x: any) => ({ tipo: x?.tipo === "-" ? "-" : "+", texto: t(x?.texto, 200) })).filter((x: any) => x.texto);
  const passo = ["voce", "vinculo", "vamos"].includes(res.passo) ? res.passo : "vinculo";
  const base = { leitura: t(res.leitura, 400), interesse: t(res.interesse, 10), interesse_porque: t(res.interesse_porque, 300), termometro: termo, sinais, passo, erro: t(res.erro, 240), estrategia: t(res.estrategia, 500), evitar: t(res.evitar, 240), reacao_provavel: t(res.reacao_provavel, 240) };
  if (b.anuncio === "teste-interno") return out(200, { teste: true, modelo, ...base, candidatas: res.candidatas, respostas: resp, proximo_passo: t(res.proximo_passo, 400), convite: t(res.convite, 300) });
  if (pago) return out(200, { pago: true, ...base, respostas: resp, proximo_passo: t(res.proximo_passo, 400), convite: t(res.convite, 300) });
  const inicio = (s: string) => s.split(/\s+/).slice(0, 3).join(" ");
  return out(200, { pago: false, ...base, respostas: resp.map((x: any, i: number) => (i === 0 ? x : { tom: x.tom, bloqueada: true, inicio: inicio(x.texto) })), proximo_passo: null, convite: null, convite_inicio: inicio(t(res.convite, 300)) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return out(405, { erro: "método" });
  let b: any = {}; try { b = JSON.parse(await req.text()); } catch { return out(400, { erro: "json" }); }
  try {
    if (b.acao === "acesso") { const e = limpaEmail(b.email); return out(200, { email: e || null, ativo: await temAcesso(e, String(b.sessao || "")) }); }
    if (b.acao === "analisar") return await analisar(b);
    return out(400, { erro: "acao" });
  } catch (e) { console.error(e); return out(500, { erro: "Falha inesperada. Tente de novo." }); }
});
