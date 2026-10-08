import { json, sb, conferePago } from './_lib.js';
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { erro: 'use POST' });
  const { ref, id, selfies, estilos } = req.body || {};
  const c = await conferePago(id);
  if (!c.pago || c.ref !== ref) return json(res, 403, { erro: 'Pagamento ainda não confirmado' });
  const r = await sb('/rest/v1/rpc/fotos_atualizar', { body: { p_ref: ref, p_order: id, p_status: 'selfies_recebidas', p_selfies: Math.min(4, parseInt(selfies, 10) || 0), p_estilos: String(estilos || '').slice(0, 300) } });
  if (!r.ok) console.error('finalizar', r.status, r.txt.slice(0, 300));
  json(res, 200, { ok: true });
}
