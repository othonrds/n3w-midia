# jurispaginas.com — gerador de landing pages para advogados (v1, 08/10/2026)
Dono: chat JURISPAGES (projeto Central N3w). Oferta: 3 páginas por R$ 39,90 (Pix) + bump 3 fotos profissionais R$ 29,90.

## Peças
- `public/` site estático (sem build): `index.html` + `app.js` (gerador → prévia com marca d'água → personalizar → checkout Pix → painel), `lp.js` (desenho da página do advogado, usado no navegador e no servidor), `p.html` (página publicada renderizada no navegador, para prévias), termos e privacidade (rascunhos, falta revisão jurídica).
- `api/lp.js` página publicada montada no servidor: `jurispaginas.com/<slug>` → `/api/lp?s=<slug>` (rewrite no `vercel.json`). `api/config.js` liga o pixel quando `META_PIXEL_ID` existir.
- `supabase/functions/juris/index.ts` backend (Supabase "reflex", função `juris`, verify_jwt=false): rascunho, midia, pedido, status, painel, salvar. Usa a service role automática.
- Banco: `juris_paginas`, `juris_pedidos` (RLS; público só lê páginas publicadas e só as colunas da página), bucket público `juris-midia`.

## Vercel
Projeto novo (ex.: n3w-juris) · Root Directory `sites/juris` · Framework Other · Output `public` · sem build. Domínios: jurispaginas.com e www.
Variável opcional: `META_PIXEL_ID`.

## Pagamento
`MP_ACCESS_TOKEN` vai em Supabase → Edge Functions → Secrets (não na Vercel). Sem ele, o site roda em MODO TESTE (Pix simulado, botão "Simular pagamento"). Com ele, o modo teste some sozinho.
A mesma conta Mercado Pago do fotos: o bump de fotos cria um pedido em `fotos_pedidos` com a mesma ref, e a página fotos.jurispaginas.com/pedido.html confere o pagamento por ela (precisa da tabela `fotos_pedidos`, SQL em sites/fotos/supabase).

## Painel do cliente
Link privado `/?ref=JP…&t=…` mostrado depois do pagamento (sem senha na v1). Cria as páginas 2 e 3 e edita tudo.
