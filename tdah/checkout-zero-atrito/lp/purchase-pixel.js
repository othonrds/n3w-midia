/* KIT ADHD — Purchase do pixel na página do kit quando a compra veio da Stripe.
 * Uso: <script src="/purchase-pixel.js" defer></script> no fim de kit-5345843cc6/index.html,
 *      DEPOIS do código base do pixel 1585625179768343 (fbq init).
 * Só dispara com ?src=stripe&session_id=cs_... (redirecionamento do Payment Link) e uma vez por sessão de checkout.
 * eventID = session_id: o mesmo id vai no Purchase da Conversions API (edge function kit) -> o Meta deduplica.
 * Valor fixo do Payment Link: 9.90 USD. Se o preço mudar, mude aqui e no Payment Link juntos.
 */
(function () {
  var VALUE = 9.9, CURRENCY = "USD";
  var qs = new URLSearchParams(location.search);
  var sid = qs.get("session_id") || "";
  if (qs.get("src") !== "stripe" || !/^cs_(test|live)_[A-Za-z0-9]{10,}$/.test(sid)) return;
  var key = "kit_purchase_" + sid;
  try { if (localStorage.getItem(key)) return; } catch (e) {}
  var tries = 0;
  (function fire() {
    if (typeof window.fbq !== "function") { if (++tries < 20) setTimeout(fire, 250); return; }
    try {
      window.fbq("track", "Purchase", { value: VALUE, currency: CURRENCY, content_name: "The ADHD Focus Kit", content_type: "product" }, { eventID: sid });
      try { localStorage.setItem(key, "1"); } catch (e) {}
    } catch (e) {}
  })();
})();
