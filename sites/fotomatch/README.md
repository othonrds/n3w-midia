# FotoMatch — MVP em RASCUNHO (Criador de Produtos, 11/10/2026)
Fotos de perfil para apps de namoro (homens, BR). Funil: LP-quiz de 6 telas → WhatsApp/e-mail + aceite → 3–6 fotos → **nota grátis** (IA de visão) → oferta "15 fotos com o seu rosto · R$ 29,90". Specs: `claude/projetos/match-funil-gringo-e-motor.md` (seções 2 e 4), `fotomatch-lp-copy-v1.md`, `match-plano.md`.
**Nada publicado em domínio, sem tráfego, sem geração paga.** Página com `noindex`.

## Peças
- `public/` site estático (sem build): `index.html` + `app.js` + `style.css` + `privacidade.html` (rascunho, falta revisão jurídica). `?demo=1` mostra um resultado de EXEMPLO sem chamar a IA.
- `supabase/001_match.sql` migração aplicada no projeto `cdtfglylekiyxdmrgbne` ("reflex") como `match_001_leads_orders_selfies`:
  `match_leads`, `match_orders`, `match_config` (RLS ligado, sem políticas: só service role), bucket **privado** `match-selfies` (6 MB, jpg/png/webp),
  limpeza de 30 dias: pg_cron diário 04:17 UTC → pg_net → `match-nota {acao:"limpeza"}` com chave no Vault (`match_cron_key`) → Storage API apaga (o Supabase bloqueia DELETE direto em `storage.objects`).
- `supabase/functions/match-nota` (verify_jwt=false, padrão do projeto; autorização por token do lead): `saude`, `lead`, `contato`, `foto`, `nota`, `limpeza`.
  `nota` usa a visão da OpenAI (`OPENAI_API_KEY`, modelo `MATCH_NOTA_MODELO`, padrão gpt-4.1-mini). Sem a chave responde **503 `{erro:"chave pendente", codigo:"chave_pendente"}`** e a página mostra "recebemos suas fotos".
  Avalia só a fotografia (luz, ângulo, expressão, cenário), nunca o físico da pessoa; marca `possivel_menor`, várias pessoas etc. Máx. 3 análises por lead; resultado fica guardado no lead.
- `supabase/functions/match-motor` (verify_jwt=false + exige `Authorization: Bearer <service role>`): **esqueleto** do Motor de Fotos N3W.
  Ações `saude`, `cenas`, `plano` (custo estimado, zero chamadas) e `gerar`. Adaptadores GPT Image (OpenAI), Nano Banana Pro e Seedream 5 Pro (Higgsfield) e QA de rosto (embedding + juiz de visão) só com a estrutura.
  **Trava de verba (card `match-20261011-motor-decisao`)**: `gerar` responde 423 a menos que `match_config.motor.verba_aprovada = true` com `teto_usd_por_rodada > 0` **e** o secret `MATCH_MOTOR_LIBERADO = match-20261011-motor-decisao`. Exige `origem_rosto` = sintetico | voluntario_autorizado | cliente_pago.

## Vercel (precisa do Othon)
Projeto novo (ex.: `n3w-fotomatch`) · Git `othonrds/n3w-midia` · Root Directory `sites/fotomatch` · Framework Other · Output `public` · sem build. Previews por branch saem sozinhos depois disso. Sem domínio até aprovação.

## Pendências
| Item | Dono |
|---|---|
| Colar `OPENAI_API_KEY` em Supabase → Edge Functions → Secrets (nunca no chat) | Othon |
| Criar o projeto Vercel acima (o conector não tem acesso ao time) | Othon |
| Aprovar card do motor (verba + teto) | Othon |
| Link do checkout PIX com bump → `CHECKOUT_URL` em `public/app.js` + webhook gravando em `match_orders` | Checkout Expert |
| 3 pares antes/depois com pessoas fictícias para o topo | Diretor Criativo |
| Pixel do produto + eventos (Lead, ViewContent da nota) | Gestor de Tráfego + Checkout Expert |
| Mensagem de WhatsApp com o resultado (quem tem nota "pendente") | owner-match / operário |
| Número real no reforço (tela 5) quando tivermos dados próprios | owner-match |
| Revisão jurídica da privacidade + contato LGPD | Othon |
| Adaptadores reais (OpenAI images/edits, API Higgsfield) e serviço de embedding de rosto | operário (após aprovação) |
