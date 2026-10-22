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


-- -----------------------------------------------------------------------------
-- 2. arena_landing_media — hero, banners y promos de /arena
--    Los administra /admin/arena/landing; las fotos viven en Cloudflare Images.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_landing_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  slot text NOT NULL CHECK (slot IN ('hero', 'banner', 'promo')),
  url text NOT NULL,
  titulo text CHECK (titulo IS NULL OR char_length(titulo) <= 120),
  subtitulo text CHECK (subtitulo IS NULL OR char_length(subtitulo) <= 240),
  cta_label text CHECK (cta_label IS NULL OR char_length(cta_label) <= 40),
  cta_href text,
  activo boolean NOT NULL DEFAULT TRUE,
  orden integer NOT NULL DEFAULT 0,
  updated_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS arena_landing_media_slot_idx ON public.arena_landing_media (slot, activo, orden);

ALTER TABLE public.arena_landing_media ENABLE ROW LEVEL SECURITY;

-- Sin políticas: ni anon ni authenticated tocan esta tabla. La landing la lee
-- por el backend (GET /api/v1/arena/landing-media) y la escribe el admin por
-- /api/v1/arena/admin/landing-media, siempre con service role.
