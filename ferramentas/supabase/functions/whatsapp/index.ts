// Central WhatsApp N3w — webhook oficial (WhatsApp Cloud API) + atendente IA
// Rotas:
//   GET  /whatsapp                 verificação do webhook (Meta)
//   POST /whatsapp                 eventos da Meta (mensagens e status), assinatura X-Hub-Signature-256
//   *    /whatsapp/admin/...       API da inbox (header x-n3w-key)
// Aprovação de peças (09/10/2026): /admin/aprovacao manda a peça (imagem/vídeo + legenda) com botões
// Aprovar/Refazer para o número aprovador; a resposta é gravada em wa_aprovacoes sem passar pela IA.
import { createClient } from "npm:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const GRAPH = `https://graph.facebook.com/${env("WA_GRAPH_VERSION") || "v23.0"}`;
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});
const DEBOUNCE_MS = Number(env("WA_DEBOUNCE_MS") || 7000);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// chaves internas (verify token, admin key, phone id) ficam em wa_config.chaves; env tem prioridade
let _k: { at: number; v: Record<string, string> } | null = null;
async function chave(nome: string, envName: string) {
  if (env(envName)) return env(envName);
  if (!_k || Date.now() - _k.at > 60000) {
    const { data } = await db.from("wa_config").select("chaves").eq("id", "default").maybeSingle();
    _k = { at: Date.now(), v: data?.chaves ?? {} };
  }
  return _k.v[nome] ?? "";
}
const phoneId = () => chave("phone_number_id", "WA_PHONE_NUMBER_ID");

// ── aprovação de peças ──
// Único número que pode aprovar (wa_id só com dígitos, como a Meta manda, ex.: 5548999998888).
const soDigitos = (s: unknown) => String(s ?? "").replace(/\D/g, "");
const aprovador = async () => soDigitos(await chave("aprovador", "WA_APROVADOR"));
const TPL_APROVAR_IMAGEM = () => env("WA_TPL_APROVAR") || "peca_nova_aprovar";
const TPL_APROVAR_VIDEO = () => env("WA_TPL_APROVAR_VIDEO") || "peca_nova_aprovar_video";
const TPL_LANG = () => env("WA_TPL_LANG") || "pt_BR";
const JANELA_MS = 24 * 60 * 60 * 1000 - 5 * 60 * 1000; // 24 h com 5 min de folga
const corta = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-n3w-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const json = (d: unknown, status = 200) =>
  new Response(JSON.stringify(d), { status, headers: { "content-type": "application/json", ...cors } });

// ───────────────────────── entrada ─────────────────────────
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const i = url.pathname.indexOf("/admin");
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (i >= 0) return admin(req, url, url.pathname.slice(i + 6) || "/");

  if (req.method === "GET") {
    const vt = await chave("verify_token", "WA_VERIFY_TOKEN");
    const ok = url.searchParams.get("hub.mode") === "subscribe" && vt && url.searchParams.get("hub.verify_token") === vt;
    return ok ? new Response(url.searchParams.get("hub.challenge") ?? "") : new Response("forbidden", { status: 403 });
  }
  if (req.method !== "POST") return new Response("method", { status: 405 });

  const raw = await req.text();
  if (!(await validSignature(raw, req.headers.get("x-hub-signature-256")))) {
    return new Response("bad signature", { status: 401 });
  }
  let body: any;
  try { body = JSON.parse(raw); } catch { return new Response("ok"); }

  const work: Promise<unknown>[] = [];
  for (const entry of body.entry ?? []) {
    for (const ch of entry.changes ?? []) {
      const v = ch.value ?? {};
      for (const st of v.statuses ?? []) {
        work.push(Promise.resolve(db.from("wa_messages").update({ status: st.status }).eq("wamid", st.id)));
      }
      for (const m of v.messages ?? []) {
        const name = (v.contacts ?? []).find((c: any) => c.wa_id === m.from)?.profile?.name;
        work.push(ingest(m, name));
      }
    }
  }
  // responde 200 rápido; o processamento continua em segundo plano
  // @ts-ignore EdgeRuntime existe no Supabase
  EdgeRuntime.waitUntil(Promise.allSettled(work));
  return new Response("ok");
});

async function validSignature(raw: string, header: string | null) {
  const secret = env("WA_APP_SECRET");
  if (!secret || !header?.startsWith("sha256=")) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw)));
  const hex = [...sig].map((b) => b.toString(16).padStart(2, "0")).join("");
  const got = header.slice(7);
  if (got.length !== hex.length) return false;
  let diff = 0;
  for (let k = 0; k < hex.length; k++) diff |= hex.charCodeAt(k) ^ got.charCodeAt(k);
  return diff === 0;
}

// ───────────────────────── mensagem recebida ─────────────────────────
async function ingest(m: any, name?: string) {
  const waId = m.from as string;
  const now = new Date().toISOString();
  const { data: existing } = await db.from("wa_contacts").select("wa_id").eq("wa_id", waId).maybeSingle();
  const contact: Record<string, unknown> = { wa_id: waId, last_inbound_at: now };
  if (name) contact.name = name;
  if (m.referral) contact.source = m.referral;
  if (!existing) contact.stage = "novo";
  await db.from("wa_contacts").upsert(contact);

  let body = "", type = m.type as string, mediaId: string | null = null, transcript: string | null = null;
  if (type === "text") body = m.text?.body ?? "";
  else if (type === "audio") { mediaId = m.audio?.id; }
  else if (type === "image") { mediaId = m.image?.id; body = m.image?.caption ?? ""; }
  else if (type === "video") { mediaId = m.video?.id; body = m.video?.caption ?? ""; }
  else if (type === "document") { mediaId = m.document?.id; body = m.document?.caption ?? m.document?.filename ?? ""; }
  else if (type === "button") body = m.button?.text ?? "";
  else if (type === "interactive") body = m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? "";
  else if (type === "reaction") body = `reagiu ${m.reaction?.emoji ?? ""}`;
  else if (type === "sticker") body = "[figurinha]";
  else body = `[${type}]`;

  // id do botão clicado (mensagem interativa) ou payload do botão de template
  const botao: string = m.interactive?.button_reply?.id ?? m.button?.payload ?? "";
  const meta: Record<string, unknown> = {};
  if (m.referral) meta.referral = m.referral;
  if (botao) meta.botao = botao;
  if (m.context?.id) meta.context = m.context.id;

  const { error } = await db.from("wa_messages").insert({
    wa_id: waId, direction: "in", sender: "cliente", type, body, media_id: mediaId, wamid: m.id,
    meta: Object.keys(meta).length ? meta : null,
  });
  if (error) return; // duplicado (a Meta reenviou) ou falha: não processa de novo

  if (type === "audio" && mediaId) {
    try {
      transcript = await transcribe(mediaId);
      await db.from("wa_messages").update({ transcript }).eq("wamid", m.id);
    } catch (e) { console.error("transcrição", e); }
  }

  // aprovação de peças: tratada aqui e NUNCA segue para a IA de vendas
  try {
    if (await tratarAprovacao(waId, type, botao, transcript ?? body)) return;
  } catch (e) { console.error("aprovação", e); return; }

  if (type === "reaction") return; // reação sozinha não pede resposta
  await respondLater(waId, m.id);
}

// ───────────────────────── aprovação de peças ─────────────────────────
// Botões: id/payload "apv:<id da linha em wa_aprovacoes>:ok" ou "apv:<id>:refazer".
// Devolve true quando a mensagem era da aprovação (e portanto não vai para a IA).
async function tratarAprovacao(waId: string, type: string, botao: string, texto: string): Promise<boolean> {
  const quem = await aprovador();
  const ehAprovador = !!quem && soDigitos(waId) === quem;
  const clique = /^apv:(\d+):(ok|refazer)$/.exec(botao);

  if (clique) {
    if (!ehAprovador) { // só o número do Othon aprova; clique de outro número é ignorado
      console.warn("aprovação: clique de número não autorizado", waId);
      return true;
    }
    const id = Number(clique[1]);
    const { data: ap } = await db.from("wa_aprovacoes").select("*").eq("id", id).maybeSingle();
    if (!ap || soDigitos(ap.wa_id) !== quem) {
      await sendText(waId, "Não achei essa peça na fila de aprovação.", "sistema");
      return true;
    }
    if (ap.status === "aprovado" || ap.status === "refazer") {
      await sendText(waId, `A peça ${ap.peca} já estava marcada como "${ap.status}". Nada mudou.`, "sistema");
      return true;
    }
    const agora = new Date().toISOString();
    if (clique[2] === "ok") {
      await db.from("wa_aprovacoes").update({ status: "aprovado", respondido_em: agora, sincronizado_em: null }).eq("id", id);
      await sendText(waId, `Aprovada: ${ap.peca} (${ap.projeto}). Vai para o painel.`, "sistema");
    } else {
      // só uma peça por vez aguarda motivo: as anteriores ficam como "refazer" sem motivo
      await db.from("wa_aprovacoes").update({ status: "refazer", respondido_em: agora, sincronizado_em: null })
        .eq("wa_id", ap.wa_id).eq("status", "aguardando_motivo");
      await db.from("wa_aprovacoes").update({ status: "aguardando_motivo", respondido_em: agora, sincronizado_em: null }).eq("id", id);
      await sendText(waId, `Refazer ${ap.peca}: qual o motivo? Responda na próxima mensagem (texto ou áudio).`, "sistema");
    }
    return true;
  }

  if (!ehAprovador) return false;

  // próxima mensagem do Othon depois de "Refazer" = motivo
  if (type === "text" || type === "audio") {
    const { data: ap } = await db.from("wa_aprovacoes").select("*").eq("wa_id", waId).eq("status", "aguardando_motivo")
      .order("respondido_em", { ascending: false }).limit(1).maybeSingle();
    if (!ap) return false;
    const motivo = (texto || "").trim() || (type === "audio" ? "[áudio sem transcrição]" : "");
    await db.from("wa_aprovacoes").update({ status: "refazer", motivo, sincronizado_em: null }).eq("id", ap.id);
    await sendText(waId, `Anotado. ${ap.peca} volta para refazer com o motivo: "${corta(motivo, 300)}"`, "sistema");
    return true;
  }
  return false;
}

// legenda padrão: código da peça + projeto + copy
function legendaPeca(peca: string, projeto: string, copy: string) {
  return corta(`Peça ${peca} · ${projeto}\n\n${copy || "(sem copy)"}`.trim(), 1000);
}

async function dentroDaJanela(waId: string) {
  const { data } = await db.from("wa_contacts").select("last_inbound_at").eq("wa_id", waId).maybeSingle();
  const t = data?.last_inbound_at ? new Date(data.last_inbound_at).getTime() : 0;
  return t > 0 && Date.now() - t < JANELA_MS;
}

// Envia uma peça para aprovação. Dentro da janela de 24 h: 1 mensagem interativa (mídia no cabeçalho +
// legenda + botões). Fora dela: template utilitário com a mídia no cabeçalho e os mesmos botões.
async function enviarParaAprovacao(b: any) {
  const quem = await aprovador();
  if (!quem) throw new Error("defina o número aprovador (env WA_APROVADOR ou wa_config.chaves.aprovador)");
  const waId = soDigitos(b.wa_id || quem);
  if (waId !== quem) throw new Error("só o número aprovador pode receber peças para aprovar");
  const peca = String(b.peca ?? "").trim(), projeto = String(b.projeto ?? "").trim();
  const copy = String(b.copy ?? "").trim(), link = String(b.midia_url ?? "").trim();
  const tipo = b.midia_tipo === "video" || b.midia_tipo === "vídeo" ? "video" : "image";
  if (!peca || !projeto || !/^https:\/\//.test(link)) throw new Error("obrigatório: peca, projeto, midia_url (https)");

  const { data: ap, error } = await db.from("wa_aprovacoes").insert({
    wa_id: waId, peca, projeto, copy, midia_url: link, midia_tipo: tipo, evento_id: b.evento_id ?? null, status: "enviando",
  }).select("id").single();
  if (error || !ap) throw new Error("wa_aprovacoes: " + (error?.message ?? "insert falhou"));

  const legenda = legendaPeca(peca, projeto, copy);
  const janela = !b.forcar_template && (await dentroDaJanela(waId));
  let d: any, via: string;
  try {
    if (janela) {
      via = "interativa";
      d = await graph(`${await phoneId()}/messages`, {
        method: "POST",
        body: JSON.stringify({
          messaging_product: "whatsapp", recipient_type: "individual", to: waId, type: "interactive",
          interactive: {
            type: "button",
            header: { type: tipo, [tipo]: { link } },
            body: { text: legenda },
            footer: { text: "Aprovar ou Refazer?" },
            action: { buttons: [
              { type: "reply", reply: { id: `apv:${ap.id}:ok`, title: "Aprovar" } },
              { type: "reply", reply: { id: `apv:${ap.id}:refazer`, title: "Refazer" } },
            ] },
          },
        }),
      });
    } else {
      via = "template";
      const param = (s: string, n: number) => ({ type: "text", text: corta(s.replace(/\s*[\r\n\t]+\s*/g, " / ").replace(/ {4,}/g, " ") || "-", n) });
      d = await graph(`${await phoneId()}/messages`, {
        method: "POST",
        body: JSON.stringify({
          messaging_product: "whatsapp", recipient_type: "individual", to: waId, type: "template",
          template: {
            name: tipo === "video" ? TPL_APROVAR_VIDEO() : TPL_APROVAR_IMAGEM(),
            language: { code: TPL_LANG() },
            components: [
              { type: "header", parameters: [{ type: tipo, [tipo]: { link } }] },
              { type: "body", parameters: [param(peca, 60), param(projeto, 60), param(copy || "(sem copy)", 700)] },
              { type: "button", sub_type: "quick_reply", index: "0", parameters: [{ type: "payload", payload: `apv:${ap.id}:ok` }] },
              { type: "button", sub_type: "quick_reply", index: "1", parameters: [{ type: "payload", payload: `apv:${ap.id}:refazer` }] },
            ],
          },
        }),
      });
    }
  } catch (e) {
    await db.from("wa_aprovacoes").update({ status: "erro", motivo: String(e).slice(0, 500) }).eq("id", ap.id);
    throw e;
  }
  const wamid = d?.messages?.[0]?.id ?? null;
  await db.from("wa_aprovacoes").update({ status: "enviado", wamid, enviado_em: new Date().toISOString(), via }).eq("id", ap.id);
  await logOut(waId, "sistema", via === "template" ? "template" : "interactive", legenda, wamid ?? undefined, undefined,
    { aprovacao_id: ap.id, midia_url: link, midia_tipo: tipo });
  return { id: ap.id, via, wamid };
}

// espera o cliente terminar de digitar e responde o bloco inteiro
async function respondLater(waId: string, wamid: string) {
  await sleep(DEBOUNCE_MS);
  const { data: last } = await db.from("wa_messages").select("wamid").eq("wa_id", waId).eq("direction", "in")
    .order("id", { ascending: false }).limit(1).maybeSingle();
  if (last?.wamid !== wamid) return; // chegou mensagem mais nova; ela é quem responde

  const [{ data: cfg }, { data: contact }] = await Promise.all([
    db.from("wa_config").select("*").eq("id", "default").single(),
    db.from("wa_contacts").select("*").eq("wa_id", waId).single(),
  ]);
  if (!cfg?.ai_enabled || contact?.ai_paused) return;

  await typing(wamid);
  const reply = await think(cfg, contact, waId);
  if (!reply) return;

  const lastIn = await db.from("wa_messages").select("type").eq("wamid", wamid).single();
  const clienteMandouAudio = lastIn.data?.type === "audio";
  const usarAudio = cfg.voice?.usar_audio ?? "quando_cliente_manda_audio";
  const podeAudio = usarAudio === "sempre_que_fizer_sentido" || (usarAudio === "quando_cliente_manda_audio" && clienteMandouAudio);

  // não responder se, durante o "pensar", o cliente mandou mais coisa
  const { data: last2 } = await db.from("wa_messages").select("wamid").eq("wa_id", waId).eq("direction", "in")
    .order("id", { ascending: false }).limit(1).maybeSingle();
  if (last2?.wamid !== wamid) return;

  if (reply.audio && podeAudio && cfg.voice?.voice_id) {
    try {
      await typing(wamid, "audio");
      await sleep(Math.min(8000, 1500 + reply.audio.length * 25));
      await sendVoice(waId, reply.audio, cfg.voice, "ia");
    } catch (e) {
      console.error("áudio", e);
      reply.mensagens.unshift(reply.audio); // fallback: manda como texto
    }
  }
  for (const text of reply.mensagens) {
    await typing(wamid);
    await sleep(Math.min(7000, Math.max(1500, text.length * 45)));
    await sendText(waId, text, "ia");
  }

  const upd: Record<string, unknown> = {};
  if (reply.etapa) upd.stage = reply.etapa;
  if (reply.precisa_humano) { upd.needs_human = true; upd.ai_paused = true; }
  if (reply.nota) upd.notes = reply.nota;
  if (Object.keys(upd).length) await db.from("wa_contacts").update(upd).eq("wa_id", waId);
}

// ───────────────────────── cérebro (Claude) ─────────────────────────
type Reply = { mensagens: string[]; audio?: string | null; etapa?: string; precisa_humano?: boolean; nota?: string };

function systemPrompt(cfg: any) {
  const p = cfg.persona ?? {};
  return `Você é ${p.nome || "a atendente"}, da ${p.empresa || "empresa"}, atendendo clientes pelo WhatsApp.
Produto: ${p.produto || "-"}
Oferta: ${p.oferta || "-"}
Link de compra: ${p.link_checkout || "(ainda não definido: não invente link; diga que vai enviar já já)"}
Tom: ${p.tom || "natural e humano"}
Objetivo: ${p.objetivo || "ajudar e vender"}
Perguntas frequentes / informações confirmadas:
${p.faq || "-"}
${p.regras_extra ? "Regras extras:\n" + p.regras_extra : ""}

Como escrever:
- Escreva como uma pessoa real escreve no WhatsApp: 1 a 3 mensagens curtas por vez, cada uma com no máximo ~2 frases. Sem listas, sem markdown, sem textão, sem formalidade de robô.
- Responda ao que o cliente disse; faça no máximo 1 pergunta por vez.
- Nunca invente preço, prazo, garantia, desconto ou característica que não esteja acima. Se não souber, diga que vai confirmar com a equipe.
- Se o cliente perguntar diretamente se fala com robô, IA ou pessoa, seja honesta: diga que é a assistente virtual da ${p.empresa || "empresa"} e ofereça passar para alguém da equipe. Nunca afirme ser humana.
- Assuntos fora do produto: responda brevemente e volte ao atendimento; não atue como assistente geral.

Áudio: o campo "audio" é opcional. Use só quando um áudio curto deixar a conversa mais humana (por exemplo, se o cliente mandou áudio). Texto falado natural, até 50 palavras, sem emoji, sem link, sem números de preço complicados. Links sempre vão em "mensagens".

precisa_humano = true quando: pedido de reembolso ou reclamação séria, cliente irritado, pedido explícito para falar com uma pessoa, ou algo que você não pode resolver.

Responda SOMENTE com um JSON válido, sem nada antes ou depois:
{"mensagens": ["..."], "audio": null, "etapa": "novo|conversando|interessado|checkout|comprou|perdido", "precisa_humano": false, "nota": "resumo curto do cliente para a equipe"}`;
}

async function transcriptFor(waId: string, limit = 40) {
  const { data } = await db.from("wa_messages").select("sender,type,body,transcript,created_at")
    .eq("wa_id", waId).order("id", { ascending: false }).limit(limit);
  const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (data ?? []).reverse().map((m: any) => {
    const who = m.sender === "cliente" ? "CLIENTE" : m.sender === "humano" ? "EQUIPE (humano)" : "VOCÊ";
    let t = m.body || "";
    if (m.type === "audio") t = m.transcript ? `[áudio] ${m.transcript}` : "[áudio sem transcrição]";
    else if (m.type !== "text" && m.type !== "button" && m.type !== "interactive") t = `[${m.type}] ${t}`.trim();
    return `${fmt(m.created_at)} ${who}: ${t}`;
  }).join("\n");
}

async function think(cfg: any, contact: any, waId: string, extraHistory?: string): Promise<Reply | null> {
  const hist = extraHistory ?? (await transcriptFor(waId));
  const agora = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const user = `Agora: ${agora} (horário de Brasília)
Cliente: ${contact?.name || "sem nome"} · etapa atual: ${contact?.stage || "novo"}${contact?.source ? " · veio de anúncio: " + (contact.source.headline || contact.source.source_id || "sim") : ""}
${contact?.notes ? "Notas da equipe: " + contact.notes : ""}

Conversa até agora:
${hist}

Escreva a próxima resposta (JSON).`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01", "content-type": "application/json",
      ...((await chave("anthropic_workspace_id", "ANTHROPIC_WORKSPACE_ID")) ? { "anthropic-workspace-id": await chave("anthropic_workspace_id", "ANTHROPIC_WORKSPACE_ID") } : {}),
    },
    body: JSON.stringify({ model: cfg.model || "claude-sonnet-5-5", max_tokens: 900, system: systemPrompt(cfg), messages: [{ role: "user", content: user }] }),
  });
  if (!r.ok) { console.error("anthropic", r.status, await r.text()); return null; }
  const out = await r.json();
  const text = (out.content ?? []).map((c: any) => c.text ?? "").join("");
  const s = text.indexOf("{"), e = text.lastIndexOf("}");
  try {
    const parsed = JSON.parse(text.slice(s, e + 1)) as Reply;
    parsed.mensagens = (parsed.mensagens ?? []).map((x) => String(x).trim()).filter(Boolean).slice(0, 4);
    return parsed;
  } catch {
    console.error("json inválido", text);
    return text.trim() ? { mensagens: [text.trim().slice(0, 600)] } : null;
  }
}

// ───────────────────────── WhatsApp (Cloud API) ─────────────────────────
async function graph(path: string, init: RequestInit = {}) {
  const r = await fetch(`${GRAPH}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env("WA_TOKEN")}`, ...(init.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}), ...(init.headers ?? {}) },
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`graph ${path} ${r.status} ${JSON.stringify(d)}`);
  return d;
}

async function typing(wamid: string, _kind: "text" | "audio" = "text") {
  try {
    await graph(`${await phoneId()}/messages`, {
      method: "POST",
      body: JSON.stringify({ messaging_product: "whatsapp", status: "read", message_id: wamid, typing_indicator: { type: "text" } }),
    });
  } catch (e) { console.error("typing", e); }
}

async function sendText(waId: string, text: string, sender: "ia" | "humano" | "sistema") {
  const d = await graph(`${await phoneId()}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: waId, type: "text", text: { body: text, preview_url: true } }),
  });
  await logOut(waId, sender, "text", text, d?.messages?.[0]?.id);
}

async function sendVoice(waId: string, text: string, voice: any, sender: "ia" | "humano") {
  const { bytes, mime } = await tts(text, voice);
  const fd = new FormData();
  fd.append("messaging_product", "whatsapp");
  fd.append("type", mime);
  fd.append("file", new Blob([bytes], { type: mime }), mime === "audio/ogg" ? "voz.ogg" : "voz.mp3");
  const up = await graph(`${await phoneId()}/media`, { method: "POST", body: fd });
  const payload = (v: boolean) => JSON.stringify({ messaging_product: "whatsapp", to: waId, type: "audio", audio: v ? { id: up.id, voice: true } : { id: up.id } });
  let d;
  try { d = await graph(`${await phoneId()}/messages`, { method: "POST", body: payload(mime === "audio/ogg") }); }
  catch { d = await graph(`${await phoneId()}/messages`, { method: "POST", body: payload(false) }); }
  await logOut(waId, sender, "audio", text, d?.messages?.[0]?.id, up.id);
}

// imagem ou vídeo por link público (https); a legenda vai junto (máx. 1024 caracteres na Cloud API)
async function sendMedia(waId: string, tipo: "image" | "video", link: string, legenda: string, sender: "ia" | "humano" | "sistema") {
  if (!/^https:\/\//.test(link)) throw new Error("link da mídia precisa ser https");
  const media: Record<string, string> = { link };
  if (legenda) media.caption = corta(legenda, 1024);
  const d = await graph(`${await phoneId()}/messages`, {
    method: "POST",
    body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to: waId, type: tipo, [tipo]: media }),
  });
  await logOut(waId, sender, tipo, legenda, d?.messages?.[0]?.id, undefined, { midia_url: link });
}

async function logOut(waId: string, sender: string, type: string, body: string, wamid?: string, mediaId?: string, meta?: Record<string, unknown>) {
  await db.from("wa_messages").insert({ wa_id: waId, direction: "out", sender, type, body, wamid: wamid ?? null, media_id: mediaId ?? null, status: "sent", meta: meta ?? null });
  await db.from("wa_contacts").update({ last_outbound_at: new Date().toISOString() }).eq("wa_id", waId);
}

async function downloadMedia(mediaId: string) {
  const meta = await graph(mediaId);
  const r = await fetch(meta.url, { headers: { Authorization: `Bearer ${env("WA_TOKEN")}` } });
  if (!r.ok) throw new Error("download " + r.status);
  return { bytes: new Uint8Array(await r.arrayBuffer()), mime: meta.mime_type as string };
}

// ───────────────────────── voz (ElevenLabs) ─────────────────────────
async function transcribe(mediaId: string) {
  const { bytes, mime } = await downloadMedia(mediaId);
  const fd = new FormData();
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "por");
  fd.append("file", new Blob([bytes], { type: mime }), "audio.ogg");
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": env("ELEVENLABS_API_KEY") }, body: fd });
  if (!r.ok) throw new Error("stt " + r.status + " " + (await r.text()));
  return (await r.json()).text as string;
}

async function tts(text: string, voice: any) {
  const call = (fmt: string) => fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.voice_id}?output_format=${fmt}`, {
    method: "POST",
    headers: { "xi-api-key": env("ELEVENLABS_API_KEY"), "content-type": "application/json" },
    body: JSON.stringify({ text, model_id: voice.model || "eleven_multilingual_v2", voice_settings: voice.settings ?? { stability: 0.45, similarity_boost: 0.8, style: 0.3 } }),
  });
  let r = await call("opus_48000_64");
  if (r.ok) return { bytes: new Uint8Array(await r.arrayBuffer()), mime: "audio/ogg" };
  r = await call("mp3_44100_128");
  if (!r.ok) throw new Error("tts " + r.status + " " + (await r.text()));
  return { bytes: new Uint8Array(await r.arrayBuffer()), mime: "audio/mpeg" };
}

// ───────────────────────── API da inbox ─────────────────────────
async function admin(req: Request, url: URL, path: string) {
  const ak = await chave("admin_key", "N3W_ADMIN_KEY");
  if (!ak || req.headers.get("x-n3w-key") !== ak) return json({ erro: "não autorizado" }, 401);
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  try {
    if (path === "/status") {
      const keys = ["WA_TOKEN", "WA_APP_SECRET", "ANTHROPIC_API_KEY", "ELEVENLABS_API_KEY"];
      const { data: cfg } = await db.from("wa_config").select("ai_enabled,model,persona,voice").eq("id", "default").single();
      return json({ segredos: Object.fromEntries(keys.map((k) => [k, !!env(k)])), phone_number_id: await phoneId(), aprovador_definido: !!(await aprovador()), config: cfg });
    }
    if (path === "/conversas") {
      const { data } = await db.from("wa_contacts").select("*").order("last_inbound_at", { ascending: false, nullsFirst: false }).limit(200);
      return json(data);
    }
    if (path === "/mensagens") {
      const { data } = await db.from("wa_messages").select("*").eq("wa_id", url.searchParams.get("wa_id") ?? "").order("id").limit(500);
      return json(data);
    }
    if (path === "/enviar") { // humano assume a conversa
      // {wa_id, texto?, audio?, imagem?: url, video?: url, legenda?, peca?, projeto?, copy?, manter_ia?}
      const link = body.imagem || body.video;
      if (link) {
        const legenda = body.legenda ?? (body.peca ? legendaPeca(String(body.peca), String(body.projeto ?? ""), String(body.copy ?? body.texto ?? "")) : String(body.texto ?? ""));
        await sendMedia(body.wa_id, body.video ? "video" : "image", String(link), legenda, "humano");
      } else if (body.audio) await sendVoice(body.wa_id, body.texto, (await db.from("wa_config").select("voice").eq("id", "default").single()).data?.voice, "humano");
      else await sendText(body.wa_id, body.texto, "humano");
      if (!body.manter_ia) await db.from("wa_contacts").update({ ai_paused: true }).eq("wa_id", body.wa_id);
      return json({ ok: true });
    }
    if (path === "/aprovacao") { // {peca, projeto, copy, midia_url, midia_tipo: "imagem"|"video", evento_id?, forcar_template?}
      return json({ ok: true, ...(await enviarParaAprovacao(body)) });
    }
    if (path === "/aprovacoes") { // GET ?pendentes=1 → respostas ainda não gravadas no painel
      let q = db.from("wa_aprovacoes").select("*").order("id", { ascending: false }).limit(200);
      if (url.searchParams.get("pendentes")) q = q.in("status", ["aprovado", "refazer"]).is("sincronizado_em", null);
      const { data } = await q;
      return json(data);
    }
    if (path === "/aprovacoes/sincronizado") { // {ids: [..]} depois de gravar no painel
      const ids = (body.ids ?? []).map(Number).filter(Boolean);
      if (ids.length) await db.from("wa_aprovacoes").update({ sincronizado_em: new Date().toISOString() }).in("id", ids);
      return json({ ok: true, ids });
    }
    if (path === "/ia") { // pausar/retomar IA de um contato ou geral
      if (body.wa_id) await db.from("wa_contacts").update({ ai_paused: !!body.pausar, needs_human: body.pausar ? undefined : false }).eq("wa_id", body.wa_id);
      else await db.from("wa_config").update({ ai_enabled: !body.pausar, updated_at: new Date().toISOString() }).eq("id", "default");
      return json({ ok: true });
    }
    if (path === "/config") {
      const { data: cur } = await db.from("wa_config").select("*").eq("id", "default").single();
      const upd: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (body.persona) upd.persona = { ...cur.persona, ...body.persona };
      if (body.voice) upd.voice = { ...cur.voice, ...body.voice };
      if (typeof body.ai_enabled === "boolean") upd.ai_enabled = body.ai_enabled;
      if (body.model) upd.model = body.model;
      if (body.phone_number_id) { upd.chaves = { ...cur.chaves, phone_number_id: String(body.phone_number_id) }; _k = null; }
      await db.from("wa_config").update(upd).eq("id", "default");
      return json({ ok: true });
    }
    if (path === "/simular") { // testa o cérebro sem WhatsApp: {conversa: "CLIENTE: oi\nVOCÊ: ...\nCLIENTE: ..."}
      const { data: cfg } = await db.from("wa_config").select("*").eq("id", "default").single();
      const reply = await think({ ...cfg, ...(body.config ?? {}) }, body.contato ?? { name: "Teste" }, "simulacao", body.conversa ?? "CLIENTE: oi");
      return json(reply);
    }
    if (path === "/voz-teste") { // gera um áudio de teste e devolve em base64
      const { data: cfg } = await db.from("wa_config").select("voice").eq("id", "default").single();
      const { bytes, mime } = await tts(body.texto ?? "Oi! Tudo bem? Aqui é da equipe, posso te ajudar?", { ...cfg?.voice, ...(body.voice ?? {}) });
      let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
      return json({ mime, base64: btoa(bin) });
    }
    return json({ erro: "rota desconhecida" }, 404);
  } catch (e) {
    return json({ erro: String(e) }, 500);
  }
}
