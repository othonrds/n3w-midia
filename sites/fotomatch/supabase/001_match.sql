-- FotoMatch (MATCH) · migração 001 · projeto Supabase cdtfglylekiyxdmrgbne ("reflex")
-- Aplicada pelo Criador de Produtos em 11/10/2026 como "match_001_leads_orders_selfies".
-- Tudo fechado por RLS (sem políticas para anon/authenticated): só as Edge Functions
-- match-nota e match-motor (service role) leem e escrevem.

create table if not exists public.match_leads (
  id uuid primary key default gen_random_uuid(),
  token text not null,                          -- segredo do lead (vai só para o navegador dele)
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  idade text, trava text, objetivo text, segura text[],   -- respostas do quiz
  whats text, email text,
  consentimento boolean not null default false, consentimento_em timestamptz,
  fotos text[] not null default '{}',           -- paths no bucket match-selfies (<lead_id>/<arquivo>)
  nota jsonb, nota_em timestamptz, nota_tentativas int not null default 0,
  status text not null default 'quiz' check (status in ('quiz','contato','fotos','nota','checkout','cliente','apagado')),
  utm jsonb,
  fotos_apagadas_em timestamptz
);
create index if not exists match_leads_criado_idx on public.match_leads (criado_em);
alter table public.match_leads enable row level security;

create table if not exists public.match_orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,                     -- ex.: FM + 10 hex
  lead_id uuid references public.match_leads(id) on delete set null,
  criado_em timestamptz not null default now(),
  pacote text not null default 'p15',
  valor numeric(10,2) not null,
  bump_bio boolean not null default false,
  gateway text,                                 -- cakto | payt | mp (definir com o Checkout Expert)
  gateway_id text,
  status text not null default 'aguardando_pagamento'
    check (status in ('aguardando_pagamento','pago','em_producao','entregue','refacao','reembolsado','cancelado')),
  pago_em timestamptz, entregue_em timestamptz,
  nome text, email text, whats text,
  cenas text[],
  motor jsonb,                                  -- modelo usado, custo, candidatas, QA
  entrega jsonb,                                -- paths das fotos entregues
  utm jsonb, teste boolean not null default true
);
create index if not exists match_orders_lead_idx on public.match_orders (lead_id);
alter table public.match_orders enable row level security;

-- Configuração do motor: trava de verba (card match-20261011-motor-decisao).
create table if not exists public.match_config (
  chave text primary key, valor jsonb not null, atualizado_em timestamptz not null default now()
);
alter table public.match_config enable row level security;
insert into public.match_config (chave, valor) values
  ('motor', '{"verba_aprovada": false, "card": "match-20261011-motor-decisao", "teto_usd_por_rodada": 0}'::jsonb)
on conflict (chave) do nothing;

-- Bucket PRIVADO das selfies (nunca público; leitura só por URL assinada gerada no servidor).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('match-selfies', 'match-selfies', false, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false;

-- Limpeza de 30 dias. O Supabase bloqueia DELETE direto em storage.objects, então:
-- pg_cron (diário) -> pg_net -> match-nota {acao:"limpeza"} com chave guardada no Vault -> Storage API apaga.
create or replace function public.match_selfies_vencidas(p_limite int default 500)
returns table (nome text) language sql security definer set search_path = '' as $$
  select o.name from storage.objects o
   where o.bucket_id = 'match-selfies' and o.created_at < now() - interval '30 days'
   order by o.created_at limit p_limite
$$;
revoke all on function public.match_selfies_vencidas(int) from public, anon, authenticated;
grant execute on function public.match_selfies_vencidas(int) to service_role;

create or replace function public.match_cron_chave_ok(p_chave text)
returns boolean language sql security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'match_cron_key' and decrypted_secret = p_chave)
$$;
revoke all on function public.match_cron_chave_ok(text) from public, anon, authenticated;
grant execute on function public.match_cron_chave_ok(text) to service_role;

-- Chave aleatória do cron (gerada no banco, nunca impressa).
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'match_cron_key') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'match_cron_key', 'FotoMatch: chave do cron de limpeza');
  end if;
end $$;

-- Agenda diária 04:17 UTC.
select cron.unschedule(jobid) from cron.job where jobname = 'match-limpeza-selfies';
select cron.schedule('match-limpeza-selfies', '17 4 * * *', $cron$
  select net.http_post(
    url := 'https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-nota',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-key', (select decrypted_secret from vault.decrypted_secrets where name = 'match_cron_key')),
    body := '{"acao":"limpeza"}'::jsonb,
    timeout_milliseconds := 60000)
$cron$);
