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
const WM_TILE_B64 = "iVBORw0KGgoAAAANSUhEUgAAAaQAAADSCAYAAAAFQLRdAAA+oklEQVR42u2dd3hUZdr/v8+ZlsxM2iQBQgglQgIEgiAoITRFBEQ6WOCFRdefAsr6+toW3HW9uFZ33V17wdVVV7FhoYkFF1ZAKdJCJ71XJn0mU8+c5/fH8xwyZsG1rRvg/lxXrpDJmXMm5wznO9/7uQtAEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEARBEMTPDKNTQBAEQXxnOOeJnPPrOecjfsQ+enPOMzjngznnGUVFRTF0Zr8/RjoFBEFcZALEGGOcc94dwFgAwwDEATgIoAxAGoAcAG3fYV/D5fN7A/AASADgb2trq3r++eeL7rjjjl0Amumsk6UkCII4l5DYASwGkA6gCYACIHLhwoV5b775ph/AfgAnz/FcA4CBAEbL724AqtyH/h0AIh966KHi1157rbiysjIHQB2d+W9HoVNAEMRF90mcMTeAr0OhUD0AW2FhYdtHH31UU1xc7AHgk47nXBGk4QCmA0gC0AJAaWtrU91ud1B+yOcANAC+BQsWxI8cObIHgMEAutCZ/3YMdAoIgrgYefjhh1VFUWwul6ti1qxZlW+88UYwNze3BUC9/GqSjifcHQ0DcBVEiA9NTU3+F198sWLu3LkVe/bsUaOioozp6el2/XkJCQkGm83G9u3bxxsbGxUALil4xNk+KNApIAjiYoVzHgXAyxiLka7IDaCkb9++rLCw0H+W7W+X2wV8Ph/uuuuuipdeeqkGgAVADYDaQCAw1WQypQDwA1AqKip8K1eurHnzzTfLIdao8unMnx0K2REEcfF+ImfMxRhTIRIPDgLI45ynFBQU2M8iRj0hQm8qABYREWE4efKkGyLS5ANwAECJyWQ6rmmafm/VkpOTTTNnzozp3r27AyLMF01nngSJIAjiXIRkyvYvATwMEZYDgJSwbaIgQnkRAFBQUOCPjo42yd9V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";
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
  const tile = await Image.decode(Uint8Array.from(atob(WM_TILE_B64), (c) => c.charCodeAt(0)));
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
