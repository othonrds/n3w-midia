// FotoMatch — entrega automática (Supabase Edge Function "match-entrega", verify_jwt=false). owner-match, 30/10/2026.
// Decisão do Othon (30/10): entrega automática. Pago → gera as fotos com as selfies que o lead mandou no quiz → página privada do pedido + e-mail.
// Ações (POST JSON {acao}):
//   processar  (cron a cada minuto, header x-cron-key) → sincroniza vendas Payt (match-pagamento) e gera o próximo lote (5 fotos por vez)
//   pedido     {p, k}         → status + URLs assinadas das fotos (página /pedido.html)
//   do_lead    {id, token}    → acha o pedido do lead (página /obrigado.html) e devolve {p, k}
// Teto: MAX_PEDIDOS_DIA pedidos produzidos por dia (fuso SP). Custo ~US$ 0,08/foto (gpt-image-2, medium).
const SB = Deno.env.get("SUPABASE_URL")!;
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI = Deno.env.get("OPENAI_API_KEY") || "";
const RESEND = Deno.env.get("RESEND_API_KEY") || "";
const IMG_MODELO = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-2";
const BUCKET = "match-selfies";
const SITE = "https://n3w-fotomatch.vercel.app";
const LOTE = 5, BASE = 15, EXTRA_UPSELL = 30, MAX_PEDIDOS_DIA = 25;

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, x-cron-key", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (c: number, o: unknown) => new Response(JSON.stringify(o), { status: c, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const H = { apikey: SK, Authorization: "Bearer " + SK };
async function db(path: string, opts: { method?: string; body?: unknown; prefer?: string } = {}) {
  const r = await fetch(SB + "/rest/v1/" + path, { method: opts.method || "GET", headers: { ...H, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation" }, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  const t = await r.text(); let d: any = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  if (!r.ok) console.error("db", path.split("?")[0], r.status, t.slice(0, 300));
  return { ok: r.ok, data: d };
}
const rnd = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
async function chaveDe(id: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fm-pedido:" + id + ":" + SK));
  return Array.from(new Uint8Array(h)).slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
}
const hojeSP = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

const ESTILO = "foto vertical tirada com celular por um amigo, luz natural, grão leve, foco no rosto, sem cara de estúdio, sem filtro, " +
  "pele com textura real, mesma pessoa das fotos de referência (mesmo rosto, cabelo, barba, idade e tipo físico), sem texto, sem marca d'água, mãos naturais";
const CENAS: string[] = [
  "sentado num restaurante à noite com luz quente de velas, camisa social, rindo de algo fora do quadro",
  "de terno bem ajustado caminhando numa rua da cidade no fim de tarde, sorriso leve, olhar fora da câmera",
  "num café com janela grande, segurando uma xícara, roupa casual arrumada, luz da manhã",
  "na praia no pôr do sol, camisa de linho aberta, corpo 3/4, sorriso natural",
  "numa trilha com vista para o mar, roupa de caminhada, de corpo inteiro, olhando a paisagem",
  "num rooftop à noite com luzes da cidade ao fundo, camisa escura, segurando um copo, sorriso de lado",
  "num bar com amigos desfocados ao fundo, rindo de verdade, camiseta lisa, luz quente",
  "brincando com um cachorro num parque, roupa casual, luz de fim de tarde, sorriso espontâneo",
  "numa viagem, numa rua histórica europeia, mochila no ombro, olhando para a câmera com sorriso leve",
  "na academia depois do treino, camiseta, luz natural da janela, expressão confiante e simpática",
  "num show ou festival à noite, luzes coloridas ao fundo, camiseta, expressão animada",
  "dirigindo um carro com a janela aberta, óculos escuros na mão, luz do dia, sorriso",
  "em casa na cozinha preparando um café da manhã, camiseta, luz suave da manhã, sorriso natural",
  "retrato em preto e branco, camisa branca, olhar direto para a câmera, sorriso leve, fundo urbano desfocado",
  "num barco em dia de sol, camisa de linho, óculos escuros, mar ao fundo, sorriso relaxado",
];

async function urlAssinada(path: string, s = 7 * 86400) {
  const r = await fetch(`${SB}/storage/v1/object/sign/${BUCKET}/${path}`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: s }) });
  if (!r.ok) return null; const j = await r.json(); return j.signedURL ? SB + "/storage/v1" + j.signedURL : null;
}
async function baixa(path: string): Promise<Blob | null> {
  const r = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, { headers: H });
  return r.ok ? new Blob([await r.arrayBuffer()], { type: r.headers.get("content-type") || "image/jpeg" }) : null;
}
function custo(u: any) {
  if (!u) return 0.12;
  const it = u.input_tokens_details?.image_tokens ?? 0; const tt = u.input_tokens_details?.text_tokens ?? Math.max(0, (u.input_tokens ?? 0) - it);
  return +(tt * 5e-6 + it * 10e-6 + (u.output_tokens ?? 0) * 40e-6).toFixed(4);
}
async function gera(cena: string, refs: Blob[]) {
  const prompt = `Foto de perfil para app de namoro: o homem das fotos de referência ${cena}. ${ESTILO}.`;
  const fd = new FormData();
  for (const [k, v] of Object.entries({ model: IMG_MODELO, prompt, size: "1024x1536", quality: "medium", n: "1", output_format: "jpeg", output_compression: "88", input_fidelity: "high" })) fd.append(k, v);
  refs.forEach((b, i) => fd.append("image[]", b, "ref" + i + ".jpg"));
  let r = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: "Bearer " + OPENAI }, body: fd });
  if (!r.ok && r.status === 400) {
    const t = await r.clone().text();
    if (/input_fidelity|output_format|output_compression|unknown parameter/i.test(t)) {
      const f2 = new FormData(); for (const [k, v] of Object.entries({ model: IMG_MODELO, prompt, size: "1024x1536", quality: "medium", n: "1" })) f2.append(k, v);
      refs.forEach((b, i) => f2.append("image[]", b, "ref" + i + ".jpg"));
      r = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: "Bearer " + OPENAI }, body: f2 });
    }
  }
  const j = await r.json();
  if (!r.ok) throw new Error("OpenAI " + r.status + ": " + String(j?.error?.message || "").slice(0, 160));
  return { bytes: Uint8Array.from(atob(j.data[0].b64_json), (c) => c.charCodeAt(0)), custo: custo(j.usage) };
}
async function bio(lead: any) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + OPENAI, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "gpt-4.1-mini", temperature: 0.8, max_tokens: 400, messages: [{ role: "system", content: "Você escreve bios curtas para perfis masculinos de apps de namoro no Brasil: leves, com humor sutil, sem clichê, sem mentir, até 300 caracteres. Dê 3 opções numeradas, em português." },
      { role: "user", content: `Idade: ${lead.idade || "não informada"}. Procura: ${lead.objetivo || "não informado"}. Escreva as 3 opções.` }] }) });
  const j = await r.json().catch(() => null);
  return j?.choices?.[0]?.message?.content || null;
}
async function email(o: any, link: string) {
  if (!RESEND || !o.email) return false;
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#14110F"><h2>Suas fotos estão prontas 📸</h2>
<p>Oi${o.nome ? ", " + String(o.nome).split(" ")[0] : ""}! As suas fotos de perfil do FotoMatch ficaram prontas.</p>
<p><a href="${link}" style="display:inline-block;background:#FF5A4E;color:#fff;padding:14px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Ver e baixar minhas fotos</a></p>
<p style="font-size:13px;color:#555">O link é só seu e fica no ar por 7 dias. Não gostou de alguma? Responda este e-mail que a gente refaz até 3 fotos.<br>Suas selfies são apagadas em até 30 dias.</p></div>`;
  const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + RESEND, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "FotoMatch <contato@jurispaginas.com>", reply_to: "contato@jurispaginas.com", to: [o.email], subject: "Suas fotos de perfil estão prontas", html }) });
  return r.ok;
}

async function processar(req: Request) {
  const chave = req.headers.get("x-cron-key") || "";
  if (!chave || !(await db("rpc/match_cron_chave_ok", { method: "POST", body: { p_chave: chave } })).data) return out(401, { erro: "não autorizado" });
  await fetch(`${SB}/functions/v1/match-pagamento/sync`).catch(() => null);
  if (!OPENAI) return out(200, { ok: true, motivo: "sem chave" });
  const lista = (await db("match_orders?status=in.(pago,em_producao)&select=*&order=pago_em.asc&limit=10")).data || [];
  const agora = Date.now();
  const hoje = hojeSP();
  const feitosHoje = ((await db(`match_orders?entrega->>dia_producao=eq.${hoje}&select=id`)).data || []).length;
  for (const o of lista) {
    const e = o.entrega || {};
    if (e.gerando_ate && Date.parse(e.gerando_ate) > agora) continue;
    if (e.erro_fatal) continue;
    if (!e.dia_producao && feitosHoje >= MAX_PEDIDOS_DIA) return out(200, { ok: true, motivo: "teto diário" });
    if (!o.lead_id) { await db(`match_orders?id=eq.${o.id}`, { method: "PATCH", prefer: "return=minimal", body: { entrega: { ...e, erro_fatal: "sem_lead_sem_selfies" } } }); continue; }
    const lead = (await db(`match_leads?id=eq.${o.lead_id}&select=*`)).data?.[0];
    const selfies: string[] = (lead?.fotos || []).filter((f: string) => !f.includes("/previa-"));
    if (!selfies.length) { await db(`match_orders?id=eq.${o.id}`, { method: "PATCH", prefer: "return=minimal", body: { entrega: { ...e, erro_fatal: "selfies_apagadas" } } }); continue; }
    const alvo = BASE + (e.upsell ? EXTRA_UPSELL : 0);
    const fotos: string[] = Array.isArray(e.fotos) ? e.fotos : [];
    const ent = { ...e, dia_producao: e.dia_producao || hoje, alvo, gerando_ate: new Date(agora + 4 * 60e3).toISOString(), inicio: e.inicio || new Date().toISOString() };
    await db(`match_orders?id=eq.${o.id}`, { method: "PATCH", prefer: "return=minimal", body: { status: "em_producao", entrega: ent } });
    // @ts-ignore EdgeRuntime existe no Supabase
    EdgeRuntime.waitUntil((async () => {
      let custoTotal = Number(ent.custo_usd || 0), falhas = Number(ent.falhas || 0), novas: string[] = [];
      try {
        const mi = lead.nota?.melhor_indice; const melhor = Number.isInteger(mi) ? lead.nota?.fotos?.[mi]?.path : null;
        const ordem = melhor && selfies.includes(melhor) ? [melhor, ...selfies.filter((f) => f !== melhor)] : selfies;
        const refs = (await Promise.all(ordem.slice(0, 3).map(baixa))).filter(Boolean) as Blob[];
        const idx = Array.from({ length: Math.min(LOTE, alvo - fotos.length) }, (_, i) => fotos.length + i);
        const res = await Promise.allSettled(idx.map(async (i) => {
          const g = await gera(CENAS[i % CENAS.length] + (i >= CENAS.length ? ", outro ângulo e outra roupa" : ""), refs);
          const path = `${o.lead_id}/pedido-${o.id}/${String(i + 1).padStart(2, "0")}-${rnd(2)}.jpg`;
          const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, { method: "POST", headers: { ...H, "Content-Type": "image/jpeg" }, body: g.bytes });
          if (!up.ok) throw new Error("upload " + up.status);
          custoTotal += g.custo; return { i, path };
        }));
        res.sort((a: any, b: any) => (a.value?.i ?? 0) - (b.value?.i ?? 0));
        for (const r of res) { if (r.status === "fulfilled") novas.push(r.value.path); else { falhas++; console.error("foto", o.id, r.reason); } }
      } catch (err) { falhas++; console.error("lote", o.id, err); }
      const atual = (await db(`match_orders?id=eq.${o.id}&select=entrega`)).data?.[0]?.entrega || ent;
      const todas = [...(atual.fotos || []), ...novas];
      const fim: any = { ...atual, fotos: todas, custo_usd: +custoTotal.toFixed(4), falhas, gerando_ate: null };
      if (falhas >= 12) fim.erro_fatal = "muitas_falhas";
      const body: any = { entrega: fim };
      if (todas.length >= (atual.alvo || alvo)) {
        if (o.bump_bio && !fim.bio) fim.bio = await bio(lead).catch(() => null);
        fim.pronto_em = new Date().toISOString();
        fim.email_ok = await email(o, `${SITE}/pedido.html?p=${o.id}&k=${await chaveDe(o.id)}`).catch(() => false);
        body.status = "entregue"; body.entregue_em = new Date().toISOString();
      }
      await db(`match_orders?id=eq.${o.id}`, { method: "PATCH", prefer: "return=minimal", body });
    })());
    return out(200, { ok: true, gerando: o.id, ja: fotos.length, alvo });
  }
  // upsell pago depois da entrega: reabre o pedido
  const reabrir = ((await db("match_orders?status=eq.entregue&select=id,entrega&limit=50")).data || []).filter((o: any) => o.entrega?.upsell && (o.entrega?.fotos?.length || 0) < BASE + EXTRA_UPSELL);
  for (const o of reabrir) await db(`match_orders?id=eq.${o.id}`, { method: "PATCH", prefer: "return=minimal", body: { status: "em_producao", entrega: { ...o.entrega, alvo: BASE + EXTRA_UPSELL } } });
  return out(200, { ok: true, gerando: null, reabertos: reabrir.length });
}

async function pedido(b: any) {
  if (!UUID.test(String(b.p || "")) || !/^[0-9a-f]{32}$/.test(String(b.k || ""))) return out(403, { erro: "Link inválido" });
  const o = (await db(`match_orders?id=eq.${b.p}&select=id,status,nome,entrega,bump_bio`)).data?.[0];
  if (!o || (await chaveDe(o.id)) !== b.k) return out(403, { erro: "Link inválido" });
  const e = o.entrega || {};
  const urls = (await Promise.all((e.fotos || []).map((p: string) => urlAssinada(p, 86400)))).filter(Boolean);
  return out(200, { status: o.status, nome: o.nome ? String(o.nome).split(" ")[0] : null, prontas: urls.length, alvo: e.alvo || BASE, fotos: urls, bio: e.bio || null, erro: e.erro_fatal ? true : false });
}

async function doLead(b: any) {
  if (!UUID.test(String(b.id || "")) || !/^[0-9a-f]{32}$/.test(String(b.token || ""))) return out(403, { erro: "Sem permissão" });
  const l = (await db(`match_leads?id=eq.${b.id}&token=eq.${b.token}&select=id`)).data?.[0];
  if (!l) return out(403, { erro: "Sem permissão" });
  await fetch(`${SB}/functions/v1/match-pagamento/sync`).catch(() => null);
  const o = (await db(`match_orders?lead_id=eq.${l.id}&status=in.(pago,em_producao,entregue)&select=id,status,entrega&order=criado_em.desc&limit=1`)).data?.[0];
  if (!o) return out(200, { achou: false });
  return out(200, { achou: true, p: o.id, k: await chaveDe(o.id) });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out(405, { erro: "use POST" });
  let b: any = {}; try { b = await req.json(); } catch { /* */ }
  try {
    if (b.acao === "processar") return await processar(req);
    if (b.acao === "pedido") return await pedido(b);
    if (b.acao === "do_lead") return await doLead(b);
    return out(400, { erro: "ação desconhecida" });
  } catch (e) { console.error("match-entrega", e); return out(500, { erro: "Erro interno" }); }
});
