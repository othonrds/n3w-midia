// Motor de Fotos N3W — GENÉRICO (Supabase Edge Function "match-motor", v6, 11/10/2026).
// Atende vários produtos com a mesma função: os pacotes de cenas ficam nas tabelas
//   public.motor_produtos (estilo, nº de fotos do pacote, candidatas, qualidade, tamanho) e
//   public.motor_cenas    (cenas por produto: match, aniversario, ...).
// Geração: gpt-image-2 (OpenAI) via a função n3w-imagens, com referências (selfies) e input_fidelity=high.
// Fila: public.match_motor_jobs (lote, produto, deps/refs). Cada chamada "processar" pega 1 job pelo
// public.motor_claim(lote, teto, margem), que nunca deixa o gasto do lote passar do teto.
// QA: juiz de visão (gpt-4.1-mini) compara a 1ª referência com a foto gerada → fidelidade 0–10, realismo, defeitos.
//
// TRAVA DE VERBA (duas chaves, de propósito):
//   1) match_config 'motor': verba_aprovada = true e teto_usd_por_rodada > 0
//   2) secret MATCH_MOTOR_LIBERADO = CARD  — OU a liberação de teste abaixo (só o lote do teste e só até LIBERACAO_TESTE.ate)
// E um teto rígido no código: TETO_MAX_USD por lote, qualquer que seja o valor no banco.
// Autorização: Authorization: Bearer <SERVICE_ROLE_KEY> ou x-token = match_config.motor.token.
// Rostos: só "sintetico" (gerado por IA), "voluntario_autorizado" (autorização escrita) ou "cliente_pago".

const SB = Deno.env.get('SUPABASE_URL')!;
const SK = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OPENAI = Deno.env.get('OPENAI_API_KEY') || '';
const CARD = 'match-20261011-motor-decisao';
const SECRET_OK = Deno.env.get('MATCH_MOTOR_LIBERADO') === CARD;
// Aprovação do Othon (evento match-20261011-motor-teste): até US$ 6 na OpenAI, só para este teste.
const LIBERACAO_TESTE = { lote: 'match-motor-teste', ate: Date.parse('2026-10-12T12:00:00Z') };
const TETO_MAX_USD = 6;          // travado no código
const MARGEM_USD = 0.30;         // reserva por job em andamento (sobe sozinha para 1,25× o maior custo visto)
const BUCKET = 'match-selfies';
const JUIZ_MODELO = 'gpt-4.1-mini';
const ORIGENS = ['sintetico', 'voluntario_autorizado', 'cliente_pago'];

const J = (o: unknown, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const H = { apikey: SK, Authorization: 'Bearer ' + SK, 'Content-Type': 'application/json' };

async function rest(path: string, opts: { method?: string; body?: unknown; prefer?: string } = {}) {
  const r = await fetch(SB + '/rest/v1/' + path, { method: opts.method || 'GET', headers: { ...H, Prefer: opts.prefer || 'return=representation' }, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
  const t = await r.text(); let d: any = null; try { d = t ? JSON.parse(t) : null; } catch { d = t; }
  if (!r.ok) console.error('rest', path.split('?')[0], r.status, String(t).slice(0, 300));
  return { ok: r.ok, data: d };
}
const patchJob = (id: string, body: Record<string, unknown>) => rest('match_motor_jobs?id=eq.' + encodeURIComponent(id), { method: 'PATCH', body, prefer: 'return=minimal' });

/* ---------- custo (US$) ---------- */
// Tabela conservadora (preço do gpt-image-1, maior que o do gpt-image-2): texto 5/M, imagem entrada 10/M, imagem saída 40/M.
function custoImagem(u: any): number {
  if (!u) return MARGEM_USD;
  const it = u.input_tokens_details?.image_tokens ?? 0;
  const tt = u.input_tokens_details?.text_tokens ?? Math.max(0, (u.input_tokens ?? 0) - it);
  const ot = u.output_tokens ?? 0;
  return +(tt * 5e-6 + it * 10e-6 + ot * 40e-6).toFixed(4);
}
const custoJuiz = (u: any) => (u ? +((u.prompt_tokens ?? 0) * 0.4e-6 + (u.completion_tokens ?? 0) * 1.6e-6).toFixed(5) : 0.002);

/* ---------- config ---------- */
async function cfgMotor() { return (await rest("match_config?chave=eq.motor&select=valor")).data?.[0]?.valor || {}; }
async function trava(lote?: string) {
  const cfg = await cfgMotor();
  const banco = cfg.verba_aprovada === true && Number(cfg.teto_usd_por_rodada) > 0;
  const testeOk = !!lote && lote === LIBERACAO_TESTE.lote && Date.now() < LIBERACAO_TESTE.ate;
  const teto = Math.min(Number(cfg.teto_usd_por_rodada) || 0, TETO_MAX_USD);
  return { liberado: banco && (SECRET_OK || testeOk) && !!OPENAI, banco, secret: SECRET_OK, liberacao_teste: testeOk, teto_usd: teto, teto_max_codigo: TETO_MAX_USD, card: CARD, chave_openai: !!OPENAI };
}
async function produto(id: string) {
  const p = (await rest('motor_produtos?produto=eq.' + encodeURIComponent(id) + '&ativo=is.true&select=*')).data?.[0];
  if (!p) return null;
  const cenas = (await rest('motor_cenas?produto=eq.' + encodeURIComponent(id) + '&ativo=is.true&select=id,nome,prompt,ordem&order=ordem')).data || [];
  return { ...p, cenas };
}
export function promptCena(p: any, cena: any) {
  return `Photo of the EXACT SAME person shown in the reference images. Preserve facial identity precisely: same face shape, eyes, nose, mouth, eyebrows, hairline, hair, facial hair and skin tone; do not beautify or change the face. Scene: ${p.sujeito === 'he' ? 'he is' : p.sujeito + ' is'} ${cena.prompt}. ${p.estilo}`;
}

/* ---------- storage ---------- */
async function assinar(path: string, seg = 900) {
  const r = await fetch(`${SB}/storage/v1/object/sign/${BUCKET}/${path}`, { method: 'POST', headers: H, body: JSON.stringify({ expiresIn: seg }) });
  if (!r.ok) return null; const j = await r.json(); return j.signedURL ? SB + '/storage/v1' + j.signedURL : null;
}
async function subir(path: string, bin: Uint8Array) {
  const r = await fetch(`${SB}/storage/v1/object/${BUCKET}/${path}`, { method: 'POST', headers: { apikey: SK, Authorization: 'Bearer ' + SK, 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: bin });
  if (!r.ok) throw new Error('upload ' + r.status + ' ' + (await r.text()).slice(0, 200));
}

/* ---------- juiz de visão ---------- */
async function juiz(refUrl: string, b64: string) {
  const prompt = 'You are the QA checker of an AI photo generator. Image 1 is the reference portrait of a SYNTHETIC character (AI-generated, not a real person). Image 2 is a new generated photo that must show the same character. ' +
    'Do not identify anyone. Only rate visual consistency. Reply ONLY JSON: {"fidelidade": 0-10 (how consistent the facial features are: face shape, eyes, nose, mouth, eyebrows, hairline, hair, facial hair, skin tone, marks), ' +
    '"realismo": 0-10 (looks like a real amateur phone photo, not AI/plastic), "defeitos": [short strings: hands, eyes, teeth, text, anatomy, background], "comentario": "max 20 words in Portuguese"}';
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { Authorization: 'Bearer ' + OPENAI, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: JUIZ_MODELO, temperature: 0, max_tokens: 300, response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: refUrl, detail: 'high' } }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64, detail: 'high' } }] }] }),
  });
  if (!r.ok) return { erro: 'juiz ' + r.status, custo: 0 };
  const j = await r.json();
  let res: any = {}; try { res = JSON.parse(j.choices?.[0]?.message?.content || '{}'); } catch { /* */ }
  return { ...res, custo: custoJuiz(j.usage) };
}

/* ---------- worker ---------- */
async function rodar(job: any) {
  const t0 = Date.now();
  let custo = 0;
  try {
    const p = await produto(job.produto || 'match');
    const paths: string[] = [];
    if (job.deps?.length) {
      const ds = (await rest('match_motor_jobs?select=id,path&id=in.(' + job.deps.map((d: string) => '"' + d + '"').join(',') + ')')).data || [];
      for (const d of job.deps) { const x = ds.find((y: any) => y.id === d)?.path; if (!x) throw new Error('ref sem path ' + d); paths.push(x); }
    }
    paths.push(...(job.refs || []));
    const urls = (await Promise.all(paths.map((x) => assinar(x)))) as string[];
    if (urls.some((u) => !u)) throw new Error('não assinei as referências');
    let r: Response;
    try {
      r = await fetch(SB + '/functions/v1/n3w-imagens', {
        method: 'POST', headers: { Authorization: 'Bearer ' + SK, 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(170_000),
        body: JSON.stringify({ prompt: job.prompt, size: p?.tamanho || '1024x1536', quality: p?.qualidade || 'medium', referencias: urls, input_fidelity: urls.length ? 'high' : undefined, output_format: 'jpeg', output_compression: 90 }),
      });
    } catch (e) { custo = MARGEM_USD; throw new Error('n3w-imagens sem resposta (margem contada como gasto): ' + String(e)); }
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.b64) { custo = j.openai_status ? 0 : MARGEM_USD; throw new Error('n3w-imagens ' + r.status + ': ' + String(j.erro || '').slice(0, 300)); }
    custo = custoImagem(j.uso);
    const bin = Uint8Array.from(atob(j.b64), (c) => c.charCodeAt(0));
    const path = `motor/${job.lote}/${job.id}.jpg`;
    await subir(path, bin);
    let q: any = null;
    if (job.etapa !== 'base' && urls[0]) { q = await juiz(urls[0], j.b64); custo += q.custo || 0; }
    await patchJob(job.id, { status: 'done', path, modelo: j.modelo, uso: { ...(j.uso || {}), ms_openai: j.ms, parametros: j.parametros }, custo: +custo.toFixed(4), ms: Date.now() - t0, terminado: new Date().toISOString(), erro: null, juiz: q, fidelidade: typeof q?.fidelidade === 'number' ? q.fidelidade : null });
  } catch (e) {
    await patchJob(job.id, { status: 'erro', erro: String((e as Error)?.message || e).slice(0, 500), ms: Date.now() - t0, custo: +((Number(job.custo) || 0) + custo).toFixed(4) });
  }
}

/* ---------- ações ---------- */
function plano(p: any, b: any) {
  const rostos = Math.max(1, Math.min(10, Number(b.rostos) || 1));
  const cenas = (Array.isArray(b.cenas) && b.cenas.length ? p.cenas.filter((c: any) => b.cenas.includes(c.id)) : p.cenas);
  const cand = Math.max(1, Math.min(4, Number(b.candidatas) || p.candidatas));
  return { produto: p.produto, rostos, cenas: cenas.map((c: any) => ({ id: c.id, nome: c.nome })), candidatas: cand, geracoes: rostos * cenas.length * cand };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return J({ erro: 'use POST' }, 405);
  let b: any = {}; try { b = await req.json(); } catch { /* vazio */ }
  const auth = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const tok = req.headers.get('x-token') || '';
  const cfg = await cfgMotor();
  if (!(auth && auth === SK) && !(tok && cfg.token && tok === cfg.token)) return J({ erro: 'só o servidor chama o motor' }, 401);
  const lote = String(b.lote || '').slice(0, 80);
  switch (b.acao) {
    case 'saude':
      return J({ trava: await trava(lote), produtos: ((await rest('motor_produtos?select=produto,nome,ativo')).data || []) });
    case 'cenas': {
      const p = await produto(String(b.produto || 'match')); if (!p) return J({ erro: 'produto desconhecido' }, 404);
      return J({ produto: p.produto, cenas: p.cenas.map((c: any) => ({ id: c.id, nome: c.nome, prompt: promptCena(p, c) })) });
    }
    case 'plano': {
      const p = await produto(String(b.produto || 'match')); if (!p) return J({ erro: 'produto desconhecido' }, 404);
      return J({ plano: plano(p, b), trava: await trava(lote) });
    }
    case 'enfileirar': {
      // {produto, lote, rosto, origem_rosto, refs:[paths no bucket], cenas?:[], candidatas?}
      if (!ORIGENS.includes(String(b.origem_rosto))) return J({ erro: 'origem_rosto obrigatória: ' + ORIGENS.join(' | ') }, 400);
      const p = await produto(String(b.produto || 'match')); if (!p) return J({ erro: 'produto desconhecido' }, 404);
      if (!/^[a-z0-9-]{3,80}$/.test(lote)) return J({ erro: 'lote inválido' }, 400);
      const rosto = String(b.rosto || '').replace(/[^a-z0-9-]/gi, '').slice(0, 40); if (!rosto) return J({ erro: 'rosto obrigatório' }, 400);
      const refs: string[] = (Array.isArray(b.refs) ? b.refs : []).map(String).filter((x: string) => !x.includes('..')).slice(0, 6);
      if (refs.length < 1) return J({ erro: 'mínimo 1 referência' }, 400);
      const pl = plano(p, b);
      const rows: any[] = [];
      for (let k = 1; k <= pl.candidatas; k++) pl.cenas.forEach((c: any, i: number) => {
        const cena = p.cenas.find((x: any) => x.id === c.id);
        rows.push({ id: `${lote}-${rosto}-${c.id}-${k}`, lote, produto: p.produto, etapa: 'cena', rosto, cena: c.id, cand: k, ordem: 1000 + (k - 1) * 100 + i, prompt: promptCena(p, cena), deps: [], refs });
      });
      const r = await rest('match_motor_jobs?on_conflict=id', { method: 'POST', body: rows, prefer: 'resolution=ignore-duplicates,return=minimal' });
      return J({ ok: r.ok, jobs: rows.length, plano: pl });
    }
    case 'processar': {
      const t = await trava(lote);
      if (!t.liberado) return J({ erro: 'verba não aprovada ou lote não liberado', detalhe: 'Nenhuma API paga foi chamada.', trava: t }, 423);
      const r = await rest('rpc/motor_claim', { method: 'POST', body: { p_lote: lote, p_teto: t.teto_usd, p_margem: MARGEM_USD } });
      const job = r.data?.[0];
      if (!job) return J({ ok: true, nada: true });
      // @ts-ignore EdgeRuntime existe no Supabase
      EdgeRuntime.waitUntil(rodar(job));
      return J({ ok: true, job: job.id });
    }
    case 'resumo': {
      const rows = (await rest('match_motor_jobs?lote=eq.' + encodeURIComponent(lote) + '&select=etapa,status,custo,ms,fidelidade')).data || [];
      const done = rows.filter((x: any) => x.status === 'done');
      const soma = (a: any[], k: string) => a.reduce((s, x) => s + (Number(x[k]) || 0), 0);
      const cenas = done.filter((x: any) => x.etapa === 'cena');
      return J({ lote, jobs: rows.length, feitos: done.length, erros: rows.filter((x: any) => x.status === 'erro').length, gasto_usd: +soma(rows, 'custo').toFixed(4),
        custo_medio_cena_usd: cenas.length ? +(soma(cenas, 'custo') / cenas.length).toFixed(4) : null, ms_medio: done.length ? Math.round(soma(done, 'ms') / done.length) : null,
        fidelidade_media: cenas.filter((x: any) => x.fidelidade != null).length ? +(soma(cenas, 'fidelidade') / cenas.filter((x: any) => x.fidelidade != null).length).toFixed(2) : null });
    }
  }
  return J({ erro: 'ação desconhecida (saude | cenas | plano | enfileirar | processar | resumo)' }, 400);
});
