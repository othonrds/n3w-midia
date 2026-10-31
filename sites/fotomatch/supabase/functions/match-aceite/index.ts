// FotoMatch — grava só o consentimento (LGPD) de um lead antes do upload das fotos.
// Página A (isca, modelo roastdating.com): a foto vem ANTES do contato, então o aceite é gravado aqui.
// POST {id, token, consentimento:true}. verify_jwt=false; autorização pelo token do lead (igual à match-nota).
const SB = Deno.env.get("SUPABASE_URL")!;
const SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (c: number, o: unknown) => new Response(JSON.stringify(o), { status: c, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
const H = { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json" };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return out(405, { erro: "use POST" });
  let b: any = {}; try { b = await req.json(); } catch { return out(400, { erro: "JSON inválido" }); }
  if (!UUID.test(String(b.id || "")) || !/^[0-9a-f]{32}$/.test(String(b.token || ""))) return out(403, { erro: "Sem permissão" });
  if (b.consentimento !== true) return out(400, { erro: "Precisamos do seu aceite para analisar as fotos." });
  const agora = new Date().toISOString();
  const r = await fetch(`${SB}/rest/v1/match_leads?id=eq.${b.id}&token=eq.${b.token}&consentimento=is.not.true`, {
    method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify({ consentimento: true, consentimento_em: agora, atualizado_em: agora }) });
  if (!r.ok) return out(500, { erro: "Não foi possível salvar agora." });
  const c = await fetch(`${SB}/rest/v1/match_leads?id=eq.${b.id}&token=eq.${b.token}&select=consentimento`, { headers: H }).then((x) => x.json()).catch(() => []);
  return c?.[0]?.consentimento ? out(200, { ok: true }) : out(403, { erro: "Sem permissão" });
});
