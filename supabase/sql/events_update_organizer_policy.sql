-- Permitir que el organizador del evento actualice datos básicos (sin campo/fecha salvo admin o dueño de campo).
-- Ejecutar en Supabase SQL Editor después de events_and_rsvps.sql.

DROP POLICY IF EXISTS "events_update_organizer" ON public.events;

CREATE POLICY "events_update_organizer" ON public.events FOR UPDATE TO authenticated
USING (organizador_id = auth.uid ())
WITH CHECK (organizador_id = auth.uid ());

DROP TRIGGER IF EXISTS trg_events_guard_organizer_field_fecha ON public.events;

CREATE OR REPLACE FUNCTION public.events_guard_organizer_field_fecha ()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $$
DECLARE
  is_admin boolean;

  is_field_owner boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  SELECT
    EXISTS (
      SELECT
        1
      FROM
        public.users u
      WHERE
        u.id = auth.uid ()
        AND u.app_role = 'admin') INTO is_admin;

  IF is_admin THEN
    RETURN NEW;
  END IF;

  SELECT
    EXISTS (
      SELECT
        1
      FROM
        public.fields f
      WHERE
        f.id = OLD.field_id
        AND f.created_by = auth.uid ()) INTO is_field_owner;

  IF is_field_owner THEN
    RETURN NEW;
  END IF;

  IF OLD.organizador_id IS NOT DISTINCT FROM auth.uid () THEN
    IF NEW.field_id IS DISTINCT FROM OLD.field_id OR NEW.fecha IS DISTINCT FROM OLD.fecha OR NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'forbidden'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_events_guard_organizer_field_fecha
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE PROCEDURE public.events_guard_organizer_field_fecha ();
