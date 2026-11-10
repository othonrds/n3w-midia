// FotoMatch · Pix na própria página (Mercado Pago, via Edge Function match-pix). 02/11/2026.
// Uso: FMPix.abrir({ tipo:"fotos", lead_id, faixa:"a", bump:false, email, utm, nome:"15 fotos", valor:9.9, onPago(ref), fallback(url) })
// Se o Mercado Pago estiver indisponível, chama fallback (checkout Payt) em vez de travar a venda.
(function () {
  const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-pix";
  const CSS = `
  .fmpx{position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.72);display:flex;align-items:flex-end;justify-content:center}
  .fmpx[hidden]{display:none}
  .fmpx-c{width:100%;max-width:480px;max-height:92vh;overflow:auto;background:var(--surface,#1E1A17);color:var(--ink,#F6F0EA);border-radius:20px 20px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom));box-shadow:0 -10px 40px rgba(0,0,0,.5);font-family:inherit}
  @media(min-width:520px){.fmpx{align-items:center}.fmpx-c{border-radius:20px}}
  .fmpx-h{display:flex;justify-content:space-between;align-items:center;margin:0 0 6px}
  .fmpx-h b{font-size:18px}.fmpx-x{background:none;border:0;color:var(--muted,#B7ABA0);font-size:26px;line-height:1;cursor:pointer;padding:0 4px}
  .fmpx-p{margin:0 0 12px;color:var(--muted,#B7ABA0);font-size:14px}
  .fmpx-pr{display:flex;justify-content:space-between;align-items:center;background:var(--surface2,#2A2420);border-radius:12px;padding:10px 12px;margin:0 0 10px;font-size:15px}
  .fmpx-pr b{font-size:22px;color:var(--warn,#F2B544)}
  .fmpx label{display:block;font-size:13px;color:var(--muted,#B7ABA0);margin:8px 0 4px}
  .fmpx input[type=email]{width:100%;box-sizing:border-box;border:1px solid var(--line,#3A322C);background:var(--bg,#14110F);color:inherit;border-radius:12px;padding:13px 12px;font:inherit;font-size:16px}
  .fmpx-bump{display:flex;gap:10px;align-items:flex-start;background:var(--surface2,#2A2420);border:1px dashed var(--warn,#F2B544);border-radius:12px;padding:10px 12px;margin:10px 0;font-size:14px;cursor:pointer}
  .fmpx-bump input{margin-top:3px;width:18px;height:18px}
  .fmpx-btn{display:block;width:100%;border:0;border-radius:14px;padding:15px;font:800 16px/1 inherit;font-family:inherit;text-transform:uppercase;letter-spacing:.04em;background:var(--warn,#F2B544);color:#1a1408;cursor:pointer;margin-top:10px}
  .fmpx-btn:disabled{opacity:.45}
  .fmpx-btn.sec{background:var(--surface2,#2A2420);color:var(--ink,#F6F0EA);border:1px solid var(--line,#3A322C);text-transform:none;font-weight:700}
  .fmpx-qr{display:block;width:220px;height:220px;margin:8px auto;border-radius:12px;background:#fff;padding:8px;box-sizing:border-box}
  .fmpx-cod{width:100%;box-sizing:border-box;border:1px solid var(--line,#3A322C);background:var(--bg,#14110F);color:var(--muted,#B7ABA0);border-radius:10px;padding:10px;font:12px/1.4 monospace;height:64px;resize:none}
  .fmpx-cron{display:flex;align-items:center;justify-content:space-between;gap:10px;background:#3A1F1C;border:1px solid #6b2a24;border-radius:14px;padding:10px 14px;margin:0 0 12px}
  .fmpx-cron span{font-size:13.5px;line-height:1.35;color:#F3D9D4}.fmpx-cron b{font:800 26px/1 ui-monospace,Menlo,monospace;color:#FF6B5E;letter-spacing:.02em}
  .fmpx-cron.fim{background:#2a2522;border-color:#3a332f}.fmpx-cron.fim b{color:#B7ABA0}
  .fmpx-st{text-align:center;margin:12px 0 0;font-size:14px;color:var(--muted,#B7ABA0)}
  .fmpx-st.ok{color:var(--ok,#3FBF7F);font-weight:800;font-size:17px}
  .fmpx-err{color:var(--bad,#FF6B5E);font-size:13px;margin:6px 0 0;min-height:1em}
  .fmpx-passos{margin:8px 0 0;padding:0 0 0 18px;font-size:13px;color:var(--muted,#B7ABA0)}
  .fmpx-passos li{margin:3px 0}
  .fmpx-anel{width:18px;height:18px;border-radius:50%;border:3px solid var(--surface2,#2A2420);border-top-color:var(--warn,#F2B544);display:inline-block;vertical-align:middle;margin-right:8px;animation:fmpxg 1s linear infinite}
  @keyframes fmpxg{to{transform:rotate(360deg)}}
  .fmpx-mp{display:flex;align-items:center;gap:10px;background:#fff;border-radius:12px;padding:9px 12px;margin:0 0 12px;color:#2d3277}
  .fmpx-mp .mpl{flex:0 0 auto;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#009EE3;color:#fff;font:800 13px/1 system-ui,sans-serif;letter-spacing:-.5px}
  .fmpx-mp b{display:block;font:800 14px/1.15 system-ui,sans-serif;color:#2d3277}
  .fmpx-mp span{display:block;font:500 11.5px/1.3 system-ui,sans-serif;color:#5b5f86}
  .fmpx-mp .cad{margin-left:auto;font-size:18px}
  .fmpx-banco{background:var(--surface2,#2A2420);border-radius:10px;padding:9px 12px;margin:10px 0 0;font-size:12.5px;line-height:1.4;color:var(--muted,#B7ABA0)}
  .fmpx-banco b{color:var(--ink,#F6F0EA)}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const SELO = `<div class="fmpx-mp"><span class="mpl">MP</span><div><b>Pagamento via Mercado Pago</b><span>Pix processado e protegido pelo Mercado Pago</span></div><span class="cad" aria-hidden="true">🔒</span></div>`;
  const BANCO = `<p class="fmpx-banco">No app do seu banco, o recebedor aparece como <b>N3W DIGITAL LTDA · Mercado Pago</b>. É a empresa responsável pela FotoMatch.</p>`;
  const real = (v) => "R$ " + Number(v).toFixed(2).replace(".", ",");
  const cookie = (n) => { const m = document.cookie.match("(^|;)\\s*" + n + "=([^;]+)"); return m ? m[2] : null; };
  const fb = (ev, d) => { try { if (window.fbq) fbq("track", ev, d); } catch { /* */ } };
  let st = null, timer = 0, modal = null;

  function monta() {
    if (modal) return modal;
    const s = document.createElement("style"); s.textContent = CSS; document.head.appendChild(s);
    modal = document.createElement("div"); modal.className = "fmpx"; modal.hidden = true; modal.innerHTML = `<div class="fmpx-c" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", (e) => { if (e.target === modal && !(st && st.pago)) fechar(); });
    return modal;
  }
  const box = () => modal.querySelector(".fmpx-c");
  function fechar() { clearInterval(timer); timer = 0; modal.hidden = true; document.body.style.overflow = ""; }

  function telaEmail(o) {
    const bumpH = o.bump_oferta ? `<label class="fmpx-bump"><input type="checkbox" id="fmpxBump"><span><b>+ ${esc(o.bump_titulo || "Bio pronta para o seu perfil")}</b> por só ${real(o.bump_valor || 4.9)}<br><span style="color:var(--muted,#B7ABA0)">${esc(o.bump_desc || "3 bios escritas a partir das suas respostas, para copiar e colar.")}</span></span></label>` : "";
    box().innerHTML = `<div class="fmpx-h"><b>Pagar com Pix</b><button class="fmpx-x" type="button" aria-label="Fechar">×</button></div>
      ${SELO}
      <p class="fmpx-p">${esc(o.nome)} · libera na hora, direto nesta tela.</p>
      <div class="fmpx-pr"><span>Total</span><b id="fmpxTot">${real(o.valor)}</b></div>
      <label for="fmpxEmail">Seu e-mail (é para onde vai o acesso)</label>
      <input type="email" id="fmpxEmail" inputmode="email" autocomplete="email" placeholder="voce@email.com" value="${esc(o.email || "")}">
      ${bumpH}
      <p class="fmpx-err" id="fmpxErr"></p>
      <button class="fmpx-btn" id="fmpxGo" type="button">Gerar Pix · ${real(o.valor)}</button>
      <p class="fmpx-p" style="text-align:center;margin:10px 0 0;font-size:12px">Pagamento único. Sem mensalidade.</p>`;
    box().querySelector(".fmpx-x").addEventListener("click", fechar);
    const bump = box().querySelector("#fmpxBump");
    if (bump) bump.addEventListener("change", () => { const v = o.valor + (bump.checked ? (o.bump_valor || 4.9) : 0); box().querySelector("#fmpxTot").textContent = real(v); box().querySelector("#fmpxGo").textContent = "Gerar Pix · " + real(v); });
    box().querySelector("#fmpxGo").addEventListener("click", () => gerar(o));
    setTimeout(() => { const i = box().querySelector("#fmpxEmail"); if (i && !i.value) i.focus(); }, 150);
  }

  async function gerar(o) {
    const email = box().querySelector("#fmpxEmail").value.trim(), err = box().querySelector("#fmpxErr"), go = box().querySelector("#fmpxGo");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Digite um e-mail válido."; return; }
    const bump = !!(box().querySelector("#fmpxBump") || {}).checked;
    go.disabled = true; go.innerHTML = `<span class="fmpx-anel"></span>Gerando seu Pix…`; err.textContent = "";
    try { if (o.lembra) o.lembra(email); } catch { /* */ }
    let r = null;
    try {
      const resp = await fetch(FN, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ acao: "criar", tipo: o.tipo, lead_id: o.lead_id, rid: o.rid, sessao: o.sessao, email, faixa: o.faixa || "a", bump, utm: o.utm || {}, fbp: cookie("_fbp"), fbc: cookie("_fbc"), pagina: o.pagina || null }) });
      r = await resp.json().catch(() => ({})); r._status = resp.status;
    } catch { r = { _status: 0, erro: "rede" }; }
    if (!r || !r.ref) {
      const grave = !r || r._status === 503 || r._status === 0 || r._status >= 500 || r.erro === "indisponivel";
      if (grave && o.fallback) { fechar(); o.fallback(); return; }
      err.textContent = (r && r.erro && r.erro.length > 12) ? r.erro : "Não consegui gerar o Pix agora. Tente de novo.";
      go.disabled = false; go.textContent = "Gerar Pix"; return;
    }
    st = { ref: r.ref, valor: r.valor, pago: false, o };
    fb("InitiateCheckout", { content_name: o.pagina || o.tipo, currency: "BRL", value: Number(r.valor) });
    telaQr(r, o);
  }

  function telaQr(r, o) {
    box().innerHTML = `<div class="fmpx-h"><b>Pix gerado · ${real(r.valor)}</b><button class="fmpx-x" type="button" aria-label="Fechar">×</button></div>
      ${SELO}
      <div class="fmpx-cron" id="fmpxCron"><span>Finalize agora para liberar na hora</span><b id="fmpxRel">03:00</b></div>
      <p class="fmpx-p">Pague em qualquer banco. Assim que cair, esta tela libera sozinha.</p>
      <img class="fmpx-qr" alt="QR Code Pix" src="data:image/png;base64,${r.qr64}">
      <button class="fmpx-btn" id="fmpxCp" type="button">Copiar código Pix (copia e cola)</button>
      <textarea class="fmpx-cod" id="fmpxCod" readonly>${esc(r.qr)}</textarea>
      <ol class="fmpx-passos"><li>Abra o app do seu banco → Pix → <b>Pix copia e cola</b></li><li>Cole o código e confirme ${real(r.valor)}</li><li>Volte aqui: libera em segundos</li></ol>
      ${BANCO}
      <p class="fmpx-st" id="fmpxSt"><span class="fmpx-anel"></span>Aguardando o pagamento…</p>
      <button class="fmpx-btn sec" id="fmpxJa" type="button" style="margin-top:12px">Já paguei, conferir agora</button>`;
    box().querySelector(".fmpx-x").addEventListener("click", fechar);
    const cp = box().querySelector("#fmpxCp"), ta = box().querySelector("#fmpxCod");
    cp.addEventListener("click", async () => { try { await navigator.clipboard.writeText(r.qr); } catch { ta.select(); try { document.execCommand("copy"); } catch { /* */ } } cp.textContent = "Código copiado ✓"; setTimeout(() => { cp.textContent = "Copiar código Pix (copia e cola)"; }, 2500); });
    box().querySelector("#fmpxJa").addEventListener("click", () => confere(true));
    clearInterval(timer); timer = setInterval(() => confere(false), 4000);
    // cronômetro de 3 min (prioridade); o código Pix em si continua valendo 30 min
    const fim = Date.now() + 180e3, rel = box().querySelector("#fmpxRel"), cr = box().querySelector("#fmpxCron");
    clearInterval(window.__fmpxCron); window.__fmpxCron = setInterval(() => {
      if (!rel || !rel.isConnected || (st && st.pago)) { clearInterval(window.__fmpxCron); return; }
      const ms = Math.max(0, fim - Date.now()), m = Math.floor(ms / 60000), sx = Math.floor((ms % 60000) / 1000);
      rel.textContent = String(m).padStart(2, "0") + ":" + String(sx).padStart(2, "0");
      if (!ms) { clearInterval(window.__fmpxCron); cr.classList.add("fim"); cr.querySelector("span").textContent = "Ainda dá tempo: este código Pix vale por 30 minutos."; rel.textContent = "⏳"; }
    }, 250);
    setTimeout(() => { if (timer) { clearInterval(timer); timer = 0; const s = box().querySelector("#fmpxSt"); if (s && !st.pago) s.textContent = "O código expirou. Feche e gere um novo Pix."; } }, 30 * 60e3);
  }

  let conferindo = false;
  async function confere(manual) {
    if (!st || st.pago || conferindo) return; conferindo = true;
    const s = box().querySelector("#fmpxSt");
    if (manual && s) s.innerHTML = `<span class="fmpx-anel"></span>Conferindo com o banco…`;
    try {
      const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ acao: "status", ref: st.ref }) }).then((x) => x.json());
      if (r.pago) { st.pago = true; clearInterval(timer); timer = 0; pago(); }
      else if (manual && s) { s.innerHTML = `<span class="fmpx-anel"></span>Ainda não caiu. Se acabou de pagar, leva alguns segundos.`; }
    } catch { /* tenta de novo no próximo tique */ }
    conferindo = false;
  }

  function pago() {
    const o = st.o;
    try { const k = "fmpx_px_" + st.ref; if (!sessionStorage.getItem(k)) { fb("Purchase", { content_name: o.pagina || o.tipo, currency: "BRL", value: Number(st.valor) }); sessionStorage.setItem(k, "1"); } } catch { fb("Purchase", { content_name: o.pagina || o.tipo, currency: "BRL", value: Number(st.valor) }); }
    box().innerHTML = `<div class="fmpx-h"><b>Pagamento confirmado ✓</b></div>
      ${SELO}<p class="fmpx-st ok">Pix recebido. Liberando o seu acesso…</p>
      <p class="fmpx-p" style="text-align:center">Pedido ${esc(st.ref)}. Também mandamos tudo para o seu e-mail.</p>`;
    setTimeout(() => { try { o.onPago && o.onPago(st.ref); } catch { /* */ } }, 900);
  }

  window.FMPix = {
    abrir(o) { monta(); st = null; clearInterval(timer); timer = 0; modal.hidden = false; document.body.style.overflow = "hidden"; telaEmail(o); },
    fechar,
  };
})();
