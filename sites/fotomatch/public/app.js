// FotoMatch · LP-quiz (rascunho). Fala só com a Edge Function match-nota (verify_jwt=false; autorização por token do lead).
// ?demo=1 mostra um resultado de EXEMPLO sem chamar a IA (para revisão do Othon na prévia).
const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-nota";
const CHECKOUT_URL = ""; // Checkout Expert: colar aqui o link do checkout PIX (Cakto/Payt) quando existir.
const PRECO = 29.90; // BRL. Oferta "15 fotos com o seu rosto" (mesmo valor do botão e do Purchase em obrigado.html).
const DEMO = new URLSearchParams(location.search).has("demo");
const MIN = 3, MAX = 6;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const estado = { respostas: { segura: [] }, lead: null, fotos: [] };
try { const s = JSON.parse(sessionStorage.getItem("fm_lead") || "null"); if (s && s.id) estado.lead = s; } catch { /* sem storage */ }

const utm = (() => { const p = new URLSearchParams(location.search), o = {};
  ["utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbclid"].forEach((k) => p.get(k) && (o[k] = p.get(k))); return o; })();

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
  // Sem números inventados: o reforço usa a resposta do próprio lead. (Owner: trocar por número real quando tivermos dados.)
  const s = estado.respostas.segura || [];
  if (s.includes("fotos")) {
    $("#reforcoNum").textContent = "1ª foto";
    $("#reforcoTit").textContent = "Você marcou “fotos”. É o que todo mundo vê antes de decidir.";
  } else {
    $("#reforcoNum").textContent = "Antes do papo";
    $("#reforcoTit").textContent = "Antes de qualquer conversa, quem decide é a foto.";
  }
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
  $("#pendenteCod").textContent = n.codigo ? "código: " + n.codigo : (n.erro || "");
  ir("pendente");
});

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
  if (CHECKOUT_URL) { const a = $("#ctaCheckout"); a.href = CHECKOUT_URL; a.removeAttribute("aria-disabled"); $("#ctaNota").textContent = ""; }
  ir("resultado");
}
$("#ctaCheckout").addEventListener("click", (e) => {
  if (!CHECKOUT_URL) { e.preventDefault(); return; }
  // Pixel N3w FotoMatch: InitiateCheckout ao abrir o checkout; guarda o preço para o Purchase da obrigado.html.
  try { localStorage.setItem("fm_preco", String(PRECO)); } catch { /* sem storage */ }
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
