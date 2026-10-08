import { json, mp, sb, PACOTES } from './_lib.js';
import { randomUUID, randomBytes } from 'node:crypto';
const limpa = (s, n) => String(s || '').replace(/[<>]/g, '').trim().slice(0, n);
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { erro: 'use POST' });
  const b = req.body || {};
  const pac = PACOTES[String(b.pacote)];
  const nome = limpa(b.nome, 80), email = limpa(b.email, 120).toLowerCase(), whats = limpa(b.whats, 20).replace(/\D/g, '');
  if (!pac) return json(res, 400, { erro: 'Pacote inválido' });
  if (nome.length < 2) return json(res, 400, { erro: 'Digite seu nome' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(res, 400, { erro: 'E-mail inválido' });
  if (whats.length < 10) return json(res, 400, { erro: 'WhatsApp com DDD' });
  const ref = 'FA' + randomBytes(5).toString('hex').toUpperCase();
  const r = await mp('/v1/orders', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': randomUUID() },
    body: JSON.stringify({
      type: 'online', processing_mode: 'automatic', external_reference: ref, total_amount: pac.valor,
      description: pac.nome,
      payer: { email, first_name: nome.split(' ')[0] },
      transactions: { payments: [{ amount: pac.valor, payment_method: { id: 'pix', type: 'bank_transfer' } }] },
    }),
  });
  if (!r.ok) { console.error('mp order', r.status, JSON.stringify(r.body).slice(0, 500)); return json(res, 502, { erro: 'Não foi possível gerar o PIX agora. Tente de novo em instantes.' }); }
  const o = r.body; const pm = (o.transactions.payments[0] || {}).payment_method || {};
  const utm = b.utm && typeof b.utm === 'object' ? Object.fromEntries(Object.entries(b.utm).slice(0, 10).map(([k, v]) => [limpa(k, 30), limpa(v, 200)])) : null;
  const s = await sb('/rest/v1/fotos_pedidos', { body: { ref, mp_order_id: o.id, pacote: pac.fotos, valor: pac.valor, nome, email, whats, utm }, headers: { Prefer: 'return=minimal' } });
  if (!s.ok) console.error('sb insert', s.status, s.txt.slice(0, 300));
  json(res, 200, { ref, id: o.id, valor: pac.valor, fotos: pac.fotos, qr: pm.qr_code, qr64: pm.qr_code_base64, ticket: pm.ticket_url });
}
