-- =============================================================================
-- ARENA — Marketplace y carrito (aditivo sobre arena_mvp.sql)
-- Archivo: supabase/sql/arena_marketplace.sql
-- Ejecutar COMPLETO en Supabase SQL Editor, DESPUÉS de arena_mvp.sql.
-- Solo agrega columnas y funciones; no borra ni cambia datos existentes.
-- Seguro de re-ejecutar.
--
-- 1. Atributos para filtros: disciplinas y terrenos por campo,
--    disciplina y duración por paquete.
-- 2. Carrito: un pago (arena_payments) puede cubrir varias reservas
--    (arena_bookings.payment_id). arena_payments.booking_id queda opcional.
-- 3. Funciones: arena_marketplace (listado con filtros),
--    arena_create_checkout (varias reservas en una sola transacción) y
--    arena_mark_payment_paid (confirma todas las reservas de un pago).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Atributos de marketplace
-- -----------------------------------------------------------------------------
ALTER TABLE public.arena_field_settings
  ADD COLUMN IF NOT EXISTS disciplinas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS terrenos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS edad_minima integer CHECK (edad_minima IS NULL OR (edad_minima BETWEEN 0 AND 99));

ALTER TABLE public.arena_items
  ADD COLUMN IF NOT EXISTS disciplina text,
  ADD COLUMN IF NOT EXISTS duracion_min integer CHECK (duracion_min IS NULL OR (duracion_min BETWEEN 15 AND 1440));

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'arena_field_settings_disciplinas_chk') THEN
    ALTER TABLE public.arena_field_settings
      ADD CONSTRAINT arena_field_settings_disciplinas_chk
      CHECK (disciplinas <@ ARRAY['airsoft', 'gotcha', 'gelsoft']::text[]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'arena_field_settings_terrenos_chk') THEN
    ALTER TABLE public.arena_field_settings
      ADD CONSTRAINT arena_field_settings_terrenos_chk
      CHECK (terrenos <@ ARRAY['bosque', 'cqb', 'urbano', 'mixto', 'desierto']::text[]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'arena_items_disciplina_chk') THEN
    ALTER TABLE public.arena_items
      ADD CONSTRAINT arena_items_disciplina_chk
      CHECK (disciplina IS NULL OR disciplina IN ('airsoft', 'gotcha', 'gelsoft'));
  END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- 2. Carrito: un pago cubre varias reservas
-- -----------------------------------------------------------------------------
ALTER TABLE public.arena_payments ALTER COLUMN booking_id DROP NOT NULL;

ALTER TABLE public.arena_payments
  ADD COLUMN IF NOT EXISTS access_token text UNIQUE;

ALTER TABLE public.arena_bookings
  ADD COLUMN IF NOT EXISTS payment_id uuid REFERENCES public.arena_payments (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS arena_bookings_payment_idx ON public.arena_bookings (payment_id);


-- =============================================================================
-- FUNCIONES
-- Códigos de error nuevos: carrito_vacio, carrito_demasiado_grande,
-- carrito_duplicado, pago_no_encontrado. Si una reserva del carrito falla,
-- el error trae su código normal (campo_cerrado, item_invalido, etc.) y
-- DETAIL = 'reserva_index=<n>' (0 = primera) para que el front marque cuál.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Listado del marketplace: solo campos con ARENA activo y al menos un
-- paquete base que aplique. Todos los filtros son opcionales.
-- p_orden: 'recomendados' (default) | 'precio_asc' | 'precio_desc' | 'rating'
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_marketplace (
  p_fecha date DEFAULT NULL,
  p_estado text DEFAULT NULL,
  p_ciudad text DEFAULT NULL,
  p_jugadores integer DEFAULT NULL,
  p_disciplina text DEFAULT NULL,
  p_terreno text DEFAULT NULL,
  p_precio_max_centavos integer DEFAULT NULL,
  p_con_renta boolean DEFAULT NULL,
  p_rating_min numeric DEFAULT NULL,
  p_orden text DEFAULT 'recomendados')
  RETURNS TABLE (
    field_id uuid,
    slug text,
    nombre text,
    ciudad text,
    estado text,
    foto_portada_url text,
    logo_url text,
    promedio_rating numeric,
    resenas_count integer,
    disciplinas text[],
    terrenos text[],
    edad_minima integer,
    desde_centavos integer,
    desde_unidad text,
    tiene_renta boolean,
    proximos_dias date[],
    destacado boolean)
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
#variable_conflict use_column
DECLARE
  v_hoy date := (now() AT TIME ZONE 'America/Mexico_City')::date;
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT
      f.id AS fid,
      f.slug AS f_slug,
      f.nombre AS f_nombre,
      f.ciudad AS f_ciudad,
      f.estado AS f_estado,
      f.foto_portada_url AS f_foto,
      f.logo_url AS f_logo,
      COALESCE(f.promedio_rating::numeric, 0) AS f_rating,
      COALESCE(lower(f.destacado::text), '') IN ('true', 't', '1', 'si', 'sí') AS f_destacado,
      s.disciplinas AS s_disc,
      s.terrenos AS s_terr,
      s.edad_minima AS s_edad,
      (
        SELECT i.precio_centavos
        FROM public.arena_items i
        WHERE i.field_id = f.id AND i.activo AND i.es_base
          AND (p_jugadores IS NULL OR ((i.min_jugadores IS NULL OR p_jugadores >= i.min_jugadores)
            AND (i.max_jugadores IS NULL OR p_jugadores <= i.max_jugadores)))
          AND (p_disciplina IS NULL OR i.disciplina IS NULL OR i.disciplina = p_disciplina)
        ORDER BY (i.unidad = 'por_persona') DESC, i.precio_centavos ASC
        LIMIT 1) AS desde,
      (
        SELECT i.unidad
        FROM public.arena_items i
        WHERE i.field_id = f.id AND i.activo AND i.es_base
          AND (p_jugadores IS NULL OR ((i.min_jugadores IS NULL OR p_jugadores >= i.min_jugadores)
            AND (i.max_jugadores IS NULL OR p_jugadores <= i.max_jugadores)))
          AND (p_disciplina IS NULL OR i.disciplina IS NULL OR i.disciplina = p_disciplina)
        ORDER BY (i.unidad = 'por_persona') DESC, i.precio_centavos ASC
        LIMIT 1) AS desde_u,
      EXISTS (
        SELECT 1 FROM public.arena_items i
        WHERE i.field_id = f.id AND i.activo AND i.tipo = 'renta') AS renta
    FROM public.fields f
    JOIN public.arena_field_settings s ON s.field_id = f.id AND s.activo
    WHERE f.status = 'aprobado'
      AND (p_estado IS NULL OR lower(f.estado) = lower(p_estado))
      AND (p_ciudad IS NULL OR lower(f.ciudad) = lower(p_ciudad))
      AND (p_disciplina IS NULL OR p_disciplina = ANY (s.disciplinas))
      AND (p_terreno IS NULL OR p_terreno = ANY (s.terrenos))
  ),
  filtrado AS (
    SELECT
      b.*,
      ARRAY (
        SELECT od.fecha FROM public.arena_open_days (b.fid, v_hoy, v_hoy + 21) od
        ORDER BY od.fecha LIMIT 6) AS dias
    FROM base b
    WHERE b.desde IS NOT NULL
      AND (p_precio_max_centavos IS NULL OR b.desde <= p_precio_max_centavos)
      AND (p_con_renta IS NOT TRUE OR b.renta)
      AND (p_rating_min IS NULL OR b.f_rating >= p_rating_min)
      AND (p_fecha IS NULL OR EXISTS (
        SELECT 1 FROM public.arena_open_days (b.fid, p_fecha, p_fecha)))
  )
  SELECT
    fl.fid,
    fl.f_slug,
    fl.f_nombre,
    fl.f_ciudad,
    fl.f_estado,
    fl.f_foto,
    fl.f_logo,
    fl.f_rating,
    (SELECT count(*)::integer FROM public.field_reviews r WHERE r.field_id = fl.fid),
    fl.s_disc,
    fl.s_terr,
    fl.s_edad,
    fl.desde,
    fl.desde_u,
    fl.renta,
    fl.dias,
    fl.f_destacado
  FROM filtrado fl
  ORDER BY
    CASE WHEN p_orden = 'precio_asc' THEN fl.desde END ASC NULLS LAST,
    CASE WHEN p_orden = 'precio_desc' THEN fl.desde END DESC NULLS LAST,
    CASE WHEN p_orden = 'rating' THEN fl.f_rating END DESC NULLS LAST,
    fl.f_destacado DESC,
    fl.f_rating DESC,
    fl.f_nombre ASC;
END;
$$;


-- -----------------------------------------------------------------------------
-- Checkout del carrito: crea todas las reservas en una sola transacción.
-- Si una falla, no se crea ninguna.
-- p_reservas: [{"field_id": "...", "fecha": "2026-10-24", "num_jugadores": 6,
--               "items": [{"item_id": "...", "cantidad": 2}], "notas": "..."}]
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_create_checkout (
  p_reservas jsonb,
  p_contacto_nombre text,
  p_contacto_email text,
  p_contacto_telefono text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_origen text DEFAULT 'web')
  RETURNS TABLE (
    booking_id uuid,
    codigo text,
    access_token text,
    qr_token text,
    field_id uuid,
    fecha date,
    total_centavos integer,
    expires_at timestamptz)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
#variable_conflict use_column
DECLARE
  v_el jsonb;
  v_i integer := 0;
  v_field uuid;
  v_fecha date;
  v_jug integer;
  v_seen text[] := '{}';
  v_key text;
  r record;
BEGIN
  IF p_reservas IS NULL OR jsonb_typeof(p_reservas) <> 'array' OR jsonb_array_length(p_reservas) = 0 THEN
    RAISE EXCEPTION 'carrito_vacio';
  END IF;
  IF jsonb_array_length(p_reservas) > 10 THEN
    RAISE EXCEPTION 'carrito_demasiado_grande';
  END IF;

  FOR v_el IN SELECT e FROM jsonb_array_elements(p_reservas) AS t (e) LOOP
    BEGIN
      v_field := (v_el ->> 'field_id')::uuid;
      v_fecha := (v_el ->> 'fecha')::date;
      v_jug := (v_el ->> 'num_jugadores')::integer;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'item_invalido' USING DETAIL = 'reserva_index=' || v_i;
    END;

    v_key := COALESCE(v_field::text, '') || '|' || COALESCE(v_fecha::text, '');
    IF v_key = ANY (v_seen) THEN
      RAISE EXCEPTION 'carrito_duplicado' USING DETAIL = 'reserva_index=' || v_i;
    END IF;
    v_seen := v_seen || v_key;

    BEGIN
      SELECT * INTO r
      FROM public.arena_create_booking (
        v_field,
        v_fecha,
        v_jug,
        v_el -> 'items',
        p_contacto_nombre,
        p_contacto_email,
        p_contacto_telefono,
        p_user_id,
        p_origen,
        v_el ->> 'notas',
        p_user_id);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM USING DETAIL = 'reserva_index=' || v_i;
    END;

    booking_id := r.booking_id;
    codigo := r.codigo;
    access_token := r.access_token;
    qr_token := r.qr_token;
    field_id := v_field;
    fecha := v_fecha;
    total_centavos := r.total_centavos;
    expires_at := r.expires_at;
    RETURN NEXT;

    v_i := v_i + 1;
  END LOOP;
END;
$$;


-- -----------------------------------------------------------------------------
-- Pago aprobado de un carrito: confirma todas sus reservas (idempotente).
-- Devuelve una fila por reserva con el resultado de arena_mark_paid:
-- 'confirmada' | 'ya_confirmada' | 'cancelada_reembolsar'
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_mark_payment_paid (p_payment_id uuid)
  RETURNS TABLE (
    booking_id uuid,
    resultado text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
#variable_conflict use_column
DECLARE
  v_b uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.arena_payments p WHERE p.id = p_payment_id) THEN
    RAISE EXCEPTION 'pago_no_encontrado';
  END IF;

  FOR v_b IN
    SELECT b.id FROM public.arena_bookings b
    WHERE b.payment_id = p_payment_id
    UNION
    SELECT p.booking_id FROM public.arena_payments p
    WHERE p.id = p_payment_id AND p.booking_id IS NOT NULL
  LOOP
    booking_id := v_b;
    resultado := public.arena_mark_paid (v_b);
    RETURN NEXT;
  END LOOP;
END;
$$;


-- =============================================================================
-- PERMISOS: solo service role (backend)
-- =============================================================================
REVOKE ALL ON FUNCTION public.arena_marketplace (date, text, text, integer, text, text, integer, boolean, numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_create_checkout (jsonb, text, text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_mark_payment_paid (uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.arena_marketplace (date, text, text, integer, text, text, integer, boolean, numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_create_checkout (jsonb, text, text, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_mark_payment_paid (uuid) TO service_role;
