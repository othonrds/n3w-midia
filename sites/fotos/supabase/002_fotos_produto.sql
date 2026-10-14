-- 11/10/2026 · Ensaio de aniversário: o mesmo funil passa a atender mais de um produto.
-- Rodar DEPOIS do 001 no Supabase "reflex" (SQL Editor). Em 11/10 nenhum dos dois estava aplicado.
alter table public.fotos_pedidos add column if not exists produto text not null default 'fotos';
create index if not exists fotos_pedidos_produto on public.fotos_pedidos(produto, status, criado_em desc);
