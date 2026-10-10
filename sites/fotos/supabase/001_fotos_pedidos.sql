-- Rodar uma vez no projeto Supabase "reflex" (SQL Editor). Cria pedidos + pasta privada de selfies das Fotos.
create table if not exists public.fotos_pedidos (
  ref text primary key, mp_order_id text, pacote int not null, valor numeric(10,2) not null,
  nome text, email text, whats text, estilos text,
  status text not null default 'aguardando_pix', pago_em timestamptz, selfies int not null default 0,
  utm jsonb, criado_em timestamptz not null default now()
);
alter table public.fotos_pedidos enable row level security;
drop policy if exists fotos_pedidos_insert on public.fotos_pedidos;
create policy fotos_pedidos_insert on public.fotos_pedidos for insert to anon with check (status = 'aguardando_pix' and pago_em is null and selfies = 0);
create or replace function public.fotos_atualizar(p_ref text, p_order text, p_status text, p_selfies int default null, p_estilos text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_status not in ('pago','selfies_recebidas') then raise exception 'status invalido'; end if;
  update public.fotos_pedidos set status = p_status, pago_em = coalesce(pago_em, now()),
         selfies = coalesce(p_selfies, selfies), estilos = coalesce(p_estilos, estilos)
   where ref = p_ref and mp_order_id = p_order;
end $$;
revoke all on function public.fotos_atualizar(text,text,text,int,text) from public;
grant execute on function public.fotos_atualizar(text,text,text,int,text) to anon;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos-selfies','fotos-selfies', false, 5242880, array['image/jpeg','image/png','image/webp']) on conflict (id) do nothing;
drop policy if exists fotos_selfies_insert on storage.objects;
create policy fotos_selfies_insert on storage.objects for insert to anon with check (bucket_id = 'fotos-selfies');
