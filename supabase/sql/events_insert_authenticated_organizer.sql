-- Ticket: cualquier usuario autenticado puede crear eventos con organizador_id = auth.uid().
-- Ejecutar en Supabase SQL Editor después de events_and_rsvps.sql.

DROP POLICY IF EXISTS "events_insert_authenticated_organizer" ON public.events;

CREATE POLICY "events_insert_authenticated_organizer" ON public.events FOR INSERT TO authenticated
WITH CHECK (
  organizador_id = auth.uid ()
  AND created_by = auth.uid ()
);
