// N3w Meta — conector MCP próprio para a Meta Marketing API (substitui o Windsor).
// Roda como Cloudflare Worker. Protocolo: MCP Streamable HTTP (JSON-RPC 2.0, sem estado).
//
// Segredos (wrangler secret put …  ou painel Cloudflare > Worker > Settings > Variables):
//   META_TOKEN     token de System User (não expira) com ads_management, ads_read, business_management
//   CONNECTOR_KEY  chave longa aleatória; a URL do conector fica  https://<worker>/mcp/<CONNECTOR_KEY>
// Variáveis (wrangler.toml):
//   GRAPH_VERSION  versão fixada da Graph API (trocar só aqui quando a Meta lançar nova)
//   AD_ACCOUNT_ID  conta padrão (sem "act_")
//   PAGE_ID        página padrão dos anúncios
//
// REGRA INQUEBRÁVEL: nada é ativado e nenhum orçamento sobe sem autorização humana.
// Tudo nasce PAUSADO. Ativar ou aumentar orçamento exige o campo `autorizacao_humana`
// com a frase de autorização do Othon, que fica registrada no log da resposta.

const SERVER_INFO = { name: "n3w-meta", version: "0.1.0" };
const PROTOCOL_VERSIONS = ["2025-06-18", "2025-03-26", "2024-11-05"];

// ---------------------------------------------------------------- Graph API

class MetaError extends Error {
  constructor(status, body) {
    const e = (body && body.error) || {};
    super(e.error_user_msg || e.message || `HTTP ${status}`);
    this.status = status;
    this.code = e.code;
    this.subcode = e.error_subcode;
    this.title = e.error_user_title;
    this.fbtrace = e.fbtrace_id;
    this.transient = e.is_transient;
  }
  toJSON() {
    return { erro: this.message, titulo: this.title, code: this.code, subcode: this.subcode, http: this.status, fbtrace_id: this.fbtrace };
  }
}

// Códigos de limite/erro temporário da Meta que valem nova tentativa.
const RETRY_CODES = new Set([1, 2, 4, 17, 32, 341, 613, 80000, 80003, 80004, 80014]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function usageFrom(headers) {
  const out = {};
  for (const h of ["x-business-use-case-usage", "x-ad-account-usage", "x-app-usage"]) {
    const v = headers.get(h);
    if (v) { try { out[h] = JSON.parse(v); } catch { out[h] = v; } }
  }
  return out;
}

function encodeParams(params) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null) continue;
    p.set(k, typeof v === "object" ? JSON.stringify(v) : String(v));
  }
  return p;
}

async function graph(env, method, path, params = {}, ctx = {}) {
  const base = `https://graph.facebook.com/${env.GRAPH_VERSION}/${path.replace(/^\//, "")}`;
  const body = encodeParams(params);
  const headers = { Authorization: `Bearer ${env.META_TOKEN}` };
  let url = base, init = { method, headers };
  if (method === "GET") url = `${base}?${body}`;
  else { init.body = body; headers["Content-Type"] = "application/x-www-form-urlencoded"; }

  let last;
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, init);
    ctx.usage = usageFrom(res.headers);
    let json;
    try { json = await res.json(); } catch { json = {}; }
    if (res.ok && !json.error) return json;
    last = new MetaError(res.status, json);
    const retry = res.status >= 500 || RETRY_CODES.has(last.code) || last.transient;
    // Escritas só repetem em erro de limite (não duplicar criação após 5xx ambíguo).
    if (!retry || (method !== "GET" && !RETRY_CODES.has(last.code))) break;
    await sleep(Math.min(8000, 800 * 2 ** attempt) + Math.random() * 300);
  }
  throw last;
}

async function graphAll(env, path, params, limit = 200) {
  const out = [];
  let after;
  while (out.length < limit) {
    const r = await graph(env, "GET", path, { ...params, limit: Math.min(100, limit - out.length), after });
    out.push(...(r.data || []));
    after = r.paging && r.paging.cursors && r.paging.next ? r.paging.cursors.after : null;
    if (!after) break;
  }
  return out;
}

const act = (env, a) => `act_${String(a || env.AD_ACCOUNT_ID).replace(/^act_/, "")}`;

// ---------------------------------------------------------------- Regras de segurança

function exigeAutorizacao(args, oque) {
  const a = (args.autorizacao_humana || "").trim();
  if (a.length < 3) {
    throw new Error(`Bloqueado: ${oque} exige autorização humana. Peça ao Othon e repita a chamada com "autorizacao_humana" contendo a frase exata dele.`);
  }
  return a;
}

// ---------------------------------------------------------------- Ferramentas

const S = (props, required = []) => ({ type: "object", properties: props, required });
const str = (d) => ({ type: "string", description: d });
const num = (d) => ({ type: "number", description: d });
const AUT = str("Frase exata de autorização do Othon (obrigatória para ativar ou aumentar orçamento).");
const CONTA = str("ID da conta (opcional; padrão = conta configurada)");

const CAMPOS_CAMPANHA = "id,name,status,effective_status,objective,daily_budget,lifetime_budget,bid_strategy,buying_type,created_time";
const CAMPOS_CONJUNTO = "id,name,status,effective_status,campaign_id,daily_budget,optimization_goal,billing_event,bid_amount,promoted_object,targeting,created_time";
const CAMPOS_ANUNCIO = "id,name,status,effective_status,adset_id,campaign_id,creative{id,name,video_id,object_story_spec,thumbnail_url},created_time";

const TOOLS = [
  {
    name: "conta_info",
    description: "Dados da conta de anúncios (nome, moeda, fuso, gasto, status) e versão da API em uso.",
    inputSchema: S({ conta: CONTA }),
    run: async (env, a) => ({
      graph_version: env.GRAPH_VERSION,
      conta: await graph(env, "GET", act(env, a.conta), { fields: "id,name,currency,timezone_name,account_status,amount_spent,spend_cap,disable_reason" }),
    }),
  },
  {
    name: "listar_campanhas",
    description: "Lista campanhas. Filtro opcional por status efetivo (ACTIVE, PAUSED…) e por trecho do nome.",
    inputSchema: S({ conta: CONTA, status: { type: "array", items: { type: "string" } }, nome_contem: str("trecho do nome"), limite: num("máx. 200") }),
    run: async (env, a) => {
      const filtering = [];
      if (a.status && a.status.length) filtering.push({ field: "effective_status", operator: "IN", value: a.status });
      if (a.nome_contem) filtering.push({ field: "name", operator: "CONTAIN", value: a.nome_contem });
      return graphAll(env, `${act(env, a.conta)}/campaigns`, { fields: CAMPOS_CAMPANHA, filtering: filtering.length ? filtering : undefined }, a.limite || 200);
    },
  },
  {
    name: "listar_conjuntos",
    description: "Lista conjuntos de anúncios da conta ou de uma campanha.",
    inputSchema: S({ conta: CONTA, campanha_id: str("opcional"), status: { type: "array", items: { type: "string" } }, limite: num("máx. 200") }),
    run: async (env, a) => {
      const path = a.campanha_id ? `${a.campanha_id}/adsets` : `${act(env, a.conta)}/adsets`;
      const filtering = a.status && a.status.length ? [{ field: "effective_status", operator: "IN", value: a.status }] : undefined;
      return graphAll(env, path, { fields: CAMPOS_CONJUNTO, filtering }, a.limite || 200);
    },
  },
  {
    name: "listar_anuncios",
    description: "Lista anúncios da conta, de uma campanha ou de um conjunto (com criativo).",
    inputSchema: S({ conta: CONTA, campanha_id: str("opcional"), conjunto_id: str("opcional"), status: { type: "array", items: { type: "string" } }, limite: num("máx. 200") }),
    run: async (env, a) => {
      const path = a.conjunto_id ? `${a.conjunto_id}/ads` : a.campanha_id ? `${a.campanha_id}/ads` : `${act(env, a.conta)}/ads`;
      const filtering = a.status && a.status.length ? [{ field: "effective_status", operator: "IN", value: a.status }] : undefined;
      return graphAll(env, path, { fields: CAMPOS_ANUNCIO, filtering }, a.limite || 200);
    },
  },
  {
    name: "insights",
    description: "Métricas (gasto, CPM, CTR, CPC, compras, checkout, ROAS…). Nível account|campaign|adset|ad. Use periodo (today, yesterday, last_7d, last_30d, maximum…) ou desde/ate (AAAA-MM-DD).",
    inputSchema: S({
      conta: CONTA, objeto_id: str("opcional: id de campanha/conjunto/anúncio; padrão = conta"),
      nivel: { type: "string", enum: ["account", "campaign", "adset", "ad"] },
      periodo: str("date_preset"), desde: str("AAAA-MM-DD"), ate: str("AAAA-MM-DD"),
      por_dia: { type: "boolean" }, campos: str("lista separada por vírgula (opcional)"), quebras: str("breakdowns, ex.: age,gender (opcional)"),
      filtro_status: { type: "array", items: { type: "string" }, description: "ex.: [\"ACTIVE\"] filtra pelo status efetivo do nível" },
    }),
    run: async (env, a) => {
      const nivel = a.nivel || "campaign";
      const fields = a.campos || "campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,frequency,cpm,clicks,inline_link_clicks,inline_link_click_ctr,cost_per_inline_link_click,actions,action_values,cost_per_action_type,purchase_roas";
      const p = { level: nivel, fields, breakdowns: a.quebras };
      if (a.desde) p.time_range = { since: a.desde, until: a.ate || a.desde }; else p.date_preset = a.periodo || "today";
      if (a.por_dia) p.time_increment = 1;
      if (a.filtro_status && a.filtro_status.length) p.filtering = [{ field: `${nivel === "account" ? "campaign" : nivel}.effective_status`, operator: "IN", value: a.filtro_status }];
      const rows = await graphAll(env, `${a.objeto_id || act(env, a.conta)}/insights`, p, 500);
      return rows.map(resumoLinha);
    },
  },
  {
    name: "criar_campanha",
    description: "Cria campanha SEMPRE PAUSADA. Orçamento diário em reais (CBO) opcional.",
    inputSchema: S({
      conta: CONTA, nome: str("nome"), objetivo: str("ex.: OUTCOME_SALES (padrão), OUTCOME_LEADS, OUTCOME_TRAFFIC"),
      orcamento_diario_reais: num("CBO; omita para orçamento no conjunto"), estrategia_lance: str("padrão LOWEST_COST_WITHOUT_CAP"),
      categorias_especiais: { type: "array", items: { type: "string" } },
    }, ["nome"]),
    run: async (env, a) => graph(env, "POST", `${act(env, a.conta)}/campaigns`, {
      name: a.nome, objective: a.objetivo || "OUTCOME_SALES", status: "PAUSED",
      special_ad_categories: a.categorias_especiais || [],
      daily_budget: a.orcamento_diario_reais ? Math.round(a.orcamento_diario_reais * 100) : undefined,
      bid_strategy: a.orcamento_diario_reais ? (a.estrategia_lance || "LOWEST_COST_WITHOUT_CAP") : undefined,
      is_adset_budget_sharing_enabled: a.orcamento_diario_reais ? undefined : false,
    }),
  },
  {
    name: "criar_conjunto",
    description: "Cria conjunto SEMPRE PAUSADO. Para Advantage+ com público sugerido: advantage_plus=true e publicos_sugeridos=[ids]. targeting_json permite passar o targeting completo da Meta.",
    inputSchema: S({
      conta: CONTA, campanha_id: str("campanha"), nome: str("nome"),
      pixel_id: str("pixel para OFFSITE_CONVERSIONS"), evento: str("padrão PURCHASE"),
      otimizacao: str("padrão OFFSITE_CONVERSIONS"), orcamento_diario_reais: num("só se a campanha não for CBO"),
      paises: { type: "array", items: { type: "string" }, description: "padrão [\"BR\"]" },
      idade_min: num("padrão 18"), idade_max: num("padrão 65"),
      advantage_plus: { type: "boolean", description: "público Advantage+ (padrão true)" },
      publicos_sugeridos: { type: "array", items: { type: "string" }, description: "IDs de públicos personalizados/semelhantes" },
      targeting_json: { type: "object", description: "targeting completo (substitui os campos acima)" },
      inicio: str("ISO opcional"),
    }, ["campanha_id", "nome"]),
    run: async (env, a) => {
      const adv = a.advantage_plus !== false;
      const targeting = a.targeting_json || {
        geo_locations: { countries: a.paises || ["BR"] },
        age_min: a.idade_min || 18, age_max: a.idade_max || 65,
        custom_audiences: a.publicos_sugeridos && a.publicos_sugeridos.length ? a.publicos_sugeridos.map((id) => ({ id })) : undefined,
        targeting_automation: { advantage_audience: adv ? 1 : 0 },
      };
      return graph(env, "POST", `${act(env, a.conta)}/adsets`, {
        campaign_id: a.campanha_id, name: a.nome, status: "PAUSED",
        optimization_goal: a.otimizacao || "OFFSITE_CONVERSIONS", billing_event: "IMPRESSIONS",
        promoted_object: a.pixel_id ? { pixel_id: a.pixel_id, custom_event_type: a.evento || "PURCHASE" } : undefined,
        daily_budget: a.orcamento_diario_reais ? Math.round(a.orcamento_diario_reais * 100) : undefined,
        targeting, start_time: a.inicio,
      });
    },
  },
  {
    name: "duplicar_campanha",
    description: "Duplica uma campanha (cópia PAUSADA). deep_copy=true copia conjuntos e anúncios.",
    inputSchema: S({ campanha_id: str("origem"), deep_copy: { type: "boolean" }, sufixo_nome: str("opcional") }, ["campanha_id"]),
    run: async (env, a) => graph(env, "POST", `${a.campanha_id}/copies`, {
      deep_copy: !!a.deep_copy, status_option: "PAUSED",
      rename_options: a.sufixo_nome ? { rename_suffix: a.sufixo_nome } : undefined,
    }),
  },
  {
    name: "duplicar_conjunto",
    description: "Duplica um conjunto (cópia PAUSADA), opcionalmente para outra campanha. Se deep_copy falhar por criativo antigo, use deep_copy=false e crie o anúncio depois.",
    inputSchema: S({ conjunto_id: str("origem"), campanha_destino_id: str("opcional"), deep_copy: { type: "boolean" }, sufixo_nome: str("opcional") }, ["conjunto_id"]),
    run: async (env, a) => graph(env, "POST", `${a.conjunto_id}/copies`, {
      campaign_id: a.campanha_destino_id, deep_copy: !!a.deep_copy, status_option: "PAUSED",
      rename_options: a.sufixo_nome ? { rename_suffix: a.sufixo_nome } : undefined,
    }),
  },
  {
    name: "subir_video",
    description: "Sobe um vídeo na biblioteca da conta a partir de uma URL pública (ex.: GitHub raw, bucket R2). Retorna video_id.",
    inputSchema: S({ conta: CONTA, url: str("URL pública do .mp4"), nome: str("título") }, ["url"]),
    run: async (env, a) => graph(env, "POST", `${act(env, a.conta)}/advideos`, { file_url: a.url, name: a.nome }),
  },
  {
    name: "status_video",
    description: "Verifica se o vídeo já foi processado (pronto para anúncio) e retorna miniaturas.",
    inputSchema: S({ video_id: str("id") }, ["video_id"]),
    run: async (env, a) => graph(env, "GET", a.video_id, { fields: "id,title,status,length,picture,thumbnails{uri,is_preferred}" }),
  },
  {
    name: "subir_imagem",
    description: "Sobe imagem por URL pública. Retorna image_hash.",
    inputSchema: S({ conta: CONTA, url: str("URL pública") }, ["url"]),
    run: async (env, a) => {
      const r = await fetch(a.url);
      if (!r.ok) throw new Error(`Não consegui baixar a imagem (${r.status})`);
      const b64 = arrayBufferToBase64(await r.arrayBuffer());
      return graph(env, "POST", `${act(env, a.conta)}/adimages`, { bytes: b64 });
    },
  },
  {
    name: "criar_criativo",
    description: "Cria criativo de vídeo ou imagem (object_story_spec) com CTA livre (inclui SEE_DETAILS, LEARN_MORE, SHOP_NOW…).",
    inputSchema: S({
      conta: CONTA, nome: str("nome"), pagina_id: str("padrão = página configurada"), instagram_id: str("opcional"),
      video_id: str("para vídeo"), miniatura_url: str("obrigatória com vídeo; use status_video"), image_hash: str("para imagem"),
      texto: str("texto principal"), titulo: str("headline"), descricao: str("opcional"),
      link: str("URL de destino"), cta: str("padrão SEE_DETAILS"), url_tags: str("UTMs opcionais"),
    }, ["nome", "texto", "link"]),
    run: async (env, a) => {
      const page_id = a.pagina_id || env.PAGE_ID;
      const call_to_action = { type: a.cta || "SEE_DETAILS", value: { link: a.link } };
      const spec = { page_id, instagram_user_id: a.instagram_id };
      if (a.video_id) spec.video_data = { video_id: a.video_id, image_url: a.miniatura_url, message: a.texto, title: a.titulo, link_description: a.descricao, call_to_action };
      else spec.link_data = { image_hash: a.image_hash, link: a.link, message: a.texto, name: a.titulo, description: a.descricao, call_to_action };
      return graph(env, "POST", `${act(env, a.conta)}/adcreatives`, { name: a.nome, object_story_spec: spec, url_tags: a.url_tags });
    },
  },
  {
    name: "criar_anuncio",
    description: "Cria anúncio SEMPRE PAUSADO num conjunto, usando um criativo existente.",
    inputSchema: S({ conta: CONTA, conjunto_id: str("conjunto"), criativo_id: str("criativo"), nome: str("nome") }, ["conjunto_id", "criativo_id", "nome"]),
    run: async (env, a) => graph(env, "POST", `${act(env, a.conta)}/ads`, {
      adset_id: a.conjunto_id, name: a.nome, status: "PAUSED", creative: { creative_id: a.criativo_id },
    }),
  },
  {
    name: "pausar",
    description: "Pausa campanha, conjunto ou anúncio (pausar é livre; registre no painel como ação).",
    inputSchema: S({ id: str("id do objeto") }, ["id"]),
    run: async (env, a) => graph(env, "POST", a.id, { status: "PAUSED" }),
  },
  {
    name: "ativar",
    description: "ATIVA campanha/conjunto/anúncio. Bloqueado sem autorizacao_humana (regra inquebrável).",
    inputSchema: S({ ids: { type: "array", items: { type: "string" } }, autorizacao_humana: AUT }, ["ids", "autorizacao_humana"]),
    run: async (env, a) => {
      const aut = exigeAutorizacao(a, "ativar");
      const out = [];
      for (const id of a.ids) {
        try { out.push({ id, ok: await graph(env, "POST", id, { status: "ACTIVE" }) }); }
        catch (e) { out.push({ id, erro: e instanceof MetaError ? e.toJSON() : String(e.message) }); }
      }
      return { autorizacao_registrada: aut, resultado: out };
    },
  },
  {
    name: "alterar_orcamento",
    description: "Altera orçamento diário (reais) de campanha CBO ou conjunto. Reduzir é livre; AUMENTAR exige autorizacao_humana.",
    inputSchema: S({ id: str("campanha ou conjunto"), orcamento_diario_reais: num("novo valor"), autorizacao_humana: AUT }, ["id", "orcamento_diario_reais"]),
    run: async (env, a) => {
      const atual = await graph(env, "GET", a.id, { fields: "daily_budget,name" });
      const novo = Math.round(a.orcamento_diario_reais * 100);
      let aut = null;
      if (!atual.daily_budget || novo > Number(atual.daily_budget)) aut = exigeAutorizacao(a, "aumentar orçamento");
      const r = await graph(env, "POST", a.id, { daily_budget: novo });
      return { nome: atual.name, de_reais: atual.daily_budget ? Number(atual.daily_budget) / 100 : null, para_reais: novo / 100, autorizacao_registrada: aut, ...r };
    },
  },
  {
    name: "renomear",
    description: "Renomeia campanha, conjunto ou anúncio.",
    inputSchema: S({ id: str("id"), nome: str("novo nome") }, ["id", "nome"]),
    run: async (env, a) => graph(env, "POST", a.id, { name: a.nome }),
  },
  {
    name: "trocar_criativo",
    description: "Troca o criativo de um anúncio existente.",
    inputSchema: S({ anuncio_id: str("anúncio"), criativo_id: str("novo criativo") }, ["anuncio_id", "criativo_id"]),
    run: async (env, a) => graph(env, "POST", a.anuncio_id, { creative: { creative_id: a.criativo_id } }),
  },
  {
    name: "editar_conjunto",
    description: "Edita targeting / Advantage+ / públicos de um conjunto (não altera status nem orçamento).",
    inputSchema: S({ conjunto_id: str("conjunto"), targeting_json: { type: "object", description: "targeting completo novo" } }, ["conjunto_id", "targeting_json"]),
    run: async (env, a) => graph(env, "POST", a.conjunto_id, { targeting: a.targeting_json }),
  },
  {
    name: "listar_publicos",
    description: "Lista públicos personalizados e semelhantes (tamanho estimado e status de entrega).",
    inputSchema: S({ conta: CONTA }),
    run: async (env, a) => graphAll(env, `${act(env, a.conta)}/customaudiences`, {
      fields: "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status,lookalike_spec,time_created",
    }, 200),
  },
  {
    name: "criar_semelhante",
    description: "Cria público semelhante (lookalike) a partir de um público de origem. Faixa em % (ex.: 1 a 3).",
    inputSchema: S({ conta: CONTA, origem_id: str("público de origem"), nome: str("nome"), pais: str("padrão BR"), de_pct: num("início, ex.: 0"), ate_pct: num("fim, ex.: 3") }, ["origem_id", "nome"]),
    run: async (env, a) => graph(env, "POST", `${act(env, a.conta)}/customaudiences`, {
      name: a.nome, subtype: "LOOKALIKE", origin_audience_id: a.origem_id,
      lookalike_spec: { type: "similarity", country: a.pais || "BR", starting_ratio: (a.de_pct || 0) / 100, ratio: (a.ate_pct || 1) / 100 },
    }),
  },
  {
    name: "consultar",
    description: "Leitura livre na Graph API (somente GET) para qualquer objeto/campo não coberto acima.",
    inputSchema: S({ caminho: str("ex.: 123456/insights ou act_X/adrules_library"), parametros: { type: "object" } }, ["caminho"]),
    run: async (env, a) => graph(env, "GET", a.caminho, a.parametros || {}),
  },
];

function resumoLinha(r) {
  const pick = (arr, types) => {
    if (!arr) return 0;
    for (const t of types) { const f = arr.find((x) => x.action_type === t); if (f) return Number(f.value); }
    return 0;
  };
  const compras = pick(r.actions, ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"]);
  const receita = pick(r.action_values, ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"]);
  const checkout = pick(r.actions, ["omni_initiated_checkout", "initiate_checkout", "offsite_conversion.fb_pixel_initiate_checkout"]);
  const gasto = Number(r.spend || 0);
  const out = {};
  for (const k of ["date_start", "date_stop", "campaign_id", "campaign_name", "adset_id", "adset_name", "ad_id", "ad_name", "age", "gender", "publisher_platform"]) if (r[k] !== undefined) out[k] = r[k];
  Object.assign(out, {
    gasto, impressoes: Number(r.impressions || 0), alcance: Number(r.reach || 0), frequencia: Number(r.frequency || 0),
    cpm: Number(r.cpm || 0), cliques_link: Number(r.inline_link_clicks || 0), ctr_link: Number(r.inline_link_click_ctr || 0),
    cpc_link: Number(r.cost_per_inline_link_click || 0), checkout, compras, receita,
    cpa: compras ? +(gasto / compras).toFixed(2) : null, roas: gasto ? +(receita / gasto).toFixed(2) : null,
  });
  return out;
}

function arrayBufferToBase64(buf) {
  let s = ""; const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
}

// ---------------------------------------------------------------- MCP (JSON-RPC)

const TOOL_MAP = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

async function handleRpc(env, msg) {
  const { id, method, params } = msg;
  const ok = (result) => ({ jsonrpc: "2.0", id, result });
  const fail = (code, message) => ({ jsonrpc: "2.0", id, error: { code, message } });

  switch (method) {
    case "initialize": {
      const v = PROTOCOL_VERSIONS.includes(params && params.protocolVersion) ? params.protocolVersion : PROTOCOL_VERSIONS[0];
      return ok({
        protocolVersion: v, serverInfo: SERVER_INFO, capabilities: { tools: { listChanged: false } },
        instructions: "Conector Meta Ads da N3w. Tudo é criado PAUSADO. Ativar e aumentar orçamento exigem autorizacao_humana com a frase do Othon. Valores em reais.",
      });
    }
    case "ping": return ok({});
    case "tools/list":
      return ok({ tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) });
    case "tools/call": {
      const t = TOOL_MAP[params && params.name];
      if (!t) return fail(-32602, `Ferramenta desconhecida: ${params && params.name}`);
      const ctx = {};
      try {
        const data = await t.run(env, (params && params.arguments) || {}, ctx);
        return ok({ content: [{ type: "text", text: JSON.stringify(data, null, 1) }] });
      } catch (e) {
        const info = e instanceof MetaError ? e.toJSON() : { erro: String(e.message || e) };
        return ok({ isError: true, content: [{ type: "text", text: JSON.stringify(info, null, 1) }] });
      }
    }
    default:
      if (method && method.startsWith("notifications/")) return null;
      return fail(-32601, `Método não suportado: ${method}`);
  }
}

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (url.pathname === "/" || url.pathname === "/saude") {
      return Response.json({ ok: true, servidor: SERVER_INFO, graph_version: env.GRAPH_VERSION, token_configurado: !!env.META_TOKEN, chave_configurada: !!env.CONNECTOR_KEY }, { headers: CORS });
    }

    const m = url.pathname.match(/^\/mcp(?:\/([^/]+))?\/?$/);
    if (!m) return new Response("not found", { status: 404 });
    const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    if (!env.CONNECTOR_KEY || !(safeEqual(m[1] || "", env.CONNECTOR_KEY) || safeEqual(bearer, env.CONNECTOR_KEY))) {
      return new Response("unauthorized", { status: 401, headers: CORS });
    }
    if (request.method === "GET") return new Response("method not allowed", { status: 405, headers: { ...CORS, Allow: "POST" } });
    if (request.method === "DELETE") return new Response(null, { status: 204, headers: CORS });
    if (request.method !== "POST") return new Response("method not allowed", { status: 405, headers: CORS });
    if (!env.META_TOKEN) return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "META_TOKEN não configurado no Worker" } }, { headers: CORS });

    let body;
    try { body = await request.json(); } catch { return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } }, { status: 400, headers: CORS }); }

    const batch = Array.isArray(body);
    const results = (await Promise.all((batch ? body : [body]).map((msg) => handleRpc(env, msg)))).filter(Boolean);
    if (!results.length) return new Response(null, { status: 202, headers: CORS });
    return Response.json(batch ? results : results[0], { headers: { ...CORS, "Content-Type": "application/json" } });
  },
};

export { TOOLS, handleRpc, resumoLinha };
