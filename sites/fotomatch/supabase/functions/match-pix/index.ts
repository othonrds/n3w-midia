// FOTOMATCH — match-pix (02/11/2026): Pix dentro da própria página, via Mercado Pago (API de Orders). Conta: ver CONTA_PADRAO.
// Segredo: MP_TOKEN_FOTOMATCH (Access Token de produção da aplicação "FotoMatch"). Sem ele, responde "indisponível" e a página cai no checkout da Payt.
// Ações (POST, JSON ou text/plain):
//   criar   {tipo, lead_id? | rid? | sessao?, email, bump?, preco?, utm?}  → {ref, qr, qr64, valor, expira}
//           tipo: "fotos" (15 fotos; precisa lead_id com selfies) · "perfil"/"glowup" (rid do match_oferta_res) · "copiloto" (sessao) · "kit"
//   status  {ref}                                                        → {pago, status, lead_id?, rid?}
//   webhook (GET/POST do Mercado Pago)  — nunca confia no corpo: confere a order na API e só então marca pago.
// Preço vem da tabela PRECO (servidor), nunca do cliente; o A/B de preço manda só a "faixa" (a,b,c).
const SB = Deno.env.get("SUPABASE_URL")!, SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// 02/11 19h: Othon mandou usar a conta Mercado Pago PJ N3W DIGITAL LTDA (a mesma do Tarot) até as próximas vendas / CNPJ novo.
// Troca de conta: mudar CONTA_PADRAO. Cada pedido guarda a conta em entrega.conta, e a conferência usa o token da conta em que foi criado.
const CONTA_PADRAO = Deno.env.get("MATCH_PIX_CONTA") || "n3w";
const TOKENS: Record<string, string> = { n3w: Deno.env.get("TAROT_MP_ACCESS_TOKEN") || "", fotomatch: Deno.env.get("MP_TOKEN_FOTOMATCH") || "" };
const MP = TOKENS[CONTA_PADRAO] || "";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const out = (c: number, o: unknown) => new Response(JSON.stringify(o), { status: c, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function db(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const r = await fetch(SB + "/rest/v1/" + path, { method: init.method || "GET", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", ...(init.prefer ? { Prefer: init.prefer } : {}) }, body: init.body ? JSON.stringify(init.body) : undefined });
  const t = await r.text(); let data: any = null; try { data = t ? JSON.parse(t) : null; } catch { data = t; }
  if (!r.ok) console.error("db", path.split("?")[0], r.status, t.slice(0, 200));
  return { ok: r.ok, data };
}
async function mp(path: string, init: RequestInit = {}, conta = CONTA_PADRAO) {
  const r = await fetch("https://api.mercadopago.com" + path, { ...init, headers: { Authorization: "Bearer " + (TOKENS[conta] || MP), "Content-Type": "application/json", accept: "application/json", ...(init.headers || {}) } });
  let body: any = null; try { body = await r.json(); } catch { /* */ }
  return { ok: r.ok, status: r.status, body };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rnd = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (x) => x.toString(16).padStart(2, "0")).join("");
const limpaEmail = (e: unknown) => { const s = String(e || "").trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length < 200 ? s : ""; };

// Preços por tipo e faixa (A/B de preço: faixa a/b/c). Bump da bio soma +4,90.
const PRECO: Record<string, Record<string, number>> = {
  fotos: { a: 9.9, b: 19.9, c: 29.9 }, kit: { a: 19.9, b: 29.9 },
  perfil: { a: 9.9 }, glowup: { a: 9.9 }, copiloto: { a: 9.9 }, mensagens: { a: 9.9 },
};
const BUMP = 4.9;
const DESCR: Record<string, string> = { fotos: "FotoMatch: 15 fotos de perfil", kit: "FotoMatch: Kit Match (15 fotos + Copiloto 30 dias)", perfil: "FotoMatch: análise completa do perfil", glowup: "FotoMatch: plano de estilo completo", copiloto: "FotoMatch: Copiloto de Conversa 30 dias", mensagens: "FotoMatch: Kit O Que Mandar (35 mensagens)" };

async function criar(b: any, req: Request) {
  if (!MP) return out(503, { erro: "indisponivel" });
  const tipo = String(b.tipo || "fotos"); if (!PRECO[tipo]) return out(400, { erro: "tipo" });
  const faixa = PRECO[tipo][String(b.faixa || "a")] ? String(b.faixa || "a") : "a";
  const bump = !!b.bump && (tipo === "fotos" || tipo === "kit");
  const valor = +(PRECO[tipo][faixa] + (bump ? BUMP : 0)).toFixed(2);
  const email = limpaEmail(b.email); if (!email) return out(400, { erro: "Digite um e-mail válido: é para onde vai o seu acesso." });
  let lead_id: string | null = null, rid: string | null = null, sessao: string | null = null;
  if (tipo === "fotos" || tipo === "kit") {
    if (!UUID.test(String(b.lead_id || ""))) return out(400, { erro: "lead" });
    const l = (await db(`match_leads?id=eq.${b.lead_id}&select=id,fotos`)).data?.[0];
    if (!l || !(l.fotos || []).length) return out(400, { erro: "Não achei suas selfies. Volte e mande de novo." });
    lead_id = l.id;
  } else if (tipo === "perfil" || tipo === "glowup") {
    if (!UUID.test(String(b.rid || ""))) return out(400, { erro: "rid" });
    rid = String(b.rid);
  } else if (tipo === "copiloto" || tipo === "mensagens") {
    if (!/^[a-f0-9]{8,64}$/.test(String(b.sessao || ""))) return out(400, { erro: "sessao" });
    sessao = String(b.sessao);
  }
  const ref = "FM" + rnd(5).toUpperCase();
  const r = await mp("/v1/orders", { method: "POST", headers: { "X-Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ type: "online", processing_mode: "automatic", external_reference: ref, total_amount: valor.toFixed(2), ...(CONTA_PADRAO === "fotomatch" ? { description: DESCR[tipo] + (bump ? " + bio" : "") } : {}),
      payer: CONTA_PADRAO === "fotomatch" ? { email, first_name: String(b.nome || "Cliente").split(" ")[0].slice(0, 40) } : { email },
      transactions: { payments: [{ amount: valor.toFixed(2), payment_method: { id: "pix", type: "bank_transfer" } }] } }) });
  if (!r.ok) { console.error("mp order", r.status, JSON.stringify(r.body).slice(0, 400)); return out(502, { erro: "Não consegui gerar o Pix agora. Tente de novo em instantes." }); }
  const pm = r.body.transactions?.payments?.[0]?.payment_method || {};
  const utm: Record<string, unknown> = {}; for (const [k, v] of Object.entries(b.utm || {})) if (/^(utm_|fbclid|fm_)/.test(k) && typeof v === "string") utm[k] = v.slice(0, 200);
  const rastreio = { fbp: typeof b.fbp === "string" ? b.fbp.slice(0, 80) : null, fbc: typeof b.fbc === "string" ? b.fbc.slice(0, 200) : null,
    client_ip: (req.headers.get("cf-connecting-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0]).trim().slice(0, 64) || null, client_ua: (req.headers.get("user-agent") || "").slice(0, 300) || null };
  const ins = await db("match_orders", { method: "POST", prefer: "return=minimal", body: { ref, lead_id, pacote: tipo === "kit" ? "kit" : tipo === "fotos" ? "p15" : tipo, valor, bump_bio: bump, gateway: "mp", gateway_id: String(r.body.id), status: "aguardando_pagamento", email, teste: false,
    utm: { ...utm, faixa, pix_pagina: true, rid, sessao_cop: sessao }, entrega: { meio: "pix", conta: CONTA_PADRAO, rastreio, ...(tipo === "kit" ? { copiloto: true } : {}) } } });
  if (!ins.ok) return out(500, { erro: "Falha ao registrar. Tente de novo." });
  return out(200, { ref, valor, qr: pm.qr_code, qr64: pm.qr_code_base64, expira: Date.now() + 30 * 60e3 });
}

async function conferePago(o: any): Promise<boolean> {
  if (o.status === "pago" || o.status === "em_producao" || o.status === "entregue") return true;
  const r = await mp("/v1/orders/" + encodeURIComponent(o.gateway_id), {}, o.entrega?.conta || "fotomatch"); if (!r.ok) return false;
  const od = r.body || {}, p = od.transactions?.payments?.[0] || {};
  const pago = od.status === "processed" || p.status === "processed" || od.status_detail === "accredited" || p.status_detail === "accredited";
  return pago && od.external_reference === o.ref && Number(od.total_amount) >= Number(o.valor) - 0.01;
}
async function confirma(o: any) {
  const up = await db(`match_orders?id=eq.${o.id}&status=eq.aguardando_pagamento`, { method: "PATCH", prefer: "return=representation", body: { status: "pago", pago_em: new Date().toISOString() } });
  if (!up.ok || !up.data?.length) return; // já confirmado antes
  const u = o.utm || {};
  if (o.lead_id) await db(`match_leads?id=eq.${o.lead_id}`, { method: "PATCH", prefer: "return=minimal", body: { status: "pago", email: o.email } });
  if (u.rid) await db(`match_oferta_res?id=eq.${u.rid}`, { method: "PATCH", prefer: "return=minimal", body: { liberado: true } });
  if ((u.sessao_cop && o.pacote === "copiloto") || o.pacote === "kit") {
    await db("match_copiloto_acesso", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: { email: o.email, ate: new Date(Date.now() + 30 * 864e5).toISOString(), origem: "mp-" + o.pacote } });
  }
  // vendas: mesma tabela que a Payt alimenta, para o painel somar tudo
  await db("vendas", { method: "POST", prefer: "resolution=ignore-duplicates,return=minimal", body: { id: "mp:" + o.ref, plataforma: "mercadopago", transacao: o.ref, evento: "pago", status: "aprovada", produto_id: "MP-" + o.pacote.toUpperCase(), produto: "FotoMatch " + o.pacote, projeto: "fotomatch",
    valor_bruto: o.valor, liquido: +(Number(o.valor) * 0.99).toFixed(2), moeda: "BRL", meio: "pix", pais: "BR", data_venda: new Date().toISOString(), verificado: true, origem: "match-pix",
    raw: { customer: { email: o.email }, link: { sources: { src: o.lead_id || u.rid || u.sessao_cop || null, utm_content: u.utm_content || null, utm_campaign: u.utm_campaign || null } } } } });
}

async function status(b: any) {
  const ref = String(b.ref || ""); if (!/^FM[0-9A-F]{10}$/.test(ref)) return out(400, { erro: "ref" });
  const o = (await db(`match_orders?ref=eq.${ref}&gateway=eq.mp&select=*`)).data?.[0]; if (!o) return out(404, { erro: "pedido" });
  if (o.status === "aguardando_pagamento" && (await conferePago(o))) await confirma(o);
  const o2 = (await db(`match_orders?ref=eq.${ref}&select=status,lead_id,utm,pacote`)).data?.[0] || o;
  const pago = ["pago", "em_producao", "entregue"].includes(o2.status);
  return out(200, { pago, status: o2.status, lead_id: o2.lead_id, rid: o2.utm?.rid || null, pacote: o2.pacote });
}
// varrer: chamado pelo cron a cada minuto (a conta N3W tem o webhook apontado para o Tarot, então a confirmação vem daqui).
async function varrer() {
  const desde = new Date(Date.now() - 3 * 3600e3).toISOString();
  const os = (await db(`match_orders?gateway=eq.mp&status=eq.aguardando_pagamento&criado_em=gt.${desde}&select=*&limit=50`)).data || [];
  let n = 0; for (const o of os) if (await conferePago(o)) { await confirma(o); n++; }
  return out(200, { conferidos: os.length, pagos: n });
}
async function webhook(b: any, url: URL) {
  const tipo = String(b?.type || url.searchParams.get("type") || b?.topic || url.searchParams.get("topic") || "");
  const id = String(b?.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id") || "");
  if (tipo !== "order" || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return out(200, { ok: true, ignorado: true });
  const o = (await db(`match_orders?gateway_id=eq.${encodeURIComponent(id)}&gateway=eq.mp&select=*`)).data?.[0];
  if (!o) return out(200, { ok: true, ignorado: true });
  if (o.status === "aguardando_pagamento" && (await conferePago(o))) await confirma(o);
  return out(200, { ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const url = new URL(req.url);
  let b: any = {}; try { const t = await req.text(); b = t ? JSON.parse(t) : {}; } catch { b = {}; }
  try {
    if (url.pathname.endsWith("/webhook")) return await webhook(b, url);
    if (b.acao === "saude") { if (!MP) return out(200, { mp: "sem token" }); const r = await mp("/users/me"); return out(200, { mp: r.ok ? "token válido" : "recusado " + r.status, conta: CONTA_PADRAO, site: r.ok ? r.body?.site_id : null }); }
    if (b.acao === "criar") return await criar(b, req);
    if (b.acao === "varrer") return await varrer();
    if (b.acao === "status") return await status(b);
    return out(400, { erro: "acao" });
  } catch (e) { console.error(e); return out(500, { erro: "Falha inesperada." }); }
});
