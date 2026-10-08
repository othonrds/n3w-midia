import { json, mp } from './_lib.js';
export default async function handler(req, res) {
  const temToken = !!process.env.MP_ACCESS_TOKEN;
  let mpOk = false, conta = null;
  if (temToken) { const r = await mp('/users/me'); mpOk = r.ok; if (r.ok) conta = { site: r.body.site_id, pais: r.body.country_id }; }
  json(res, 200, { site: 'fotos', mp_token_configurado: temToken, mp_public_key_configurada: !!process.env.MP_PUBLIC_KEY, mp_ok: mpOk, conta, pixel: !!process.env.META_PIXEL_ID });
}
