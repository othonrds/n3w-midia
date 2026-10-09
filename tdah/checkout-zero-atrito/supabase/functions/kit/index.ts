// KIT ADHD — checkout sem atrito (Supabase Edge Function "kit", projeto reflex).
// POST /kit/stripe   webhook da Stripe (assinatura validada com STRIPE_WEBHOOK_SECRET)
//   checkout.session.completed / async_payment_succeeded (paid) -> grava compra aprovada + e-mail com o link do kit
//   charge.refunded / charge.dispute.created                    -> marca revogada
// GET  /kit/check?session_id=cs_...  -> { paid } (a página do kit pode confirmar a compra)
//
// Secrets (Supabase > Edge Functions > Secrets), nunca no código:
//   STRIPE_WEBHOOK_SECRET  whsec_...  (obrigatório)
//   STRIPE_SECRET_KEY      sk_live_... (opcional: só para /check)
//   RESEND_API_KEY         re_...      (opcional: e-mail de entrega; sem ele a entrega é pelo redirecionamento do Payment Link)
//   KIT_FROM_EMAIL         ex.: "ADHD Focus Kit <kit@xyzgames.app>"
// Igual à Hotmart hoje: a entrega é o link da área do kit (KIT_URL). Sem fila, sem conta de usuário.
import { createClient } from "jsr:@supabase/supabase-js@2";

const KIT_URL = "https://adhd.xyzgames.app/kit-5345843cc6/";
const TOLERANCE_S = 300;
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
const enc = new TextEncoder();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "https://adhd.xyzgames.app" },
  });

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// Stripe-Signature: t=<unix>,v1=<hex hmac_sha256(secret, `${t}.${payload}`)>[,v1=...]
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

async function sendKitEmail(to: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to) return "skipped";
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: Deno.env.get("KIT_FROM_EMAIL") || "ADHD Focus Kit <kit@xyzgames.app>",
      to: [to],
      subject: "Your ADHD Focus Kit is ready",
      html: `<p>Thanks for your purchase!</p><p><a href="${KIT_URL}?src=email">Open your Focus Kit</a> (workbook, brain games and focus tracks).</p><p>Bookmark this link. Questions or refund (15 days): just reply to this e-mail.</p>`,
    }),
  });
  return r.ok ? "sent" : `error ${r.status}`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^.*\/kit/, "") || "/";

  if (path === "/stripe" && req.method === "POST") {
    const payload = await req.text();
    const ok = await verifyStripe(payload, req.headers.get("stripe-signature"), Deno.env.get("STRIPE_WEBHOOK_SECRET") || "");
    if (!ok) return new Response("bad signature", { status: 400 });
    const ev = JSON.parse(payload);
    const o = ev.data?.object || {};
    const now = new Date().toISOString();

    if (ev.type === "checkout.session.completed" || ev.type === "checkout.session.async_payment_succeeded") {
      if (o.payment_status !== "paid") return json({ ok: true, ignored: "not paid yet" });
      const email = (o.customer_details?.email || o.customer_email || "").toLowerCase() || null;
      const ref = String(o.client_reference_id || ""); // "chk_stripe__<visitante>"
      const row = {
        transaction: o.id, provider: "stripe", status: "approved", email,
        amount: o.amount_total != null ? o.amount_total / 100 : null, currency: o.currency || null,
        payment_intent: o.payment_intent || null, country: o.customer_details?.address?.country || null,
        arm: ref.split("__")[0] || "chk_stripe", visitor: ref.split("__")[1] || null,
        livemode: !!ev.livemode, raw: ev, updated_at: now,
      };
      const { data: prev } = await db.from("kit_purchases").select("emailed").eq("transaction", o.id).limit(1);
      const { error } = await db.from("kit_purchases").upsert(row, { onConflict: "transaction" });
      if (error) return new Response("db error", { status: 500 }); // Stripe tenta de novo
      let mail = "already";
      if (!prev?.[0]?.emailed && email) {
        mail = await sendKitEmail(email);
        if (mail === "sent") await db.from("kit_purchases").update({ emailed: true }).eq("transaction", o.id);
      }
      return json({ ok: true, status: "approved", mail });
    }

    if (ev.type === "charge.refunded" || ev.type === "charge.dispute.created") {
      const pi = o.payment_intent || o.charge?.payment_intent;
      if (pi) await db.from("kit_purchases").update({ status: "revoked", updated_at: now }).eq("payment_intent", pi);
      return json({ ok: true, status: "revoked" });
    }
    return json({ ok: true, ignored: ev.type });
  }

  if (path === "/check" && req.method === "GET") {
    const sid = url.searchParams.get("session_id") || "";
    if (!/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(sid)) return json({ paid: false });
    const { data } = await db.from("kit_purchases").select("status").eq("transaction", sid).limit(1);
    if (data?.[0]) return json({ paid: data[0].status === "approved" });
    const sk = Deno.env.get("STRIPE_SECRET_KEY"); // webhook ainda não chegou: pergunta direto à Stripe
    if (!sk) return json({ paid: false, pending: true });
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sid}`, { headers: { authorization: `Bearer ${sk}` } });
    const s = r.ok ? await r.json() : {};
    return json({ paid: s.payment_status === "paid" });
  }

  return json({ ok: true, service: "kit" });
});
