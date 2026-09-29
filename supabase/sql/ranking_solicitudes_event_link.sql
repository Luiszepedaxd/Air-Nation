-- Vincula ranking_solicitudes con events y agrega columnas estado/formato.

alter table ranking_solicitudes add column if not exists event_id uuid references events(id) on delete set null;
alter table ranking_solicitudes add column if not exists estado text not null default 'pendiente';
alter table ranking_solicitudes add column if not exists formato text;

create index if not exists ranking_solicitudes_event_id_idx on ranking_solicitudes(event_id);

-- por si existe un check viejo de origen que no incluye 'evento'
alter table ranking_solicitudes drop constraint if exists ranking_solicitudes_origen_check;
