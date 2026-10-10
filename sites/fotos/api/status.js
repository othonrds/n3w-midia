import { json, sb, conferePago } from './_lib.js';
export default async function handler(req, res) {
  const u = new URL(req.url, 'http://x'); const id = u.searchParams.get('id'), ref = u.searchParams.get('ref');
  const c = await conferePago(id);
  if (c.pago && c.ref === ref) await sb('/rest/v1/rpc/fotos_atualizar', { body: { p_ref: ref, p_order: id, p_status: 'pago' } });
  json(res, 200, { pago: !!(c.pago && c.ref === ref), status: c.status || null });
}
