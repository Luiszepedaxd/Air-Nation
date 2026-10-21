-- =============================================================================
-- ARENA MVP — Reservas en línea para campos (v2: sin turnos ni cupo)
-- Archivo: supabase/sql/arena_mvp.sql
-- Ejecutar COMPLETO en Supabase SQL Editor (una sola corrida).
-- Requiere: public.fields (con horarios_json), public.users (ya existen).
--
-- Modelo simple: el jugador elige un DÍA en que el campo abre según
-- fields.horarios_json ({"sabado": {"abierto": true, "apertura": "09:00",
-- "cierre": "18:00"}, ...}). El campo no configura turnos ni lugares.
-- Días cerrados extra (lluvia, evento privado) van en arena_blackouts.
--
-- Dinero en centavos (integer). Fechas en America/Mexico_City.
-- Escrituras SOLO vía backend Express con service role. RLS en todas las tablas.
-- Seguro de re-ejecutar. Si ya corriste la v1 (con turnos), esta la migra.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Limpieza de la v1 (turnos y cupo). No hace nada si no existe.
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.arena_availability (uuid, date, date);
DROP FUNCTION IF EXISTS public.arena_occupied (uuid, date, uuid);
DROP FUNCTION IF EXISTS public.arena_create_booking (uuid, uuid, date, integer, jsonb, text, text, text, uuid, text, text, uuid);
DROP INDEX IF EXISTS public.arena_blackouts_slot_uidx;
DROP INDEX IF EXISTS public.arena_blackouts_dia_uidx;
ALTER TABLE IF EXISTS public.arena_blackouts DROP COLUMN IF EXISTS slot_id;
ALTER TABLE IF EXISTS public.arena_bookings DROP COLUMN IF EXISTS slot_id;
ALTER TABLE IF EXISTS public.arena_bookings DROP COLUMN IF EXISTS hora_inicio;
ALTER TABLE IF EXISTS public.arena_bookings DROP COLUMN IF EXISTS hora_fin;
DROP TABLE IF EXISTS public.arena_slots;


-- -----------------------------------------------------------------------------
-- Utilidad: updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_touch_updated_at ()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;


-- -----------------------------------------------------------------------------
-- 1. arena_field_settings — activa ARENA en un campo + configuración
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_field_settings (
  field_id uuid PRIMARY KEY REFERENCES public.fields (id) ON DELETE CASCADE,
  activo boolean NOT NULL DEFAULT false,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'pro')),
  comision_pct numeric(5, 2) NOT NULL DEFAULT 8.00 CHECK (comision_pct >= 0 AND comision_pct <= 50),
  anticipacion_min_horas integer NOT NULL DEFAULT 12 CHECK (anticipacion_min_horas >= 0 AND anticipacion_min_horas <= 720),
  anticipacion_max_dias integer NOT NULL DEFAULT 60 CHECK (anticipacion_max_dias >= 1 AND anticipacion_max_dias <= 365),
  cancelacion_horas_limite integer NOT NULL DEFAULT 24 CHECK (cancelacion_horas_limite >= 0 AND cancelacion_horas_limite <= 720),
  politica_cancelacion text CHECK (politica_cancelacion IS NULL OR char_length(politica_cancelacion) <= 2000),
  email_avisos text,
  telefono_avisos text,
  -- Datos de liquidación (nunca públicos)
  banco text,
  clabe text CHECK (clabe IS NULL OR clabe ~ '^[0-9]{18}$'),
  titular_cuenta text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS arena_field_settings_touch ON public.arena_field_settings;
CREATE TRIGGER arena_field_settings_touch
  BEFORE UPDATE ON public.arena_field_settings
  FOR EACH ROW EXECUTE FUNCTION public.arena_touch_updated_at ();


-- -----------------------------------------------------------------------------
-- 2. arena_field_members — liga el campo con cuentas de AirNation
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_field_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'owner' CHECK (rol IN ('owner', 'admin', 'cajero')),
  status text NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  invited_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, user_id)
);

CREATE INDEX IF NOT EXISTS arena_field_members_user_idx ON public.arena_field_members (user_id, status);


-- -----------------------------------------------------------------------------
-- 3. arena_items — catálogo (paquetes, derechos de campo, rentas, extras)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('paquete', 'derecho_campo', 'renta', 'extra')),
  es_base boolean GENERATED ALWAYS AS (tipo IN ('paquete', 'derecho_campo')) STORED,
  nombre text NOT NULL CHECK (char_length(nombre) BETWEEN 1 AND 80),
  descripcion text CHECK (descripcion IS NULL OR char_length(descripcion) <= 1000),
  incluye text[] NOT NULL DEFAULT '{}',
  precio_centavos integer NOT NULL CHECK (precio_centavos >= 0),
  unidad text NOT NULL DEFAULT 'por_persona' CHECK (unidad IN ('por_persona', 'por_reserva', 'por_unidad')),
  min_jugadores integer CHECK (min_jugadores IS NULL OR min_jugadores >= 1),
  max_jugadores integer CHECK (max_jugadores IS NULL OR max_jugadores >= 1),
  max_por_reserva integer CHECK (max_por_reserva IS NULL OR max_por_reserva >= 1),
  fotos_urls text[] NOT NULL DEFAULT '{}' CHECK (cardinality(fotos_urls) <= 6),
  activo boolean NOT NULL DEFAULT true,
  orden integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (min_jugadores IS NULL OR max_jugadores IS NULL OR max_jugadores >= min_jugadores)
);

CREATE INDEX IF NOT EXISTS arena_items_field_idx ON public.arena_items (field_id, activo, orden);

DROP TRIGGER IF EXISTS arena_items_touch ON public.arena_items;
CREATE TRIGGER arena_items_touch
  BEFORE UPDATE ON public.arena_items
  FOR EACH ROW EXECUTE FUNCTION public.arena_touch_updated_at ();


-- -----------------------------------------------------------------------------
-- 4. arena_blackouts — días cerrados extra (lluvia, evento privado)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_blackouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE CASCADE,
  fecha date NOT NULL,
  motivo text CHECK (motivo IS NULL OR char_length(motivo) <= 200),
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS arena_blackouts_field_fecha_uidx ON public.arena_blackouts (field_id, fecha);


-- -----------------------------------------------------------------------------
-- 5. arena_payouts — liquidaciones al campo
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE RESTRICT,
  periodo_desde date NOT NULL,
  periodo_hasta date NOT NULL,
  reservas_count integer NOT NULL DEFAULT 0,
  bruto_centavos integer NOT NULL DEFAULT 0,
  comision_centavos integer NOT NULL DEFAULT 0,
  reembolsos_centavos integer NOT NULL DEFAULT 0,
  neto_centavos integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'transferido')),
  referencia text,
  transferido_at timestamptz,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (periodo_hasta >= periodo_desde)
);

CREATE INDEX IF NOT EXISTS arena_payouts_field_idx ON public.arena_payouts (field_id, created_at DESC);

DROP TRIGGER IF EXISTS arena_payouts_touch ON public.arena_payouts;
CREATE TRIGGER arena_payouts_touch
  BEFORE UPDATE ON public.arena_payouts
  FOR EACH ROW EXECUTE FUNCTION public.arena_touch_updated_at ();


-- -----------------------------------------------------------------------------
-- 6. arena_bookings — la reserva (un día, N jugadores)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  codigo text NOT NULL UNIQUE,
  field_id uuid NOT NULL REFERENCES public.fields (id) ON DELETE RESTRICT,
  fecha date NOT NULL,
  num_jugadores integer NOT NULL CHECK (num_jugadores BETWEEN 1 AND 500),
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  contacto_nombre text NOT NULL,
  contacto_email text NOT NULL,
  contacto_telefono text,
  access_token text NOT NULL UNIQUE,
  qr_token text NOT NULL UNIQUE,
  checkin_at timestamptz,
  checkin_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  jugadores_llegaron integer CHECK (jugadores_llegaron IS NULL OR jugadores_llegaron >= 0),
  subtotal_centavos integer NOT NULL CHECK (subtotal_centavos >= 0),
  comision_pct numeric(5, 2) NOT NULL,
  comision_centavos integer NOT NULL CHECK (comision_centavos >= 0),
  total_centavos integer NOT NULL CHECK (total_centavos > 0),
  monto_campo_centavos integer NOT NULL CHECK (monto_campo_centavos >= 0),
  status text NOT NULL DEFAULT 'pendiente_pago' CHECK (status IN ('pendiente_pago', 'confirmada', 'completada', 'cancelada', 'no_show', 'expirada')),
  pago_status text NOT NULL DEFAULT 'pendiente' CHECK (pago_status IN ('pendiente', 'pagado', 'fallido', 'reembolsado', 'reembolso_parcial')),
  reembolso_centavos integer NOT NULL DEFAULT 0 CHECK (reembolso_centavos >= 0),
  payout_id uuid REFERENCES public.arena_payouts (id) ON DELETE SET NULL,
  origen text NOT NULL DEFAULT 'web' CHECK (origen IN ('web', 'app', 'manual', 'admin')),
  expires_at timestamptz,
  notas_jugador text CHECK (notas_jugador IS NULL OR char_length(notas_jugador) <= 500),
  notas_internas text CHECK (notas_internas IS NULL OR char_length(notas_internas) <= 1000),
  cancelada_at timestamptz,
  cancelada_por text CHECK (cancelada_por IS NULL OR cancelada_por IN ('jugador', 'campo', 'admin', 'sistema')),
  motivo_cancelacion text,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS arena_bookings_field_fecha_idx ON public.arena_bookings (field_id, fecha, status);
CREATE INDEX IF NOT EXISTS arena_bookings_user_idx ON public.arena_bookings (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS arena_bookings_pending_idx ON public.arena_bookings (expires_at)
WHERE
  status = 'pendiente_pago';
CREATE INDEX IF NOT EXISTS arena_bookings_payout_idx ON public.arena_bookings (field_id, payout_id, fecha);

DROP TRIGGER IF EXISTS arena_bookings_touch ON public.arena_bookings;
CREATE TRIGGER arena_bookings_touch
  BEFORE UPDATE ON public.arena_bookings
  FOR EACH ROW EXECUTE FUNCTION public.arena_touch_updated_at ();


-- -----------------------------------------------------------------------------
-- 7. arena_booking_items — renglones con precio congelado
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_booking_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  booking_id uuid NOT NULL REFERENCES public.arena_bookings (id) ON DELETE CASCADE,
  item_id uuid REFERENCES public.arena_items (id) ON DELETE SET NULL,
  tipo text NOT NULL,
  nombre text NOT NULL,
  unidad text NOT NULL,
  precio_unit_centavos integer NOT NULL CHECK (precio_unit_centavos >= 0),
  cantidad integer NOT NULL CHECK (cantidad >= 1),
  subtotal_centavos integer NOT NULL CHECK (subtotal_centavos >= 0)
);

CREATE INDEX IF NOT EXISTS arena_booking_items_booking_idx ON public.arena_booking_items (booking_id);


-- -----------------------------------------------------------------------------
-- 8. arena_payments — intentos de pago, independiente del proveedor
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.arena_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid (),
  booking_id uuid NOT NULL REFERENCES public.arena_bookings (id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_ref text NOT NULL,
  monto_centavos integer NOT NULL CHECK (monto_centavos > 0),
  moneda text NOT NULL DEFAULT 'MXN',
  status text NOT NULL DEFAULT 'creado' CHECK (status IN ('creado', 'pendiente', 'pagado', 'fallido', 'reembolsado')),
  checkout_url text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_ref)
);

CREATE INDEX IF NOT EXISTS arena_payments_booking_idx ON public.arena_payments (booking_id, created_at DESC);

DROP TRIGGER IF EXISTS arena_payments_touch ON public.arena_payments;
CREATE TRIGGER arena_payments_touch
  BEFORE UPDATE ON public.arena_payments
  FOR EACH ROW EXECUTE FUNCTION public.arena_touch_updated_at ();


-- =============================================================================
-- FUNCIONES
-- Errores: RAISE EXCEPTION '<codigo>' — el backend lee error.message y lo
-- mapea a { error, code }. Códigos: arena_inactivo, campo_cerrado,
-- fecha_bloqueada, fuera_de_anticipacion, item_invalido, falta_item_base,
-- jugadores_invalido, contacto_invalido, origen_invalido, total_invalido,
-- rango_invalido, reserva_no_encontrada, qr_invalido, qr_otro_campo,
-- qr_fecha_distinta, qr_ya_usado, qr_no_confirmada, sin_permiso,
-- sin_reservas_por_liquidar
-- =============================================================================

-- ¿El usuario puede operar el campo? (miembro activo, creador legacy o admin app)
CREATE OR REPLACE FUNCTION public.arena_is_field_member (p_field_id uuid, p_user_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
  SELECT
    p_user_id IS NOT NULL
    AND (EXISTS (
        SELECT 1 FROM public.arena_field_members m
        WHERE m.field_id = p_field_id AND m.user_id = p_user_id AND m.status = 'activo')
      OR EXISTS (
        SELECT 1 FROM public.fields f
        WHERE f.id = p_field_id AND f.created_by = p_user_id)
      OR EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.id = p_user_id AND u.app_role = 'admin'));
$$;


-- ¿ARENA activo en el campo? (usada por RLS de lectura pública)
CREATE OR REPLACE FUNCTION public.arena_field_activo (p_field_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.arena_field_settings s
    WHERE s.field_id = p_field_id AND s.activo);
$$;


-- Horario del campo para una fecha, leído de fields.horarios_json.
-- Devuelve una fila si ese día abre con horario válido y no está bloqueado.
CREATE OR REPLACE FUNCTION public.arena_day_hours (p_field_id uuid, p_fecha date)
  RETURNS TABLE (
    apertura time,
    cierre time)
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  v_json jsonb;
  v_day jsonb;
  v_key text;
  v_ap text;
  v_ci text;
BEGIN
  IF p_fecha IS NULL THEN
    RETURN;
  END IF;

  SELECT f.horarios_json::jsonb INTO v_json FROM public.fields f WHERE f.id = p_field_id;
  IF v_json IS NULL OR jsonb_typeof(v_json) <> 'object' THEN
    RETURN;
  END IF;

  v_key := (ARRAY['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'])[EXTRACT(DOW FROM p_fecha)::integer + 1];
  v_day := v_json -> v_key;
  IF v_day IS NULL OR jsonb_typeof(v_day) <> 'object' OR COALESCE((v_day ->> 'abierto')::boolean, false) IS NOT TRUE THEN
    RETURN;
  END IF;

  v_ap := trim(COALESCE(v_day ->> 'apertura', ''));
  v_ci := trim(COALESCE(v_day ->> 'cierre', ''));
  IF v_ap !~ '^[0-9]{1,2}:[0-9]{2}$' OR v_ci !~ '^[0-9]{1,2}:[0-9]{2}$' THEN
    RETURN;
  END IF;
  IF v_ci::time <= v_ap::time THEN
    RETURN;
  END IF;

  IF EXISTS (SELECT 1 FROM public.arena_blackouts bl WHERE bl.field_id = p_field_id AND bl.fecha = p_fecha) THEN
    RETURN;
  END IF;

  RETURN QUERY SELECT v_ap::time, v_ci::time;
END;
$$;


-- Código corto AR-XXXXXX (sin caracteres ambiguos)
CREATE OR REPLACE FUNCTION public.arena_generate_code ()
  RETURNS text
  LANGUAGE plpgsql
  VOLATILE
  SET search_path = public
  AS $$
DECLARE
  v_alpha text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_code text;
  i integer;
BEGIN
  LOOP
    v_code := 'AR-';
    FOR i IN 1..6 LOOP
      v_code := v_code || substr(v_alpha, 1 + floor(random() * length(v_alpha))::integer, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.arena_bookings b WHERE b.codigo = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;


-- Token aleatorio de 64 hex (dos uuid v4, sin depender de pgcrypto)
CREATE OR REPLACE FUNCTION public.arena_random_token ()
  RETURNS text
  LANGUAGE sql
  VOLATILE
  AS $$
  SELECT replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
$$;


-- -----------------------------------------------------------------------------
-- Días reservables en un rango (máx. 62 días). Para el calendario.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_open_days (p_field_id uuid, p_desde date, p_hasta date)
  RETURNS TABLE (
    fecha date,
    apertura time,
    cierre time)
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path = public
  AS $$
#variable_conflict use_column
DECLARE
  v_s public.arena_field_settings%ROWTYPE;
  v_hoy date := (now() AT TIME ZONE 'America/Mexico_City')::date;
  v_desde date;
  v_hasta date;
BEGIN
  SELECT * INTO v_s FROM public.arena_field_settings s WHERE s.field_id = p_field_id;
  IF NOT FOUND OR NOT v_s.activo THEN
    RAISE EXCEPTION 'arena_inactivo';
  END IF;

  IF p_desde IS NULL OR p_hasta IS NULL OR p_hasta < p_desde OR (p_hasta - p_desde) > 62 THEN
    RAISE EXCEPTION 'rango_invalido';
  END IF;

  v_desde := GREATEST(p_desde, v_hoy);
  v_hasta := LEAST(p_hasta, v_hoy + v_s.anticipacion_max_dias);
  IF v_hasta < v_desde THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d.dia::date, h.apertura, h.cierre
  FROM generate_series(v_desde::timestamp, v_hasta::timestamp, interval '1 day') AS d (dia)
  CROSS JOIN LATERAL public.arena_day_hours (p_field_id, d.dia::date) AS h
  WHERE ((d.dia::date + h.apertura) AT TIME ZONE 'America/Mexico_City') >= now() + make_interval(hours => v_s.anticipacion_min_horas)
  ORDER BY d.dia;
END;
$$;


-- -----------------------------------------------------------------------------
-- Crear reserva. Siempre nace pendiente_pago. Sin cupo: todo día abierto acepta.
-- p_items: [{"item_id": "<uuid>", "cantidad": 2}, ...]
--   base por_persona  -> cantidad = num_jugadores (se ignora la enviada)
--   por_reserva       -> cantidad = 1
--   por_persona extra -> cantidad enviada (1..num_jugadores), default num_jugadores
--   por_unidad        -> cantidad enviada (>=1, <= max_por_reserva), default 1
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_create_booking (
  p_field_id uuid,
  p_fecha date,
  p_num_jugadores integer,
  p_items jsonb,
  p_contacto_nombre text,
  p_contacto_email text,
  p_contacto_telefono text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_origen text DEFAULT 'web',
  p_notas_jugador text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL)
  RETURNS TABLE (
    booking_id uuid,
    codigo text,
    access_token text,
    qr_token text,
    total_centavos integer,
    expires_at timestamptz,
    status text)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
#variable_conflict use_column
DECLARE
  v_s public.arena_field_settings%ROWTYPE;
  v_item public.arena_items%ROWTYPE;
  v_apertura time;
  v_cierre time;
  v_el jsonb;
  v_item_id uuid;
  v_cant integer;
  v_seen uuid[] := '{}';
  v_has_base boolean := false;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_comision integer;
  v_hoy date := (now() AT TIME ZONE 'America/Mexico_City')::date;
  v_id uuid := gen_random_uuid();
  v_codigo text;
  v_access text;
  v_qr text;
  v_expires timestamptz;
BEGIN
  -- Validaciones básicas
  IF p_origen IS NULL OR p_origen NOT IN ('web', 'app', 'manual', 'admin') THEN
    RAISE EXCEPTION 'origen_invalido';
  END IF;
  IF p_num_jugadores IS NULL OR p_num_jugadores < 1 OR p_num_jugadores > 500 THEN
    RAISE EXCEPTION 'jugadores_invalido';
  END IF;
  IF COALESCE(trim(p_contacto_nombre), '') = '' OR COALESCE(trim(p_contacto_email), '') = '' THEN
    RAISE EXCEPTION 'contacto_invalido';
  END IF;

  -- Campo con ARENA activo
  SELECT * INTO v_s FROM public.arena_field_settings s WHERE s.field_id = p_field_id;
  IF NOT FOUND OR NOT v_s.activo THEN
    RAISE EXCEPTION 'arena_inactivo';
  END IF;

  -- El campo abre ese día (horarios_json) y no está bloqueado
  IF p_fecha IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.arena_blackouts bl WHERE bl.field_id = p_field_id AND bl.fecha = p_fecha) THEN
    RAISE EXCEPTION 'fecha_bloqueada';
  END IF;
  SELECT h.apertura, h.cierre INTO v_apertura, v_cierre FROM public.arena_day_hours (p_field_id, p_fecha) h;
  IF v_apertura IS NULL THEN
    RAISE EXCEPTION 'campo_cerrado';
  END IF;

  -- Anticipación. Web/app: X horas antes de la apertura.
  -- Manual/admin (reservas por WhatsApp): hasta antes del cierre del mismo día.
  IF p_fecha > v_hoy + v_s.anticipacion_max_dias THEN
    RAISE EXCEPTION 'fuera_de_anticipacion';
  END IF;
  IF p_origen IN ('manual', 'admin') THEN
    IF ((p_fecha + v_cierre) AT TIME ZONE 'America/Mexico_City') <= now() THEN
      RAISE EXCEPTION 'fuera_de_anticipacion';
    END IF;
  ELSIF ((p_fecha + v_apertura) AT TIME ZONE 'America/Mexico_City') < now() + make_interval(hours => v_s.anticipacion_min_horas) THEN
    RAISE EXCEPTION 'fuera_de_anticipacion';
  END IF;

  -- Items: precios SIEMPRE desde la BD
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'falta_item_base';
  END IF;

  FOR v_el IN SELECT e FROM jsonb_array_elements(p_items) AS t (e) LOOP
    BEGIN
      v_item_id := (v_el ->> 'item_id')::uuid;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'item_invalido';
    END;

    IF v_item_id IS NULL OR v_item_id = ANY (v_seen) THEN
      RAISE EXCEPTION 'item_invalido';
    END IF;
    v_seen := v_seen || v_item_id;

    SELECT * INTO v_item FROM public.arena_items i
    WHERE i.id = v_item_id AND i.field_id = p_field_id AND i.activo;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'item_invalido';
    END IF;

    IF v_item.es_base THEN
      v_has_base := true;
      IF (v_item.min_jugadores IS NOT NULL AND p_num_jugadores < v_item.min_jugadores)
        OR (v_item.max_jugadores IS NOT NULL AND p_num_jugadores > v_item.max_jugadores) THEN
        RAISE EXCEPTION 'item_invalido';
      END IF;
    END IF;

    BEGIN
      v_cant := CASE
        WHEN v_item.unidad = 'por_reserva' THEN 1
        WHEN v_item.unidad = 'por_persona' AND v_item.es_base THEN p_num_jugadores
        WHEN v_item.unidad = 'por_persona' THEN COALESCE((v_el ->> 'cantidad')::integer, p_num_jugadores)
        ELSE COALESCE((v_el ->> 'cantidad')::integer, 1)
      END;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'item_invalido';
    END;

    IF v_cant < 1
      OR (v_item.unidad = 'por_persona' AND v_cant > p_num_jugadores)
      OR (v_item.max_por_reserva IS NOT NULL AND v_cant > v_item.max_por_reserva) THEN
      RAISE EXCEPTION 'item_invalido';
    END IF;

    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'item_id', v_item.id,
      'tipo', v_item.tipo,
      'nombre', v_item.nombre,
      'unidad', v_item.unidad,
      'precio', v_item.precio_centavos,
      'cantidad', v_cant,
      'subtotal', v_item.precio_centavos * v_cant));
    v_subtotal := v_subtotal + v_item.precio_centavos * v_cant;
  END LOOP;

  IF NOT v_has_base THEN
    RAISE EXCEPTION 'falta_item_base';
  END IF;
  IF v_subtotal <= 0 THEN
    RAISE EXCEPTION 'total_invalido';
  END IF;

  -- Comisión incluida en el precio: el jugador paga el subtotal
  v_comision := round(v_subtotal * v_s.comision_pct / 100.0)::integer;
  v_codigo := public.arena_generate_code ();
  v_access := public.arena_random_token ();
  v_qr := public.arena_random_token ();
  v_expires := now() + CASE WHEN p_origen = 'manual' THEN interval '2 hours' ELSE interval '15 minutes' END;

  INSERT INTO public.arena_bookings (
    id, codigo, field_id, fecha, num_jugadores,
    user_id, contacto_nombre, contacto_email, contacto_telefono,
    access_token, qr_token,
    subtotal_centavos, comision_pct, comision_centavos, total_centavos, monto_campo_centavos,
    status, pago_status, origen, expires_at, notas_jugador, created_by)
  VALUES (
    v_id, v_codigo, p_field_id, p_fecha, p_num_jugadores,
    p_user_id, trim(p_contacto_nombre), lower(trim(p_contacto_email)), NULLIF(trim(COALESCE(p_contacto_telefono, '')), ''),
    v_access, v_qr,
    v_subtotal, v_s.comision_pct, v_comision, v_subtotal, v_subtotal - v_comision,
    'pendiente_pago', 'pendiente', p_origen, v_expires, p_notas_jugador, COALESCE(p_created_by, p_user_id));

  INSERT INTO public.arena_booking_items (
    booking_id, item_id, tipo, nombre, unidad, precio_unit_centavos, cantidad, subtotal_centavos)
  SELECT
    v_id,
    (l ->> 'item_id')::uuid,
    l ->> 'tipo',
    l ->> 'nombre',
    l ->> 'unidad',
    (l ->> 'precio')::integer,
    (l ->> 'cantidad')::integer,
    (l ->> 'subtotal')::integer
  FROM jsonb_array_elements(v_lines) AS t (l);

  RETURN QUERY SELECT v_id, v_codigo, v_access, v_qr, v_subtotal, v_expires, 'pendiente_pago'::text;
END;
$$;


-- -----------------------------------------------------------------------------
-- Pago aprobado (lo llama el webhook). Idempotente.
-- Devuelve: 'confirmada' | 'ya_confirmada' | 'cancelada_reembolsar'
-- Sin cupo: un pago aprobado siempre confirma, aunque llegue tarde.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_mark_paid (p_booking_id uuid)
  RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  v_b public.arena_bookings%ROWTYPE;
BEGIN
  SELECT * INTO v_b FROM public.arena_bookings b WHERE b.id = p_booking_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'reserva_no_encontrada';
  END IF;

  IF v_b.status IN ('confirmada', 'completada', 'no_show') THEN
    RETURN 'ya_confirmada';
  END IF;

  IF v_b.status = 'cancelada' THEN
    UPDATE public.arena_bookings SET pago_status = 'pagado' WHERE id = v_b.id AND pago_status = 'pendiente';
    RETURN 'cancelada_reembolsar';
  END IF;

  -- pendiente_pago o expirada: se confirma
  UPDATE public.arena_bookings
  SET status = 'confirmada', pago_status = 'pagado', expires_at = NULL
  WHERE id = v_b.id;
  RETURN 'confirmada';
END;
$$;


-- -----------------------------------------------------------------------------
-- Check-in por QR. p_field_id opcional (cuando se escanea desde el panel de un campo).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_checkin (
  p_qr_token text,
  p_user_id uuid,
  p_field_id uuid DEFAULT NULL,
  p_jugadores_llegaron integer DEFAULT NULL)
  RETURNS TABLE (
    booking_id uuid,
    codigo text,
    status text,
    checkin_at timestamptz,
    jugadores_llegaron integer)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
#variable_conflict use_column
DECLARE
  v_b public.arena_bookings%ROWTYPE;
  v_hoy date := (now() AT TIME ZONE 'America/Mexico_City')::date;
  v_llegaron integer;
BEGIN
  SELECT * INTO v_b FROM public.arena_bookings b WHERE b.qr_token = p_qr_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'qr_invalido';
  END IF;

  IF p_field_id IS NOT NULL AND p_field_id <> v_b.field_id THEN
    RAISE EXCEPTION 'qr_otro_campo';
  END IF;

  IF NOT public.arena_is_field_member (v_b.field_id, p_user_id) THEN
    RAISE EXCEPTION 'sin_permiso';
  END IF;

  IF v_b.status = 'completada' THEN
    RAISE EXCEPTION 'qr_ya_usado'
      USING DETAIL = to_char(v_b.checkin_at AT TIME ZONE 'America/Mexico_City', 'YYYY-MM-DD HH24:MI');
  END IF;

  IF v_b.status <> 'confirmada' THEN
    RAISE EXCEPTION 'qr_no_confirmada' USING DETAIL = v_b.status;
  END IF;

  IF v_b.fecha <> v_hoy THEN
    RAISE EXCEPTION 'qr_fecha_distinta' USING DETAIL = v_b.fecha::text;
  END IF;

  v_llegaron := GREATEST(COALESCE(p_jugadores_llegaron, v_b.num_jugadores), 0);

  UPDATE public.arena_bookings
  SET status = 'completada', checkin_at = now(), checkin_by = p_user_id, jugadores_llegaron = v_llegaron
  WHERE id = v_b.id;

  RETURN QUERY
  SELECT b.id, b.codigo, b.status, b.checkin_at, b.jugadores_llegaron
  FROM public.arena_bookings b WHERE b.id = v_b.id;
END;
$$;


-- -----------------------------------------------------------------------------
-- Expirar reservas que nunca se pagaron (limpieza de la agenda)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_expire_pending ()
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  v_n integer;
BEGIN
  UPDATE public.arena_bookings
  SET status = 'expirada'
  WHERE status = 'pendiente_pago' AND expires_at <= now();
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RETURN v_n;
END;
$$;


-- -----------------------------------------------------------------------------
-- Crear liquidación: reservas pagadas, con fecha ya pasada, sin liquidación previa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.arena_create_payout (p_field_id uuid, p_hasta date, p_created_by uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  v_hoy date := (now() AT TIME ZONE 'America/Mexico_City')::date;
  v_hasta date;
  v_id uuid := gen_random_uuid();
  v_count integer;
  v_desde date;
  v_bruto integer;
  v_com integer;
  v_reemb integer;
  v_neto integer;
BEGIN
  v_hasta := LEAST(COALESCE(p_hasta, v_hoy - 1), v_hoy - 1);

  PERFORM 1 FROM public.arena_bookings b
  WHERE b.field_id = p_field_id
    AND b.payout_id IS NULL
    AND b.fecha <= v_hasta
    AND b.pago_status IN ('pagado', 'reembolso_parcial')
    AND b.status IN ('confirmada', 'completada', 'no_show')
  FOR UPDATE;

  SELECT
    count(*)::integer,
    min(b.fecha),
    COALESCE(sum(b.total_centavos), 0)::integer,
    COALESCE(sum(b.comision_centavos), 0)::integer,
    COALESCE(sum(b.reembolso_centavos), 0)::integer,
    COALESCE(sum(GREATEST(b.monto_campo_centavos - b.reembolso_centavos, 0)), 0)::integer
  INTO v_count, v_desde, v_bruto, v_com, v_reemb, v_neto
  FROM public.arena_bookings b
  WHERE b.field_id = p_field_id
    AND b.payout_id IS NULL
    AND b.fecha <= v_hasta
    AND b.pago_status IN ('pagado', 'reembolso_parcial')
    AND b.status IN ('confirmada', 'completada', 'no_show');

  IF v_count = 0 THEN
    RAISE EXCEPTION 'sin_reservas_por_liquidar';
  END IF;

  INSERT INTO public.arena_payouts (
    id, field_id, periodo_desde, periodo_hasta, reservas_count,
    bruto_centavos, comision_centavos, reembolsos_centavos, neto_centavos, created_by)
  VALUES (
    v_id, p_field_id, v_desde, v_hasta, v_count,
    v_bruto, v_com, v_reemb, v_neto, p_created_by);

  UPDATE public.arena_bookings b
  SET payout_id = v_id
  WHERE b.field_id = p_field_id
    AND b.payout_id IS NULL
    AND b.fecha <= v_hasta
    AND b.pago_status IN ('pagado', 'reembolso_parcial')
    AND b.status IN ('confirmada', 'completada', 'no_show');

  RETURN v_id;
END;
$$;


-- =============================================================================
-- PERMISOS DE FUNCIONES: solo service role (backend). arena_field_activo es
-- pública porque la usan las políticas de lectura.
-- =============================================================================
REVOKE ALL ON FUNCTION public.arena_is_field_member (uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_day_hours (uuid, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_generate_code () FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_random_token () FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_open_days (uuid, date, date) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_create_booking (uuid, date, integer, jsonb, text, text, text, uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_mark_paid (uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_checkin (text, uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_expire_pending () FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.arena_create_payout (uuid, date, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.arena_is_field_member (uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_day_hours (uuid, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_generate_code () TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_random_token () TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_open_days (uuid, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_create_booking (uuid, date, integer, jsonb, text, text, text, uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_mark_paid (uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_checkin (text, uuid, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_expire_pending () TO service_role;
GRANT EXECUTE ON FUNCTION public.arena_create_payout (uuid, date, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.arena_field_activo (uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.arena_field_activo (uuid) TO anon, authenticated, service_role;


-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.arena_field_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_field_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_blackouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_payments ENABLE ROW LEVEL SECURITY;

-- Lectura pública: catálogo activo de campos con ARENA activo (SSR de la ficha)
DROP POLICY IF EXISTS "arena_items_select_public" ON public.arena_items;
CREATE POLICY "arena_items_select_public" ON public.arena_items
  FOR SELECT TO anon, authenticated
  USING (activo AND public.arena_field_activo (field_id));

-- Resto de tablas: sin políticas = sin acceso desde anon/authenticated.
-- Solo el backend (service role) lee y escribe.


-- =============================================================================
-- OPCIONAL — pg_cron: limpia reservas no pagadas cada 5 min.
-- Correr APARTE solo si pg_cron está habilitado (Database > Extensions).
-- =============================================================================
-- SELECT cron.schedule('arena_expire_pending', '*/5 * * * *', $$SELECT public.arena_expire_pending()$$);
