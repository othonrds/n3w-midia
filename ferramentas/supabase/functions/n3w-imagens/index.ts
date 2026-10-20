// Gerador de imagens da Central N3w (OpenAI). A chave fica SO no segredo OPENAI_API_KEY do Supabase.
// v5 (11/10): opcionais input_fidelity, output_format, output_compression (com nova tentativa sem eles se a API
// recusar o parametro), extensao da referencia pelo content-type e tempo (ms) na resposta. Compativel com v4.
const SIZES = new Set(['1024x1024', '1024x1536', '1536x1024', 'auto']);
const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
type Ref = { blob: Blob; ext: string };

async function chamar(modelo: string, b: { prompt: string; size: string; quality: string }, refs: Ref[], extra: Record<string, string>) {
  const key = Deno.env.get('OPENAI_API_KEY')!;
  if (!refs.length) {
    const body: Record<string, unknown> = { model: modelo, prompt: b.prompt, size: b.size, quality: b.quality, n: 1 };
    if (extra.output_format) body.output_format = extra.output_format;
    if (extra.output_compression) body.output_compression = Number(extra.output_compression);
    return fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  const fd = new FormData();
  fd.append('model', modelo); fd.append('prompt', b.prompt); fd.append('size', b.size); fd.append('quality', b.quality); fd.append('n', '1');
  for (const [k, v] of Object.entries(extra)) fd.append(k, v);
  refs.forEach((r, i) => fd.append('image[]', r.blob, 'ref' + i + '.' + r.ext));
  return fetch('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: 'Bearer ' + key }, body: fd });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const temChave = !!Deno.env.get('OPENAI_API_KEY');
  const modeloPedido = Deno.env.get('OPENAI_IMAGE_MODEL') || 'gpt-image-2';
  if (req.method === 'GET' || url.pathname.endsWith('/status')) return J({ ok: true, temChave, modelo: modeloPedido });
  if (req.method !== 'POST') return J({ erro: 'use POST' }, 405);
  if (!temChave) return J({ erro: 'OPENAI_API_KEY nao configurada nos segredos do Supabase' }, 503);
  let x: any; try { x = await req.json(); } catch { return J({ erro: 'json invalido' }, 400); }
  if (typeof x.prompt !== 'string' || x.prompt.length < 5 || x.prompt.length > 8000) return J({ erro: 'prompt invalido' }, 400);
  const b = { prompt: x.prompt, size: SIZES.has(x.size) ? x.size : '1024x1536', quality: ['low', 'medium', 'high', 'auto'].includes(x.quality) ? x.quality : 'high' };
  const refs: Ref[] = [];
  for (const u of (Array.isArray(x.referencias) ? x.referencias.slice(0, 8) : [])) {
    if (typeof u !== 'string' || !u.startsWith('https://')) return J({ erro: 'referencia invalida' }, 400);
    const r = await fetch(u); if (!r.ok) return J({ erro: 'nao baixei a referencia' }, 400);
    const ct = r.headers.get('content-type') || 'image/png';
    refs.push({ blob: new Blob([await r.arrayBuffer()], { type: ct }), ext: /jpe?g/.test(ct) ? 'jpg' : /webp/.test(ct) ? 'webp' : 'png' });
  }
  const extra: Record<string, string> = {};
  if (refs.length && ['high', 'low'].includes(x.input_fidelity)) extra.input_fidelity = x.input_fidelity;
  if (['jpeg', 'png', 'webp'].includes(x.output_format)) extra.output_format = x.output_format;
  if (extra.output_format && extra.output_format !== 'png' && Number(x.output_compression) > 0) extra.output_compression = String(Math.min(100, Math.round(Number(x.output_compression))));
  const t0 = Date.now();
  let modelo = modeloPedido;
  let usados = { ...extra };
  let r = await chamar(modelo, b, refs, usados);
  if (!r.ok && r.status === 400 && Object.keys(usados).length) {
    const t = await r.clone().text();
    // gpt-image-2 recusa input_fidelity (sempre alta fidelidade): tira só o parâmetro recusado (400 não é cobrado)
    if (/input_fidelity/i.test(t) && usados.input_fidelity) { delete usados.input_fidelity; r = await chamar(modelo, b, refs, usados); }
    else if (/output_format|output_compression|unknown parameter|not supported/i.test(t)) { usados = {}; r = await chamar(modelo, b, refs, usados); }
  }
  if (!r.ok && r.status === 400 && Object.keys(usados).length) {
    const t = await r.clone().text();
    if (/output_format|output_compression|unknown parameter|not supported/i.test(t)) { usados = {}; r = await chamar(modelo, b, refs, usados); }
  }
  if (!r.ok) {
    const t = await r.clone().text();
    if (r.status === 404 || (r.status === 400 && /model/i.test(t))) { modelo = 'gpt-image-1'; r = await chamar(modelo, b, refs, usados); }
  }
  const j = await r.json();
  if (!r.ok) return J({ erro: j?.error?.message || 'erro OpenAI', modelo, openai_status: r.status }, r.status);
  return J({ modelo, b64: j.data[0].b64_json, uso: j.usage || null, ms: Date.now() - t0, parametros: Object.keys(usados) });
});
