-- FotoMatch (MATCH) · migração 002 · prévia grátis por lead (aprovada pelo Othon 11/10 15h54, evento match-20261011-previa-ligar)
-- 1 foto do próprio lead (gpt-image-2, cena "jantar"), marca d'água no servidor, teto US$ 10/dia somando todas as prévias.
-- Passou do teto → status 'fila' e o cron gera no dia seguinte (fuso America/Sao_Paulo).
-- A trava geral do motor (match_config.motor.verba_aprovada) continua FALSE: só a prévia foi liberada (motor.previa).

create table if not exists public.match_previas (
  lead_id uuid primary key references public.match_leads(id) on delete cascade,
  status text not null check (status in ('gerando','pronta','fila','erro','bloqueada')),
  dia date not null default (now() at time zone 'America/Sao_Paulo')::date,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  tentativas int not null default 0,
  cena text, modelo text, path text,
  custo_usd numeric(8,4) not null default 0,
  uso jsonb, ms int, erro text
);
create index if not exists match_previas_dia_idx on public.match_previas (dia, status);
alter table public.match_previas enable row level security;

update public.match_config
   set valor = valor || jsonb_build_object('previa', jsonb_build_object(
         'verba_aprovada', true, 'teto_usd_dia', 10, 'custo_estimado_usd', 0.15, 'cena', 'jantar',
         'aprovado', 'Othon no chat MATCH 11/10 15h54 (eu libero a prévia grátis do lead)', 'evento', 'match-20261011-previa-ligar')),
       atualizado_em = now()
 where chave = 'motor';

-- Reserva atômica de 1 prévia: respeita 1 por lead e o teto diário. Devolve o status e se pode gerar agora.
create or replace function public.match_previa_reservar(p_lead uuid)
returns table (status text, gerar boolean) language plpgsql security definer set search_path = '' as $$
declare
  cfg jsonb; hoje date := (now() at time zone 'America/Sao_Paulo')::date;
  atual public.match_previas%rowtype; est numeric; gasto numeric;
begin
  perform pg_advisory_xact_lock(hashtext('match_previa'));
  select valor->'previa' into cfg from public.match_config where chave = 'motor';
  select * into atual from public.match_previas where lead_id = p_lead;
  if found and (atual.status in ('gerando','pronta','bloqueada') or (atual.status = 'erro' and atual.tentativas >= 2)) then
    return query select atual.status, false; return;
  end if;
  if found and atual.status = 'fila' and atual.dia >= hoje then
    return query select 'fila'::text, false; return;
  end if;
  if not coalesce((cfg->>'verba_aprovada')::boolean, false) then
    return query select 'desligada'::text, false; return;
  end if;
  est := coalesce((cfg->>'custo_estimado_usd')::numeric, 0.15);
  select coalesce(sum(case when p.status = 'gerando' then greatest(p.custo_usd, est) else p.custo_usd end), 0)
    into gasto from public.match_previas p where p.dia = hoje;
  if gasto + est > coalesce((cfg->>'teto_usd_dia')::numeric, 0) then
    insert into public.match_previas as m (lead_id, status, dia) values (p_lead, 'fila', hoje)
      on conflict (lead_id) do update set status = 'fila', dia = hoje, atualizado_em = now();
    return query select 'fila'::text, false; return;
  end if;
  insert into public.match_previas as m (lead_id, status, dia, tentativas, cena)
    values (p_lead, 'gerando', hoje, 1, coalesce(cfg->>'cena', 'jantar'))
    on conflict (lead_id) do update set status = 'gerando', dia = hoje, tentativas = m.tentativas + 1,
      cena = excluded.cena, erro = null, atualizado_em = now();
  return query select 'gerando'::text, true;
end $$;
revoke all on function public.match_previa_reservar(uuid) from public, anon, authenticated;
grant execute on function public.match_previa_reservar(uuid) to service_role;

-- Fila do dia seguinte: a cada 15 min o cron pede à match-nota para gerar até 2 prévias pendentes de dias anteriores
-- (e devolve para 'erro' as que ficaram presas em 'gerando' por mais de 10 min).
select cron.unschedule(jobid) from cron.job where jobname = 'match-previa-fila';
select cron.schedule('match-previa-fila', '*/15 * * * *', $cron$
  select net.http_post(
    url := 'https://cdtfglylekiyxdmrgbne.supabase.co/functions/v1/match-nota',
    headers := jsonb_build_object('Content-Type','application/json',
      'x-cron-key', (select decrypted_secret from vault.decrypted_secrets where name = 'match_cron_key')),
    body := '{"acao":"previa_fila"}'::jsonb,
    timeout_milliseconds := 30000)
$cron$);
