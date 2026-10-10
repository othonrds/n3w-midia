-- Compras do KIT ADHD fora da Hotmart (Stripe). Só a edge function "kit" (service role) escreve.
create table if not exists public.kit_purchases (
  transaction    text primary key,            -- id da Checkout Session (cs_...)
  provider       text not null default 'stripe',
  status         text not null,               -- approved | revoked
  email          text,
  amount         numeric,
  currency       text,
  payment_intent text,
  country        text,
  arm            text,                        -- chk_stripe (braço do sorteio)
  visitor        text,                        -- id do visitante na LP (cookie)
  livemode       boolean,
  emailed        boolean not null default false,
  raw            jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists kit_purchases_pi on public.kit_purchases (payment_intent);
alter table public.kit_purchases enable row level security; -- sem policies: anon não lê nada
