(function () {
  const FN = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-copiloto";
  const EV = "https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-evento";
  const $ = (s) => document.querySelector(s);
  const q = new URLSearchParams(location.search), DEMO = q.has("demo"), utm = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach((k) => q.get(k) && (utm[k] = q.get(k)));
  const ls = { get: (k) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* */ } } };
  const SESSAO = ls.get("cp_s") || (() => { const v = Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, "0")).join(""); ls.set("cp_s", v); return v; })();
  let email = ls.get("cp_e") || "";
  const marca = (tela, ordem) => { if (DEMO) return; fetch(EV, { method: "POST", headers: { "Content-Type": "text/plain" }, keepalive: true, body: JSON.stringify({ sessao: SESSAO, pagina: "COPILOTO", tela, ordem, anuncio: utm.utm_content || null }) }).catch(() => {}); };
  const fb = (ev, d) => { try { if (!DEMO && window.fbq) fbq("track", ev, d); } catch { /* */ } };
  const call = (b) => fetch(FN, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(b) }).then((r) => r.json());
  const mostra = (id) => ["envio", "carregando", "resultado"].forEach((s) => ($("#" + s).hidden = s !== id));
  marca("inicio", 0);

  // checkout
  const CK = document.body.dataset.checkout;
  const cta = $("#cta");
  if (CK) { const u = new URL(CK); Object.entries(utm).forEach(([k, v]) => u.searchParams.set(k, v)); u.searchParams.set("src", SESSAO); cta.href = u.toString(); } else cta.href = "#";
  cta.addEventListener("click", (e) => {
    marca("checkout", 9);
    if (window.FMPix && q.get("pg") !== "payt") { // Pix na página (02/11); sem Mercado Pago cai no Payt
      e.preventDefault(); marca("pix", 9);
      FMPix.abrir({ tipo: "copiloto", sessao: SESSAO, email: email || ls.get("fm_email") || "", utm, pagina: "COPILOTO", nome: "Copiloto de Conversa · 30 dias ilimitado", valor: 9.9,
        lembra: (x) => { email = x; ls.set("cp_e", x); ls.set("fm_email", x); },
        onPago: () => { marca("pago", 10); try { sessionStorage.setItem("fo_px_/o/ok-copiloto.html", "1"); } catch { /* */ } location.href = "ok-copiloto.html"; },
        fallback: () => { fb("InitiateCheckout", { content_name: "Copiloto de Conversa", currency: "BRL", value: 9.9 }); location.href = cta.href; } });
      return;
    }
    fb("InitiateCheckout", { content_name: "Copiloto de Conversa", currency: "BRL", value: 9.9 });
  });

  let objetivo = ["continuar", "sair", "seco", "esfriou", "abrir"].includes(q.get("obj")) ? q.get("obj") : "continuar";
  document.querySelectorAll("#obj .chip").forEach((x) => x.setAttribute("aria-pressed", x.dataset.v === objetivo ? "true" : "false"));
  document.querySelectorAll("#obj .chip").forEach((c) => c.addEventListener("click", () => {
    objetivo = c.dataset.v; document.querySelectorAll("#obj .chip").forEach((x) => x.setAttribute("aria-pressed", x === c ? "true" : "false"));
  }));

  let imgs = [];
  const reduz = (f) => new Promise((ok, no) => { const im = new Image(); im.onload = () => {
    const m = 1800, k = Math.min(1, m / Math.max(im.width, im.height)); const c = document.createElement("canvas");
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(im.src); ok(c.toDataURL("image/jpeg", 0.85)); }; im.onerror = no; im.src = URL.createObjectURL(f); });
  $("#arq").addEventListener("change", async (e) => {
    const fs = Array.from(e.target.files || []).slice(0, 4); if (!fs.length) return;
    imgs = (await Promise.all(fs.map(reduz).map((p) => p.catch(() => null)))).filter(Boolean);
    $("#thumbs").innerHTML = imgs.map((u) => `<img src="${u}" alt="">`).join("");
    $("#vai").disabled = !imgs.length; marca("prints", 1);
  });

  const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const FALSO = "Essa resposta está pronta para você copiar e mandar agora";
  function desenha(r) {
    const it = (r.interesse || "").toLowerCase(); const t = $("#rInt");
    t.textContent = { frio: "❄️ Frio", morno: "🌤 Morno", quente: "🔥 Quente" }[it] || it; t.className = "tag " + (it === "quente" ? "bom" : it === "morno" ? "morno" : "ruim");
    $("#rIntP").textContent = r.interesse_porque || "";
    const tm = Math.max(0, Math.min(100, Number(r.termometro) || ({ frio: 25, morno: 55, quente: 85 }[it] || 50)));
    $("#rTermo").textContent = tm; setTimeout(() => { $("#rTermoBar").style.width = tm + "%"; }, 150);
    $("#rSinais").innerHTML = (r.sinais || []).map((x) => `<li class="${x.tipo === "-" ? "n" : "p"}"><b>${x.tipo === "-" ? "–" : "+"}</b><span>${esc(x.texto)}</span></li>`).join("");
    document.querySelectorAll("#rPasso span").forEach((s) => s.classList.toggle("on", s.dataset.p === (r.passo || "vinculo")));
    $("#cReac").hidden = !r.reacao_provavel; $("#rReac").textContent = r.reacao_provavel || ""; $("#rLei").textContent = r.leitura || ""; $("#rErro").textContent = r.erro || "";
    $("#rEst").textContent = r.estrategia || ""; $("#rEvi").textContent = r.evitar || "";
    $("#rResp").innerHTML = (r.respostas || []).map((x) => x.bloqueada
      ? `<div class="resp lock"><p class="r-h">${esc(x.tom)} · 🔒</p><p class="tx"><span class="ini">${esc(x.inicio || "")}</span></p><p class="pq">Resposta pronta + o porquê de funcionar com ela</p></div>`
      : `<div class="resp"><button class="cp" data-t="${esc(x.texto)}">Copiar</button><p class="r-h">${esc(x.tom)}</p><p class="tx">${esc(x.texto)}</p><p class="pq">${esc(x.porque)}</p></div>`).join("");
    document.querySelectorAll(".cp").forEach((b) => b.addEventListener("click", () => { navigator.clipboard?.writeText(b.dataset.t); b.textContent = "Copiado"; marca("copiou", 4); }));
    if (!r.pago) $("#rResp").insertAdjacentHTML("beforeend", `<a class="btn" href="#pague" id="ctaMeio" style="margin:6px 0 4px">Liberar as outras respostas · R$ 9,90</a>`);
    $("#ctaMeio")?.addEventListener("click", () => marca("cta_meio", 6));
    const prox = $("#cProx"); if (r.proximo_passo) { prox.classList.remove("tranca"); $("#rProx").textContent = r.proximo_passo; } else { prox.classList.add("tranca"); $("#rProx").innerHTML = `<span class="tx" style="display:block">${FALSO}, com o passo seguinte</span>`; }
    const conv = $("#cConv"); if (r.convite) { conv.classList.remove("tranca"); $("#rConv").textContent = r.convite; } else { $("#rConv").innerHTML = `<span class="ini">${esc(r.convite_inicio || "")}</span><br><span class="mini">🔒 Convite com dia, lugar e plano B, no seu jeito de escrever</span>`; }
    $("#pague").hidden = !!r.pago; $("#selo").textContent = r.pago ? "Ilimitado ativo" : "1ª análise grátis";
    mostra("resultado"); scrollTo(0, 0);
  }

  $("#vai").addEventListener("click", async () => {
    $("#erro").textContent = ""; mostra("carregando"); marca("analisou", 2); { const ps = ["Lendo quem disse o quê…", "Medindo o interesse dela…", "Achando o erro que travou a conversa…", "Testando 8 respostas no estilo de vocês…", "Escolhendo as 3 melhores…", "Montando o convite pro encontro…"]; let k = 0; clearInterval(window._lt); window._lt = setInterval(() => { const el = $("#loadTxt"); if (el && k < ps.length - 1) el.textContent = ps[++k]; else clearInterval(window._lt); }, 5000); $("#loadTxt") && ($("#loadTxt").textContent = ps[0]); }
    try {
      const r = await call({ acao: "analisar", sessao: SESSAO, email, imagens: imgs, objetivo, contexto: $("#ctx").value, anuncio: utm.utm_content || null });
      if (r.bloqueado) { mostra("envio"); $("#pague").hidden = false; $("#pague").scrollIntoView({ behavior: "smooth" }); marca("paywall", 5); return; }
      if (r.fora_do_escopo) { mostra("envio"); $("#erro").textContent = "Não consegui ler uma conversa nesses prints. Mande o print da conversa (app, WhatsApp ou Instagram) ou do perfil dela."; return; }
      if (r.erro) { mostra("envio"); $("#erro").textContent = r.erro; return; }
      desenha(r); marca("resultado", 3); if (!r.pago) { marca("paywall", 5); fb("Lead", { content_name: "Copiloto" }); }
    } catch { mostra("envio"); $("#erro").textContent = "Sem conexão. Tente de novo."; }
  });
  $("#outro").addEventListener("click", () => { imgs = []; $("#thumbs").innerHTML = ""; $("#arq").value = ""; $("#vai").disabled = true; mostra("envio"); scrollTo(0, 0); });
  $("#entrar").addEventListener("click", async () => {
    const e = $("#email").value.trim(); if (!e) return; $("#emailMsg").textContent = "Verificando…";
    try { const r = await call({ acao: "acesso", email: e, sessao: SESSAO });
      if (r.ativo) { email = r.email; ls.set("cp_e", email); $("#emailMsg").textContent = "✓ Copiloto liberado. Mande seus prints."; $("#selo").textContent = "Ilimitado ativo"; $("#pague").hidden = true; mostra("envio"); scrollTo(0, 0); }
      else $("#emailMsg").textContent = "Ainda não achei pagamento nesse e-mail. Se acabou de pagar, espere 1 minuto e tente de novo.";
    } catch { $("#emailMsg").textContent = "Sem conexão. Tente de novo."; }
  });
  if (!DEMO) call({ acao: "acesso", email, sessao: SESSAO }).then((r) => { if (r.ativo) $("#selo").textContent = "Ilimitado ativo"; }).catch(() => {});
  if (DEMO && q.get("demo") === "res") desenha({ pago: false, interesse: "morno", termometro: 58, passo: "vinculo", sinais: [{ tipo: "+", texto: "Ela devolveu a pergunta (\"e você?\"): quer continuar falando" }, { tipo: "+", texto: "Respondeu em menos de 10 min nas 3 últimas" }, { tipo: "-", texto: "Mensagens curtas e um \"kkkkk verdade\" sem assunto novo" }], reacao_provavel: "Ela deve rir e te mandar o lugar que ela mais gostou em Salvador.", convite_inicio: "sexta eu vou", interesse_porque: "Ela responde rápido e devolve pergunta, mas com mensagens curtas.",
    leitura: "A conversa está viva, mas virou entrevista: você pergunta, ela responde e devolve.", erro: "Três perguntas seguidas sem contar nada sobre você.",
    estrategia: "Pare de perguntar e conte algo seu ligado ao que ela falou da viagem. Isso dá assunto para ela e abre espaço para um convite.",
    evitar: "Não mande outra pergunta sobre trabalho.",
    respostas: [{ tom: "Leve", texto: "salvador sem acarajé não conta, então já vou considerar q vc me deve uma indicação", porque: "Pega o assunto DELA (a viagem) e cria uma dívida brincalhona entre vocês: é o passo 2 do 3V, vínculo. E sai do modo entrevista." }, { tom: "Ousada", bloqueada: true, inicio: "aposto que vc" }, { tom: "Direta", bloqueada: true, inicio: "bora resolver isso" }] });
})();
