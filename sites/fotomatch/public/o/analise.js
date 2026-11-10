// Análise grátis → paywall R$ 9,90 → resultado completo (prints do perfil e glow up). 01/11/2026.
(function () {
  const B = document.body, TIPO = B.dataset.tipo, MODO = B.dataset.modo || "venda", PAGINA = B.dataset.pagina, CK = B.dataset.checkout || "";
  const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-oferta";
  const EV = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-evento";
  const $ = (s) => document.querySelector(s);
  const q = new URLSearchParams(location.search), DEMO = q.get("demo"), utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach((k) => q.get(k) && (utm[k] = q.get(k)));
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } } };
  const SESSAO = ls.get("fo_s") || (() => { const v = Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, "0")).join(""); ls.set("fo_s", v); return v; })();
  const marca = (tela, ordem) => { if (DEMO) return; fetch(EV, { method: "POST", headers: { "Content-Type": "text/plain" }, keepalive: true, body: JSON.stringify({ sessao: SESSAO, pagina: PAGINA, tela, ordem, anuncio: utm.utm_content || null }) }).catch(() => {}); };
  const fb = (ev, d) => { try { if (!DEMO && window.fbq) fbq("track", ev, d); } catch { /* */ } };
  const call = (b) => fetch(FN, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(b) }).then((r) => r.json());
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const show = (id) => document.querySelectorAll("[data-tela]").forEach((s) => (s.hidden = s.dataset.tela !== id));
  const card = (h, body, extra = "") => `<div class="card" ${extra}><p class="r-h">${h}</p>${body}</div>`;
  const tranca = (h, linhas) => `<div class="card tranca"><p class="r-h">${h}</p>${Array.from({ length: linhas }, () => `<p class="tx" style="margin:4px 0">Conteúdo liberado na análise completa</p>`).join("")}</div>`;

  // ---------- render ----------
  const R = {
    perfil(d, full) {
      const f = Math.max(0, Math.min(100, Number(d.forca) || 0)), cor = f >= 70 ? "var(--ok)" : f >= 45 ? "var(--warn)" : "var(--accent)";
      let h = card("Força do seu perfil", `<div style="display:flex;align-items:baseline;gap:8px"><b style="font-size:46px;color:${cor}">${f}</b><span class="mini">/100</span></div>
        <div style="height:8px;background:var(--surface2);border-radius:9px;overflow:hidden;margin:6px 0 10px"><div style="width:${f}%;height:100%;background:${cor}"></div></div><p style="margin:0">${esc(d.resumo)}</p>`);
      const e = d.erro_principal || {};
      h += card("O erro que mais derruba seu perfil", `<p style="margin:0 0 6px;font-weight:800;font-size:18px">${esc(e.titulo)}</p><p style="margin:0 0 8px;color:var(--muted)">${esc(e.por_que)}</p><p style="margin:0"><b style="color:var(--ok)">Como corrigir:</b> ${esc(e.como_corrigir)}</p>`, 'style="border-color:var(--accent)"');
      if (!full) return h;
      h += card("Veredito de cada foto", (d.fotos || []).map((x) => `<p style="margin:6px 0"><span class="tag ${x.veredito === "manter" ? "bom" : x.veredito === "mover" ? "morno" : "ruim"}">Foto ${esc(x.n)} · ${esc(x.veredito)}</span> ${esc(x.motivo)}</p>`).join(""));
      h += card("Ordem ideal", `<p style="margin:0">${esc(d.ordem_ideal)}</p>`);
      h += card("Fotos que faltam", `<ul class="lista">${(d.fotos_que_faltam || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
      h += card("3 bios novas para copiar", (d.bios || []).map((x) => `<div class="resp"><button class="cp" data-t="${esc(x)}">Copiar</button><p class="tx">${esc(x)}</p></div>`).join(""));
      if ((d.outros_erros || []).length) h += card("Outros erros", `<ul class="lista">${d.outros_erros.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
      return h;
    },
    glowup(d, full) {
      let h = card("Formato do seu rosto", `<p style="margin:0 0 4px;font-weight:800;font-size:26px;text-transform:capitalize">${esc(d.formato)}</p><p style="margin:0 0 8px;color:var(--muted)">${esc(d.formato_porque)}</p><p style="margin:0"><b style="color:var(--ok)">Seu ponto forte:</b> ${esc(d.ponto_forte)}</p>`);
      const c = d.corte || {};
      h += card("Corte de cabelo para você", `<p style="margin:0 0 6px;font-weight:800;font-size:18px">${esc(c.nome)}</p><p style="margin:0 0 6px"><b>Como pedir ao barbeiro:</b> ${esc(c.como_pedir)}</p><p style="margin:0;color:var(--muted)"><b>Evite:</b> ${esc(c.evitar)}</p>`, 'style="border-color:var(--ok)"');
      if (!full) return h;
      const b = d.barba || {};
      h += card("Barba", `<p style="margin:0 0 6px;font-weight:800">${esc(b.recomendacao)}</p><p style="margin:0 0 6px">${esc(b.como_fazer)}</p><p style="margin:0;color:var(--muted)"><b>Evite:</b> ${esc(b.evitar)}</p>`);
      h += card("Sobrancelha", `<p style="margin:0">${esc(d.sobrancelha)}</p>`);
      h += card("Óculos", `<p style="margin:0">${esc(d.oculos)}</p>`);
      h += card("Cuidados simples", `<ul class="lista">${(d.cuidados || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`);
      h += card("Nas fotos do app", `<p style="margin:0">${esc(d.foto_perfil)}</p>`);
      return h;
    },
  };
  const TRANCAS = {
    perfil: (t) => tranca(`Veredito de cada uma das ${t.fotos || ""} fotos`, 2) + tranca("A ordem ideal das suas fotos", 1) + tranca(`${t.fotos_que_faltam || ""} fotos que estão faltando`, 1) + tranca("3 bios novas prontas para copiar", 2) + tranca(`Mais ${t.outros_erros || 2} erros do seu perfil`, 1),
    glowup: () => tranca("Barba: deixar, aparar ou tirar (e qual desenho)", 2) + tranca("Sobrancelha", 1) + tranca("Óculos que combinam", 1) + tranca("3 cuidados simples", 2) + tranca("Como levar isso para as fotos do app", 1),
  };
  const copia = () => document.querySelectorAll(".cp").forEach((b) => b.addEventListener("click", () => { navigator.clipboard?.writeText(b.dataset.t); b.textContent = "Copiado"; }));

  // ---------- página de venda ----------
  if (MODO === "venda") {
    marca("inicio", 0);
    let imgs = [], rid = null;
    const reduz = (f) => new Promise((ok, no) => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1800 / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(im.src); ok(c.toDataURL("image/jpeg", 0.85)); }; im.onerror = no; im.src = URL.createObjectURL(f); });
    const MAX = TIPO === "perfil" ? 6 : 3;
    $("#arq").addEventListener("change", async (e) => {
      const fs = Array.from(e.target.files || []).slice(0, MAX); if (!fs.length) return;
      imgs = (await Promise.all(fs.map((f) => reduz(f).catch(() => null)))).filter(Boolean);
      $("#thumbs").innerHTML = imgs.map((u) => `<img src="${u}" alt="">`).join("");
      $("#vai").disabled = !imgs.length; marca("fotos", 1);
      if (imgs.length) $("#vai").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const ckUrl = () => { if (!CK) return "#"; const u = new URL(CK); Object.entries(utm).forEach(([k, v]) => u.searchParams.set(k, v)); if (rid) u.searchParams.set("src", rid); return u.toString(); };
    const resultado = (r) => {
      rid = r.rid; if (rid) ls.set("fo_rid_" + TIPO, rid);
      $("#res").innerHTML = R[TIPO](r.previa, false) + `<div class="card" style="border-color:var(--warn);text-align:center"><p class="r-h" style="color:var(--warn)">Análise completa pronta</p><p style="margin:0 0 12px">A outra parte da sua análise já foi feita. Libere agora e veja tudo nesta tela.</p><a class="btn" data-cta>Liberar tudo · R$ 9,90</a><p class="mini" style="margin:8px 0 0">Pagamento único via Pix. Libera na hora, nesta tela.</p></div>` + TRANCAS[TIPO](r.trancado || {});
      document.querySelectorAll("[data-cta]").forEach((a) => { a.href = ckUrl(); a.addEventListener("click", (e) => {
        marca("checkout", 9);
        if (window.FMPix && q.get("pg") !== "payt" && rid) { // Pix na página (02/11)
          e.preventDefault(); marca("pix", 9);
          const OK = TIPO === "perfil" ? "ok-prints.html" : "ok-glowup.html";
          FMPix.abrir({ tipo: TIPO, rid, email: ls.get("fm_email") || "", utm, pagina: PAGINA, nome: TIPO === "perfil" ? "Análise completa do seu perfil" : "Glow up completo", valor: 9.9,
            lembra: (x) => ls.set("fm_email", x),
            onPago: () => { marca("pago", 10); try { sessionStorage.setItem("fo_px_/o/" + OK, "1"); } catch { /* */ } location.href = OK + "?rid=" + rid; },
            fallback: () => { fb("InitiateCheckout", { content_name: PAGINA, currency: "BRL", value: 9.9 }); location.href = ckUrl(); } });
          return;
        }
        fb("InitiateCheckout", { content_name: PAGINA, currency: "BRL", value: 9.9 }); }); });
      show("resultado"); $("#fixo").hidden = false; scrollTo(0, 0); marca("resultado", 3); fb("Lead", { content_name: PAGINA });
    };
    $("#vai").addEventListener("click", async () => {
      $("#erro").textContent = ""; show("analisando"); scrollTo(0, 0); marca("analisando", 2);
      const passos = document.querySelectorAll("#passosLoad li"); let i = 0; const t = setInterval(() => { passos.forEach((p, k) => p.classList.toggle("ok", k <= i)); i = Math.min(i + 1, passos.length - 1); }, 2500);
      try {
        const r = await call({ acao: "analisar", tipo: TIPO, sessao: SESSAO, imagens: imgs, anuncio: utm.utm_content || null });
        clearInterval(t);
        if (r.fora_do_escopo) { show("envio"); $("#erro").textContent = TIPO === "perfil" ? "Não encontrei um perfil nesses prints. Mande prints da tela do seu perfil no app." : "Não consegui ver bem seu rosto. Mande uma selfie de frente, com boa luz."; return; }
        if (r.erro || !r.rid) { show("envio"); $("#erro").textContent = r.erro || "Não consegui analisar agora. Tente de novo."; return; }
        resultado(r);
      } catch { clearInterval(t); show("envio"); $("#erro").textContent = "Sem conexão. Tente de novo."; }
    });
    if (DEMO === "res") resultado(JSON.parse(document.getElementById("demoRes").textContent));
    return;
  }

  // ---------- página depois do pagamento ----------
  const rid = q.get("rid") || ls.get("fo_rid_" + TIPO);
  const fim = (r) => { $("#res").innerHTML = R[TIPO](r.completo, true); copia(); show("pronto"); };
  if (DEMO === "res") { fim({ completo: JSON.parse(document.getElementById("demoRes").textContent).completo }); return; }
  if (!rid) { show("sem"); return; }
  let n = 0;
  const tenta = async () => {
    try { const r = await call({ acao: "liberar", rid }); if (r.pago) return fim(r); } catch { /* */ }
    if (++n < 40) setTimeout(tenta, 5000); else show("sem");
  };
  show("aguardando"); tenta();
})();
