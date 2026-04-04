-- RPC: aprobar solicitud de ingreso (join_requests + team_members + users.team_id).
-- Ejecutar en Supabase SQL Editor. Requiere índice único en team_members (team_id, user_id):
--
-- CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_id_user_id_key
--   ON public.team_members (team_id, user_id);

CREATE OR REPLACE FUNCTION public.approve_team_member(
  p_request_id UUID,
  p_team_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.user_id = v_caller
      AND tm.status = 'activo'
      AND tm.rol_plataforma IN ('founder', 'admin')
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.team_join_requests
  SET status = 'aprobado'
  WHERE id = p_request_id
    AND team_id = p_team_id
    AND user_id = p_user_id
    AND status = 'pendiente';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid or already processed request';
  END IF;

  INSERT INTO public.team_members (team_id, user_id, rol_plataforma, rango_militar, status)
  VALUES (p_team_id, p_user_id, 'member', 'miembro', 'activo')
  ON CONFLICT (team_id, user_id) DO UPDATE
  SET status = 'activo';

  UPDATE public.users
  SET team_id = p_team_id
  WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_team_member(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_team_member(UUID, UUID, UUID) TO authenticated;
