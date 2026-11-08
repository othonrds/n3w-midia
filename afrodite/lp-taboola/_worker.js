// Cloudflare Pages: site estático + /painel (Painel Tarô, só leitura, com login).
// O login é conferido na edge "painel-tarot" do Supabase; aqui não há senha nem segredo.
const EDGE = 'https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/painel-tarot';
async function edge(auth, body) {
  return fetch(EDGE, { method: 'POST', headers: { 'content-type': 'application/json', authorization: auth || '' }, body: JSON.stringify(body) });
}
async function sha(t) { const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
// sorteio de chip: função pública rota_chip() no Supabase (chave publicável, feita para ficar no navegador)
const SB_REST = 'https://cdtfglylekiyxdmrgbne.supabase.co/rest/v1/rpc/rota_chip_log';
const SB_PUB = 'sb_publishable_CVZTk5jPKg5XAQo6QUJeTQ_YxMAUX7h';
let ultimoChip = '5548999057155';
// conta/BM de origem: ?conta=... no link do anúncio; senão, pelo utm_campaign.
// (08/11) Os anúncios de LP mandam utm_campaign={{campaign.name}} (nome da campanha da Meta, às vezes URL-encoded com "+"),
// não a chave zap_*: por isso 316 cliques de 07/11 caíram em "Origem não identificada". Agora a conta sai do prefixo do nome.
// Regra para conta nova: prefixo no nome das campanhas ([BM1], [TARÔ]…) listado aqui, ou ?conta=Nome no link do anúncio.
// Fora da Meta a conta é a plataforma (a LP manda origem=tiktok/taboola/youtube; o TikTok também usa nomes "[TARÔ] …").
const CONTAS = [
  [/^zap_(roteador|escala|leticia|lp)$/i, 'Sócio · TARÔ - ESCALA'],
  [/^\[TAR[ÔO]\]/i, 'Sócio · TARÔ - ESCALA'],
  [/^\[(BM1|TESTE)\]/i, 'BM 1 · Anúncios Astral Afrodite'],
];
const PLATAFORMAS = { tiktok: 'TikTok · 7702236482601238529', taboola: 'Taboola · Realize 2138505', youtube: 'Google Ads · YouTube', google: 'Google Ads · YouTube' };
function limpa(v) { if (!v) return null; let t = String(v); try { t = decodeURIComponent(t.replace(/\+/g, ' ')); } catch (e) {} t = t.trim().slice(0, 200); return t || null; }
function contaDe(campanha, origem) {
  const plat = PLATAFORMAS[String(origem || '').toLowerCase()];
  if (plat) return plat;
  for (const [re, nome] of CONTAS) if (re.test(campanha || '')) return nome;
  return null;
}
async function rotaChip(info) {
  try {
    const r = await fetch(SB_REST, { method: 'POST', headers: { apikey: SB_PUB, 'content-type': 'application/json' }, body: JSON.stringify(info || {}) });
    const n = String(await r.json() || '').replace(/\D/g, '');
    if (r.ok && n.length >= 12) ultimoChip = n;
  } catch (e) {}
  return ultimoChip;
}
function infoDe(q, via, codigo) {
  const campanha = limpa(q.get('utm_campaign')), origem = q.get('origem') || q.get('utm_source') || null;
  return { p_codigo: codigo || null, p_origem: origem, p_conta: limpa(q.get('conta')) || contaDe(campanha, origem),
    p_campanha: campanha, p_item: limpa(q.get('utm_content') || q.get('ad_id')), p_via: via };
}
function pedeLogin() {
  return new Response('Login necessário.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Painel Taro", charset="UTF-8"', 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // (06/11) /zap → link dos anúncios: sem página nenhuma. Gera o código #XXXXX, registra o clique em segundo plano e já abre o WhatsApp do chip verde (302 direto).
    if (url.pathname === '/zap' || url.pathname === '/zap/') {
      const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const rnd = crypto.getRandomValues(new Uint8Array(5));
      const cod = [...rnd].map((x) => A[x % A.length]).join('');
      const q = url.searchParams;
      const body = JSON.stringify({ codigo: cod, origem: q.get('origem') || 'meta', clid: q.get('fbclid'), campanha: q.get('utm_campaign'), item: q.get('utm_content') || q.get('ad_id'), site: q.get('utm_source') || 'meta', plataforma: q.get('utm_medium') });
      if (!/facebookexternalhit|facebot|meta-externalagent|bot|crawler|spider|preview/i.test(request.headers.get('user-agent') || '')) ctx.waitUntil(fetch('https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/tb-click', { method: 'POST', headers: { 'content-type': 'text/plain' }, body }).catch(() => {}));
      // robôs da Meta (revisão/preview) não contam como clique
      const robo = /facebookexternalhit|facebot|meta-externalagent|bot|crawler|spider|preview/i.test(request.headers.get('user-agent') || '');
      const num = await rotaChip(infoDe(q, robo ? 'robo' : 'zap', cod));
      const msg = 'Olá! Quero minha leitura de tarô 🔮 #' + cod;
      return new Response(null, { status: 302, headers: { location: 'https://wa.me/' + num + '?text=' + encodeURIComponent(msg), 'cache-control': 'no-store' } });
    }
    // (06/11) /w?text=... → sorteia um chip no ar (Painel de Chips) e abre o WhatsApp dele. Chip caiu = sai do sorteio sozinho.
    if (url.pathname === '/w' || url.pathname === '/w/') {
      const txt = url.searchParams.get('text') || '';
      const num = await rotaChip(infoDe(url.searchParams, 'lp', (txt.match(/#([A-Z0-9]{3,8})/) || [])[1]));
      const dest = 'https://wa.me/' + num + (url.searchParams.get('text') ? '?text=' + encodeURIComponent(url.searchParams.get('text')) : '');
      return new Response(null, { status: 302, headers: { location: dest, 'cache-control': 'no-store' } });
    }
    if (url.pathname === '/w/numero') {
      return new Response(JSON.stringify({ numero: await rotaChip({ p_via: 'consulta' }) }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'access-control-allow-origin': '*' } });
    }
    // (08/11) TikTok · aprovar posts: mesmo login do Painel Tarô. A API repassa para a edge posts-publicar,
    // que confere o login de novo e só aceita as ações do painel (tt_lista, tt_creator, tt_preview, tt_aprovar, tt_recusar).
    if (url.pathname === '/tiktok-posts' || url.pathname.startsWith('/tiktok-posts/')) {
      const a = request.headers.get('authorization') || '';
      if (!/^Basic /i.test(a)) return pedeLogin();
      if (url.pathname === '/tiktok-posts/api') {
        if (request.method !== 'POST') return new Response('POST', { status: 405 });
        const corpo = (await request.text()).slice(0, 20000);
        const r = await fetch('https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/posts-publicar', { method: 'POST', headers: { authorization: a, 'content-type': 'application/json' }, body: corpo || '{}' });
        return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
      }
      const ping = await edge(a, { tipo: 'ping' });
      if (ping.status !== 200) return pedeLogin();
      const page = await env.ASSETS.fetch(new Request(new URL('/tiktok-posts/', url), { method: 'GET' }));
      const h = new Headers(page.headers); h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex'); h.delete('etag');
      return new Response(page.body, { status: page.status, headers: h });
    }
    // (06/11) Painel de Chips: mesmo login do Painel Tarô; dados vêm da edge chips-dados (que confere o login de novo)
    if (url.pathname === '/painel-chips' || url.pathname.startsWith('/painel-chips/')) {
      const a = request.headers.get('authorization') || '';
      if (!/^Basic /i.test(a)) return pedeLogin();
      if (url.pathname === '/painel-chips/api') {
        // (08/11) repassa o período { de, ate } do filtro de data (corpo pequeno; o resto a edge ignora)
        const corpo = request.method === 'POST' ? (await request.text()).slice(0, 200) : '';
        const r = await fetch('https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/chips-dados', { method: 'POST', headers: { authorization: a, 'content-type': 'application/json' }, body: corpo || '{}' });
        return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
      }
      const ping = await edge(a, { tipo: 'ping' });
      if (ping.status !== 200) return pedeLogin();
      const page = await env.ASSETS.fetch(new Request(new URL('/painel-chips/', url), { method: 'GET' }));
      const h = new Headers(page.headers); h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex'); h.delete('etag');
      return new Response(page.body, { status: page.status, headers: h });
    }
    if (!url.pathname.startsWith('/painel')) return env.ASSETS.fetch(request);
    const auth = request.headers.get('authorization') || '';
    if (!/^Basic /i.test(auth)) return pedeLogin();
    if (request.method === 'POST' && url.pathname === '/painel/api/d') {
      const body = await request.json().catch(() => ({}));
      // leituras da Meta: uma consulta serve todo mundo por 4 min (menos chamadas = menos "código 17")
      if (body.tipo === 'meta' && !body.fresh) {
        const chave = new Request('https://cache.painel/meta/' + await sha(JSON.stringify([body.caminho, body.parametros || {}])));
        const hit = await caches.default.match(chave);
        if (hit) return hit;
        const r = await edge(auth, body);
        const txt = await r.text();
        let ok = r.status === 200; try { const jx = JSON.parse(txt); if (jx && (jx.error || jx.erro)) ok = false; } catch (_) { ok = false; }
        const res = new Response(txt, { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': ok ? 'public, max-age=240' : 'no-store' } });
        if (ok) await caches.default.put(chave, res.clone());
        return res;
      }
      const r = await edge(auth, body);
      return new Response(r.body, { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
    }
    const ping = await edge(auth, { tipo: 'ping' });
    if (ping.status !== 200) return pedeLogin();
    const page = await env.ASSETS.fetch(new Request(new URL('/painel/', url), { method: 'GET' }));
    const h = new Headers(page.headers); h.set('cache-control', 'no-store'); h.set('x-robots-tag', 'noindex'); h.delete('etag');
    return new Response(page.body, { status: page.status, headers: h });
  },
};
