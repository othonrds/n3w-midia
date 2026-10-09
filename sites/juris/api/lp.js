// Página publicada do advogado, montada no servidor (SEO e prévia no WhatsApp): jurispaginas.com/<slug> → /api/lp?s=<slug>
// Lê só páginas publicadas com a chave publicável (o banco só deixa o público ver páginas publicadas e as colunas da página).
import { CSS, FONTS, AREAS, renderLP, textos, esc } from "../public/lp.js";
const SB = "https://cdtfglylekiyxdmrgbne.supabase.co", KEY = "sb_publishable_CVZTk5jPKg5XAQo6QUJeTQ_YxMAUX7h";

export default async function handler(req, res) {
  const qs = new URL(req.url, "http://x").searchParams;
  let slug = qs.get("s") || "", p = null, host = "";
  const H = { headers: { apikey: KEY, Authorization: "Bearer " + KEY } };
  if (qs.get("dominio")) { // domínio próprio do cliente apontado para a Vercel (pacote Escritório)
    host = String(req.headers["x-forwarded-host"] || req.headers.host || "").toLowerCase().replace(/:\d+$/, "").replace(/^www\./, "");
    if (/^[a-z0-9.-]{4,120}$/.test(host)) {
      const r = await fetch(`${SB}/rest/v1/juris_paginas?or=(dominio.eq.${host},dominio.eq.www.${host})&select=slug,dados,atualizado_em`, H);
      if (r.ok) { [p] = await r.json(); if (p) slug = p.slug; }
    }
  } else if (/^[a-z0-9-]{3,60}$/.test(slug)) {
    const r = await fetch(`${SB}/rest/v1/juris_paginas?slug=eq.${slug}&select=dados,atualizado_em`, H);
    if (r.ok) [p] = await r.json();
  }
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  if (!p) {
    res.statusCode = 404; res.setHeader("Cache-Control", "public, max-age=60");
    return res.end(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Página não encontrada</title><body style="font:16px system-ui;text-align:center;padding:60px 20px;color:#555">Página não encontrada. <a href="https://jurispaginas.com/">Crie a sua no Juris Páginas</a>.</body>`);
  }
  const d = p.dados, o = renderLP(d), t = textos(d), a = AREAS[d.area] || AREAS.familia;
  const titulo = `${d.nome} · ${a.n.replace("Direito ", "Advocacia ")}${d.cidade ? ` em ${d.cidade}/${d.uf}` : ""}`;
  const url = host && p ? `https://${host}/` : `https://jurispaginas.com/${slug}`;
  const ld = { "@context": "https://schema.org", "@type": "LegalService", name: d.nome, description: t.sub, url, areaServed: d.cidade ? `${d.cidade}/${d.uf}` : "BR", ...(d.foto ? { image: d.foto } : {}), ...(d.zap ? { telephone: "+55" + String(d.zap).replace(/\D/g, "") } : {}), ...(d.end ? { address: d.end } : {}) };
  res.statusCode = 200;
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=600");
  res.end(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(titulo)}</title><meta name="description" content="${esc(t.sub)}"><link rel="canonical" href="${url}">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(t.sub)}"><meta property="og:url" content="${url}">${d.foto ? `<meta property="og:image" content="${esc(d.foto)}">` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${FONTS}">
${d.foto ? `<link rel="preload" as="image" href="${esc(d.foto)}">` : ""}
<style>body{margin:0;background:#fff}.selo{font:12px system-ui,sans-serif;text-align:center;padding:10px;color:#888;background:#fafafa}.selo a{color:inherit}${CSS}</style>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
</head><body><div class="${o.cls}" style="${o.style}">${o.html}</div><div class="selo">Página criada com <a href="https://jurispaginas.com/">Juris Páginas</a></div></body></html>`);
}
