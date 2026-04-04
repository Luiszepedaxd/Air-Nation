-- Opcional: columnas y reseñas para listado/ficha pública de campos.
-- Ejecutar en Supabase SQL Editor si aún no existen.

ALTER TABLE public.fields
  ADD COLUMN IF NOT EXISTS tipo text DEFAULT 'publico',
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS promedio_rating numeric(4, 2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.field_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (
    rating >= 1
    AND rating <= 5
  ),
  comentario text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (field_id, user_id)
);

CREATE INDEX IF NOT EXISTS field_reviews_field_id_created_at_idx ON public.field_reviews (field_id, created_at DESC);

ALTER TABLE public.field_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "field_reviews_select_public" ON public.field_reviews;

CREATE POLICY "field_reviews_select_public" ON public.field_reviews FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE
      f.id = field_reviews.field_id
      AND f.status = 'approved'
  )
);

DROP POLICY IF EXISTS "field_reviews_insert_own" ON public.field_reviews;

CREATE POLICY "field_reviews_insert_own" ON public.field_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "field_reviews_update_own" ON public.field_reviews;

CREATE POLICY "field_reviews_update_own" ON public.field_reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
