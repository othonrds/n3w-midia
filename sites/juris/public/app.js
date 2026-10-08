// Juris Páginas — app (gerador, personalização, checkout Pix e painel do cliente).
import { AREAS, UFS, PALS, CSS, renderLP, slugDe, esc, areaCurta } from "./lp.js";

const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/juris";
const PRECO = 39.9, PRECO_FOTOS = 29.9;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const q = new URLSearchParams(location.search);
const brl = n => "R$ " + Number(n).toFixed(2).replace(".", ",");
const ls = { get(k){ try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } }, set(k,v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }, del(k){ try { localStorage.removeItem(k); } catch {} } };
const ev = (...a) => { try { window.ev && window.ev(...a); } catch {} };

$("#lpcss").textContent = CSS;
$("#fArea").innerHTML = Object.entries(AREAS).map(([k, v]) => `<option value="${k}">${v.n}</option>`).join("");
$("#fUf").innerHTML = UFS.map(u => `<option${u === "CE" ? " selected" : ""}>${u}</option>`).join("");
$("#pal").innerHTML = PALS.map((p, i) => `<button type="button" data-i="${i}" class="${i ? "" : "on"}" style="background:linear-gradient(135deg,${p[0]} 50%,${p[1]} 50%)" aria-label="Paleta ${i + 1}"></button>`).join("");

const st = { step: 1, view: 1, tpl: "classico", p: PALS[0][0], a: PALS[0][1], foto: null, logo: null, fotoLocal: null, logoLocal: null, id: null, token: null, painel: null, teste: false };
const PAINEL = q.get("ref") && q.get("t") ? { ref: q.get("ref"), t: q.get("t") } : null;

async function api(body) {
  const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(j.erro || "Falha de conexão. Tente de novo.");
  return j;
}
const v = id => $(id).value.trim();
function dados() {
  return { nome: v("#fNome"), genero: v("#fGen"), area: v("#fArea"), cidade: v("#fCidade"), uf: v("#fUf"), oab: v("#fOab"), anos: v("#fAnos"), zap: v("#fZap"), atend: v("#fAtend"),
    tpl: st.tpl, p: st.p, a: st.a, h1: v("#tH1"), sub: v("#tSub"), bio: v("#tBio"), end: v("#tEnd"), email: v("#tEmail"), insta: v("#tInsta"), foto: st.foto, logo: st.logo };
}
function preenche(d) {
  const set = (id, x) => { $(id).value = x || ""; };
  set("#fNome", d.nome); $("#fGen").value = d.genero || "a"; $("#fArea").value = d.area || "familia"; set("#fCidade", d.cidade); $("#fUf").value = d.uf || "CE";
  set("#fOab", d.oab); set("#fAnos", d.anos); set("#fZap", d.zap); $("#fAtend").value = d.atend || "Presencial e online";
  set("#tH1", d.h1); set("#tSub", d.sub); set("#tBio", d.bio); set("#tEnd", d.end); set("#tEmail", d.email); set("#tInsta", d.insta);
  st.tpl = d.tpl || "classico"; st.p = d.p || PALS[0][0]; st.a = d.a || PALS[0][1]; st.foto = d.foto || null; st.logo = d.logo || null; st.fotoLocal = st.logoLocal = null;
  $("#cP").value = st.p;
  $$("#tpls button").forEach(x => x.classList.toggle("on", x.dataset.t === st.tpl));
  $$("#pal button").forEach(x => x.classList.toggle("on", PALS[x.dataset.i][0] === st.p && PALS[x.dataset.i][1] === st.a));
  thumb("#thFoto", st.foto); thumb("#thLogo", st.logo);
}
const thumb = (sel, src) => { const i = $(sel); if (src) { i.src = src; i.hidden = false; } else { i.removeAttribute("src"); i.hidden = true; } };

// URL pública da página (no domínio final é jurispaginas.com/slug; em prévias de teste usa p.html?s=slug)
const NOSSO = /(^|\.)jurispaginas\.com$/.test(location.hostname);
const urlPagina = slug => NOSSO ? `${location.origin}/${slug}` : new URL("p.html?s=" + encodeURIComponent(slug), location.href).href;
const urlPainel = (ref, t) => new URL(`./?ref=${ref}&t=${t}`, location.href).href;

function render() {
  const d = dados();
  const r = renderLP({ ...d, foto: st.fotoLocal || d.foto, logo: st.logoLocal || d.logo }, { previa: !PAINEL, fotoVazia: PAINEL ? "Envie sua foto em Visual" : "Sua foto aqui (envie em Personalizar)" });
  const lp = $("#lp"); lp.className = r.cls; lp.style.cssText = r.style; lp.innerHTML = r.html;
  const pg = PAINEL && st.painel && st.painel.atual !== "novo" ? st.painel.paginas[st.painel.atual] : null;
  $("#url").textContent = "jurispaginas.com/" + (pg?.slug || slugDe(d.nome) || "seu-nome");
}

/* ---------- etapas ---------- */
function setStep(n) {
  st.step = n; if (n < 4) st.view = n;
  $$("#steps li").forEach(li => { const s = +li.dataset.s; li.className = s === n ? "on" : s < n ? "done" : ""; });
  $("#formGen").hidden = st.view !== 1; $("#ready").hidden = st.view !== 2; $("#custom").hidden = st.view !== 3;
  render();
}

/* ---------- rascunho (salva no servidor sem cadastro) ---------- */
let tSave = null;
function agendaSalvar() {
  if (PAINEL || !st.id) return;
  clearTimeout(tSave); $("#saved").textContent = "";
  tSave = setTimeout(salvaRascunho, 1200);
}
async function salvaRascunho() {
  clearTimeout(tSave);
  const j = await api({ acao: "rascunho", id: st.id, token: st.token, dados: dados(), utm: window.utm ? window.utm() : null });
  st.id = j.id; st.token = j.token; st.teste = !!j.teste;
  ls.set("jp_rasc", { id: st.id, token: st.token, dados: dados() });
  $("#saved").textContent = "Rascunho salvo ✓";
  if (st.teste) { $("#tag").textContent = "Modo teste · Pix simulado"; $("#tag").classList.add("teste"); }
  return j;
}

$("#formGen").addEventListener("submit", async e => {
  e.preventDefault(); if (PAINEL) return;
  const err = $("#errForm"); err.textContent = "";
  if (v("#fNome").length < 3) { err.textContent = "Digite seu nome profissional."; $("#fNome").focus(); return; }
  if (v("#fZap").replace(/\D/g, "").length < 10) { err.textContent = "Digite o WhatsApp com DDD: ele vira o botão de contato da página."; $("#fZap").focus(); return; }
  const b = $("#btnGerar"); b.disabled = true; b.textContent = "Gerando…";
  try { await salvaRascunho(); ev("Lead", { content_name: v("#fArea") }); setStep(2); if (innerWidth < 900) $("#ready").scrollIntoView({ behavior: "smooth", block: "start" }); }
  catch (x) { err.textContent = x.message; }
  finally { b.disabled = false; b.textContent = "Gerar minha página"; }
});
$("#goCustom").onclick = () => setStep(3);
$("#backForm").onclick = () => setStep(1);
$("#back").onclick = () => setStep(2);
$("#goPub2").onclick = () => abrirCheckout();
$("#goPub").onclick = () => PAINEL ? salvarPainel() : abrirCheckout();

["#fNome","#fGen","#fArea","#fCidade","#fUf","#fOab","#fAnos","#fZap","#fAtend","#tH1","#tSub","#tBio","#tEnd","#tEmail","#tInsta"].forEach(i => $(i).addEventListener("input", () => { render(); agendaSalvar(); }));
$$(".tabs button").forEach(b => b.onclick = () => {
  $$(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  ["vis", "txt", "dados", "base"].forEach(t => $("#tab-" + t).hidden = t !== b.dataset.tab);
});
$("#tpls").onclick = e => { const b = e.target.closest("button"); if (!b) return; st.tpl = b.dataset.t; $$("#tpls button").forEach(x => x.classList.toggle("on", x === b)); render(); agendaSalvar(); };
$("#pal").onclick = e => { const b = e.target.closest("button"); if (!b) return; const p = PALS[b.dataset.i]; st.p = p[0]; st.a = p[1]; $("#cP").value = p[0]; $$("#pal button").forEach(x => x.classList.toggle("on", x === b)); render(); agendaSalvar(); };
$("#cP").oninput = e => { st.p = e.target.value; render(); agendaSalvar(); };

/* ---------- fotos e logo: reduz no celular e envia ---------- */
function reduz(file, max) {
  return new Promise((ok, no) => {
    const r = new FileReader(); r.onerror = no;
    r.onload = () => { const i = new Image(); i.onerror = () => no(new Error("Imagem inválida")); i.onload = () => {
      const s = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement("canvas");
      c.width = Math.round(i.width * s); c.height = Math.round(i.height * s);
      const g = c.getContext("2d"); g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(i, 0, 0, c.width, c.height);
      ok(c.toDataURL("image/jpeg", 0.86)); }; i.src = r.result; };
    r.readAsDataURL(file);
  });
}
function upload(inp, tipo, th) {
  $(inp).onchange = async e => {
    const f = e.target.files[0]; if (!f) return; const err = $("#errCustom"); err.textContent = "";
    try {
      const img = await reduz(f, tipo === "logo" ? 600 : 1200);
      st[tipo + "Local"] = img; thumb(th, img); render();
      if (!PAINEL && !st.id) await salvaRascunho();
      const body = PAINEL ? { acao: "midia", tipo, img, ref: PAINEL.ref, ptoken: PAINEL.t, id: st.painel.atual === "novo" ? null : st.painel.paginas[st.painel.atual].id } : { acao: "midia", tipo, img, id: st.id, token: st.token };
      const j = await api(body); st[tipo] = j.url; agendaSalvar(); $("#saved").textContent = (tipo === "foto" ? "Foto" : "Logo") + " enviada ✓";
    } catch (x) { err.textContent = "Não foi possível enviar a imagem: " + x.message; }
  };
}
upload("#upFoto", "foto", "#thFoto"); upload("#upLogo", "logo", "#thLogo");

$("#dDesk").onclick = () => { $("#stage").classList.remove("mobile"); $("#dDesk").classList.add("on"); $("#dMob").classList.remove("on"); };
$("#dMob").onclick = () => { $("#stage").classList.add("mobile"); $("#dMob").classList.add("on"); $("#dDesk").classList.remove("on"); };

/* ---------- checkout ---------- */
const sheet = $("#sheet");
function fecha() { $("#modal").hidden = true; clearInterval(poll); if (st.step === 4) setStep(st.view); }
function abre(html, fechavel = true) { sheet.innerHTML = (fechavel ? `<button class="x" type="button" id="mx">Fechar ✕</button>` : "") + html; $("#modal").hidden = false; if (fechavel) $("#mx").onclick = fecha; sheet.scrollTop = 0; }
let poll = null;

function abrirCheckout() {
  setStep(4); ev("InitiateCheckout", { value: PRECO, currency: "BRL" });
  const nome = v("#fNome") || "Seu Nome", slug = slugDe(nome) || "seu-nome";
  abre(`<h3>Publique sua página</h3>
  <div class="offer">
    <div class="ot"><b>Pacote Juris Páginas</b><span class="pr">${brl(PRECO)}<small>pagamento único</small></span></div>
    <ul><li><b>3 páginas completas</b>: esta e mais 2 (uma para cada área ou serviço)</li><li>No ar em <b>jurispaginas.com/${esc(slug)}</b></li><li>12 meses de hospedagem e edições ilimitadas</li><li>Sem marca d'água · botão direto para o seu WhatsApp</li></ul>
  </div>
  <label class="bump"><input type="checkbox" id="bump"><div><b>Sim! Quero 3 fotos profissionais por + ${brl(PRECO_FOTOS)}</b><span>Fotos de advocacia feitas a partir de uma selfie sua, para usar na página, no Instagram e no LinkedIn. <s>R$ 39,90</s> só neste pedido.</span></div></label>
  <label for="cEmail">Seu e-mail <small>para o recibo e o acesso ao painel</small><input id="cEmail" type="email" autocomplete="email" inputmode="email" value="${esc(v("#tEmail"))}"></label>
  <label for="cZap">Seu WhatsApp <input id="cZap" inputmode="tel" autocomplete="tel" value="${esc(v("#fZap"))}"></label>
  <div class="total"><span>Total</span><span id="tot">${brl(PRECO)}</span></div>
  <p class="err" id="errPay"></p>
  <button class="btn" type="button" id="pagar">Gerar Pix de ${brl(PRECO)}</button>
  <p class="note">Pagamento por Pix pelo Mercado Pago. A página vai ao ar assim que o Pix for confirmado, em segundos.</p>`);
  const tot = () => { const t = PRECO + ($("#bump").checked ? PRECO_FOTOS : 0); $("#tot").textContent = brl(t); $("#pagar").textContent = "Gerar Pix de " + brl(t); };
  $("#bump").onchange = tot;
  $("#pagar").onclick = async () => {
    const err = $("#errPay"); err.textContent = "";
    const email = v("#cEmail"), whats = v("#cZap");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = "Confira o e-mail."; return; }
    if (whats.replace(/\D/g, "").length < 10) { err.textContent = "WhatsApp com DDD."; return; }
    const b = $("#pagar"); b.disabled = true; b.textContent = "Gerando Pix…";
    try {
      await salvaRascunho();
      const bump = $("#bump").checked;
      const j = await api({ acao: "pedido", id: st.id, token: st.token, email, whats, bump, nome: v("#fNome") });
      ls.set("jp_pedido", { ref: j.ref, id: j.id, valor: j.valor });
      ev("AddPaymentInfo", { value: j.valor, currency: "BRL" });
      telaPix(j);
    } catch (x) { err.textContent = x.message; b.disabled = false; tot(); }
  };
}

function telaPix(j) {
  const img = j.qr64 ? `<img alt="QR Code Pix" src="data:image/png;base64,${j.qr64}">` : `<div class="code" style="width:220px;height:220px;display:grid;place-items:center;text-align:center">QR de teste<br>(Mercado Pago ainda não conectado)</div>`;
  abre(`<h3>Pague ${brl(j.valor)} no Pix</h3>
  <div class="qr">${img}
    <p class="note">Abra o app do seu banco, escolha Pix e escaneie o QR. No celular, copie o código abaixo e cole em "Pix copia e cola".</p>
    <div class="code" id="pixCode">${esc(j.qr || "")}</div>
    <button class="btn" type="button" id="copia">Copiar código Pix</button>
    <div class="wait"><i></i>Aguardando o pagamento…</div>
    ${j.teste ? `<button class="btn ghost" type="button" id="simula">Simular pagamento (modo teste)</button>` : ""}
  </div>`);
  $("#copia").onclick = async () => { try { await navigator.clipboard.writeText(j.qr); } catch { const r = document.createRange(); r.selectNodeContents($("#pixCode")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand("copy"); } $("#copia").textContent = "Código copiado ✓"; };
  const confere = async (simular = false) => { try { const s = await api({ acao: "status", ref: j.ref, id: j.id, simular }); if (s.pago) { clearInterval(poll); sucesso(s); } } catch {} };
  clearInterval(poll); poll = setInterval(confere, 4000);
  if (j.teste) $("#simula").onclick = () => confere(true);
}

function sucesso(s) {
  ls.del("jp_rasc"); ls.del("jp_pedido");
  if (!ls.get("jp_px_" + s.ref)) { ev("Purchase", { value: Number(s.valor), currency: "BRL", content_name: "juris-3-paginas" }, s.ref); ls.set("jp_px_" + s.ref, 1); }
  const pg = (s.paginas || []).find(p => p.slug) || {};
  const link = pg.slug ? urlPagina(pg.slug) : "";
  const painel = urlPainel(s.ref, s.token);
  ls.set("jp_painel", painel);
  $$("#steps li").forEach(li => li.className = "done");
  abre(`<h3>Sua página está no ar ✓</h3>
  ${link ? `<div class="live">${esc(link.replace(/^https?:\/\//, ""))}</div><a class="btn" href="${esc(link)}" target="_blank" rel="noopener">Ver minha página</a>` : ""}
  <div class="box"><b>Seu painel: guarde este link</b><p class="note">É por ele que você edita esta página e cria as outras 2 do seu pacote. Ele também vai no recibo.</p>
    <a class="btn ghost" href="${esc(painel)}">Abrir meu painel</a>
    <a class="btn ghost" href="https://wa.me/?text=${encodeURIComponent("Meu painel do Juris Páginas: " + painel)}" target="_blank" rel="noopener">Enviar o link para o meu WhatsApp</a></div>
  ${s.fotos ? `<div class="box"><b>Suas 3 fotos profissionais</b><p class="note">Envie uma selfie e escolha os estilos. As fotos ficam prontas em até 12 horas e você troca a foto da página pelo painel.</p><a class="btn" href="${esc(s.fotos)}" target="_blank" rel="noopener">Enviar minha selfie</a></div>` : ""}`, true);
}

/* ---------- painel do cliente (link privado) ---------- */
async function iniciaPainel() {
  document.title = "Meu painel · Juris Páginas";
  $("#hero").hidden = true; $("#steps").hidden = true; $("#heroPainel").hidden = false; $("#pages").hidden = false;
  $("#formTit").textContent = "Dados da página"; $("#formSub").textContent = "Mudou algo aqui? Toque em Salvar no quadro de baixo.";
  $("#btnGerar").hidden = true; $("#ready").hidden = true; $("#back").hidden = true;
  $("#formGen").hidden = false; $("#custom").hidden = false;
  $("#goPub").textContent = "Salvar e publicar";
  try {
    const j = await api({ acao: "painel", ref: PAINEL.ref, token: PAINEL.t });
    st.painel = { ...j, atual: 0 }; $("#nCred").textContent = j.creditos;
    if (j.teste) { $("#tag").textContent = "Modo teste"; $("#tag").classList.add("teste"); }
    abas(); seleciona(0);
  } catch (x) { $("#heroPainel").innerHTML = `<h1>Link inválido</h1><p>${esc(x.message)}. Confira se você abriu o link completo enviado depois do pagamento.</p>`; $(".bench").hidden = true; $("#pages").hidden = true; }
}
function abas() {
  const P = st.painel;
  $("#pages").innerHTML = P.paginas.map((p, i) => `<button type="button" data-i="${i}" class="${P.atual === i ? "on" : ""}">${i + 1} · ${esc(AREAS[p.dados.area] ? areaCurta(AREAS[p.dados.area]) : "Página")}</button>`).join("")
    + (P.paginas.length < P.creditos ? `<button type="button" data-i="novo" class="add ${P.atual === "novo" ? "on" : ""}">+ Criar página ${P.paginas.length + 1} de ${P.creditos}</button>` : "")
    + (P.fotos ? `<a class="pages-link" href="${esc(P.fotos)}" target="_blank" rel="noopener" style="align-self:center;font-size:13px;color:var(--accent);font-weight:600">Minhas fotos profissionais ↗</a>` : "");
  $("#pages").onclick = e => { const b = e.target.closest("button"); if (!b) return; seleciona(b.dataset.i === "novo" ? "novo" : +b.dataset.i); };
}
function seleciona(i) {
  const P = st.painel; P.atual = i;
  if (i === "novo") { const base = P.paginas[0]?.dados || {}; preenche({ ...base, h1: "", sub: "", bio: "" }); const outra = Object.keys(AREAS).find(k => !P.paginas.some(p => p.dados.area === k)); if (outra) $("#fArea").value = outra; }
  else preenche(P.paginas[i].dados);
  abas(); render();
  const pg = i === "novo" ? null : P.paginas[i];
  $("#saved").innerHTML = pg?.slug ? `No ar: <a href="${esc(urlPagina(pg.slug))}" target="_blank" rel="noopener">${esc(urlPagina(pg.slug).replace(/^https?:\/\//, ""))}</a>` : (i === "novo" ? "Escolha a área no quadro de dados e toque em Salvar para publicar." : "");
}
async function salvarPainel() {
  const P = st.painel, err = $("#errCustom"); err.textContent = ""; const b = $("#goPub"); b.disabled = true; b.textContent = "Salvando…";
  try {
    const j = await api({ acao: "salvar", ref: PAINEL.ref, token: PAINEL.t, pagina_id: P.atual === "novo" ? null : P.paginas[P.atual].id, dados: dados() });
    if (P.atual === "novo") { P.paginas.push(j.pagina); P.atual = P.paginas.length - 1; } else P.paginas[P.atual] = j.pagina;
    st.fotoLocal = st.logoLocal = null; seleciona(P.atual);
    $("#saved").innerHTML = "Salvo e publicado ✓ " + $("#saved").innerHTML;
  } catch (x) { err.textContent = x.message; }
  finally { b.disabled = false; b.textContent = "Salvar e publicar"; }
}

/* ---------- início ---------- */
if (PAINEL) iniciaPainel();
else {
  const r = ls.get("jp_rasc");
  if (r?.id) { st.id = r.id; st.token = r.token; preenche(r.dados || {}); setStep(2); }
  else setStep(1);
  const pd = ls.get("jp_pedido");
  if (pd?.ref) api({ acao: "status", ref: pd.ref, id: pd.id }).then(s => { if (s.pago) sucesso(s); }).catch(() => {});
}
