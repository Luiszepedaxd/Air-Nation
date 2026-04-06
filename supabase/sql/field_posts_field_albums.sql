-- Posts y álbumes por campo (panel admin con service role).
-- Ejecutar en Supabase SQL Editor después de `fields`.

CREATE TABLE IF NOT EXISTS public.field_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(content) >= 1),
  fotos_urls text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.field_albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE CASCADE,
  nombre text NOT NULL CHECK (char_length(nombre) >= 1),
  fotos_urls text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS field_posts_field_created_idx ON public.field_posts (field_id, created_at DESC);

CREATE INDEX IF NOT EXISTS field_albums_field_created_idx ON public.field_albums (field_id, created_at DESC);

ALTER TABLE public.field_posts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.field_albums ENABLE ROW LEVEL SECURITY;

-- Sin políticas públicas: solo acceso vía service role (admin).
