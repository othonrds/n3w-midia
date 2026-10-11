// FotoMatch · LP-quiz (rascunho). Fala só com a Edge Function match-nota (verify_jwt=false; autorização por token do lead).
// ?demo=1 mostra um resultado de EXEMPLO sem chamar a IA (para revisão do Othon na prévia).
const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-nota";
// Checkout Payt do FotoMatch (produto RB7EQO, checkout RKOPW6; R$ 29,90 PIX + cartão). Aprovado pelo Othon em 11/10.
const CHECKOUT_URL = "https://checkout.payt.com.br/1c8f9b1e8a2f69d9ae85268e8854d13b";
const CHECKOUT_PARAM_LEAD = "src"; // id do lead vai neste parâmetro (Checkout Expert confirma o nome aceito pela Payt).
const PRECO = 29.90; // BRL. Oferta "15 fotos com o seu rosto" (mesmo valor do botão e do Purchase em obrigado.html).
const DEMO = new URLSearchParams(location.search).has("demo");
const MIN = 3, MAX = 6;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const estado = { respostas: { segura: [] }, lead: null, fotos: [] };
try { const s = JSON.parse(sessionStorage.getItem("fm_lead") || "null"); if (s && s.id) estado.lead = s; } catch { /* sem storage */ }

const utm = (() => { const p = new URLSearchParams(location.search), o = {};
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid"].forEach((k) => p.get(k) && (o[k] = p.get(k))); return o; })();

// Link do checkout com o id do lead + UTMs/fbclid da visita (liga a venda ao lead e ao anúncio).
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

/* ---------- navegação ---------- */
const TOTAL = 6;
function ir(nome) {
  $$(".tela").forEach((t) => t.classList.toggle("ativa", t.dataset.tela === nome));
  const t = $(`.tela[data-tela="${nome}"]`); const passo = Number(t?.dataset.passo || 0);
  $("#barra").hidden = !passo; $("#barraFill").style.width = (passo / TOTAL * 100) + "%";
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  if (nome === "reforco") montaReforco();
}
$$("[data-ir]").forEach((b) => b.addEventListener("click", () => ir(b.dataset.ir)));

const ORDEM = { idade: "trava", trava: "objetivo", objetivo: "segura" };
$$(".opcoes:not(.multi)").forEach((g) => g.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  $$("button", g).forEach((x) => x.classList.toggle("on", x === b));
  estado.respostas[g.dataset.campo] = b.dataset.v;
  setTimeout(() => ir(ORDEM[g.dataset.campo]), 180);
}));
$(".opcoes.multi").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  b.classList.toggle("on");
  estado.respostas.segura = $$(".opcoes.multi button.on").map((x) => x.dataset.v);
  $("#seguraOk").disabled = !estado.respostas.segura.length;
});
$("#seguraOk").addEventListener("click", async () => {
  ir("reforco");
  if (!estado.lead && !DEMO) {
    const r = await api("lead", { respostas: estado.respostas, utm });
    if (r.id) { estado.lead = { id: r.id, token: r.token }; try { sessionStorage.setItem("fm_lead", JSON.stringify(estado.lead)); } catch { /* */ } }
  }
});

function montaReforco() {
  // Sem número nem estatística: frase fixa aprovada. (Owner: só usar número quando tivermos dados próprios.)
  $("#reforcoNum").textContent = "Antes do papo";
  $("#reforcoTit").textContent = "A primeira foto decide se ela para no seu perfil.";
}

/* ---------- fotos ---------- */
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
    fig.innerHTML = `<img alt="Sua foto ${i + 1}"><button type="button" aria-label="Remover foto ${i + 1}">×</button>`;
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
  if (DEMO) { ir("analisando"); setTimeout(() => mostraResultado(EXEMPLO, true), 1400); return; }
  if (!estado.lead) {
    const r = await api("lead", { respostas: estado.respostas, utm });
    if (!r.id) { $("#erroEnvio").textContent = r.erro || "Sem conexão. Tente de novo."; return; }
    estado.lead = { id: r.id, token: r.token };
  }
  const c = await api("contato", { ...estado.lead, whats: $("#whats").value, email: $("#email").value, consentimento: $("#aceite").checked });
  if (!c.ok) { $("#erroEnvio").textContent = c.erro || "Confira seus dados."; return; }
  ir("analisando");
  const paths = [];
  for (let i = 0; i < estado.fotos.length; i++) { // em sequência (o servidor acrescenta na lista do lead)
    $("#statusAnalise").textContent = `Enviando foto ${i + 1} de ${estado.fotos.length}`;
    const r = await api("foto", { ...estado.lead, img: estado.fotos[i] });
    if (!r.path) { ir("envio"); $("#erroEnvio").textContent = r.erro || "Falha ao enviar a foto."; return; }
    paths.push(r.path);
  }
  $("#statusAnalise").textContent = "Avaliando luz, ângulo, expressão e cenário";
  const n = await api("nota", { ...estado.lead, paths });
  if (n.nota) return mostraResultado(n.nota, false);
  const viaWhats = $("#whats").value.replace(/\D/g, "").length >= 10;
  $("#pendenteTxt").textContent = viaWhats ? "Sua nota chega em até 10 min no seu WhatsApp." : "Sua nota chega em até 10 min no seu e-mail.";
  $("#pendenteCod").textContent = n.codigo ? "código: " + n.codigo : (n.erro || "");
  ir("pendente");
});

/* ---------- exemplos do topo (carrossel) ---------- */
(() => {
  const pares = $$("#exemplo .par"), pts = $$("#pontos button"); if (pares.length < 2) return;
  let i = 0, timer;
  const mostra = (n) => { i = n % pares.length; pares.forEach((p, k) => p.classList.toggle("on", k === i)); pts.forEach((b, k) => b.classList.toggle("on", k === i)); };
  const roda = () => { clearInterval(timer); timer = setInterval(() => mostra(i + 1), 3500); };
  pts.forEach((b, k) => b.addEventListener("click", () => { mostra(k); roda(); }));
  roda();
})();

/* ---------- prévia com marca d'água ---------- */
// Pede 1 foto gerada do próprio cliente à match-nota (ação "previa"). Se o servidor ainda não gera
// (motor travado/sem verba), avisa que a prévia chega no contato deixado — a página não quebra.
const PREVIA_EXEMPLO = "img/r1-jantar.jpg";
function previaPronta(url) {
  const img = $("#previaImg");
  img.onload = () => { $("#previaCarregando").hidden = true; img.hidden = false; };
  img.src = url;
  $("#previaTxt").textContent = "Uma foto sua, com luz e cenário certos. As 15 do pacote saem sem marca d'água.";
}
function previaDepois() {
  const viaWhats = $("#whats").value.replace(/\D/g, "").length >= 10;
  $("#previaCarregando").innerHTML = "<span>Sua prévia está sendo gerada e chega no seu " + (viaWhats ? "WhatsApp" : "e-mail") + " em até 30 minutos.</span>";
}
async function pedePrevia(exemplo) {
  $("#previa").hidden = false;
  if (exemplo) { setTimeout(() => previaPronta(PREVIA_EXEMPLO), 1200); return; }
  const fim = Date.now() + 3 * 60 * 1000;
  let r = await api("previa", { ...estado.lead });
  while (!r.url && (r.status === 202 || r.pendente) && Date.now() < fim) {
    await new Promise((ok) => setTimeout(ok, 6000));
    r = await api("previa", { ...estado.lead, consulta: true });
  }
  if (r.url) previaPronta(r.url); else previaDepois();
}

/* ---------- resultado ---------- */
function mostraResultado(nota, exemplo) {
  $("#resKicker").textContent = exemplo ? "Exemplo de resultado (demonstração)" : "Sua nota";
  $("#notaGeral").textContent = String(nota.nota_geral).replace(".", ",");
  $("#resFrase").textContent = nota.com_fotos_certas || "";
  const box = $("#fotosNota"); box.innerHTML = "";
  nota.fotos.forEach((f, i) => {
    const fig = document.createElement("figure");
    if (i === nota.melhor_indice) fig.className = "melhor"; else if (i === nota.pior_indice) fig.className = "pior";
    fig.innerHTML = `<img alt=""><figcaption></figcaption>`;
    if (estado.fotos[i]) $("img", fig).src = estado.fotos[i];
    $("figcaption", fig).textContent = String(f.nota).replace(".", ",");
    fig.title = [f.ponto_forte, f.ajuste].filter(Boolean).join(" · ");
    box.appendChild(fig);
  });
  $("#errosLista").innerHTML = "";
  nota.erros.forEach((e) => { const li = document.createElement("li"); li.textContent = e; $("#errosLista").appendChild(li); });
  if (CHECKOUT_URL) { const a = $("#ctaCheckout"); a.href = linkCheckout(); a.removeAttribute("aria-disabled"); $("#ctaNota").textContent = "Pagamento seguro pela Payt · PIX na hora."; }
  ir("resultado");
  pedePrevia(exemplo).catch(previaDepois);
}
$("#ctaCheckout").addEventListener("click", (e) => {
  if (!CHECKOUT_URL) { e.preventDefault(); return; }
  e.currentTarget.href = linkCheckout(); // o lead pode ter sido criado depois de montar o resultado
  // Pixel N3w FotoMatch: InitiateCheckout ao abrir o checkout; guarda o preço para o Purchase da obrigado.html.
  try { localStorage.setItem("fm_preco", String(PRECO)); if (estado.lead && estado.lead.id) localStorage.setItem("fm_lead_id", estado.lead.id); } catch { /* sem storage */ }
  try { if (window.fbq) fbq("track", "InitiateCheckout", { content_name: "fotomatch_15_fotos", currency: "BRL", value: PRECO }); } catch { /* */ }
});

const EXEMPLO = {
  nota_geral: 5.4,
  fotos: [{ nota: 6.8 }, { nota: 4.1 }, { nota: 5.3 }],
  melhor_indice: 0, pior_indice: 1,
  erros: [
    "Todas são selfies de braço esticado: falta uma foto de corpo inteiro tirada por outra pessoa.",
    "Luz de cima ou de tela deixa sombra no rosto: prefira luz de janela ou fim de tarde.",
    "Mesmo cenário em todas: varie (rua, café, viagem, esporte) para mostrar como é sua vida.",
  ],
  com_fotos_certas: "Com luz natural, enquadramento de meio corpo e cenários variados, o mesmo rosto passa uma impressão bem mais forte.",
};
