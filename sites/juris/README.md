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

Webhook do Mercado Pago (Suas integrações → Webhooks, evento "Order"): `https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/juris?fonte=mp`. Confirma o pedido e publica as páginas mesmo se o cliente pagar no app do banco e não voltar ao site.

## Purchase no servidor (Meta Conversions API)
Quando o Pix é confirmado (webhook ou tela de pagamento), a função envia `Purchase` para o pixel 982748768192003 com `event_id` = ref do pedido (o mesmo `eventID` do pixel no navegador, então a Meta deduplica). Vai com e-mail e telefone em SHA-256, `_fbp`/`_fbc`, IP e navegador gravados no pedido. Envia uma vez só por pedido (`capi_sent_at`).
Segredos da função: `JURIS_CAPI_TOKEN` (token do pixel; se faltar, usa `META_CAPI_TOKEN`), opcional `META_TEST_EVENT_CODE` (só durante o teste: com ele os eventos vão para a aba Test Events e não contam como venda). SQL das colunas: `supabase/002_juris_pedidos_capi.sql`.

## Painel do cliente
Link privado `/?ref=JP…&t=…` mostrado depois do pagamento (sem senha na v1). Cria as páginas 2 e 3 e edita tudo.
