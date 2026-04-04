const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

export async function notifyTeamJoinRequest(
  teamId: string,
  body: {
    solicitante_nombre: string
    solicitante_alias: string | null
    team_nombre: string
  }
): Promise<void> {
  try {
    await fetch(
      `${API_URL}/teams/${encodeURIComponent(teamId)}/notify-join-request`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )
  } catch {
    /* no bloquear flujo principal */
  }
}
