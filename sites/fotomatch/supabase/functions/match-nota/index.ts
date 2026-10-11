// FotoMatch — backend do funil grátis (Supabase Edge Function "match-nota", verify_jwt=false como as demais do projeto;
// a autorização é própria: cada lead tem um token secreto que só o navegador dele recebe).
// Ações (POST JSON {acao,...}):
//   saude    → diz se a chave da OpenAI está configurada (sem expor nada)
//   lead     → cria o lead com as respostas do quiz            → {id, token}
//   contato  → grava WhatsApp/e-mail + consentimento (LGPD)
//   foto     → recebe 1 selfie (dataURL jpeg/png/webp ≤ 6 MB) e guarda no bucket PRIVADO match-selfies/<lead>/...
//   nota     → analisa 3–6 fotos (paths do bucket, do próprio lead) com visão da OpenAI → nota 0–10 por foto + 3 erros
//   limpeza  → (cron diário, header x-cron-key do Vault) apaga selfies com mais de 30 dias pela Storage API
//   previa   → 1 foto gerada do próprio lead (gpt-image-2, cena "jantar"), marca d'água "FotoMatch · prévia" aplicada AQUI,
//              guardada no bucket privado (<lead>/previa-*.jpg) e devolvida por URL assinada. 1 por lead; teto US$ 10/dia
//              (match_config.motor.previa + RPC match_previa_reservar, migração 002). 202 {pendente} enquanto gera; {consulta:true} consulta.
//              Passou do teto → {status:"fila"} e o cron (previa_fila, a cada 15 min) gera no dia seguinte.
// Segredos: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (automáticos); OPENAI_API_KEY (Othon cola em
// Supabase → Edge Functions → Secrets). Sem a chave, "nota" responde 503 {codigo:"chave_pendente"}.
// Opcional: MATCH_NOTA_MODELO (padrão gpt-4.1-mini).

import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

const SB = Deno.env.get("SUPABASE_URL")!;
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI = Deno.env.get("OPENAI_API_KEY") || "";
const MODELO = Deno.env.get("MATCH_NOTA_MODELO") || "gpt-4.1-mini";
const BUCKET = "match-selfies";
const IMG_MODELO = Deno.env.get("OPENAI_IMAGE_MODEL") || "gpt-image-2";
const MAX_FOTOS = 6, MIN_FOTOS = 3, MAX_TENTATIVAS = 3, MAX_BYTES = 6 * 1024 * 1024;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const out = (code: number, obj: unknown) =>
  new Response(JSON.stringify(obj), { status: code, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function db(path: string, opts: { method?: string; body?: unknown; prefer?: string } = {}) {
  const r = await fetch(SB + "/rest/v1/" + path, {
    method: opts.method || "GET",
    headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", Prefer: opts.prefer || "return=representation" },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const t = await r.text(); let data: any = null; try { data = t ? JSON.parse(t) : null; } catch { data = t; }
  if (!r.ok) console.error("db", path.split("?")[0], r.status, t.slice(0, 300));
  return { ok: r.ok, status: r.status, data };
}
const rpc = (fn: string, args: unknown) => db("rpc/" + fn, { method: "POST", body: args });

const rnd = (n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b.toString(16).padStart(2, "0")).join("");
const txt = (s: unknown, n: number) => String(s ?? "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const OPC = {
  idade: ["18-24", "25-34", "35-44", "45-54", "55+"],
  trava: ["poucos_matches", "match_nao_e_meu_tipo", "match_nao_vira_encontro", "quero_mais_animacao"],
  objetivo: ["serio", "conhecer_gente", "aberto", "ainda_nao_sei"],
  segura: ["fotos", "conversa", "estilo", "tempo", "algoritmo"],
};
const escolha = (v: unknown, lista: string[]) => (lista.includes(String(v)) ? String(v) : null);

async function leadAutorizado(b: any) {
  if (!UUID.test(String(b.id || "")) || !/^[0-9a-f]{32}$/.test(String(b.token || ""))) return null;
  const r = await db(`match_leads?id=eq.${b.id}&token=eq.${b.token}&select=*`);
  const l = r.data?.[0];
  return l && l.status !== "apagado" ? l : null;
}

async function urlAssinada(path: string) {
  const r = await fetch(`${SB}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 600 }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.signedURL ? SB + "/storage/v1" + j.signedURL : null;
}

const PROMPT = `Você é o analista de fotos de perfil do FotoMatch (fotos para apps de namoro, público masculino, Brasil).
Avalie SOMENTE a fotografia: luz, nitidez, enquadramento, ângulo, expressão (sorriso/olhar), fundo e cenário, roupa/estilo da produção,
variedade entre as fotos e primeira impressão no app. NUNCA comente ou pontue beleza, corpo, peso, idade, etnia ou qualquer atributo
físico da pessoa. Linguagem simples, direta, gentil, português do Brasil, frases curtas.
Para cada foto (na ordem recebida) dê nota de 0 a 10 (uma casa decimal) para "quanto essa FOTO ajuda no perfil".
Sinalize problemas de entrada: mais de uma pessoa, rosto não visível, óculos escuros, foto muito escura, pessoa que aparenta ser menor de idade.
Responda APENAS JSON neste formato:
{"nota_geral": number, "fotos": [{"indice": int, "nota": number, "ponto_forte": string, "ajuste": string,
  "alertas": [ "varias_pessoas" | "rosto_nao_visivel" | "oculos_escuros" | "escura" | "possivel_menor" ]}],
 "melhor_indice": int, "pior_indice": int,
 "erros": [string, string, string],
 "com_fotos_certas": string}
"erros" = exatamente os 3 erros mais importantes do conjunto, cada um com a correção (ex.: "Todas são selfies de braço esticado: falta uma foto de corpo inteiro tirada por outra pessoa").
"com_fotos_certas" = 1 frase sobre como o perfil ficaria com fotos certas (luz, cenário, enquadramento), sem prometer resultado.`;

async function nota(b: any) {
  const lead = await leadAutorizado(b);
  if (!lead) return out(403, { erro: "Sem permissão" });
  if (lead.nota) return out(200, { nota: lead.nota, cache: true });
  if (!OPENAI) return out(503, { erro: "chave pendente", codigo: "chave_pendente", detalhe: "OPENAI_API_KEY ainda não foi configurada nos Secrets das Edge Functions." });
  if (lead.nota_tentativas >= MAX_TENTATIVAS) return out(429, { erro: "Limite de análises atingido para este envio." });
  const pedidos: string[] = Array.isArray(b.paths) && b.paths.length ? b.paths.map(String) : lead.fotos;
  const paths = pedidos.filter((p) => lead.fotos.includes(p) && p.startsWith(lead.id + "/")).slice(0, MAX_FOTOS);
  if (paths.length < MIN_FOTOS) return out(400, { erro: `Envie pelo menos ${MIN_FOTOS} fotos.` });
  await db(`match_leads?id=eq.${lead.id}`, { method: "PATCH", prefer: "return=minimal", body: { nota_tentativas: lead.nota_tentativas + 1 } });

  const urls = await Promise.all(paths.map(urlAssinada));
  if (urls.some((u) => !u)) return out(502, { erro: "Não consegui ler as fotos agora. Tente de novo." });
  const content: any[] = [{ type: "text", text: `São ${paths.length} fotos, índices 0 a ${paths.length - 1}.` }];
  urls.forEach((u) => content.push({ type: "image_url", image_url: { url: u, detail: "low" } }));

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST", headers: { Authorization: "Bearer " + OPENAI, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODELO, temperature: 0.2, response_format: { type: "json_object" }, max_tokens: 1200,
      messages: [{ role: "system", content: PROMPT }, { role: "user", content }] }),
  });
  if (!r.ok) {
    const t = await r.text(); console.error("openai", r.status, t.slice(0, 300));
    if (r.status === 401) return out(503, { erro: "chave pendente", codigo: "chave_invalida", detalhe: "A OPENAI_API_KEY configurada foi recusada." });
    return out(502, { erro: "A análise falhou agora. Tente de novo em instantes." });
  }
  const j = await r.json();
  let res: any; try { res = JSON.parse(j.choices?.[0]?.message?.content || "{}"); } catch { return out(502, { erro: "Resposta inválida da análise." }); }
  const clamp = (n: unknown) => Math.max(0, Math.min(10, Math.round(Number(n) * 10) / 10 || 0));
  const fotos = paths.map((p, i) => {
    const f = (res.fotos || []).find((x: any) => Number(x.indice) === i) || {};
    return { path: p, nota: clamp(f.nota), ponto_forte: txt(f.ponto_forte, 160), ajuste: txt(f.ajuste, 160), alertas: (Array.isArray(f.alertas) ? f.alertas : []).map((a: unknown) => txt(a, 30)).slice(0, 5) };
  });
  const possivelMenor = fotos.some((f) => f.alertas.includes("possivel_menor"));
  const final = {
    nota_geral: clamp(res.nota_geral ?? fotos.reduce((s, f) => s + f.nota, 0) / fotos.length),
    fotos, melhor_indice: Number.isInteger(res.melhor_indice) ? res.melhor_indice : 0, pior_indice: Number.isInteger(res.pior_indice) ? res.pior_indice : 0,
    erros: (Array.isArray(res.erros) ? res.erros : []).map((e: unknown) => txt(e, 220)).filter(Boolean).slice(0, 3),
    com_fotos_certas: txt(res.com_fotos_certas, 240), modelo: MODELO, bloqueado: possivelMenor ? "possivel_menor" : null,
  };
  await db(`match_leads?id=eq.${lead.id}`, { method: "PATCH", prefer: "return=minimal", body: { nota: final, nota_em: new Date().toISOString(), status: "nota", atualizado_em: new Date().toISOString() } });
  return out(200, { nota: final });
}

/* ---------- prévia grátis (evento match-20261011-previa-ligar) ---------- */
// Ladrilho PNG 420x210 com "FotoMatch · prévia" (branco semitransparente + sombra), girado 25 graus. Aplicado em grade sobre a foto.
const WM_TILE_URL = "https://n3w-fotomatch.vercel.app/img/marca-previa.png";
let wmTileBytes: Uint8Array | null = null;
async function wmTile(): Promise<Uint8Array> {
  if (!wmTileBytes) {
    const r = await fetch(WM_TILE_URL);
    if (!r.ok) throw new Error("marca d'água indisponível: " + r.status);
    wmTileBytes = new Uint8Array(await r.arrayBuffer());
  }
  return wmTileBytes;
}
const ESTILO = "foto vertical tirada com celular por um amigo, luz natural, grão leve, foco no rosto, " +
  "sem cara de estúdio, sem filtro, pele com textura real, mesma pessoa das fotos de referência (mesmo rosto, cabelo, barba e tipo físico), " +
  "sem texto, sem marca d'água, mãos naturais";
const CENAS_PREVIA: Record<string, string> = {
  jantar: "sentado num restaurante à noite com luz quente de velas, camisa social, rindo de algo fora do quadro",
  terno_rua: "de terno bem ajustado caminhando numa rua da cidade no fim de tarde, sorriso leve, olhar fora da câmera",
};
// Estimativa conservadora (US$/token): texto 5/M, imagem de entrada 10/M, saída 40/M.
function custoImg(u: any): number {
  if (!u) return 0.25;
  const it = u.input_tokens_details?.image_tokens ?? 0;
  const tt = u.input_tokens_details?.text_tokens ?? Math.max(0, (u.input_tokens ?? 0) - it);
  return +(tt * 5e-6 + it * 10e-6 + (u.output_tokens ?? 0) * 40e-6).toFixed(4);
}
const agora = () => new Date().toISOString();
const hojeSP = () => new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);

async function baixa(path: string): Promise<Blob | null> {
  const r = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, { headers: { apikey: SK, Authorization: "Bearer " + SK } });
  return r.ok ? new Blob([await r.arrayBuffer()], { type: r.headers.get("content-type") || "image/jpeg" }) : null;
}

async function marcaDagua(bytes: Uint8Array): Promise<Uint8Array> {
  const img = await Image.decode(bytes);
  if (img.width > 768) img.resize(768, Image.RESIZE_AUTO);
  const tile = await Image.decode(await wmTile());
  for (let y = 0, linha = 0; y < img.height; y += 210, linha++) {
    for (let x = linha % 2 ? 0 : 210; x < img.width; x += 420) img.composite(tile, x, y);
  }
  return await img.encodeJPEG(82);
}

async function chamaImagem(prompt: string, refs: Blob[], extra: Record<string, string>) {
  const fd = new FormData();
  const base: Record<string, string> = { model: IMG_MODELO, prompt, size: "1024x1536", quality: "medium", n: "1", ...extra };
  for (const [k, v] of Object.entries(base)) fd.append(k, v);
  refs.forEach((b, i) => fd.append("image[]", b, "ref" + i + ".jpg"));
  return await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: "Bearer " + OPENAI }, body: fd });
}

async function gerarPrevia(lead: any, cena: string) {
  const t0 = Date.now(); let custo = 0, uso: any = null;
  try {
    const mi = lead.nota?.melhor_indice;
    const melhor = Number.isInteger(mi) ? lead.nota?.fotos?.[mi]?.path : null;
    const ordem = melhor ? [melhor, ...lead.fotos.filter((f: string) => f !== melhor)] : [...lead.fotos];
    const refs = (await Promise.all(ordem.filter((f: string) => !f.includes("/previa-")).slice(0, 3).map(baixa))).filter(Boolean) as Blob[];
    if (!refs.length) throw new Error("sem referências legíveis");
    const prompt = `Foto de perfil para app de namoro: o homem das fotos de referência ${CENAS_PREVIA[cena] || CENAS_PREVIA.jantar}. ${ESTILO}.`;
    let r = await chamaImagem(prompt, refs, { output_format: "jpeg", output_compression: "90", input_fidelity: "high" });
    if (!r.ok && r.status === 400) {
      const t = await r.clone().text();
      if (/input_fidelity|output_format|output_compression|unknown parameter/i.test(t)) r = await chamaImagem(prompt, refs, {});
    }
    const j = await r.json();
    if (!r.ok) throw new Error("OpenAI " + r.status + ": " + String(j?.error?.message || "").slice(0, 200));
    uso = j.usage || null; custo = custoImg(uso);
    const bruto = Uint8Array.from(atob(j.data[0].b64_json), (c) => c.charCodeAt(0));
    const final = await marcaDagua(bruto);
    const path = `${lead.id}/previa-${Date.now()}-${rnd(3)}.jpg`;
    const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, {
      method: "POST", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "image/jpeg" }, body: final });
    if (!up.ok) throw new Error("upload " + up.status);
    await db(`match_previas?lead_id=eq.${lead.id}`, { method: "PATCH", prefer: "return=minimal", body: {
      status: "pronta", path, modelo: IMG_MODELO, custo_usd: custo, uso, ms: Date.now() - t0, erro: null, atualizado_em: agora() } });
  } catch (e) {
    console.error("previa", lead.id, e);
    await db(`match_previas?lead_id=eq.${lead.id}`, { method: "PATCH", prefer: "return=minimal", body: {
      status: "erro", erro: String((e as Error)?.message || e).slice(0, 400), custo_usd: custo, uso, ms: Date.now() - t0, atualizado_em: agora() } });
  }
}

async function urlPrevia(path: string) {
  const r = await fetch(`${SB}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: 3600 }) });
  if (!r.ok) return null;
  const j = await r.json();
  return j.signedURL ? SB + "/storage/v1" + j.signedURL : null;
}

async function previa(b: any) {
  const lead = await leadAutorizado(b);
  if (!lead) return out(403, { erro: "Sem permissão" });
  const p = (await db(`match_previas?lead_id=eq.${lead.id}&select=*`)).data?.[0];
  if (p?.status === "pronta" && p.path) {
    const url = await urlPrevia(p.path);
    return url ? out(200, { url, status: "pronta" }) : out(502, { erro: "Não consegui abrir a prévia agora." });
  }
  if (p?.status === "gerando") return out(202, { pendente: true, status: "gerando" });
  if (b.consulta) return out(200, { pendente: false, status: p?.status || "nenhuma" });
  if (!OPENAI) return out(200, { pendente: false, status: "indisponivel" });
  if (!lead.consentimento || !lead.nota) return out(400, { erro: "A prévia sai depois da nota." });
  if (lead.nota.bloqueado) {
    await db("match_previas", { method: "POST", prefer: "resolution=ignore-duplicates,return=minimal", body: { lead_id: lead.id, status: "bloqueada", erro: String(lead.nota.bloqueado) } });
    return out(200, { pendente: false, status: "bloqueada" });
  }
  if (!lead.fotos?.length) return out(400, { erro: "Sem fotos." });
  const res = (await rpc("match_previa_reservar", { p_lead: lead.id })).data?.[0];
  if (!res?.gerar) return out(200, { pendente: false, status: res?.status || "erro" });
  const cena = (await db(`match_previas?lead_id=eq.${lead.id}&select=cena`)).data?.[0]?.cena || "jantar";
  // @ts-ignore EdgeRuntime existe no Supabase
  EdgeRuntime.waitUntil(gerarPrevia(lead, cena));
  return out(202, { pendente: true, status: "gerando" });
}

// Cron a cada 15 min: destrava presas (> 10 min em 'gerando') e gera até 2 da fila de dias anteriores.
async function previaFila(req: Request) {
  const chave = req.headers.get("x-cron-key") || "";
  if (!chave || !(await rpc("match_cron_chave_ok", { p_chave: chave })).data) return out(401, { erro: "não autorizado" });
  const limite = new Date(Date.now() - 10 * 60e3).toISOString();
  await db(`match_previas?status=eq.gerando&atualizado_em=lt.${limite}`, { method: "PATCH", prefer: "return=minimal", body: { status: "erro", erro: "tempo esgotado", atualizado_em: agora() } });
  if (!OPENAI) return out(200, { ok: true, gerando: 0, motivo: "sem chave" });
  const fila = (await db(`match_previas?status=eq.fila&dia=lt.${hojeSP()}&select=lead_id&order=criado_em.asc&limit=2`)).data || [];
  const vao: any[] = [];
  for (const f of fila) {
    const res = (await rpc("match_previa_reservar", { p_lead: f.lead_id })).data?.[0];
    if (!res?.gerar) continue;
    const lead = (await db(`match_leads?id=eq.${f.lead_id}&select=*`)).data?.[0];
    if (lead) vao.push(lead);
  }
  // @ts-ignore EdgeRuntime existe no Supabase
  if (vao.length) EdgeRuntime.waitUntil((async () => { for (const l of vao) await gerarPrevia(l, "jantar"); })());
  return out(200, { ok: true, gerando: vao.length });
}

async function limpeza(req: Request) {
  const chave = req.headers.get("x-cron-key") || "";
  if (!chave || !(await rpc("match_cron_chave_ok", { p_chave: chave })).data) return out(401, { erro: "não autorizado" });
  const r = await rpc("match_selfies_vencidas", { p_limite: 500 });
  const nomes: string[] = (r.data || []).map((x: any) => x.nome).filter(Boolean);
  if (nomes.length) {
    const d = await fetch(`${SB}/storage/v1/object/${BUCKET}`, {
      method: "DELETE", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: nomes }),
    });
    if (!d.ok) { console.error("limpeza storage", d.status, (await d.text()).slice(0, 200)); return out(502, { erro: "falha ao apagar" }); }
  }
  const limite = new Date(Date.now() - 30 * 864e5).toISOString();
  await db(`match_leads?criado_em=lt.${limite}&fotos_apagadas_em=is.null`, { method: "PATCH", prefer: "return=minimal", body: { fotos: [], fotos_apagadas_em: new Date().toISOString() } });
  return out(200, { ok: true, apagadas: nomes.length });
}

async function acao(b: any, req: Request) {
  switch (b.acao) {
    case "saude":
      return out(200, { ok: true, openai: OPENAI ? "chave presente" : "chave pendente", modelo: MODELO, modelo_imagem: IMG_MODELO });
    case "lead": {
      const r0 = b.respostas || {};
      const segura = (Array.isArray(r0.segura) ? r0.segura : []).map((x: unknown) => escolha(x, OPC.segura)).filter(Boolean);
      const utm = b.utm && typeof b.utm === "object" ? Object.fromEntries(Object.entries(b.utm).slice(0, 10).map(([k, v]) => [txt(k, 30), txt(v, 200)])) : null;
      const token = rnd(16);
      const r = await db("match_leads", { method: "POST", body: {
        token, idade: escolha(r0.idade, OPC.idade), trava: escolha(r0.trava, OPC.trava), objetivo: escolha(r0.objetivo, OPC.objetivo), segura, utm } });
      if (!r.ok) return out(500, { erro: "Não foi possível salvar agora." });
      return out(200, { id: r.data[0].id, token });
    }
    case "contato": {
      const lead = await leadAutorizado(b);
      if (!lead) return out(403, { erro: "Sem permissão" });
      const whats = txt(b.whats, 20).replace(/\D/g, ""), email = txt(b.email, 120).toLowerCase();
      if (whats && (whats.length < 10 || whats.length > 13)) return out(400, { erro: "WhatsApp com DDD, só números." });
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return out(400, { erro: "Confira o e-mail." });
      if (!whats && !email) return out(400, { erro: "Informe WhatsApp ou e-mail." });
      if (b.consentimento !== true) return out(400, { erro: "Precisamos do seu aceite para analisar as fotos." });
      await db(`match_leads?id=eq.${lead.id}`, { method: "PATCH", prefer: "return=minimal", body: {
        whats: whats || null, email: email || null, consentimento: true, consentimento_em: new Date().toISOString(),
        status: lead.status === "quiz" ? "contato" : lead.status, atualizado_em: new Date().toISOString() } });
      return out(200, { ok: true });
    }
    case "foto": {
      const lead = await leadAutorizado(b);
      if (!lead) return out(403, { erro: "Sem permissão" });
      if (!lead.consentimento) return out(400, { erro: "Aceite os termos antes de enviar fotos." });
      if (lead.fotos.length >= MAX_FOTOS) return out(400, { erro: `Máximo de ${MAX_FOTOS} fotos.` });
      const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(String(b.img || ""));
      if (!m) return out(400, { erro: "Imagem inválida (use JPG, PNG ou WEBP)." });
      const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      if (bytes.length > MAX_BYTES) return out(413, { erro: "Imagem grande demais." });
      const path = `${lead.id}/${Date.now()}-${rnd(3)}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
      const up = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, {
        method: "POST", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "image/" + m[1] }, body: bytes });
      if (!up.ok) { console.error("upload", up.status, (await up.text()).slice(0, 200)); return out(502, { erro: "Falha ao enviar a foto." }); }
      const fotos = [...lead.fotos, path];
      await db(`match_leads?id=eq.${lead.id}`, { method: "PATCH", prefer: "return=minimal", body: { fotos, status: "fotos", atualizado_em: new Date().toISOString() } });
      return out(200, { path, total: fotos.length });
    }
    case "nota":
      return await nota(b);
    case "limpeza":
      return await limpeza(req);
    case "previa":
      return await previa(b);
    case "previa_fila":
      return await previaFila(req);
  }
  return out(400, { erro: "ação desconhecida" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out(405, { erro: "use POST" });
  let b: any = null; try { b = await req.json(); } catch { return out(400, { erro: "JSON inválido" }); }
  try { return await acao(b || {}, req); } catch (e) { console.error("match-nota", e); return out(500, { erro: "Erro interno, tente de novo." }); }
});
