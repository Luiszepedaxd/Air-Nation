import { apiFetch } from '@/lib/apiFetch'

export async function notifyTeamJoinRequest(
  teamId: string,
  body: {
    solicitante_nombre: string
    solicitante_alias: string | null
    team_nombre: string
  }
): Promise<void> {
  try {
    await apiFetch(
      `/teams/${encodeURIComponent(teamId)}/notify-join-request`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )
  } catch {
    /* no bloquear flujo principal */
  }
}
