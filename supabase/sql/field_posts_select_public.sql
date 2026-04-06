-- Lectura pública de posts de campos aprobados (ficha /campos/[slug]).
-- Ejecutar en Supabase SQL Editor después de field_posts_field_albums.sql.

DROP POLICY IF EXISTS "field_posts_select_public" ON public.field_posts;

CREATE POLICY "field_posts_select_public" ON public.field_posts FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fields f
    WHERE
      f.id = field_posts.field_id
      AND f.status = 'aprobado'
  )
);
