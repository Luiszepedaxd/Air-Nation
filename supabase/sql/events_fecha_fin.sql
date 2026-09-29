alter table public.events add column if not exists fecha_fin timestamptz;

update public.events
set fecha_fin = ((fecha at time zone 'America/Mexico_City')::date + 1)::timestamp at time zone 'America/Mexico_City'
where fecha_fin is null and fecha is not null;

alter table public.events drop constraint if exists events_fecha_fin_check;
alter table public.events add constraint events_fecha_fin_check check (fecha_fin is null or fecha_fin > fecha);
