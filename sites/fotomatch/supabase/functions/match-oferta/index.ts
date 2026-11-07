// match-oferta — ofertas de teste do FotoMatch no modelo que vendeu (01/11/2026):
// análise GRÁTIS na hora → mostra uma parte → R$ 9,90 libera o resto, sem esperar.
// Tipos: "perfil" (prints do perfil do app) e "glowup" (selfie → estilo para o formato do rosto).
// As imagens NÃO são guardadas: vão direto para a OpenAI. Fica só o resultado em match_oferta_res.
// Ações:
//   analisar {tipo, sessao, imagens[dataURL], anuncio?} → {rid, previa}
//   liberar  {rid}  → {pago, completo?}  pago = venda Payt aprovada com sources.src = rid (ou liberado manual)
const SB = Deno.env.get("SUPABASE_URL")!, SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI = Deno.env.get("OPENAI_API_KEY") || "";
const MODELO = Deno.env.get("MATCH_OFERTA_MODELO") || "gpt-4.1";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (c: number, o: unknown) => new Response(JSON.stringify(o), { status: c, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
async function db(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}) {
  const r = await fetch(SB + "/rest/v1/" + path, { method: init.method || "GET", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", ...(init.prefer ? { Prefer: init.prefer } : {}) }, body: init.body ? JSON.stringify(init.body) : undefined });
  const t = await r.text(); let data: any = null; try { data = t ? JSON.parse(t) : null; } catch { data = t; }
  if (!r.ok) console.error("db", path.split("?")[0], r.status, t.slice(0, 200));
  return { ok: r.ok, data };
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const REGRAS = `Regras gerais:
- Português do Brasil, direto, como um amigo que entende do assunto. Frases curtas. Fale com ele em segunda pessoa ("você").
- Nunca dê nota de beleza nem faça julgamento negativo da aparência física da pessoa. Avalie o que dá para mudar: luz, enquadramento, expressão, contexto, variedade, texto, estilo.
- Nada de afirmar etnia, religião, saúde ou orientação. Não identifique a pessoa.
- Se houver qualquer sinal de menor de idade, ou se as imagens não forem o que foi pedido, devolva {"fora_do_escopo": true}.
- Seja específico com o que aparece nas imagens. Nada genérico.`;
const PROMPT: Record<string, string> = {
  perfil: `Você analisa perfis de apps de relacionamento de homens adultos a partir de prints do próprio perfil (fotos e bio).
${REGRAS}
Devolva SOMENTE JSON:
{"fora_do_escopo": false,
 "forca": 0-100 (quanto o perfil, como está, chama atenção e dá assunto — baseado em luz, rosto visível, variedade, ordem e bio; não em beleza),
 "resumo": "1-2 frases sobre a primeira impressão que o perfil passa",
 "erro_principal": {"titulo": "o erro que mais derruba o perfil (curto)", "por_que": "1-2 frases", "como_corrigir": "1-2 frases práticas"},
 "fotos": [{"n": 1, "veredito": "manter|trocar|mover", "motivo": "1 frase"}],
 "ordem_ideal": "qual foto vai em 1º, 2º... e por quê (1-2 frases)",
 "fotos_que_faltam": ["tipo de foto que falta", "..."],
 "bios": ["bio nova opção 1 (curta, com gancho para puxar assunto)", "opção 2", "opção 3"],
 "outros_erros": ["erro 2 curto", "erro 3 curto"]}`,
  glowup: `Você é consultor de estilo masculino. A partir de selfies de um homem adulto, indique o que valoriza o formato do rosto dele.
${REGRAS}
- Nada de procedimentos estéticos, remédios ou cirurgia. Só corte, barba, sobrancelha (só limpeza/alinhamento), óculos e cuidados simples.
Devolva SOMENTE JSON:
{"fora_do_escopo": false,
 "formato": "oval|redondo|quadrado|retangular|triangular|coração|diamante",
 "formato_porque": "1 frase sobre o que nas proporções indica isso",
 "ponto_forte": "o traço que mais vale destacar (positivo)",
 "corte": {"nome": "nome do corte para pedir ao barbeiro", "como_pedir": "1-2 frases com medidas/máquina", "evitar": "1 frase"},
 "barba": {"recomendacao": "deixar, aparar ou tirar e qual desenho", "como_fazer": "1-2 frases", "evitar": "1 frase"},
 "sobrancelha": "1 frase (só limpeza/alinhamento)",
 "oculos": "formato de armação que combina, 1 frase",
 "cuidados": ["cuidado simples 1", "2", "3"],
 "foto_perfil": "como levar isso para as fotos do app (ângulo, luz), 1-2 frases"}`,
};
const LIVRE: Record<string, string[]> = { perfil: ["forca", "resumo", "erro_principal"], glowup: ["formato", "formato_porque", "ponto_forte", "corte"] };
const MAXI: Record<string, number> = { perfil: 6, glowup: 3 };

async function pago(rid: string, row: any) {
  if (row?.liberado) return true;
  const v = (await db(`vendas?raw->link->sources->>src=eq.${rid}&select=status&limit=5`)).data || [];
  const ok = v.some((x: any) => /aprovad|paid|approved|pago/i.test(String(x.status)));
  if (ok) await db(`match_oferta_res?id=eq.${rid}`, { method: "PATCH", prefer: "return=minimal", body: { liberado: true } });
  return ok;
}

async function analisar(b: any) {
  const tipo = String(b.tipo || ""); if (!PROMPT[tipo]) return out(400, { erro: "tipo" });
  const sessao = String(b.sessao || "").slice(0, 64); if (!sessao) return out(400, { erro: "sessao" });
  const imgs: string[] = (Array.isArray(b.imagens) ? b.imagens : []).filter((s: unknown) => typeof s === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(s as string) && (s as string).length < 3_500_000).slice(0, MAXI[tipo]);
  if (!imgs.length) return out(400, { erro: "Envie pelo menos 1 imagem." });
  if (!OPENAI) return out(503, { erro: "Análise indisponível agora. Tente em alguns minutos." });
  const ja = (await db(`match_oferta_res?sessao=eq.${encodeURIComponent(sessao)}&tipo=eq.${tipo}&erro=is.null&select=id&limit=5`)).data;
  if ((ja?.length || 0) >= 3) return out(429, { erro: "Você já fez 3 análises grátis. Libere a sua análise completa para continuar." });
  const content: any[] = [{ type: "text", text: tipo === "perfil" ? "Prints do meu perfil, em ordem:" : "Minhas selfies:" }];
  imgs.forEach((u) => content.push({ type: "image_url", image_url: { url: u, detail: "high" } }));
  const t0 = Date.now();
  const r = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { Authorization: "Bearer " + OPENAI, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODELO, temperature: 0.4, response_format: { type: "json_object" }, max_tokens: 1400, messages: [{ role: "system", content: PROMPT[tipo] }, { role: "user", content }] }) });
  const j = await r.json().catch(() => ({}));
  const base = { tipo, sessao, anuncio: b.anuncio ? String(b.anuncio).slice(0, 200) : null, ms: Date.now() - t0, tokens: j?.usage?.total_tokens || null };
  if (!r.ok) { await db("match_oferta_res", { method: "POST", prefer: "return=minimal", body: { ...base, erro: "openai " + r.status } }); return out(502, { erro: "Não consegui analisar agora. Tente de novo." }); }
  let res: any = {}; try { res = JSON.parse(j.choices[0].message.content); } catch { /* */ }
  if (res.fora_do_escopo || !res[LIVRE[tipo][0]]) {
    await db("match_oferta_res", { method: "POST", prefer: "return=minimal", body: { ...base, erro: "fora_do_escopo" } });
    return out(200, { fora_do_escopo: true });
  }
  const ins = await db("match_oferta_res", { method: "POST", prefer: "return=representation", body: { ...base, completo: res } });
  const rid = ins.data?.[0]?.id;
  const previa: Record<string, unknown> = {};
  for (const k of LIVRE[tipo]) previa[k] = res[k];
  const trancado: Record<string, number> = {};
  for (const k of Object.keys(res)) if (!LIVRE[tipo].includes(k) && k !== "fora_do_escopo") trancado[k] = Array.isArray(res[k]) ? res[k].length : 1;
  return out(200, { rid, previa, trancado });
}

async function liberar(b: any) {
  const rid = String(b.rid || ""); if (!UUID.test(rid)) return out(400, { erro: "rid" });
  const row = (await db(`match_oferta_res?id=eq.${rid}&select=id,tipo,completo,liberado`)).data?.[0];
  if (!row) return out(404, { erro: "Análise não encontrada." });
  if (!(await pago(rid, row))) return out(200, { pago: false });
  return out(200, { pago: true, tipo: row.tipo, completo: row.completo });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return out(405, { erro: "método" });
  let b: any = {}; try { b = JSON.parse(await req.text()); } catch { return out(400, { erro: "json" }); }
  try {
    if (b.acao === "analisar") return await analisar(b);
    if (b.acao === "liberar") return await liberar(b);
    return out(400, { erro: "acao" });
  } catch (e) { console.error(e); return out(500, { erro: "Falha inesperada. Tente de novo." }); }
});
