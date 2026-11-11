-- Motor de Fotos N3W genérico (match, aniversario, ...) — 11/10/2026 (aplicada no Supabase reflex como motor_generico_pacotes)
-- Pacotes de cenas por produto + fila genérica com teto por lote.

create table if not exists public.motor_produtos (
  produto text primary key,
  nome text not null,
  estilo text not null,              -- texto de estilo anexado a toda cena do produto
  sujeito text not null default 'the person', -- como o prompt se refere à pessoa
  fotos_pacote int not null default 15,
  candidatas int not null default 2,
  qualidade text not null default 'medium',
  tamanho text not null default '1024x1536',
  ativo boolean not null default true
);

create table if not exists public.motor_cenas (
  produto text not null references public.motor_produtos(produto) on delete cascade,
  id text not null,
  nome text not null,
  prompt text not null,
  ordem int not null default 0,
  ativo boolean not null default true,
  primary key (produto, id)
);

alter table public.motor_produtos enable row level security;
alter table public.motor_cenas enable row level security;

alter table public.match_motor_jobs
  add column if not exists produto text not null default 'match',
  add column if not exists lote text not null default 'match-motor-teste',
  add column if not exists refs text[] not null default '{}',
  add column if not exists juiz jsonb,
  add column if not exists fidelidade numeric;

create index if not exists match_motor_jobs_lote on public.match_motor_jobs(lote, status, ordem);

-- Entrega 1 job do lote se o gasto acumulado + margem dos que estão rodando + margem do novo
-- ficar dentro do teto. Jobs travados (>6 min) contam a margem como gasto (conservador).
create or replace function public.motor_claim(p_lote text, p_teto numeric, p_margem numeric default 0.30)
returns setof public.match_motor_jobs
language plpgsql security definer set search_path = public as $$
declare gasto numeric; rodando int; m numeric; j public.match_motor_jobs;
begin
  perform pg_advisory_xact_lock(hashtext('motor_claim:' || p_lote));
  update match_motor_jobs set status = 'pendente', custo = coalesce(custo, 0) + p_margem, erro = 'reiniciado após travar (margem contada como gasto)'
   where lote = p_lote and status = 'rodando' and iniciado < now() - interval '6 minutes' and tentativas < 2;
  update match_motor_jobs set status = 'erro', custo = coalesce(custo, 0) + p_margem, erro = 'travou 2x'
   where lote = p_lote and status = 'rodando' and iniciado < now() - interval '6 minutes';
  select greatest(p_margem, coalesce(max(custo) * 1.25, 0)) into m from match_motor_jobs where lote = p_lote and status = 'done';
  select coalesce(sum(custo), 0) into gasto from match_motor_jobs where lote = p_lote;
  select count(*) into rodando from match_motor_jobs where lote = p_lote and status = 'rodando';
  if gasto + (rodando + 1) * m > p_teto then return; end if;
  select * into j from match_motor_jobs x
   where x.lote = p_lote and x.status = 'pendente' and x.tentativas < 2
     and not exists (select 1 from unnest(x.deps) d left join match_motor_jobs y on y.id = d where y.status is distinct from 'done')
   order by x.ordem limit 1 for update skip locked;
  if j.id is null then return; end if;
  update match_motor_jobs set status = 'rodando', iniciado = now(), tentativas = tentativas + 1 where id = j.id returning * into j;
  return next j;
end $$;
revoke all on function public.motor_claim(text, numeric, numeric) from public, anon, authenticated;

-- Pacotes iniciais
insert into public.motor_produtos (produto, nome, estilo, sujeito, fotos_pacote, candidatas) values
 ('match', 'FotoMatch (fotos de perfil para apps de namoro)',
  'Shot on a phone by a friend, natural light, no studio look, slight grain, candid moment, dating-app aesthetic, vertical framing from the waist up. Real skin texture, no retouching, no text, no watermark, natural hands.',
  'he', 15, 2),
 ('aniversario', 'Ensaio de aniversário com IA',
  'Birthday photoshoot look: soft flattering light, editorial but natural, real skin texture with pores, tasteful colors, vertical framing, no text, no watermark, natural hands. Keep the same body type as the reference.',
  'the person', 15, 2)
on conflict (produto) do update set nome = excluded.nome, estilo = excluded.estilo, sujeito = excluded.sujeito;

insert into public.motor_cenas (produto, id, nome, prompt, ordem) values
 ('match','terno','Terno na rua','standing on a city street at golden hour wearing a well-fitted navy suit with an open-collar white shirt, slight smile, buildings blurred behind',1),
 ('match','jantar','Jantar à noite','sitting at a restaurant table at night, warm string lights, a glass of wine, laughing naturally, smart casual shirt',2),
 ('match','cafe','Café','at a sunny sidewalk cafe holding a coffee cup, relaxed, linen shirt, morning light',3),
 ('match','praia','Praia/trilha no pôr do sol','on a beach trail at sunset, light breeze, casual t-shirt, ocean behind, candid half-turn toward the camera',4),
 ('match','academia','Academia','in a gym between sets, fitted training shirt, natural light from windows, slight sweat, confident relaxed look (not posing like a bodybuilder)',5),
 ('match','viagem','Viagem','traveling in a European-looking old town street with a backpack, looking back at the camera smiling',6),
 ('match','cachorro','Com cachorro','in a park sitting on the grass with a friendly golden retriever, laughing, afternoon light',7),
 ('match','show','Show','at an outdoor music festival at dusk with friends blurred in the background, colorful stage lights bokeh, happy',8),
 ('match','esporte','Esporte','after a beach volleyball game on a sand court, holding the ball, tank top, late afternoon sun',9),
 ('aniversario','baloes','Balões dourados','posing in front of a wall of gold and champagne balloons with a large number balloon of the age, elegant outfit, big genuine smile',1),
 ('aniversario','bolo','Bolo com velas','blowing out the candles of a beautiful birthday cake at a decorated table, warm candlelight on the face',2),
 ('aniversario','confete','Confete','laughing with colorful confetti falling around, festive backdrop, joyful candid moment',3),
 ('aniversario','brinde','Brinde','raising a glass of sparkling wine in a toast at an elegant birthday dinner, bokeh lights behind',4),
 ('aniversario','piquenique','Piquenique no pôr do sol','at a sunset picnic birthday setup with flowers, cake and a blanket in a park, golden hour light',5),
 ('aniversario','gala','Retrato de gala','elegant portrait in formal party attire against a dark backdrop with soft rim light, confident pose',6),
 ('aniversario','pb','Retrato preto e branco','black and white editorial portrait, half body, soft window light, timeless look',7),
 ('aniversario','flores','Flores','holding a big bouquet of fresh flowers, pastel background, soft daylight, gentle smile',8),
 ('aniversario','presentes','Presentes','sitting among wrapped gift boxes and ribbons, opening a present with a surprised happy expression',9)
on conflict (produto, id) do update set nome = excluded.nome, prompt = excluded.prompt, ordem = excluded.ordem;
