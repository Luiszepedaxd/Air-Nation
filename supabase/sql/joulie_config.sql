-- Interruptor de JOULIE. Ejecutar una vez en el editor SQL de Supabase.
-- El panel /admin/joulie (solo admin, con la llave de servicio) cambia `enabled`.
-- No hace falta volver a desplegar. Sin políticas de escritura para anon/authenticated:
-- un jugador no puede prenderla ni apagarla desde el cliente.

create table if not exists public.joulie_config (
  id text primary key default 'singleton',
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.joulie_config (id, enabled)
values ('singleton', true)
on conflict (id) do nothing;

alter table public.joulie_config enable row level security;

drop policy if exists joulie_config_read on public.joulie_config;
create policy joulie_config_read
  on public.joulie_config
  for select
  to anon, authenticated
  using (true);

revoke all on table public.joulie_config from public, anon, authenticated;
grant select on table public.joulie_config to anon, authenticated;
