// Juris Páginas — backend único (Supabase Edge Function "juris", verify_jwt=false).
// Ações (POST JSON {acao,...}): rascunho, midia, pedido, status, painel, salvar.
// Segredos: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (automáticos) e MP_ACCESS_TOKEN (Edge Functions → Secrets).
// Sem MP_ACCESS_TOKEN a função roda em MODO TESTE: gera um Pix de mentira e aceita "simular pagamento".

const SB = Deno.env.get("SUPABASE_URL")!;
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP = Deno.env.get("MP_ACCESS_TOKEN") || "";
const TESTE = !MP;
const PRECO = 39.9, PRECO_FOTOS = 29.9, CREDITOS = 3;
const SITE = "https://jurispaginas.com";
const RESERVADOS = new Set(["api","painel","p","termos","privacidade","index","www","admin","fotos","assets","lp","app","entrar","login","ajuda","blog","static","public","favicon","robots","sitemap"]);
const AREAS = ["familia","trabalhista","previdenciario","criminal","consumidor","imobiliario","tributario","empresarial"];
const UFS = "AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split(" ");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (code: number, obj: unknown) => new Response(JSON.stringify(obj), { status: code, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

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
    cidade: txt(d.cidade, 60), uf: UFS.includes(d.uf) ? d.uf : "SP",
    oab: txt(d.oab, 20), anos: txt(d.anos, 3), zap: txt(d.zap, 20),
    atend: ["Presencial e online", "Somente online, todo o Brasil", "Somente presencial"].includes(d.atend) ? d.atend : "Presencial e online",
    tpl: ["classico", "moderno", "minimal"].includes(d.tpl) ? d.tpl : "classico",
    p: hex(d.p, "#1B2A41"), a: hex(d.a, "#C9A227"),
    h1: txt(d.h1, 160), sub: longo(d.sub, 400), bio: longo(d.bio, 900),
    end: txt(d.end, 160), email: txt(d.email, 120), insta: txt(d.insta, 60),
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

async function acao(b: any) {
  switch (b.acao) {
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
      // bump desligado em 08/10 até o produto de fotos voltar: ignora b.bump do cliente, cobra só R$ 39,90 e nunca grava em fotos_pedidos (tabela não existe).
      const bump = false, valor = +(PRECO + (bump ? PRECO_FOTOS : 0)).toFixed(2);
      const ref = "JP" + rnd(5).toUpperCase(), token = rnd(16);
      let orderId = "TESTE-" + ref, qr = "00020126580014BR.GOV.BCB.PIX0136modo-teste-jurispaginas-" + ref, qr64: string | null = null;
      if (!TESTE) {
        const r = await mp("/v1/orders", {
          method: "POST", headers: { "X-Idempotency-Key": crypto.randomUUID() },
          body: JSON.stringify({
            type: "online", processing_mode: "automatic", external_reference: ref, total_amount: valor.toFixed(2),
            description: bump ? "Juris Páginas: 3 páginas + 3 fotos profissionais" : "Juris Páginas: 3 páginas",
            payer: { email, first_name: nome.replace(/^(dr|dra)\.?\s+/i, "").split(" ")[0] },
            transactions: { payments: [{ amount: valor.toFixed(2), payment_method: { id: "pix", type: "bank_transfer" } }] },
          }),
        });
        if (!r.ok) { console.error("mp order", r.status, JSON.stringify(r.body).slice(0, 400)); return out(502, { erro: "Não foi possível gerar o Pix agora. Tente de novo em instantes." }); }
        const pm = r.body.transactions?.payments?.[0]?.payment_method || {};
        orderId = r.body.id; qr = pm.qr_code; qr64 = pm.qr_code_base64;
      }
      const ins = await db("juris_pedidos", { method: "POST", prefer: "return=minimal", body: { ref, mp_order_id: orderId, valor, bump_fotos: bump, email, nome, whats, token, creditos: CREDITOS, teste: TESTE, utm: pag.utm } });
      if (!ins.ok) return out(500, { erro: "Falha ao registrar o pedido" });
      await db(`juris_paginas?id=eq.${pag.id}`, { method: "PATCH", prefer: "return=minimal", body: { pedido_ref: ref } });
      return out(200, { ref, id: orderId, valor, qr, qr64, teste: TESTE });
    }
    case "status": {
      const pd = await pedidoPorRef(b.ref);
      if (!pd || pd.mp_order_id !== b.id) return out(404, { erro: "Pedido não encontrado" });
      const pago = await conferePago(pd, !!b.simular);
      if (!pago) return out(200, { pago: false });
      const primeira = pd.status === "pago" ? false : await confirma(pd);
      const pags = (await db(`juris_paginas?pedido_ref=eq.${pd.ref}&select=*&order=criado_em`)).data || [];
      return out(200, { pago: true, primeira, valor: pd.valor, ref: pd.ref, token: pd.token, paginas: pags.map(vistaPagina), fotos: fotosUrl(pd), painel: `${SITE}/painel.html?ref=${pd.ref}&t=${pd.token}` });
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
  let b: any; try { b = await req.json(); } catch { return out(400, { erro: "JSON inválido" }); }
  try { return await acao(b); } catch (e) { console.error("juris", e); return out(500, { erro: "Erro interno, tente de novo." }); }
});
