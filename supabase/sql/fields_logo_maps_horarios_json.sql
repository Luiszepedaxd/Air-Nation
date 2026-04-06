-- Columnas nuevas para ficha y formularios de campos (si aún no existen).
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.fields
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS maps_url text,
  ADD COLUMN IF NOT EXISTS direccion text,
  ADD COLUMN IF NOT EXISTS horarios_json jsonb;
