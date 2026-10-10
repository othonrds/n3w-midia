// Utilidades do checkout Fotos (Vercel Functions, Node 18+).
// Segredos só em variáveis da Vercel: MP_ACCESS_TOKEN. A chave do Supabase abaixo é a PUBLICÁVEL (feita para ficar no navegador);
// o banco só deixa inserir pedidos/selfies e atualizar status por função que exige ref + id do pedido no Mercado Pago.
export const SB_URL = 'https://cdtfglylekiyxdmrgbne.supabase.co';
export const SB_KEY = 'sb_publishable_CVZTk5jPKg5XAQo6QUJeTQ_YxMAUX7h';
export const PACOTES = { '3': { valor: '39.90', fotos: 3, nome: '3 fotos profissionais' }, '15': { valor: '89.00', fotos: 15, nome: '15 fotos profissionais' } };

export function json(res, code, obj) { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.setHeader('Cache-Control', 'no-store'); res.end(JSON.stringify(obj)); }

export async function mp(path, opts = {}) {
  const r = await fetch('https://api.mercadopago.com' + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + process.env.MP_ACCESS_TOKEN, 'Content-Type': 'application/json', accept: 'application/json', ...(opts.headers || {}) },
  });
  let body = null; try { body = await r.json(); } catch {}
  return { ok: r.ok, status: r.status, body };
}

export async function sb(path, { method = 'POST', body, headers = {} } = {}) {
  const r = await fetch(SB_URL + path, {
    method,
    headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : (typeof body === 'string' || body instanceof Uint8Array ? body : JSON.stringify(body)),
  });
  let txt = ''; try { txt = await r.text(); } catch {}
  return { ok: r.ok, status: r.status, txt };
}

// Pedido pago? Confere SEMPRE no Mercado Pago (fonte da verdade).
export async function conferePago(orderId) {
  if (!/^[A-Za-z0-9_-]{6,64}$/.test(orderId || '')) return { pago: false, erro: 'id' };
  const r = await mp('/v1/orders/' + orderId);
  if (!r.ok) return { pago: false, erro: 'mp ' + r.status };
  const o = r.body || {}; const p = (o.transactions && o.transactions.payments && o.transactions.payments[0]) || {};
  const pago = o.status === 'processed' || p.status === 'processed' || o.status_detail === 'accredited' || p.status_detail === 'accredited';
  return { pago, status: o.status, detalhe: o.status_detail, ref: o.external_reference, valor: o.total_amount };
}
