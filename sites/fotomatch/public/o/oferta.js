// Páginas de teste de oferta do FotoMatch (01/11): registra telas e manda ao checkout com UTMs.
(function () {
  const B = document.body, PAGINA = B.dataset.pagina, CK = B.dataset.checkout || "", PRECO = Number(B.dataset.preco || 0), NOME = B.dataset.produto || PAGINA;
  const EV = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-evento";
  const q = new URLSearchParams(location.search), utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach((k) => q.get(k) && (utm[k] = q.get(k)));
  const DEMO = q.has("demo");
  const sess = (() => { const n = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, "0")).join("");
    try { let v = sessionStorage.getItem("fo_s"); if (!v) { v = n(); sessionStorage.setItem("fo_s", v); } return v; } catch { return n(); } })();
  const marca = (tela, ordem) => { if (DEMO) return; try { fetch(EV, { method: "POST", headers: { "Content-Type": "text/plain" }, keepalive: true,
    body: JSON.stringify({ sessao: sess, pagina: PAGINA, tela, ordem, anuncio: utm.utm_content || null }) }).catch(() => {}); } catch { /* */ } };
  marca("inicio", 0);
  let rolou = false; addEventListener("scroll", () => { if (!rolou && scrollY > 400) { rolou = true; marca("rolou", 1); } }, { passive: true });
  const link = () => { const u = new URL(CK); Object.entries(utm).forEach(([k, v]) => u.searchParams.set(k, v)); return u.toString(); };
  document.querySelectorAll("[data-cta]").forEach((a) => {
    if (!CK) { a.setAttribute("aria-disabled", "true"); a.href = "#"; return; }
    a.href = link();
    a.addEventListener("click", () => { marca("checkout", 9); try { if (window.fbq) fbq("track", "InitiateCheckout", { content_name: NOME, currency: "BRL", value: PRECO }); } catch { /* */ } });
  });
})();
