-- =============================================================================
-- SQL SEPARADO PARA SUPABASE — RPC remove_team_member (BUG 4)
-- Ejecutar en Supabase SQL Editor después del deploy del frontend.
-- =============================================================================
--
-- Quita al integrante del equipo (team_members.status = inactivo) y limpia
-- users.team_id si aún apuntaba a ese equipo. Requiere permisos de fundador/admin.
--
-- Revoca ejecución pública y otorga a rol authenticated (mismo patrón que approve_team_member).

CREATE OR REPLACE FUNCTION public.remove_team_member(
  p_member_id UUID,
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.team_members
    WHERE id = p_member_id
      AND team_id = p_team_id
      AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'invalid member';
  END IF;

  UPDATE public.team_members
  SET status = 'inactivo'
  WHERE id = p_member_id
    AND team_id = p_team_id;

  UPDATE public.users
  SET team_id = NULL
  WHERE id = p_user_id
    AND team_id = p_team_id;
END;
$$;

REVOKE ALL ON FUNCTION public.remove_team_member(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_team_member(UUID, UUID, UUID) TO authenticated;
