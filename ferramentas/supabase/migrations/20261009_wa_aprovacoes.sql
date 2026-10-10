-- Aprovação de peças pelo WhatsApp (Central N3w, 09/10/2026)
-- Uma linha por peça enviada ao Othon. A função "whatsapp" grava aqui; o executor copia para o painel
-- (events/<evento_id>) e marca sincronizado_em.
create table if not exists public.wa_aprovacoes (
  id             bigserial primary key,
  wa_id          text        not null,               -- número aprovador (só dígitos)
  peca           text        not null,               -- código da peça
  projeto        text        not null,
  copy           text,
  midia_url      text        not null,
  midia_tipo     text        not null check (midia_tipo in ('image','video')),
  evento_id      text,                               -- id do evento da peça no painel
  status         text        not null default 'enviando'
                 check (status in ('enviando','enviado','aguardando_motivo','aprovado','refazer','erro')),
  motivo         text,
  via            text,                               -- interativa | template
  wamid          text,
  enviado_em     timestamptz,
  respondido_em  timestamptz,
  sincronizado_em timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists wa_aprovacoes_pendentes on public.wa_aprovacoes (status) where sincronizado_em is null;
create index if not exists wa_aprovacoes_wa_status on public.wa_aprovacoes (wa_id, status);
-- só a service role (função) acessa; sem políticas = nenhum acesso por anon/authenticated
alter table public.wa_aprovacoes enable row level security;
