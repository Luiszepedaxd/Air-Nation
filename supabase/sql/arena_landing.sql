-- =============================================================================
-- ARENA — Landing pública (/arena) y fotos administradas
-- Archivo: supabase/sql/arena_landing.sql
-- Ejecutar COMPLETO en Supabase SQL Editor (una sola corrida, re-ejecutable).
-- Requiere: supabase/sql/arena_mvp.sql ya corrido.
--
-- Dinero en centavos. Fechas en America/Mexico_City.
-- Escrituras SOLO vía backend Express con service role.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Columnas de landing en arena_field_settings
--    destacado / orden_landing: orden de las tarjetas en /arena
--    fotos_landing: galería que se muestra arriba del bloque ARENA de la ficha
--    resumen_landing: una línea de gancho en la tarjeta
-- -----------------------------------------------------------------------------
ALTER TABLE public.arena_field_settings
  ADD COLUMN IF NOT EXISTS destacado boolean NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS orden_landing integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fotos_landing text[] NOT NULL DEFAULT '{}' CHECK (cardinality(fotos_landing) <= 12),
  ADD COLUMN IF NOT EXISTS resumen_landing text CHECK (resumen_landing IS NULL OR char_length(resumen_landing) <= 280);
