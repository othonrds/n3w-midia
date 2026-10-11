// FotoMatch · versão B (rascunho, teste A/B): "fotos direto" — 3 fotos no topo → quiz de aparência → galeria de estilos
// → contato + selfies → oferta (galeria, tabela × fotógrafo, garantia, FAQ) → mesmo checkout Payt da versão A.
// Sem nota grátis e sem prévia. Fala com a mesma Edge Function match-nota (lead, contato, foto). ?demo=1 não chama o servidor.
// O lead é marcado com utm.fm_variante = "b". Cabelo, barba, corpo e estilos ficam só no navegador até a match-nota aceitar esses campos.
const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-nota";
// Mesmo checkout da versão A (Payt, produto RB7EQO, checkout RKOPW6; R$ 29,90 PIX + cartão).
const CHECKOUT_URL = "https://checkout.payt.com.br/1c8f9b1e8a2f69d9ae85268e8854d13b";
const CHECKOUT_PARAM_LEAD = "src";
const PRECO = 29.90;
const VARIANTE = "b";
const DEMO = new URLSearchParams(location.search).has("demo");
const MIN = 3, MAX = 6, LOOKS_MIN = 2;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const estado = { respostas: { looks: [] }, lead: null, fotos: [] };

const utm = (() => { const p = new URLSearchParams(location.search), o = {};
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid"].forEach((k) => p.get(k) && (o[k] = p.get(k))); return o; })();

function linkCheckout() {
  const u = new URL(CHECKOUT_URL);
  if (estado.lead && estado.lead.id) u.searchParams.set(CHECKOUT_PARAM_LEAD, estado.lead.id);
  Object.entries(utm).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}
async function api(acao, dados = {}) {
  const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ acao, ...dados }) });
  let j = {}; try { j = await r.json(); } catch { /* */ }
  return { status: r.status, ...j };
}
function guarda() { try { sessionStorage.setItem("fm_b", JSON.stringify({ respostas: estado.respostas, lead: estado.lead })); } catch { /* */ } }

/* ---------- navegação ---------- */
const TOTAL = 7;
function ir(nome) {
  $$(".tela").forEach((t) => t.classList.toggle("ativa", t.dataset.tela === nome));
  const t = $(`.tela[data-tela="${nome}"]`); const passo = Number(t?.dataset.passo || 0);
  $("#barra").hidden = !passo; $("#barraFill").style.width = (passo / TOTAL * 100) + "%";
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}
$$("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.ir)));

const ORDEM = { idade: "lugar", cabelo: "barba", barba: "corpo", corpo: "looks" };
$$(".opcoes").forEach((g) => g.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  $$("button", g).forEach((x) => x.classList.toggle("on", x === b));
  estado.respostas[g.dataset.campo] = b.dataset.v; guarda();
  setTimeout(() => ir(ORDEM[g.dataset.campo]), 180);
}));

/* ---------- estilos ---------- */
$("#looks").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  b.classList.toggle("on");
  estado.respostas.looks = $$("#looks button.on").map((x) => x.dataset.v);
  $("#looksOk").disabled = estado.respostas.looks.length < LOOKS_MIN; guarda();
});
$("#looksOk").addEventListener("click", async () => {
  ir("envio");
  if (!estado.lead && !DEMO) {
    const r = await api("lead", { respostas: { idade: estado.respostas.idade }, utm: { ...utm, fm_variante: VARIANTE } });
    if (r.id) { estado.lead = { id: r.id, token: r.token }; guarda(); }
  }
});

/* ---------- selfies ---------- */
function reduz(file) {
  return new Promise((ok, erro) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const lado = 1280, k = Math.min(1, lado / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      ok(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => { URL.revokeObjectURL(url); erro(new Error("Não consegui abrir essa imagem.")); };
    img.src = url;
  });
}
function desenhaGrade() {
  $("#grade").innerHTML = "";
  estado.fotos.forEach((f, i) => {
    const fig = document.createElement("figure");
    fig.innerHTML = `<img alt="Sua selfie ${i + 1}"><button type="button" aria-label="Remover selfie ${i + 1}">×</button>`;
    $("img", fig).src = f; $("button", fig).onclick = () => { estado.fotos.splice(i, 1); desenhaGrade(); };
    $("#grade").appendChild(fig);
  });
  $("#addFoto").style.display = estado.fotos.length >= MAX ? "none" : "";
  confere();
}
$("#arquivos").addEventListener("change", async (e) => {
  $("#erroEnvio").textContent = "";
  for (const f of [...e.target.files].slice(0, MAX - estado.fotos.length)) {
    try { estado.fotos.push(await reduz(f)); } catch (x) { $("#erroEnvio").textContent = x.message; }
  }
  e.target.value = ""; desenhaGrade();
});
function contatoOk() {
  const w = $("#whats").value.replace(/\D/g, ""), m = $("#email").value.trim();
  return (w.length >= 10 && w.length <= 13) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m);
}
function confere() { $("#enviar").disabled = !(contatoOk() && $("#aceite").checked && estado.fotos.length >= MIN); }
["#whats", "#email", "#aceite"].forEach((s) => $(s).addEventListener("input", confere));
$("#aceite").addEventListener("change", confere);

$("#enviar").addEventListener("click", async () => {
  $("#erroEnvio").textContent = "";
  if (DEMO) { ir("enviando"); setTimeout(mostraOferta, 1200); return; }
  if (!estado.lead) {
    const r = await api("lead", { respostas: { idade: estado.respostas.idade }, utm: { ...utm, fm_variante: VARIANTE } });
    if (!r.id) { $("#erroEnvio").textContent = r.erro || "Sem conexão. Tente de novo."; return; }
    estado.lead = { id: r.id, token: r.token }; guarda();
  }
  const c = await api("contato", { ...estado.lead, whats: $("#whats").value, email: $("#email").value, consentimento: $("#aceite").checked });
  if (!c.ok) { $("#erroEnvio").textContent = c.erro || "Confira seus dados."; return; }
  ir("enviando");
  for (let i = 0; i < estado.fotos.length; i++) {
    $("#statusEnvio").textContent = `Enviando selfie ${i + 1} de ${estado.fotos.length}`;
    const r = await api("foto", { ...estado.lead, img: estado.fotos[i] });
    if (!r.path) { ir("envio"); $("#erroEnvio").textContent = r.erro || "Falha ao enviar a selfie."; return; }
  }
  mostraOferta();
});

/* ---------- oferta ---------- */
const NOMES = { executivo: "O Executivo", social: "O Social", praia: "O Cara da Praia", aventureiro: "O Aventureiro", atleta: "O Atleta", cavalheiro: "O Cavalheiro" };
function mostraOferta() {
  const ls = estado.respostas.looks.map((v) => NOMES[v]).filter(Boolean);
  if (ls.length) $("#ofertaLooks").textContent = `Nos estilos ${ls.join(", ").replace(/, ([^,]*)$/, " e $1")}, com luz, roupa e cenário certos. É você, mais bem fotografado.`;
  if (CHECKOUT_URL) {
    ["#ctaCheckout", "#ctaCheckout2"].forEach((s) => { const a = $(s); a.href = linkCheckout(); a.removeAttribute("aria-disabled"); });
    $("#ctaNota").textContent = "Pagamento seguro pela Payt · R$ 27,90 no PIX, na hora.";
  }
  ir("oferta");
}
["#ctaCheckout", "#ctaCheckout2"].forEach((s) => $(s).addEventListener("click", (e) => {
  if (!CHECKOUT_URL) { e.preventDefault(); return; }
  e.currentTarget.href = linkCheckout();
  try { localStorage.setItem("fm_preco", String(PRECO)); localStorage.setItem("fm_variante", VARIANTE); if (estado.lead && estado.lead.id) localStorage.setItem("fm_lead_id", estado.lead.id); } catch { /* */ }
  try { if (window.fbq) fbq("track", "InitiateCheckout", { content_name: "fotomatch_15_fotos", currency: "BRL", value: PRECO }); } catch { /* */ }
}));

// ?demo=1&tela=oferta abre direto numa tela (revisão e prints, sem chamar o servidor).
(() => { const t = new URLSearchParams(location.search).get("tela"); if (DEMO && t) { if (t === "oferta") { estado.respostas.looks = ["executivo", "social", "praia"]; mostraOferta(); } else ir(t); } })();
