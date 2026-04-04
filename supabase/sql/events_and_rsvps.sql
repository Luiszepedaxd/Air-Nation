-- Eventos públicos, RSVPs y políticas RLS.
-- Ejecutar en Supabase SQL Editor después de tener `users`, `fields`, `field_requests`.

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  title text NOT NULL CHECK (
    char_length(title) >= 1
    AND char_length(title) <= 100
  ),
  descripcion text CHECK (
    descripcion IS NULL
    OR char_length(descripcion) <= 1000
  ),
  field_id uuid REFERENCES public.fields (id) ON DELETE SET NULL,
  fecha timestamptz NOT NULL,
  cupo integer NOT NULL DEFAULT 0 CHECK (
    cupo >= 0
    AND cupo <= 100000
  ),
  disciplina text NOT NULL DEFAULT 'airsoft',
  imagen_url text,
  tipo text NOT NULL DEFAULT 'publico' CHECK (tipo IN ('publico', 'privado')),
  published boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'borrador' CHECK (
    status IN ('publicado', 'borrador', 'cancelado')
  ),
  organizador_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_field_fecha_idx ON public.events (field_id, fecha DESC);

CREATE INDEX IF NOT EXISTS events_list_public_idx ON public.events (published, status, fecha)
WHERE
  published = true
  AND status = 'publicado';

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  event_id uuid NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT event_rsvps_event_user_unique UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS event_rsvps_event_idx ON public.event_rsvps (event_id);

-- ---------------------------------------------------------------------------
-- Función: conteo público de RSVPs (sin exponer filas)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.event_rsvp_count (p_event_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM public.event_rsvps
  WHERE
    event_id = p_event_id;
$$;

REVOKE ALL ON FUNCTION public.event_rsvp_count (uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.event_rsvp_count (uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.event_rsvp_counts_batch (p_event_ids uuid[])
RETURNS TABLE (
  event_id uuid,
  total integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    er.event_id,
    COUNT(*)::integer AS total
  FROM
    public.event_rsvps er
  WHERE
    er.event_id = ANY (p_event_ids)
  GROUP BY
    er.event_id;
$$;

REVOKE ALL ON FUNCTION public.event_rsvp_counts_batch (uuid[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.event_rsvp_counts_batch (uuid[]) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS: events
-- ---------------------------------------------------------------------------

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "events_select_public" ON public.events;

DROP POLICY IF EXISTS "events_select_public_detail" ON public.events;

-- Catálogo y ficha pública: cualquier fila publicada (el listado filtra status en la app).
CREATE POLICY "events_select_published" ON public.events FOR SELECT TO anon, authenticated USING (published = true);

DROP POLICY IF EXISTS "events_select_admin" ON public.events;

CREATE POLICY "events_select_admin" ON public.events FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.users u
    WHERE
      u.id = auth.uid ()
      AND u.app_role = 'admin'
  )
);

DROP POLICY IF EXISTS "events_select_field_owner" ON public.events;

CREATE POLICY "events_select_field_owner" ON public.events FOR SELECT TO authenticated USING (
  field_id IS NOT NULL
  AND EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = events.field_id
      AND f.created_by = auth.uid ()
  )
);

DROP POLICY IF EXISTS "events_insert_admin" ON public.events;

CREATE POLICY "events_insert_admin" ON public.events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT
      1
    FROM
      public.users u
    WHERE
      u.id = auth.uid ()
      AND u.app_role = 'admin'
  )
);

DROP POLICY IF EXISTS "events_insert_field_owner" ON public.events;

CREATE POLICY "events_insert_field_owner" ON public.events FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT
      1
    FROM
      public.users u
    WHERE
      u.id = auth.uid ()
      AND u.app_role = 'field_owner'
  )
  AND field_id IS NOT NULL
  AND EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = field_id
      AND f.created_by = auth.uid ()
  )
);

DROP POLICY IF EXISTS "events_update_admin" ON public.events;

CREATE POLICY "events_update_admin" ON public.events FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.users u
    WHERE
      u.id = auth.uid ()
      AND u.app_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT
      1
    FROM
      public.users u
    WHERE
      u.id = auth.uid ()
      AND u.app_role = 'admin'
  )
);

DROP POLICY IF EXISTS "events_update_field_owner" ON public.events;

CREATE POLICY "events_update_field_owner" ON public.events FOR UPDATE TO authenticated USING (
  field_id IS NOT NULL
  AND EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = events.field_id
      AND f.created_by = auth.uid ()
  )
)
WITH CHECK (
  field_id IS NOT NULL
  AND EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = field_id
      AND f.created_by = auth.uid ()
  )
);

DROP POLICY IF EXISTS "events_delete_admin" ON public.events;

CREATE POLICY "events_delete_admin" ON public.events FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.users u
    WHERE
      u.id = auth.uid ()
      AND u.app_role = 'admin'
  )
);

DROP POLICY IF EXISTS "events_delete_field_owner" ON public.events;

CREATE POLICY "events_delete_field_owner" ON public.events FOR DELETE TO authenticated USING (
  field_id IS NOT NULL
  AND EXISTS (
    SELECT
      1
    FROM
      public.fields f
    WHERE
      f.id = events.field_id
      AND f.created_by = auth.uid ()
  )
);

-- ---------------------------------------------------------------------------
-- RLS: event_rsvps
-- ---------------------------------------------------------------------------

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_rsvps_select_own" ON public.event_rsvps;

CREATE POLICY "event_rsvps_select_own" ON public.event_rsvps FOR SELECT TO authenticated USING (auth.uid () = user_id);

DROP POLICY IF EXISTS "event_rsvps_select_field_owner" ON public.event_rsvps;

CREATE POLICY "event_rsvps_select_field_owner" ON public.event_rsvps FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.events e
      JOIN public.fields f ON f.id = e.field_id
    WHERE
      e.id = event_rsvps.event_id
      AND f.created_by = auth.uid ()
  )
);

DROP POLICY IF EXISTS "event_rsvps_select_admin" ON public.event_rsvps;

CREATE POLICY "event_rsvps_select_admin" ON public.event_rsvps FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT
      1
    FROM
      public.users u
    WHERE
      u.id = auth.uid ()
      AND u.app_role = 'admin'
  )
);

DROP POLICY IF EXISTS "event_rsvps_insert_own" ON public.event_rsvps;

CREATE POLICY "event_rsvps_insert_own" ON public.event_rsvps FOR INSERT TO authenticated
WITH CHECK (
  auth.uid () = user_id
  AND EXISTS (
    SELECT
      1
    FROM
      public.events e
    WHERE
      e.id = event_id
      AND e.published = true
      AND e.status = 'publicado'
  )
);

DROP POLICY IF EXISTS "event_rsvps_delete_own" ON public.event_rsvps;

CREATE POLICY "event_rsvps_delete_own" ON public.event_rsvps FOR DELETE TO authenticated USING (auth.uid () = user_id);
