-- Unique index: a lo sumo una solicitud pendiente o aprobada por (team_id, user_id).
-- Las filas con status 'rechazado' pueden repetirse; nuevos INSERT tras rechazo están permitidos.
-- Ejecutar en Supabase SQL Editor si aún no existe.

CREATE UNIQUE INDEX IF NOT EXISTS team_join_requests_unique_pending_or_approved
ON public.team_join_requests (team_id, user_id)
WHERE status IN ('pendiente', 'aprobado');
