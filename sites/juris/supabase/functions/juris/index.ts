// Juris Páginas — backend único (Supabase Edge Function "juris", verify_jwt=false).
// Ações (POST JSON {acao,...}): saude, rascunho, midia, pedido, status, painel, salvar.
// Webhook do Mercado Pago (pedido pago): POST em .../functions/v1/juris?fonte=mp (tópico "Order").
// Segredos: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (automáticos) e MP_ACCESS_TOKEN (Edge Functions → Secrets).
// Sem MP_ACCESS_TOKEN a função roda em MODO TESTE: gera um Pix de mentira e aceita "simular pagamento".
// Meta Conversions API (Purchase do lado do servidor, mesmo event_id do pixel = ref do pedido):
//   JURIS_CAPI_TOKEN (token do pixel 982748768192003; se faltar, tenta META_CAPI_TOKEN), opcional META_TEST_EVENT_CODE.
//   Sem token, nada é enviado e o resto funciona igual.

const SB = Deno.env.get("SUPABASE_URL")!;
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP = Deno.env.get("MP_ACCESS_TOKEN") || "";
const TESTE = !MP;
const PIXEL = Deno.env.get("JURIS_PIXEL_ID") || "982748768192003";
const CAPI_TOKEN = Deno.env.get("JURIS_CAPI_TOKEN") || Deno.env.get("META_CAPI_TOKEN") || "";
const CAPI_TESTE = Deno.env.get("META_TEST_EVENT_CODE") || "";
const GRAPH = "https://graph.facebook.com/" + (Deno.env.get("META_GRAPH_VERSION") || "v21.0");
const PRECO = 39.9, PRECO_FOTOS = 29.9, CREDITOS = 3;
// Oferta v2 (pacotes). Preço e nº de páginas definidos aqui, nunca pelo navegador. Sem pacote = oferta de teste (3 por R$ 39,90).
const PACOTES: Record<string, { preco: number; paginas: number; nome: string }> = {
  p1: { preco: 97, paginas: 1, nome: "Essencial (1 página)" },
  p3: { preco: 199, paginas: 3, nome: "Profissional (3 páginas)" },
  p10: { preco: 397, paginas: 10, nome: "Escritório (10 páginas + domínio próprio)" },
};
const SITE = "https://jurispaginas.com";
const RESERVADOS = new Set(["api","painel","p","termos","privacidade","index","www","admin","fotos","assets","lp","app","entrar","login","ajuda","blog","static","public","favicon","robots","sitemap"]);
const AREAS = ["familia","trabalhista","previdenciario","criminal","consumidor","imobiliario","tributario","bancario","empresarial"];
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (code: number, obj: unknown) => new Response(JSON.stringify(obj), { status: code, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

// Trabalho em segundo plano: a resposta sai na hora e a função continua viva até a promessa terminar.
declare const EdgeRuntime: { waitUntil(p: Promise<unknown>): void } | undefined;
function emSegundoPlano(p: Promise<unknown>) {
  const seguro = p.catch((e) => console.error("segundo plano", e));
  try { if (typeof EdgeRuntime !== "undefined" && EdgeRuntime) EdgeRuntime.waitUntil(seguro); } catch { /* sem waitUntil: segue como fire-and-forget */ }
}

async function db(path: string, opts: { method?: string; body?: unknown; prefer?: string } = {}) {
  const r = await fetch(SB + "/rest/v1/" + path, {
    method: opts.method || "GET",
    headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation" },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const txt = await r.text(); let data: any = null; try { data = txt ? JSON.parse(txt) : null; } catch { data = txt; }
  if (!r.ok) console.error("db", path, r.status, txt.slice(0, 300));
  return { ok: r.ok, status: r.status, data };
}
async function mp(path: string, init: RequestInit = {}) {
  const r = await fetch("https://api.mercadopago.com" + path, { ...init, headers: { Authorization: "Bearer " + MP, "Content-Type": "application/json", accept: "application/json", ...(init.headers || {}) } });
  let body: any = null; try { body = await r.json(); } catch { /* */ }
  return { ok: r.ok, status: r.status, body };
}

const rnd = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");
const txt = (s: unknown, n: number) => String(s ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const longo = (s: unknown, n: number) => String(s ?? "").replace(/[<>]/g, "").trim().slice(0, n);
const hex = (s: unknown, d: string) => /^#[0-9a-fA-F]{6}$/.test(String(s)) ? String(s) : d;
const nossaMidia = (u: unknown) => typeof u === "string" && u.startsWith(SB + "/storage/v1/object/public/juris-midia/") ? u : null;

function limpaDados(d: any) {
  d = d || {};
  return {
    nome: txt(d.nome, 80) || "Seu Nome",
    genero: d.genero === "o" ? "o" : "a",
    area: AREAS.includes(d.area) ? d.area : "familia",
    tese: /^[a-z0-9-]{1,30}$/.test(String(d.tese || "")) ? String(d.tese) : "",
    cidade: txt(d.cidade, 60), uf: UFS.includes(d.uf) ? d.uf : "SP",
    oab: txt(d.oab, 20), anos: txt(d.anos, 3), zap: txt(d.zap, 20),
    atend: ["Presencial e online", "Somente online, todo o Brasil", "Somente presencial"].includes(d.atend) ? d.atend : "Presencial e online",
    tpl: ["classico", "moderno", "minimal", "bio", "hub", "impacto", "editorial"].includes(d.tpl) ? d.tpl : "classico",
    p: hex(d.p, "#1B2A41"), a: hex(d.a, "#C9A227"),
    h1: txt(d.h1, 160), sub: longo(d.sub, 400), bio: longo(d.bio, 900),
    end: txt(d.end, 160), email: txt(d.email, 120), insta: txt(d.insta, 60), escritorio: txt(d.escritorio, 80),
    foto: nossaMidia(d.foto), logo: nossaMidia(d.logo),
  };
}
function slugBase(nome: string) {
  let s = nome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/^(dr|dra)\.?\s+/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  if (s.length < 3 || RESERVADOS.has(s)) s = (s || "adv") + "-adv";
  return s;
}
async function slugLivre(nome: string) {
  const base = slugBase(nome);
  const r = await db(`juris_paginas?select=slug&slug=like.${encodeURIComponent(base)}*`);
  const usados = new Set((r.data || []).map((x: any) => x.slug));
  if (!usados.has(base)) return base;
  for (let i = 2; i < 500; i++) if (!usados.has(base + "-" + i)) return base + "-" + i;
  return base + "-" + rnd(3);
}
async function publica(pag: any) {
  for (let t = 0; t < 4; t++) {
    const slug = pag.slug || await slugLivre(pag.dados?.nome || "adv");
    const r = await db(`juris_paginas?id=eq.${pag.id}`, { method: "PATCH", body: { slug, status: "publicada", publicada_em: new Date().toISOString(), atualizado_em: new Date().toISOString() } });
    if (r.ok) return r.data?.[0];
    if (r.status !== 409) return null; // 409 = slug pego no meio do caminho → tenta de novo
  }
  return null;
}
async function pedidoPorRef(ref: string) {
  if (!/^JP[0-9A-F]{10}$/.test(ref || "")) return null;
  const r = await db(`juris_pedidos?ref=eq.${ref}&select=*`);
  return r.data?.[0] || null;
}
const vistaPagina = (p: any) => ({ id: p.id, slug: p.slug, status: p.status, dados: p.dados, url: p.slug ? `${SITE}/${p.slug}` : null });
const fotosUrl = (pd: any) => pd.bump_fotos ? `https://fotos.jurispaginas.com/pedido.html?ref=${pd.ref}&id=${encodeURIComponent(pd.mp_order_id)}` : null;

async function conferePago(pd: any, simular: boolean) {
  if (pd.status === "pago") return true;
  if (pd.teste) return !!simular && TESTE;
  const r = await mp("/v1/orders/" + encodeURIComponent(pd.mp_order_id));
  if (!r.ok) return false;
  const o = r.body || {}; const p = o.transactions?.payments?.[0] || {};
  const pago = o.status === "processed" || p.status === "processed" || o.status_detail === "accredited" || p.status_detail === "accredited";
  return pago && o.external_reference === pd.ref && Number(o.total_amount) >= Number(pd.valor) - 0.01;
}
async function confirma(pd: any) {
  const up = await db(`juris_pedidos?ref=eq.${pd.ref}&status=eq.aguardando_pix`, { method: "PATCH", body: { status: "pago", pago_em: new Date().toISOString() } });
  const primeiraVez = up.ok && up.data?.length;
  const pags = await db(`juris_paginas?pedido_ref=eq.${pd.ref}&status=eq.rascunho&select=*`);
  for (const p of pags.data || []) await publica(p);
  if (primeiraVez && pd.bump_fotos) {
    // Pedido de 3 fotos no site de fotos (mesma conta Mercado Pago: a página de pedido confere o pagamento pela ref).
    await db("fotos_pedidos", { method: "POST", prefer: "return=minimal", body: { ref: pd.ref, mp_order_id: pd.mp_order_id, pacote: 3, valor: PRECO_FOTOS, nome: pd.nome, email: pd.email, whats: pd.whats, status: "pago", pago_em: new Date().toISOString(), utm: { origem: "juris-bump" } } });
  }
  return !!primeiraVez;
}

/* ---------- Meta Conversions API: Purchase do lado do servidor ---------- */
async function sha256(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}
// E-mail: sem espaços e minúsculo. Telefone: só dígitos, com DDI 55 (Meta exige código do país).
const normEmail = (e: unknown) => String(e ?? "").trim().toLowerCase();
function normFone(w: unknown) {
  let d = String(w ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (d.length === 10 || d.length === 11) d = "55" + d; // DDD + número
  return /^55\d{10,11}$/.test(d) ? d : "";
}
// Cookies do pixel vindos do navegador (formato fb.<sub>.<ms>.<valor>; a Meta pode acrescentar sufixos com ".").
const limpaFbp = (s: unknown) => typeof s === "string" && s.length <= 200 && /^fb\.\d\.\d{10,13}\.[\w.-]+$/.test(s) ? s : null;
const limpaFbc = (s: unknown) => typeof s === "string" && s.length <= 500 && /^fb\.\d\.\d{10,13}\.[\w.-]+$/.test(s) ? s : null;

// Idempotente: marca capi_sent_at antes de enviar (só quem conseguiu a marca envia). Se a Meta recusar, desmarca para tentar de novo.
async function enviaCapi(ref: string) {
  if (!CAPI_TOKEN) { console.log("capi: sem token, Purchase não enviado", ref); return; }
  const pd = await pedidoPorRef(ref);
  if (!pd || pd.status !== "pago" || pd.capi_sent_at) return;
  if (pd.teste && !CAPI_TESTE) return; // pedido de modo teste só vai para a Meta com META_TEST_EVENT_CODE (aba Test Events)
  const marca = await db(`juris_pedidos?ref=eq.${pd.ref}&capi_sent_at=is.null`, { method: "PATCH", body: { capi_sent_at: new Date().toISOString() } });
  if (!marca.ok || !marca.data?.length) return; // outra chamada já enviou (ou a coluna ainda não existe: migration pendente)
  try {
    const user_data: Record<string, unknown> = {};
    const em = normEmail(pd.email); if (em) user_data.em = [await sha256(em)];
    const ph = normFone(pd.whats); if (ph) user_data.ph = [await sha256(ph)];
    if (pd.fbp) user_data.fbp = pd.fbp;
    if (pd.fbc) user_data.fbc = pd.fbc;
    if (pd.client_ip) user_data.client_ip_address = pd.client_ip;
    if (pd.client_ua) user_data.client_user_agent = pd.client_ua;
    const pagoMs = pd.pago_em ? new Date(pd.pago_em).getTime() : Date.now();
    const evento = {
      event_name: "Purchase",
      event_time: Math.floor(Math.min(Number.isFinite(pagoMs) ? pagoMs : Date.now(), Date.now()) / 1000),
      event_id: pd.ref, // o mesmo eventID do fbq('track','Purchase',...,{eventID: ref}) em app.js → a Meta deduplica
      action_source: "website",
      event_source_url: SITE + "/",
      user_data,
      custom_data: { value: Number(pd.valor), currency: "BRL", content_name: "juris-" + (pd.creditos || CREDITOS) + "-paginas", order_id: pd.ref },
    };
    const corpo: Record<string, unknown> = { data: [evento] };
    if (CAPI_TESTE) corpo.test_event_code = CAPI_TESTE;
    const r = await fetch(`${GRAPH}/${PIXEL}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo),
    });
    const resp = await r.text();
    if (!r.ok) throw new Error("meta " + r.status + ": " + resp.slice(0, 300));
    console.log("capi ok", pd.ref, CAPI_TESTE ? "(test_event_code)" : "", resp.slice(0, 200));
  } catch (e) {
    console.error("capi falhou", pd.ref, String(e));
    await db(`juris_pedidos?ref=eq.${pd.ref}`, { method: "PATCH", prefer: "return=minimal", body: { capi_sent_at: null } });
  }
}

/* ---------- webhook do Mercado Pago ---------- */
// Não confia no corpo da notificação: só usa o id para achar o pedido e confere o pagamento na API do Mercado Pago.
// Responde 200 sempre (pedido de outro produto ou notificação repetida não é erro), para o MP não ficar reenviando.
async function webhookMP(b: any, url: URL) {
  const tipo = String(b?.type || url.searchParams.get("type") || b?.topic || url.searchParams.get("topic") || "");
  const id = String(b?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "");
  if (TESTE || tipo !== "order" || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return out(200, { ok: true, ignorado: true });
  const pd = (await db(`juris_pedidos?mp_order_id=eq.${id}&select=*`)).data?.[0];
  if (!pd) return out(200, { ok: true, ignorado: true });
  if (!(await conferePago(pd, false))) return out(200, { ok: true, pago: false });
  if (pd.status !== "pago") await confirma(pd);
  if (!pd.capi_sent_at) emSegundoPlano(enviaCapi(pd.ref));
  return out(200, { ok: true, pago: true });
}

async function acao(b: any, req: Request) {
  switch (b.acao) {
    case "saude": { // diz se o Pix real está ligado, sem expor o token
      if (TESTE) return out(200, { modo: "teste", mp: "sem token", capi: CAPI_TOKEN ? "token presente" : "sem token" });
      const r = await mp("/users/me");
      return out(200, { modo: "real", mp: r.ok ? "token válido" : "token recusado (" + r.status + ")", conta: r.ok ? (r.body?.site_id || null) : null, capi: CAPI_TOKEN ? "token presente" : "sem token" });
    }
    case "rascunho": {
      const dados = limpaDados(b.dados);
      if (b.id && b.token) {
        const r = await db(`juris_paginas?id=eq.${b.id}&token=eq.${b.token}&status=eq.rascunho`, { method: "PATCH", body: { dados, atualizado_em: new Date().toISOString() } });
        if (r.ok && r.data?.length) return out(200, { id: b.id, token: b.token, slug: slugBase(dados.nome), teste: TESTE });
      }
      const utm = b.utm && typeof b.utm === "object" ? Object.fromEntries(Object.entries(b.utm).slice(0, 10).map(([k, v]) => [txt(k, 30), txt(v, 200)])) : null;
      const token = rnd(16);
      const r = await db("juris_paginas", { method: "POST", body: { token, dados, utm } });
      if (!r.ok) return out(500, { erro: "Não foi possível salvar agora." });
      return out(200, { id: r.data[0].id, token, slug: slugBase(dados.nome), teste: TESTE });
    }
    case "midia": {
      const tipo = b.tipo === "logo" ? "logo" : "foto";
      let pag: any = null;
      if (b.ref && b.ptoken) {
        const pd = await pedidoPorRef(b.ref);
        if (pd && pd.token === b.ptoken && pd.status === "pago") pag = (await db(`juris_paginas?id=eq.${b.id}&pedido_ref=eq.${pd.ref}&select=id`)).data?.[0] || { id: "novo-" + pd.ref };
      } else if (b.id && b.token) pag = (await db(`juris_paginas?id=eq.${b.id}&token=eq.${b.token}&select=id`)).data?.[0];
      if (!pag) return out(403, { erro: "Sem permissão" });
      const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(b.img || "");
      if (!m) return out(400, { erro: "Imagem inválida" });
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (bytes.length > 2.5e6) return out(413, { erro: "Imagem grande demais" });
      const nome = `${pag.id}/${tipo}-${Date.now()}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
      const up = await fetch(`${SB}/storage/v1/object/juris-midia/${nome}`, { method: "POST", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "image/" + m[1], "Cache-Control": "31536000" }, body: bytes });
      if (!up.ok) { console.error("upload", up.status, (await up.text()).slice(0, 200)); return out(502, { erro: "Falha ao enviar a imagem" }); }
      return out(200, { url: `${SB}/storage/v1/object/public/juris-midia/${nome}` });
    }
    case "pedido": {
      const pag = (await db(`juris_paginas?id=eq.${b.id}&token=eq.${b.token}&select=*`)).data?.[0];
      if (!pag) return out(404, { erro: "Página não encontrada. Gere de novo." });
      const email = txt(b.email, 120).toLowerCase(), whats = txt(b.whats, 20).replace(/\D/g, ""), nome = txt(b.nome || pag.dados?.nome, 80);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return out(400, { erro: "Confira o e-mail" });
      if (whats.length < 10) return out(400, { erro: "WhatsApp com DDD" });
      const pac = PACOTES[b.pacote] || null;
      const bump = false /* bump de fotos desligado em 08/10: produto de fotos parado */, valor = +((pac ? pac.preco : PRECO) + (bump ? PRECO_FOTOS : 0)).toFixed(2);
      const creditos = pac ? pac.paginas : CREDITOS;
      const ref = "JP" + rnd(5).toUpperCase(), token = rnd(16);
      let orderId = "TESTE-" + ref, qr = "00020126580014BR.GOV.BCB.PIX0136modo-teste-jurispaginas-" + ref, qr64: string | null = null;
      if (!TESTE) {
        const r = await mp("/v1/orders", {
          method: "POST", headers: { "X-Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({
            type: "online", processing_mode: "automatic", external_reference: ref, total_amount: valor.toFixed(2),
            description: pac ? "Juris Páginas: " + pac.nome : bump ? "Juris Páginas: 3 páginas + 3 fotos profissionais" : "Juris Páginas: 3 páginas",
            payer: { email, first_name: nome.replace(/^(dr|dra)\.?\s+/i, "").split(" ")[0] },
            transactions: { payments: [{ amount: valor.toFixed(2), payment_method: { id: "pix", type: "bank_transfer" } }] },
          }),
        });
        if (!r.ok) { console.error("mp order", r.status, JSON.stringify(r.body).slice(0, 400)); return out(502, { erro: "Não foi possível gerar o Pix agora. Tente de novo em instantes." }); }
        const pm = r.body.transactions?.payments?.[0]?.payment_method || {};
        orderId = r.body.id; qr = pm.qr_code; qr64 = pm.qr_code_base64;
      }
      // Dados para a Conversions API (Purchase no servidor): cookies do pixel, IP e navegador de quem gerou o Pix.
      const fbclid = typeof pag.utm?.fbclid === "string" && /^[\w-]{1,400}$/.test(pag.utm.fbclid) ? pag.utm.fbclid : null;
      const cliqueMs = pag.criado_em ? new Date(pag.criado_em).getTime() : Date.now();
      const rastreio = {
        fbp: limpaFbp(b.fbp),
        fbc: limpaFbc(b.fbc) || (fbclid ? `fb.1.${Number.isFinite(cliqueMs) ? cliqueMs : Date.now()}.${fbclid}` : null),
        client_ip: (req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0]).trim().slice(0, 64) || null,
        client_ua: (req.headers.get("user-agent") || "").slice(0, 500) || null,
      };
      const linha = { ref, mp_order_id: orderId, valor, bump_fotos: bump, email, nome, whats, token, creditos, teste: TESTE, utm: { ...(pag.utm || {}), pacote: pac ? b.pacote : "teste-3x3990" } };
      let ins = await db("juris_pedidos", { method: "POST", prefer: "return=minimal", body: { ...linha, ...rastreio } });
      if (!ins.ok && ins.status === 400) ins = await db("juris_pedidos", { method: "POST", prefer: "return=minimal", body: linha }); // migration 002 ainda não aplicada
      if (!ins.ok) return out(500, { erro: "Falha ao registrar o pedido" });
      await db(`juris_paginas?id=eq.${pag.id}`, { method: "PATCH", prefer: "return=minimal", body: { pedido_ref: ref } });
      return out(200, { ref, id: orderId, valor, creditos, qr, qr64, teste: TESTE });
    }
    case "status": {
      const pd = await pedidoPorRef(b.ref);
      if (!pd || pd.mp_order_id !== b.id) return out(404, { erro: "Pedido não encontrado" });
      const pago = await conferePago(pd, !!b.simular);
      if (!pago) return out(200, { pago: false });
      const primeira = pd.status === "pago" ? false : await confirma(pd);
      if (!pd.capi_sent_at) emSegundoPlano(enviaCapi(pd.ref)); // se o webhook ainda não enviou, envia daqui (sem atrasar a resposta)
      const pags = (await db(`juris_paginas?pedido_ref=eq.${pd.ref}&select=*&order=criado_em`)).data || [];
      return out(200, { pago: true, primeira, valor: pd.valor, creditos: pd.creditos, ref: pd.ref, token: pd.token, paginas: pags.map(vistaPagina), fotos: fotosUrl(pd), painel: `${SITE}/painel.html?ref=${pd.ref}&t=${pd.token}` });
    }
    case "painel": {
      const pd = await pedidoPorRef(b.ref);
      if (!pd || pd.token !== b.token || pd.status !== "pago") return out(403, { erro: "Link inválido ou pagamento não confirmado" });
      const pags = (await db(`juris_paginas?pedido_ref=eq.${pd.ref}&select=*&order=criado_em`)).data || [];
      return out(200, { ref: pd.ref, email: pd.email, creditos: pd.creditos, paginas: pags.map(vistaPagina), fotos: fotosUrl(pd), teste: pd.teste });
    }
    case "salvar": {
      const pd = await pedidoPorRef(b.ref);
      if (!pd || pd.token !== b.token || pd.status !== "pago") return out(403, { erro: "Sem permissão" });
      const dados = limpaDados(b.dados);
      if (b.pagina_id) {
        const r = await db(`juris_paginas?id=eq.${b.pagina_id}&pedido_ref=eq.${pd.ref}`, { method: "PATCH", body: { dados, atualizado_em: new Date().toISOString() } });
        if (!r.ok || !r.data?.length) return out(404, { erro: "Página não encontrada" });
        return out(200, { pagina: vistaPagina(r.data[0]) });
      }
      const n = (await db(`juris_paginas?pedido_ref=eq.${pd.ref}&select=id`)).data?.length || 0;
      if (n >= pd.creditos) return out(400, { erro: `Seu pacote já tem ${pd.creditos} páginas.` });
      const r = await db("juris_paginas", { method: "POST", body: { token: rnd(16), pedido_ref: pd.ref, dados } });
      if (!r.ok) return out(500, { erro: "Falha ao criar a página" });
      const pub = await publica(r.data[0]);
      return out(200, { pagina: vistaPagina(pub || r.data[0]) });
    }
  }
  return out(400, { erro: "ação desconhecida" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out(405, { erro: "use POST" });
  const url = new URL(req.url);
  let b: any = null; try { b = await req.json(); } catch { b = null; }
  // Webhook do Mercado Pago: ?fonte=mp na URL cadastrada no painel do MP (ou corpo de notificação sem "acao").
  if (url.searchParams.get("fonte") === "mp" || (b && !b.acao && (b.type || b.topic) && b.data)) {
    try { return await webhookMP(b || {}, url); } catch (e) { console.error("webhook mp", e); return out(500, { erro: "falha no webhook" }); }
  }
  if (!b) return out(400, { erro: "JSON inválido" });
  try { return await acao(b, req); } catch (e) { console.error("juris", e); return out(500, { erro: "Erro interno, tente de novo." }); }
});
