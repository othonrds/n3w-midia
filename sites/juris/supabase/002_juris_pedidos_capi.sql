-- Juris Páginas: dados para o Purchase pela Meta Conversions API (pixel 982748768192003).
-- Aplicar ANTES de publicar a nova versão da função "juris" (projeto Supabase "reflex").
-- Sem estas colunas a função continua funcionando, mas não grava fbp/fbc/IP/navegador e não envia o Purchase pelo servidor.

alter table public.juris_pedidos
  add column if not exists fbp text,
  add column if not exists fbc text,
  add column if not exists client_ip text,
  add column if not exists client_ua text,
  add column if not exists capi_sent_at timestamptz;

comment on column public.juris_pedidos.fbp is 'Cookie _fbp do pixel no momento do pedido (Conversions API).';
comment on column public.juris_pedidos.fbc is 'Cookie _fbc do pixel, ou montado a partir do fbclid da UTM (Conversions API).';
comment on column public.juris_pedidos.client_ip is 'IP de quem gerou o Pix (Conversions API: client_ip_address).';
comment on column public.juris_pedidos.client_ua is 'User-agent de quem gerou o Pix (Conversions API: client_user_agent).';
comment on column public.juris_pedidos.capi_sent_at is 'Quando o Purchase foi enviado pela Conversions API. Preenchido = não reenviar.';
