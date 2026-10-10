// Dreamelle backend (Supabase Edge Function "dreamelle").
// POST /dreamelle/hotmart?k=<key in table dreamelle_config>  Hotmart webhook v2 -> store purchase
// GET  /dreamelle/unlock?device=<id>      -> { founder }
// POST /dreamelle/restore {email, transaction, device} -> { founder }
import { createClient } from "jsr:@supabase/supabase-js@2";

const PRODUCT_ID = "8686995";
const OK_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REVOKE_EVENTS = new Set(["PURCHASE_REFUNDED", "PURCHASE_CHARGEBACK", "PURCHASE_CANCELED", "PURCHASE_PROTEST"]);
const ORIGINS = ["https://dreamelle.vercel.app", "https://dreamelle.app", "https://www.dreamelle.app"];

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

function cors(req: Request) {
  const o = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(o) ? o : ORIGINS[0],
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Vary": "Origin",
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...cors(req) } });
const cleanDevice = (d: unknown) => (typeof d === "string" && /^[a-z0-9]{8,40}$/i.test(d) ? d.toLowerCase() : null);

async function isFounder(filter: { device?: string; email?: string; transaction?: string }) {
  let q = db.from("dreamelle_purchases").select("transaction,status,device").eq("status", "approved").eq("product_id", PRODUCT_ID).limit(1);
  if (filter.device) q = q.eq("device", filter.device);
  if (filter.transaction) q = q.eq("transaction", filter.transaction);
  const { data } = await q;
  if (!data || !data.length) return null;
  if (filter.email) {
    const { data: d2 } = await db.from("dreamelle_purchases").select("transaction").eq("transaction", data[0].transaction).ilike("email", filter.email).limit(1);
    if (!d2 || !d2.length) return null;
  }
  return data[0];
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/dreamelle/, "") || "/";
  if (req.method === "OPTIONS") return new Response(null, { headers: cors(req) });

  if (path === "/hotmart" && req.method === "POST") {
    const { data: cfg } = await db.from("dreamelle_config").select("v").eq("k", "webhook_key").limit(1);
    const key = cfg && cfg[0] ? cfg[0].v : "";
    if (!key || url.searchParams.get("k") !== key) return new Response("forbidden", { status: 403 });
    let body: any = {};
    try { body = await req.json(); } catch { return new Response("bad json", { status: 400 }); }
    const ev = String(body.event || "");
    const d = body.data || {};
    const tx = d.purchase?.transaction;
    if (!tx) return json(req, { ok: true, ignored: "no transaction" });
    const sck = String(d.purchase?.origin?.sck || "");
    const device = cleanDevice(sck.startsWith("dg") ? sck.slice(2) : "");
    const status = OK_EVENTS.has(ev) ? "approved" : REVOKE_EVENTS.has(ev) ? "revoked" : ev.toLowerCase() || "unknown";
    const row: Record<string, unknown> = {
      transaction: String(tx), email: (d.buyer?.email || "").toLowerCase() || null, status,
      product_id: String(d.product?.id ?? ""), price: d.purchase?.price?.value ?? null,
      currency: d.purchase?.price?.currency_value ?? null, raw: body, updated_at: new Date().toISOString(),
    };
    if (device) row.device = device;
    const { error } = await db.from("dreamelle_purchases").upsert(row, { onConflict: "transaction" });
    if (error) return new Response("db error", { status: 500 });
    return json(req, { ok: true, status });
  }

  if (path === "/unlock" && req.method === "GET") {
    const device = cleanDevice(url.searchParams.get("device"));
    if (!device) return json(req, { founder: false });
    return json(req, { founder: !!(await isFounder({ device })) });
  }

  if (path === "/restore" && req.method === "POST") {
    let b: any = {};
    try { b = await req.json(); } catch { /* empty */ }
    const email = String(b.email || "").trim().toLowerCase();
    const transaction = String(b.transaction || "").trim().toUpperCase();
    const device = cleanDevice(b.device);
    if (!email || !/^HP\w{6,}$/.test(transaction)) return json(req, { founder: false, error: "missing" });
    const hit = await isFounder({ email, transaction });
    if (hit && device) await db.from("dreamelle_purchases").update({ device, updated_at: new Date().toISOString() }).eq("transaction", transaction);
    return json(req, { founder: !!hit });
  }

  // Analytics: POST /e  {d:device, v:version, exp:{}, src:{}, ev:[{n,p,t}]}  (sendBeacon-friendly, text/plain ok)
  if (path === "/e" && req.method === "POST") {
    let b: any = {};
    try { b = JSON.parse(await req.text()); } catch { return new Response(null, { status: 204, headers: cors(req) }); }
    const device = cleanDevice(b.d);
    const evs = Array.isArray(b.ev) ? b.ev.slice(0, 40) : [];
    if (!device || !evs.length) return new Response(null, { status: 204, headers: cors(req) });
    const small = (o: unknown, max = 1500) => { try { const t = JSON.stringify(o ?? {}); return t.length <= max && typeof o === "object" ? o : {}; } catch { return {}; } };
    const exp = small(b.exp, 600), src = small(b.src, 800), v = String(b.v || "").slice(0, 12);
    const rows = evs.filter((e: any) => e && typeof e.n === "string" && /^[a-z0-9_]{2,40}$/.test(e.n)).map((e: any) => ({
      device, name: e.n, props: small(e.p), exp, src, v,
      created_at: typeof e.t === "number" && Math.abs(Date.now() - e.t) < 864e5 ? new Date(e.t).toISOString() : new Date().toISOString(),
    }));
    if (rows.length) await db.from("dreamelle_events").insert(rows);
    return new Response(null, { status: 204, headers: cors(req) });
  }

  return json(req, { ok: true, service: "dreamelle" });
});
