-- Solo si la tabla se creó con la columna antigua `numero_jugadores`.
-- Ejecutar una vez en Supabase SQL Editor; omitir si ya existe `num_jugadores`.

ALTER TABLE public.field_requests
  RENAME COLUMN numero_jugadores TO num_jugadores;
