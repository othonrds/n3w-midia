// FotoMatch — match-evento: registra que uma sessão chegou numa tela das páginas de teste de oferta (sem dado pessoal).
// POST {sessao, pagina, tela, ordem?, anuncio?}. Páginas: A, B, CURTO, PRINTS, CONVERSA, RESPONDE, COPILOTO, GLOWUP.
const SB = Deno.env.get("SUPABASE_URL")!, SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const PAGINAS = ["A", "B", "CURTO", "PRINTS", "CONVERSA", "RESPONDE", "COPILOTO", "GLOWUP"];
const txt = (s: unknown, n: number) => String(s ?? "").replace(/[<>]/g, "").trim().slice(0, n);
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {}; try { b = JSON.parse(await req.text()); } catch { return new Response("{}", { status: 400, headers: cors }); }
  const sessao = txt(b.sessao, 40), pagina = String(b.pagina || "").toUpperCase(), tela = txt(b.tela, 30);
  if (!/^[a-z0-9]{8,40}$/.test(sessao) || !PAGINAS.includes(pagina) || !/^[a-z0-9_-]{2,30}$/.test(tela)) return new Response('{"erro":"evento inválido"}', { status: 400, headers: cors });
  await fetch(`${SB}/rest/v1/match_eventos?on_conflict=sessao,pagina,tela`, { method: "POST",
    headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ sessao, pagina, tela, ordem: Number.isInteger(b.ordem) ? Math.max(0, Math.min(50, b.ordem)) : null, anuncio: txt(b.anuncio, 80) || null }) });
  return new Response('{"ok":true}', { headers: { ...cors, "Content-Type": "application/json" } });
});
