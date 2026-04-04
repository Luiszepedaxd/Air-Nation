-- =============================================================================
-- BLOQUE SEPARADO — RPC: crear evento al aprobar solicitud de campo privado
-- Ejecutar en Supabase SQL Editor (después de `events_and_rsvps.sql` y `field_requests`).
-- Requiere columna `field_requests.approved_event_id` — aplicar antes
-- `field_requests_solicitante_select_approved_event.sql` si la tabla ya existía.
-- Requiere `field_requests.imagen_url` (ver `field_requests_imagen_url.sql`).
-- Nota: en `field_requests` la columna de cupo es `num_jugadores`.

CREATE OR REPLACE FUNCTION public.create_event_from_field_request (p_request_id uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  v_request public.field_requests%ROWTYPE;

  v_field public.fields%ROWTYPE;

  v_event_id uuid;

  v_imagen text;
BEGIN
  SELECT
    * INTO v_request
  FROM
    public.field_requests
  WHERE
    id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'field_request not found';
  END IF;

  IF v_request.status IS DISTINCT FROM 'pendiente' THEN
    RAISE EXCEPTION 'request is not pending';
  END IF;

  SELECT
    * INTO v_field
  FROM
    public.fields
  WHERE
    id = v_request.field_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'field not found';
  END IF;

  IF v_field.created_by IS DISTINCT FROM auth.uid () THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_imagen := COALESCE(v_request.imagen_url, v_field.foto_portada_url);

  INSERT INTO public.events (
    title,
    descripcion,
    field_id,
    fecha,
    cupo,
    disciplina,
    tipo,
    published,
    status,
    imagen_url,
    organizador_id,
    created_by
  )
  VALUES (
    'Partida en ' || v_field.nombre,
    v_request.mensaje,
    v_request.field_id,
    v_request.fecha_deseada::timestamptz,
    v_request.num_jugadores,
    'airsoft',
    'privado',
    true,
    'publicado',
    v_imagen,
    v_request.solicitante_id,
    v_request.solicitante_id
  )
RETURNING
  id INTO v_event_id;

  UPDATE public.field_requests
  SET
    status = 'aprobado',
    updated_at = now(),
    approved_event_id = v_event_id
  WHERE
    id = p_request_id;

  RETURN v_event_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_event_from_field_request (uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_event_from_field_request (uuid) TO authenticated;
