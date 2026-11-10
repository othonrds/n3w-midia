// match-envio — recebe o material dos compradores das ofertas de teste (01/11/2026):
// prints do perfil (Análise do perfil) ou selfie (Glow Up). Guarda no bucket privado match-envios
// e registra em match_envios (status "recebido") para a entrega em até 24h.
// POST {tipo:"prints"|"glowup", email, nome?, obs?, imagens:[dataURL]}
const SB = Deno.env.get("SUPABASE_URL")!, SK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const out = (c: number, o: unknown) => new Response(JSON.stringify(o), { status: c, headers: { ...cors, "Content-Type": "application/json" } });
const MAX: Record<string, number> = { prints: 9, glowup: 3 };
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  let b: any = {}; try { b = JSON.parse(await req.text()); } catch { return out(400, { erro: "json" }); }
  const tipo = String(b.tipo || ""); if (!MAX[tipo]) return out(400, { erro: "tipo" });
  const email = String(b.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return out(400, { erro: "Digite o e-mail usado na compra." });
  const imgs: string[] = (Array.isArray(b.imagens) ? b.imagens : []).filter((s: unknown) => typeof s === "string" && /^data:image\/(jpeg|png|webp);base64,/.test(s as string) && (s as string).length < 4_000_000).slice(0, MAX[tipo]);
  if (!imgs.length) return out(400, { erro: "Envie pelo menos 1 imagem." });
  const pasta = `${tipo}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}`;
  const paths: string[] = [];
  for (let i = 0; i < imgs.length; i++) {
    const [meta, data] = imgs[i].split(","); const mime = meta.slice(5, meta.indexOf(";"));
    const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const p = `${pasta}/${i + 1}.${mime.split("/")[1]}`;
    const r = await fetch(`${SB}/storage/v1/object/match-envios/${p}`, { method: "POST", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": mime }, body: bytes });
    if (!r.ok) { console.error("upload", r.status, await r.text()); return out(500, { erro: "Falha ao enviar. Tente de novo." }); }
    paths.push(p);
  }
  const r = await fetch(`${SB}/rest/v1/match_envios`, { method: "POST", headers: { apikey: SK, Authorization: "Bearer " + SK, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify({ tipo, email, nome: String(b.nome || "").slice(0, 80) || null, obs: String(b.obs || "").slice(0, 600) || null, arquivos: paths }) });
  if (!r.ok) { console.error("db", r.status, await r.text()); return out(500, { erro: "Falha ao registrar. Tente de novo." }); }
  return out(200, { ok: true });
});
