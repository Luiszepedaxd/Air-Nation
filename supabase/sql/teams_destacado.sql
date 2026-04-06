-- Equipos destacados (orden en listados: destacado DESC, created_at DESC)
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS destacado boolean NOT NULL DEFAULT false;
