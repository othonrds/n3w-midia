// Juris Páginas — funil de 3 etapas (14/10):
//  1) o link do anúncio abre a página já pronta (nome/área/cidade pela URL; nome editável na própria página);
//  2) "Envie 1 selfie" → fotos de autoridade (acao "fotos"; gerador ainda é stub TODO-Higgsfield no servidor), com marca d'água;
//  3) Pix único de R$ 97 (página no ar 1 ano em jurispaginas.com/<nome>) + bump domínio próprio R$ 67. WhatsApp/e-mail só aqui.
// Parâmetros aceitos: ?nome=&area=&tese=&cidade=&uf=&g=a|o (e UTMs/fbclid, lidos por px.js).
// Pixel: PageView (px.js), ViewContent (página pronta vista), Lead (selfie enviada), InitiateCheckout (abre checkout),
// AddPaymentInfo (Pix gerado), Purchase (pago). Lead, AddPaymentInfo e Purchase também saem pelo servidor (CAPI) com o mesmo eventID.
import { AREAS, TESES, UFS, CSS, renderLP, slugDe, esc } from "./lp.js";

const q = new URLSearchParams(location.search);
// Painel do cliente (link privado pós-compra) continua no editor antigo.
if (q.get("ref") && q.get("t")) location.replace("legacy/" + location.search);

const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/juris";
const PRECO = 97, PRECO_DOMINIO = 67; // conferidos no servidor (PACOTES / PRECO_DOMINIO)
const $ = s => document.querySelector(s);
const brl = n => "R$ " + Number(n).toFixed(2).replace(".", ",");
const ls = { get(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } }, set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k){ try { localStorage.removeItem(k); } catch {} } };
const ev = (...a) => { try { window.ev && window.ev(...a); } catch {} };
const fbIds = () => (window.fbIds ? window.fbIds() : {});
const ZAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>';
const CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3zm3 5a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>';

$("#lpcss").textContent = CSS;

/* ---------- dados iniciais: rascunho salvo ou parâmetros do anúncio ---------- */
const limpa = (s, n) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n);
const salvo = ls.get("jp_funil");
const area = AREAS[q.get("area")] ? q.get("area") : "familia";
const st = salvo?.id ? { ...salvo } : {
  id: null, token: null, etapa: 1,
  dados: {
    tpl: "premium", p: "#15202B", a: "#C5A26B",
    nome: limpa(q.get("nome"), 60) || (q.get("g") === "o" ? "Dr. Seu Nome" : "Dra. Seu Nome"),
    genero: q.get("g") === "o" ? "o" : "a", area,
    tese: (TESES[area] || []).some(t => t.id === q.get("tese")) ? q.get("tese") : "",
    cidade: limpa(q.get("cidade"), 40), uf: UFS.includes((q.get("uf") || "").toUpperCase()) ? q.get("uf").toUpperCase() : "SP",
    atend: "Presencial e online", fotos: [],
  },
};
st.teste = false;
const guarda = () => ls.set("jp_funil", { id: st.id, token: st.token, etapa: st.etapa, dados: st.dados });

async function api(body) {
  const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(j.erro || "Falha de conexão. Tente de novo.");
  if (j.teste) { st.teste = true; $("#modo").hidden = false; }
  return j;
}
async function salvaRascunho() {
  const j = await api({ acao: "rascunho", id: st.id, token: st.token, dados: st.dados, utm: window.utm ? window.utm() : null, ...fbIds() });
  st.id = j.id; st.token = j.token; guarda(); return j;
}

/* ---------- página ---------- */
const slug = () => slugDe(st.dados.nome) || "seu-nome";
function render() {
  const r = renderLP(st.dados, { previa: true, app: true, editavel: true, marca: st.dados.fotos.length > 0 });
  const lp = $("#lp"); lp.className = r.cls; lp.style.cssText = r.style; lp.innerHTML = r.html;
  $("#url").textContent = "jurispaginas.com/" + slug();
  const h1 = lp.querySelector("[data-edit=nome]");
  if (h1) {
    h1.addEventListener("focus", () => { $("#dica").hidden = true; });
    h1.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); h1.blur(); } });
    h1.addEventListener("input", () => {
      st.dados.nome = limpa(h1.textContent, 60);
      lp.querySelectorAll("[data-nome]").forEach(s => s.textContent = st.dados.nome);
      $("#url").textContent = "jurispaginas.com/" + slug();
    });
    h1.addEventListener("blur", () => { if (st.dados.nome.length < 3) { st.dados.nome = "Dra. Seu Nome"; render(); } guarda(); if (st.id) salvaRascunho().catch(() => {}); });
  }
}
function etapa(n) {
  st.etapa = n; guarda();
  document.querySelectorAll("#steps i").forEach((i, k) => i.classList.toggle("on", k < n));
  const b = $("#barIn");
  if (n === 1) {
    b.innerHTML = `<div class="tx"><b>Sua página está pronta.</b>Falta só a sua foto.</div><button class="btn gold" type="button" id="goSelfie">${CAM}Envie 1 selfie</button>`;
    $("#goSelfie").onclick = () => $("#selfie").click();
  } else {
    b.innerHTML = `<div class="tx"><b>Gostou? Coloque no ar.</b>1 ano no ar · pagamento único</div><button class="btn" type="button" id="goPub">Publicar · ${brl(PRECO).replace(",00", "")}</button>`;
    $("#goPub").onclick = abrirCheckout;
  }
}

/* ---------- etapa 2: selfie → fotos de autoridade ---------- */
function reduz(file, max) {
  return new Promise((ok, no) => {
    const r = new FileReader(); r.onerror = no;
    r.onload = () => { const i = new Image(); i.onerror = () => no(new Error("Imagem inválida")); i.onload = () => {
      const s = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas");
      c.width = Math.round(i.width * s); c.height = Math.round(i.height * s);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(i, 0, 0, c.width, c.height);
      ok(c.toDataURL("image/jpeg", 0.88)); }; i.src = r.result; };
    r.readAsDataURL(file);
  });
}
$("#selfie").onchange = async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  $("#gen").hidden = false;
  try {
    const img = await reduz(f, 1400);
    if (!st.id) await salvaRascunho();
    const up = await api({ acao: "midia", tipo: "foto", img, id: st.id, token: st.token });
    const j = await api({ acao: "fotos", id: st.id, token: st.token, selfie: up.url, ...fbIds() });
    if (!ls.get("jp_lead_" + st.id)) { ev("Lead", { content_name: st.dados.area }, "lead-" + st.id); ls.set("jp_lead_" + st.id, 1); }
    st.dados.fotos = j.fotos || [up.url]; st.dados.foto = st.dados.fotos[0];
    render(); etapa(2); scrollTo({ top: 0, behavior: "smooth" });
  } catch (x) { alert("Não foi possível usar a foto: " + x.message); }
  finally { $("#gen").hidden = true; }
};

/* ---------- etapa 3: checkout Pix ---------- */
const sheet = $("#sheet"); let poll = null;
function abre(html, fechavel = true) {
  sheet.innerHTML = (fechavel ? `<button class="x" type="button" id="mx">Fechar ✕</button>` : "") + html; $("#modal").hidden = false; sheet.scrollTop = 0;
  if (fechavel) $("#mx").onclick = () => { $("#modal").hidden = true; clearInterval(poll); };
}
function abrirCheckout() {
  ev("InitiateCheckout", { value: PRECO, currency: "BRL", num_items: 1 }, st.id ? "ic-" + st.id : undefined);
  abre(`<h3>Coloque sua página no ar</h3><p class="sub">Compra única no Pix. Sem mensalidade.</p>
  <div class="offer"><div class="t"><b>Página profissional · 1 ano</b><span class="pr">${brl(PRECO).replace(",00", "")}<small>pagamento único</small></span></div>
    <ul><li>No ar em <b>jurispaginas.com/${esc(slug())}</b> por 12 meses</li><li>Suas fotos de autoridade, sem marca d'água</li><li>Botão direto para o seu WhatsApp</li><li>Textos dentro do Provimento 205/2021 da OAB</li><li>Avisamos no seu WhatsApp antes de completar 1 ano. Nada é cobrado automaticamente.</li></ul></div>
  <label class="bump"><input type="checkbox" id="bump"><span><b>+ ${brl(PRECO_DOMINIO).replace(",00", "")}: domínio próprio (seunome.adv.br)</b><span>Registramos e configuramos o endereço só seu, apontando para a página, por 1 ano.</span></span></label>
  <label for="cZap">Seu WhatsApp <small>vira o botão de contato da página</small><input id="cZap" inputmode="tel" autocomplete="tel" placeholder="(85) 99999-9999" value="${esc(st.dados.zap || "")}"></label>
  <label for="cEmail">Seu e-mail <small>recibo e acesso para editar</small><input id="cEmail" type="email" inputmode="email" autocomplete="email" value="${esc(st.dados.email || "")}"></label>
  <div class="tot"><span>Total</span><span id="tot"></span></div>
  <p class="err" id="errPay"></p>
  <button class="btn gold blk" type="button" id="pagar"></button>
  <p class="note">Pix pelo Mercado Pago. A página vai ao ar assim que o pagamento é confirmado, em segundos. Garantia de 7 dias.</p>`);
  const tot = () => { const v = PRECO + ($("#bump").checked ? PRECO_DOMINIO : 0); $("#tot").textContent = brl(v); $("#pagar").textContent = "Gerar Pix de " + brl(v); };
  tot(); $("#bump").onchange = tot;
  $("#pagar").onclick = async () => {
    const err = $("#errPay"); err.textContent = "";
    const email = $("#cEmail").value.trim(), whats = $("#cZap").value.trim();
    if (whats.replace(/\D/g, "").length < 10) { err.textContent = "WhatsApp com DDD."; $("#cZap").focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Confira o e-mail."; $("#cEmail").focus(); return; }
    const b = $("#pagar"); b.disabled = true; b.textContent = "Gerando Pix…";
    try {
      st.dados.zap = whats; st.dados.email = email;
      await salvaRascunho();
      const j = await api({ acao: "pedido", id: st.id, token: st.token, email, whats, nome: st.dados.nome, pacote: "p1", dominio: $("#bump").checked, ...fbIds() });
      ls.set("jp_pedido", { ref: j.ref, id: j.id });
      ev("AddPaymentInfo", { value: j.valor, currency: "BRL" }, "api-" + j.ref);
      telaPix(j);
    } catch (x) { err.textContent = x.message; b.disabled = false; tot(); }
  };
}
function telaPix(j) {
  const img = j.qr64 ? `<img alt="QR Code Pix" src="data:image/png;base64,${j.qr64}">` : `<div class="ph">QR de teste<br>(Mercado Pago não conectado)</div>`;
  abre(`<h3>Pague ${brl(j.valor)} no Pix</h3><p class="sub">Abra o app do banco → Pix → Copia e cola.</p><div class="qr">${img}
    <div class="code" id="pixCode">${esc(j.qr || "")}</div>
    <button class="btn gold blk" type="button" id="copia">Copiar código Pix</button>
    <div class="wait"><i></i>Aguardando o pagamento…</div>
    ${j.teste ? `<button class="btn ghost blk" type="button" id="simula">Simular pagamento (modo teste)</button>` : ""}</div>`);
  $("#copia").onclick = async () => { try { await navigator.clipboard.writeText(j.qr); } catch {} $("#copia").textContent = "Código copiado ✓"; };
  const confere = async (simular = false) => { try { const s = await api({ acao: "status", ref: j.ref, id: j.id, simular }); if (s.pago) { clearInterval(poll); sucesso(s); } } catch {} };
  clearInterval(poll); poll = setInterval(confere, 4000);
  if (j.teste) $("#simula").onclick = () => confere(true);
}
function sucesso(s) {
  if (!ls.get("jp_px_" + s.ref)) { ev("Purchase", { value: Number(s.valor), currency: "BRL", content_name: "juris-premium-1ano" }, s.ref); ls.set("jp_px_" + s.ref, 1); }
  ls.del("jp_pedido"); ls.del("jp_funil");
  const pg = (s.paginas || []).find(p => p.slug) || {};
  const link = pg.slug ? (/(^|\.)jurispaginas\.com$/.test(location.hostname) ? `${location.origin}/${pg.slug}` : new URL("p.html?s=" + pg.slug, location.href).href) : "";
  const painel = new URL(`./?ref=${s.ref}&t=${s.token}`, location.href).href;
  document.querySelectorAll("#steps i").forEach(i => i.classList.add("on"));
  abre(`<h3>Sua página está no ar ✓</h3><p class="sub">Válida até ${s.validade ? s.validade.split("-").reverse().join("/") : "daqui a 1 ano"}. Avisaremos no seu WhatsApp antes do vencimento.</p>
    ${link ? `<div class="live">${esc(link.replace(/^https?:\/\//, ""))}</div><a class="btn gold blk" href="${esc(link)}" target="_blank" rel="noopener">Ver minha página</a>` : ""}
    <a class="btn ghost blk" href="${esc(painel)}">Editar minha página</a>
    ${s.dominio ? `<p class="note">Domínio próprio: vamos falar com você no WhatsApp em até 1 dia útil para escolher o endereço.</p>` : ""}`, true);
}

/* ---------- início ---------- */
render();
etapa(st.dados.fotos?.length ? 2 : 1);
ev("ViewContent", { content_name: "pagina-pronta", content_category: st.dados.area });
const pd = ls.get("jp_pedido");
if (pd?.ref) api({ acao: "status", ref: pd.ref, id: pd.id }).then(s => { if (s.pago) sucesso(s); }).catch(() => {});
