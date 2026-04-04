'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type TeamOption = { id: string; nombre: string }

function todayInputMin(): string {
  const t = new Date()
  const y = t.getFullYear()
  const m = String(t.getMonth() + 1).padStart(2, '0')
  const d = String(t.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function SolicitarCampoButton({
  fieldId,
  fieldNombre,
  fieldSlug,
  userId,
}: {
  fieldId: string
  fieldNombre: string
  fieldSlug: string
  userId: string | null
}) {
  const router = useRouter()
  const loginHref = `/login?redirect=${encodeURIComponent(`/campos/${fieldSlug}`)}`

  const [open, setOpen] = useState(false)
  const [fechaDeseada, setFechaDeseada] = useState('')
  const [numJugadores, setNumJugadores] = useState(10)
  const [teamId, setTeamId] = useState<string>('')
  const [mensaje, setMensaje] = useState('')
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [loadingTeams, setLoadingTeams] = useState(false)
  const [checkingPending, setCheckingPending] = useState(false)
  const [hasPending, setHasPending] = useState(false)
  const [sentOk, setSentOk] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minDate = useMemo(() => todayInputMin(), [])

  const loadPending = useCallback(async () => {
    if (!userId) return
    setCheckingPending(true)
    try {
      const { data, error: qErr } = await supabase
        .from('field_requests')
        .select('status')
        .eq('field_id', fieldId)
        .eq('solicitante_id', userId)
        .eq('status', 'pendiente')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (qErr) throw qErr
      setHasPending(Boolean(data))
    } catch {
      setHasPending(false)
    } finally {
      setCheckingPending(false)
    }
  }, [fieldId, userId])

  const loadTeams = useCallback(async () => {
    if (!userId) return
    setLoadingTeams(true)
    try {
      const { data, error: qErr } = await supabase
        .from('team_members')
        .select('team_id, teams ( id, nombre )')
        .eq('user_id', userId)
        .eq('status', 'activo')
        .in('rol_plataforma', ['founder', 'admin'])

      if (qErr) throw qErr

      const opts: TeamOption[] = []
      for (const row of data ?? []) {
        const raw = row.teams
        const t = Array.isArray(raw) ? raw[0] : raw
        if (t && typeof t === 'object' && 'id' in t && 'nombre' in t) {
          const id = String((t as { id: string }).id)
          const nombre = String((t as { nombre: string }).nombre ?? '')
          if (id) opts.push({ id, nombre })
        }
      }
      setTeams(opts)
    } catch {
      setTeams([])
    } finally {
      setLoadingTeams(false)
    }
  }, [userId])

  useEffect(() => {
    void loadPending()
  }, [loadPending])

  useEffect(() => {
    if (open && userId) void loadTeams()
  }, [open, userId, loadTeams])

  const buttonDisabled =
    sentOk || hasPending || checkingPending || submitting

  const buttonLabel = sentOk
    ? 'SOLICITUD ENVIADA'
    : hasPending
      ? 'SOLICITUD PENDIENTE'
      : 'SOLICITAR CAMPO'

  const buttonClass = sentOk || hasPending
    ? 'inline-flex w-full cursor-not-allowed items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-4 text-center text-xs font-extrabold uppercase tracking-[0.14em] text-[#666666] md:w-auto md:min-w-[220px]'
    : 'inline-flex w-full items-center justify-center border border-[#CC4B37] bg-[#CC4B37] px-4 py-4 text-center text-xs font-extrabold uppercase tracking-[0.14em] text-white md:w-auto md:min-w-[220px]'

  const handlePrimaryClick = () => {
    if (!userId) {
      router.push(loginHref)
      return
    }
    if (sentOk || hasPending) return
    setOpen(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setError(null)
    if (!fechaDeseada.trim()) {
      setError('Indica la fecha deseada.')
      return
    }
    if (numJugadores < 1 || numJugadores > 500) {
      setError('El número de jugadores debe estar entre 1 y 500.')
      return
    }
    setSubmitting(true)
    try {
      const { error: insErr } = await supabase.from('field_requests').insert({
        field_id: fieldId,
        solicitante_id: userId,
        team_id: teamId.trim() ? teamId.trim() : null,
        fecha_deseada: fechaDeseada,
        numero_jugadores: numJugadores,
        mensaje: mensaje.trim() ? mensaje.trim().slice(0, 300) : null,
        status: 'pendiente',
      })
      if (insErr) throw insErr
      setSentOk(true)
      setHasPending(true)
      setOpen(false)
      setFechaDeseada('')
      setMensaje('')
      setTeamId('')
      setNumJugadores(10)
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'No se pudo enviar la solicitud.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={buttonDisabled && Boolean(userId)}
        onClick={handlePrimaryClick}
        className={buttonClass}
        style={{ ...jost, borderRadius: 0 }}
      >
        {checkingPending && userId ? '…' : buttonLabel}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
          role="presentation"
          onClick={() => !submitting && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="solicitar-campo-title"
            className="max-h-[min(92vh,720px)] w-full max-w-md overflow-y-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF] sm:max-h-[85vh]"
            style={{ borderRadius: 0 }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="border-b border-solid border-[#EEEEEE] px-4 py-4 md:px-5">
              <h2
                id="solicitar-campo-title"
                className="text-[18px] leading-tight tracking-[0.08em] text-[#111111] md:text-[20px]"
                style={{ ...jost, fontWeight: 800 }}
              >
                SOLICITAR CAMPO
              </h2>
              <p
                className="mt-2 text-[13px] leading-relaxed text-[#666666]"
                style={lato}
              >
                Tu solicitud será revisada por el encargado
              </p>
              {fieldNombre.trim() ? (
                <p
                  className="mt-1 text-[12px] font-semibold text-[#111111]"
                  style={lato}
                >
                  {fieldNombre.trim()}
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="px-4 py-4 md:px-5">
              <label className="block">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  Fecha deseada
                </span>
                <input
                  type="date"
                  required
                  min={minDate}
                  value={fechaDeseada}
                  onChange={(ev) => setFechaDeseada(ev.target.value)}
                  className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
                  style={{ borderRadius: 0, ...lato }}
                />
              </label>

              <label className="mt-4 block">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  Número de jugadores
                </span>
                <input
                  type="number"
                  required
                  min={1}
                  max={500}
                  value={numJugadores}
                  onChange={(ev) =>
                    setNumJugadores(Number.parseInt(ev.target.value, 10) || 1)
                  }
                  className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
                  style={{ borderRadius: 0, ...lato }}
                />
              </label>

              <label className="mt-4 block">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  Equipo (opcional)
                </span>
                <select
                  value={teamId}
                  onChange={(ev) => setTeamId(ev.target.value)}
                  disabled={loadingTeams}
                  className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
                  style={{ borderRadius: 0, ...lato }}
                >
                  <option value="">
                    Sin equipo / Organizador individual
                  </option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  Mensaje (opcional)
                </span>
                <textarea
                  value={mensaje}
                  maxLength={300}
                  rows={4}
                  onChange={(ev) => setMensaje(ev.target.value)}
                  className="mt-1.5 w-full resize-y border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
                  style={{ borderRadius: 0, ...lato }}
                  placeholder="Detalles para el encargado…"
                />
                <span
                  className="mt-1 block text-[11px] text-[#999999]"
                  style={lato}
                >
                  {mensaje.length}/300
                </span>
              </label>

              {error ? (
                <p className="mt-3 text-[13px] text-[#CC4B37]" style={lato}>
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="submit"
                  disabled={submitting}
                  style={jost}
                  className="min-h-[48px] flex-1 bg-[#CC4B37] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#FFFFFF] disabled:opacity-60"
                >
                  {submitting ? 'ENVIANDO…' : 'ENVIAR SOLICITUD'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setOpen(false)}
                  style={jost}
                  className="min-h-[48px] flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#111111]"
                >
                  CANCELAR
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
