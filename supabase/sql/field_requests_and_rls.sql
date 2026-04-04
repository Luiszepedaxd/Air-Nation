-- Solicitudes de uso para campos privados + RLS para el dueño del campo.
-- Ejecutar en Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.field_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE CASCADE,
  solicitante_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams (id) ON DELETE SET NULL,
  fecha_deseada date,
  num_jugadores integer NOT NULL DEFAULT 1 CHECK (
    num_jugadores >= 1
    AND num_jugadores <= 500
  ),
  mensaje text,
  status text NOT NULL DEFAULT 'pendiente' CHECK (
    status IN (
      'pendiente',
      'aprobado',
      'rechazado'
    )
  ),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS field_requests_field_status_created_idx ON public.field_requests (field_id, status, created_at DESC);

ALTER TABLE public.field_requests ENABLE ROW LEVEL SECURITY;

-- Dueño del campo: leer solicitudes de sus campos
DROP POLICY IF EXISTS "field_requests_select_owner" ON public.field_requests;

CREATE POLICY "field_requests_select_owner" ON public.field_requests FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = field_requests.field_id
      AND f.created_by = auth.uid ()
  )
);

-- Dueño del campo: actualizar solicitudes de sus campos (aprobar / rechazar)
DROP POLICY IF EXISTS "field_requests_update_owner" ON public.field_requests;

CREATE POLICY "field_requests_update_owner" ON public.field_requests FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = field_requests.field_id
      AND f.created_by = auth.uid ()
  )
)
WITH CHECK (
  EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = field_requests.field_id
      AND f.created_by = auth.uid ()
  )
);

-- Solicitante: crear solicitud (campo privado y aprobado)
DROP POLICY IF EXISTS "field_requests_insert_solicitante" ON public.field_requests;

CREATE POLICY "field_requests_insert_solicitante" ON public.field_requests FOR INSERT TO authenticated
WITH CHECK (
  auth.uid () = solicitante_id
  AND EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = field_id
      AND f.status = 'aprobado'
      AND f.tipo = 'privado'
  )
);

-- Solicitante: leer sus propias solicitudes (estado en /campos y perfil)
DROP POLICY IF EXISTS "field_requests_select_solicitante" ON public.field_requests;

CREATE POLICY "field_requests_select_solicitante" ON public.field_requests FOR SELECT TO authenticated USING (
  solicitante_id = auth.uid ()
);

-- Dueño: ver reseñas de sus campos aunque el campo no esté aprobado (panel /mi-campo)
DROP POLICY IF EXISTS "field_reviews_select_field_owner" ON public.field_reviews;

CREATE POLICY "field_reviews_select_field_owner" ON public.field_reviews FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = field_reviews.field_id
      AND f.created_by = auth.uid ()
  )
);
