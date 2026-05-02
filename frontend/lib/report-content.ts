const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

export type ReportTargetType = 'post' | 'comment' | 'user'

export type ReportReason =
  | 'spam'
  | 'inappropriate'
  | 'harassment'
  | 'other'

export type ReportPayload = {
  reporter_id: string
  target_type: ReportTargetType
  target_id: string
  reason: ReportReason
  details?: string | null
}

export async function submitReport(
  payload: ReportPayload
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporter_id: payload.reporter_id,
        target_type: payload.target_type,
        target_id: payload.target_id,
        reason: payload.reason,
        details: payload.details?.trim() || undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data?.success) {
      return {
        ok: false,
        error: data?.error || 'No se pudo enviar el reporte',
      }
    }
    return { ok: true, id: String(data.id) }
  } catch (err) {
    return {
      ok: false,
      error: (err as Error)?.message || 'Error de red',
    }
  }
}
