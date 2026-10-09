/* KIT ADHD — sorteio 50/50 de checkout (Hotmart × Stripe) na LP /focus-kit/.
 * Uso: <script src="/checkout-split.js" defer></script> antes de </body>. Não precisa mudar os botões:
 * todo link para pay.hotmart.com vira um botão sorteado.
 * - Braço novo DESLIGADO enquanto /api/checkout-config não devolver url (variável CHK_NEW_URL na Vercel).
 *   Desligado = 100% Hotmart, sem cookie gravado (o sorteio começa limpo quando ligar).
 * - Cookie chk_arm (180 dias) mantém a pessoa no mesmo braço; chk_vid identifica o visitante.
 * - UTM: utm_content=chk_hotmart | chk_stripe (Hotmart também recebe sck=chk_hotmart).
 * - Forçar para teste: ?x_chk=stripe ou ?x_chk=hotmart.
 * - Expõe window.__chk = {arm, vid} e dispara fbq trackCustom "CheckoutArm" + evento "chk_click" no clique.
 */
(function () {
  var COOKIE_DAYS = 180, CFG_URL = "/api/checkout-config", TIMEOUT_MS = 1500;
  function getC(n) { var m = document.cookie.match("(?:^|; )" + n + "=([^;]*)"); return m ? decodeURIComponent(m[1]) : ""; }
  function setC(n, v) { document.cookie = n + "=" + encodeURIComponent(v) + "; Max-Age=" + COOKIE_DAYS * 864e2 + "; Path=/; SameSite=Lax; Secure"; }
  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }
  var qs = new URLSearchParams(location.search);
  var vid = getC("chk_vid"); if (!/^[a-z0-9]{8,30}$/.test(vid)) { vid = rid(); setC("chk_vid", vid); }

  function isHotmart(a) { return /(^|\.)pay\.hotmart\.com$/i.test(a.hostname || ""); }
  function links() { return [].slice.call(document.querySelectorAll("a[href]")).filter(isHotmart); }
  function passUtms(u) {
    ["utm_source", "utm_medium", "utm_campaign", "utm_term"].forEach(function (k) {
      var v = qs.get(k); if (v && !u.searchParams.has(k)) u.searchParams.set(k, v);
    });
  }
  function tag(arm) {
    window.__chk = { arm: arm, vid: vid };
    document.documentElement.setAttribute("data-chk", arm);
  }
  function apply(cfg) {
    var forced = qs.get("x_chk");
    var on = !!(cfg && cfg.url && cfg.share > 0);
    var arm;
    if (forced === "stripe" && cfg && cfg.url) arm = "chk_stripe";
    else if (forced === "hotmart") arm = "chk_hotmart";
    else if (!on) arm = "chk_hotmart";              // desligado: não grava cookie
    else {
      arm = getC("chk_arm");
      if (arm !== "chk_hotmart" && arm !== "chk_stripe") { arm = Math.random() < cfg.share ? "chk_stripe" : "chk_hotmart"; setC("chk_arm", arm); }
      if (arm === "chk_stripe" && !cfg.url) arm = "chk_hotmart";
    }
    tag(arm);
    links().forEach(function (a) {
      var u;
      if (arm === "chk_stripe") {
        u = new URL(cfg.url);
        u.searchParams.set("client_reference_id", "chk_stripe__" + vid); // volta no webhook
        u.searchParams.set("utm_content", "chk_stripe");
        u.searchParams.set("utm_source", qs.get("utm_source") || "lp_focus_kit");
      } else {
        u = new URL(a.href);
        u.searchParams.set("utm_content", "chk_hotmart");
        if (!u.searchParams.has("sck")) u.searchParams.set("sck", "chk_hotmart");
      }
      passUtms(u);
      a.href = u.toString();
      a.setAttribute("data-chk", arm);
      a.addEventListener("click", function () {
        try { window.fbq && window.fbq("trackCustom", "CheckoutArm", { arm: arm }); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent("chk_click", { detail: { arm: arm, vid: vid } })); } catch (e) {}
      });
    });
  }
  function load() {
    var done = false, fin = function (c) { if (!done) { done = true; apply(c); } };
    setTimeout(function () { fin(null); }, TIMEOUT_MS);   // config lenta/falhou -> Hotmart
    try {
      fetch(CFG_URL, { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : null; }).then(fin, function () { fin(null); });
    } catch (e) { fin(null); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
})();
