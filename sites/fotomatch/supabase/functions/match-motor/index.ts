// FotoMatch — Motor de Fotos N3W (Supabase Edge Function "match-motor"). ESQUELETO.
// Objetivo: teste A/B multi-referência (sem treino) em 3 modelos lado a lado — GPT Image (OpenAI),
// Nano Banana Pro e Seedream 5 Pro (Higgsfield) — com cenas "estética de namoro" e QA de rosto.
//
// TRAVA DE VERBA: nada é gerado enquanto o card match-20261011-motor-decisao não for aprovado pelo Othon.
// Para liberar são necessárias AS DUAS coisas (de propósito):
//   1) public.match_config (chave 'motor') com valor.verba_aprovada = true e teto_usd_por_rodada > 0
//   2) secret MATCH_MOTOR_LIBERADO = "match-20261011-motor-decisao"
// Sem isso, "gerar" responde 423 e NENHUMA API paga é chamada. "plano" só calcula (custo zero).
//
// Autorização: verify_jwt=false (padrão do projeto) + exige Authorization: Bearer <SERVICE_ROLE_KEY>.
// Ou seja, só o servidor/owner chama; o navegador do cliente nunca chama o motor.
// Rostos: só "sintetico" (gerado por IA), "voluntario_autorizado" (autorização escrita) ou "cliente_pago".
// Nunca use fotos de pessoas reais sem autorização.

const SB = Deno.env.get("SUPABASE_URL")!;
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LIBERADO = Deno.env.get("MATCH_MOTOR_LIBERADO") === "match-20261011-motor-decisao";
const OPENAI = Deno.env.get("OPENAI_API_KEY") || "";
const HIGGSFIELD = Deno.env.get("HIGGSFIELD_API_KEY") || "";
const CARD = "match-20261011-motor-decisao";

const out = (code: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function db(path: string) {
  const r = await fetch(SB + "/rest/v1/" + path, { headers: { apikey: SK, Authorization: "Bearer " + SK } });
  return r.ok ? await r.json() : null;
}

/* ---------- Cenas "estética de namoro" ---------- */
// Base comum: parecer foto de celular tirada por um amigo (crítica ao concorrente: "posado e clichê").
const ESTILO = "foto vertical 4:5 tirada com celular por um amigo, luz natural, grão leve, foco no rosto, " +
  "sem cara de estúdio, sem filtro, pele com textura real, mesma pessoa das fotos de referência (mesmo rosto, cabelo, barba e tipo físico), " +
  "sem texto, sem marca d'água, mãos naturais";
export const CENAS: Record<string, { nome: string; prompt: string }> = {
  terno_rua: { nome: "Terno na cidade", prompt: "de terno bem ajustado caminhando numa rua da cidade no fim de tarde, sorriso leve, olhar fora da câmera" },
  jantar: { nome: "Jantar à noite", prompt: "sentado num restaurante à noite com luz quente de velas, camisa social, rindo de algo fora do quadro" },
  cafe: { nome: "Café", prompt: "num café com janela grande, segurando uma xícara, roupa casual arrumada, luz da manhã" },
  praia_trilha: { nome: "Praia/trilha no pôr do sol", prompt: "numa trilha com vista ou na praia no pôr do sol, roupa leve, corpo inteiro ou 3/4" },
  academia: { nome: "Academia", prompt: "numa academia bem iluminada entre séries, camiseta de treino, expressão confiante, sem pose exagerada" },
  viagem: { nome: "Viagem", prompt: "em viagem numa praça histórica ou mirante, mochila pequena, foto espontânea" },
  cachorro: { nome: "Com cachorro", prompt: "num parque brincando com um cachorro de porte médio, sorriso aberto" },
  show: { nome: "Show/rolê", prompt: "num show ou bar com amigos desfocados ao fundo, luzes coloridas, momento espontâneo" },
  esporte: { nome: "Esporte", prompt: "jogando ou depois de jogar futebol/tênis/beach tennis, suado de leve, luz do dia" },
  pb: { nome: "Preto e branco", prompt: "retrato em preto e branco, meio corpo, luz lateral de janela, camiseta lisa" },
};
const promptDaCena = (id: string) => `${CENAS[id].prompt}. ${ESTILO}.`;

/* ---------- Adaptadores dos 3 modelos ---------- */
type Pedido = { referencias: string[]; cena: string; candidatas: number };
type Resultado = { modelo: string; cena: string; imagens: string[]; custo_usd: number; erro?: string };
interface Adaptador { id: string; nome: string; via: "openai" | "higgsfield"; custo_usd_img: [number, number]; pronto(): boolean; gerar(p: Pedido): Promise<Resultado> }

const gptImage: Adaptador = {
  id: "gpt-image", nome: "GPT Image (OpenAI)", via: "openai", custo_usd_img: [0.03, 0.05],
  pronto: () => !!OPENAI,
  async gerar(p) {
    // POST https://api.openai.com/v1/images/edits (multipart): image[] = referências (3–6 selfies), prompt = cena,
    // model = Deno.env MATCH_GPT_IMAGE_MODELO (ex.: "gpt-image-1"), size "1024x1536", n = candidatas.
    // Implementação real só depois do sim do Othon (custo). Nunca chamada com a trava fechada.
    throw new Error("adaptador gpt-image: chamada real ainda não implementada (aguardando aprovação de verba)");
  },
};
const nanoBananaPro: Adaptador = {
  id: "nano-banana-pro", nome: "Nano Banana Pro (Higgsfield)", via: "higgsfield", custo_usd_img: [0.05, 0.09],
  pronto: () => !!HIGGSFIELD,
  async gerar(_p) {
    // Higgsfield: upload das referências → geração multi-referência → poll do job → URLs.
    // Endpoint/contrato da API Higgsfield a confirmar (hoje usamos o Higgsfield via conector, não via API própria).
    throw new Error("adaptador nano-banana-pro: contrato da API Higgsfield pendente");
  },
};
const seedream5Pro: Adaptador = {
  id: "seedream-5-pro", nome: "Seedream 5 Pro (Higgsfield)", via: "higgsfield", custo_usd_img: [0.035, 0.07],
  pronto: () => !!HIGGSFIELD,
  async gerar(_p) { throw new Error("adaptador seedream-5-pro: contrato da API Higgsfield pendente"); },
};
const ADAPTADORES = [gptImage, nanoBananaPro, seedream5Pro];

/* ---------- QA de rosto e de qualidade ---------- */
// 1) Similaridade de rosto por embedding (ArcFace/InsightFace): não roda em Deno puro; previsto serviço externo
//    (ex.: container com InsightFace) chamado aqui com corte mínimo configurável (MATCH_QA_CORTE, ex.: 0.45 cos).
// 2) Juiz de visão (OpenAI) para mãos, olhos, texto, roupa e "cara de IA" → nota 0–10; reprova < 7.
export async function qaRosto(_referencias: string[], _candidata: string) {
  return { similaridade: null as number | null, aprovado: null as boolean | null, status: "pendente: serviço de embedding não configurado" };
}
export async function qaJuiz(_candidata: string) {
  return { nota: null as number | null, defeitos: [] as string[], status: "pendente: roda só com a trava aberta" };
}

/* ---------- Trava de verba ---------- */
async function trava() {
  const cfg = (await db("match_config?chave=eq.motor&select=valor"))?.[0]?.valor || {};
  const aprovadaNoBanco = cfg.verba_aprovada === true && Number(cfg.teto_usd_por_rodada) > 0;
  return { liberado: LIBERADO && aprovadaNoBanco, secret: LIBERADO, banco: aprovadaNoBanco, teto_usd: Number(cfg.teto_usd_por_rodada) || 0, card: CARD };
}

function plano(b: any) {
  const rostos = Math.max(1, Math.min(5, Number(b.rostos) || 3));
  const cenas = (Array.isArray(b.cenas) && b.cenas.length ? b.cenas : Object.keys(CENAS)).filter((c: string) => CENAS[c]).slice(0, 10);
  const candidatas = Math.max(1, Math.min(4, Number(b.candidatas) || 2));
  const modelos = ADAPTADORES.filter((a) => !Array.isArray(b.modelos) || b.modelos.includes(a.id));
  const linhas = modelos.map((a) => {
    const n = rostos * cenas.length * candidatas;
    return { modelo: a.id, nome: a.nome, geracoes: n, custo_usd: [+(n * a.custo_usd_img[0]).toFixed(2), +(n * a.custo_usd_img[1]).toFixed(2)], pronto: a.pronto() };
  });
  const total = linhas.reduce((s, l) => [s[0] + l.custo_usd[0], s[1] + l.custo_usd[1]], [0, 0]).map((x) => +x.toFixed(2));
  return { rostos, cenas: cenas.map((c: string) => ({ id: c, nome: CENAS[c].nome, prompt: promptDaCena(c) })), candidatas_por_cena: candidatas, modelos: linhas, custo_total_usd: total,
    regra_rostos: "3 rostos sintéticos (gerados por IA) ou voluntários com autorização escrita. Nunca fotos de pessoas reais sem autorização.",
    saida: "Mesa de Luz: grade rosto × cena × modelo para o Othon escolher o motor." };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return out(405, { erro: "use POST" });
  const auth = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!auth || auth !== SK) return out(401, { erro: "só o servidor chama o motor" });
  let b: any = {}; try { b = await req.json(); } catch { /* vazio */ }
  const t = await trava();
  switch (b.acao) {
    case "saude":
      return out(200, { trava: t, adaptadores: ADAPTADORES.map((a) => ({ id: a.id, nome: a.nome, via: a.via, chave: a.pronto() ? "presente" : "pendente" })) });
    case "cenas":
      return out(200, { cenas: Object.entries(CENAS).map(([id, c]) => ({ id, nome: c.nome, prompt: promptDaCena(id) })) });
    case "plano":
      return out(200, { plano: plano(b), trava: t });
    case "gerar": {
      if (!t.liberado) return out(423, { erro: "verba não aprovada", card: CARD, detalhe: "Geração bloqueada até o Othon aprovar o card. Nenhuma API paga foi chamada.", trava: t });
      const origem = String(b.origem_rosto || "");
      if (!["sintetico", "voluntario_autorizado", "cliente_pago"].includes(origem)) return out(400, { erro: "origem_rosto obrigatória: sintetico | voluntario_autorizado | cliente_pago" });
      const p = plano(b);
      if (p.custo_total_usd[1] > t.teto_usd) return out(400, { erro: `rodada passa do teto (US$ ${p.custo_total_usd[1]} > US$ ${t.teto_usd})` });
      const refs: string[] = (Array.isArray(b.referencias) ? b.referencias : []).map(String).slice(0, 6);
      if (refs.length < 3) return out(400, { erro: "mínimo 3 referências (paths do bucket match-selfies)" });
      const resultados: Resultado[] = [];
      for (const a of ADAPTADORES.filter((x) => p.modelos.some((m) => m.modelo === x.id))) {
        for (const c of p.cenas) {
          try { resultados.push(await a.gerar({ referencias: refs, cena: c.id, candidatas: p.candidatas_por_cena })); }
          catch (e) { resultados.push({ modelo: a.id, cena: c.id, imagens: [], custo_usd: 0, erro: String(e) }); }
        }
      }
      return out(200, { resultados });
    }
  }
  return out(400, { erro: "ação desconhecida (saude | cenas | plano | gerar)" });
});
