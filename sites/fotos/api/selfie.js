import { json, sb, conferePago } from './_lib.js';
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { erro: 'use POST' });
  const { ref, id, n, img } = req.body || {};
  const c = await conferePago(id);
  if (!c.pago || c.ref !== ref) return json(res, 403, { erro: 'Pagamento ainda não confirmado' });
  const k = parseInt(n, 10); if (!(k >= 1 && k <= 4)) return json(res, 400, { erro: 'n' });
  const m = /^data:image\/(jpeg|png|webp);base64,(.+)$/.exec(img || ''); if (!m) return json(res, 400, { erro: 'Imagem inválida' });
  const bytes = Buffer.from(m[2], 'base64'); if (bytes.length > 3.5e6) return json(res, 413, { erro: 'Imagem grande demais' });
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const up = await sb(`/storage/v1/object/fotos-selfies/${ref}/selfie-${k}-${Date.now()}.${ext}`, { body: new Uint8Array(bytes), headers: { 'Content-Type': 'image/' + m[1] } });
  if (!up.ok) { console.error('upload', up.status, up.txt.slice(0, 300)); return json(res, 502, { erro: 'Falha ao salvar a selfie, tente de novo' }); }
  json(res, 200, { ok: true });
}
