-- Agregar columna de confirmación de sync a assignments
ALTER TABLE public.tournament_assignments
ADD COLUMN IF NOT EXISTS sync_confirmed_at timestamptz;
