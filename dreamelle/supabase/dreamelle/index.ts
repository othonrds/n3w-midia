// Dreamelle backend (Supabase Edge Function "dreamelle").
// POST /dreamelle/hotmart?k=<key in table dreamelle_config>  Hotmart webhook v2 -> store purchase
// GET  /dreamelle/unlock?device=<id>      -> { founder }
// POST /dreamelle/restore {email, transaction, device} -> { founder }
// POST /dreamelle/stripe                   Stripe webhook (assinatura com o secret STRIPE_WEBHOOK_SECRET_DREAMELLE)
//   checkout.session.completed / async_payment_succeeded (paid) -> compra aprovada; aparelho = client_reference_id "dg<id>"
//   charge.refunded / charge.dispute.created                    -> revogada
import { createClient } from "jsr:@supabase/supabase-js@2";

const PRODUCT_ID = "8686995";
const STRIPE_PRODUCT_ID = "stripe:dreamelle-founder"; // product_id gravado nas compras Stripe
const FOUNDER_PRODUCTS = [PRODUCT_ID, STRIPE_PRODUCT_ID];
const STRIPE_LINKS = new Set(["plink_1UOu0PLF1DEi8ag88g0JPvK5"]); // Payment Link do Founder's Pass (US$ 4,99)
const TOLERANCE_S = 300;
const enc = new TextEncoder();
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

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Stripe-Signature: t=<unix>,v1=<hex hmac_sha256(secret, `${t}.${payload}`)> (igual à função kit)
export async function verifyStripe(payload: string, header: string | null, secret: string, now = Date.now()) {
  if (!header || !secret) return false;
  const parts = header.split(",").map((p) => p.trim().split("="));
  const t = parts.find(([k]) => k === "t")?.[1];
  const sigs = parts.filter(([k]) => k === "v1").map(([, v]) => v);
  if (!t || !sigs.length) return false;
  if (Math.abs(now / 1000 - Number(t)) > TOLERANCE_S) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(`${t}.${payload}`)));
  const hex = [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
  return sigs.some((s) => timingSafeEqual(s, hex));
}

async function isFounder(filter: { device?: string; email?: string; transaction?: string }) {
  let q = db.from("dreamelle_purchases").select("transaction,status,device").eq("status", "approved").in("product_id", FOUNDER_PRODUCTS).limit(1);
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

  if (path === "/stripe" && req.method === "POST") {
    const payload = await req.text();
    const ok = await verifyStripe(payload, req.headers.get("stripe-signature"), Deno.env.get("STRIPE_WEBHOOK_SECRET_DREAMELLE") || "");
    if (!ok) return new Response("bad signature", { status: 400 });
    const ev = JSON.parse(payload);
    const o = ev.data?.object || {};
    const now = new Date().toISOString();
    if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
      if (!STRIPE_LINKS.has(String(o.payment_link || "")) && o.metadata?.oferta !== "dreamelle-founder") return json(req, { ok: true, ignored: "not dreamelle" });
      if (o.payment_status !== "paid") return json(req, { ok: true, ignored: "not paid yet" });
      const ref = String(o.client_reference_id || "");
      const device = cleanDevice(ref.startsWith("dg") ? ref.slice(2) : "");
      const row: Record<string, unknown> = {
        transaction: String(o.id), email: (o.customer_details?.email || o.customer_email || "").toLowerCase() || null,
        status: "approved", product_id: STRIPE_PRODUCT_ID,
        price: o.amount_total != null ? o.amount_total / 100 : null, currency: o.currency ? String(o.currency).toUpperCase() : null,
        raw: ev, updated_at: now,
      };
      if (device) row.device = device;
      const { error } = await db.from("dreamelle_purchases").upsert(row, { onConflict: "transaction" });
      if (error) return new Response("db error", { status: 500 }); // a Stripe tenta de novo
      return json(req, { ok: true, status: "approved", device: !!device });
    }
    if (ev.type === "charge.refunded" || ev.type === "charge.dispute.created") {
      const pi = o.payment_intent || o.charge?.payment_intent;
      if (pi) {
        await db.from("dreamelle_purchases").update({ status: "revoked", updated_at: now })
          .eq("product_id", STRIPE_PRODUCT_ID).eq("raw->data->object->>payment_intent", String(pi));
      }
      return json(req, { ok: true, status: "revoked" });
    }
    return json(req, { ok: true, ignored: ev.type });
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
    const rawTx = String(b.transaction || "").trim();
    // Hotmart: HP...; Stripe: id da sessão (cs_live_...), que volta no link de retorno do checkout
    const transaction = /^cs_(live|test)_[A-Za-z0-9]{10,}$/.test(rawTx) ? rawTx : rawTx.toUpperCase();
    const device = cleanDevice(b.device);
    if (!email || !/^(HP\w{6,}|cs_(live|test)_[A-Za-z0-9]{10,})$/.test(transaction)) return json(req, { founder: false, error: "missing" });
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
