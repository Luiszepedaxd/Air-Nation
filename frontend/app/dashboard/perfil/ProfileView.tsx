'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { apiFetch, uploadFile } from '@/lib/apiFetch'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[#111111] outline-none focus:border-[#CC4B37] rounded-[2px]'

const ROLE_LABELS: Record<string, string> = {
  rifleman: 'Jugador',
  sniper: 'Francotirador',
  support: 'Support',
  medic: 'Medic',
  team_leader: 'Líder de equipo',
  scout: 'Scout',
  rookie: 'Rookie',
}

const ROLE_OPTIONS = [
  { value: 'rifleman', label: 'Jugador' },
  { value: 'sniper', label: 'Francotirador' },
  { value: 'support', label: 'Support' },
  { value: 'medic', label: 'Medic' },
  { value: 'team_leader', label: 'Líder de equipo' },
  { value: 'scout', label: 'Scout' },
  { value: 'rookie', label: 'Rookie' },
]

const MAX_BYTES = 10 * 1024 * 1024
const MIME_OK = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type ProfileUserRow = {
  id: string
  email: string | null
  nombre: string | null
  alias: string | null
  ciudad: string | null
  rol: string | null
  team_id: string | null
  como_se_entero: string | null
  app_role: string | null
  avatar_url: string | null
  member_number: string | number | null
  created_at: string
  bio: string | null
  foto_portada_url: string | null
  instagram: string | null
  tiktok: string | null
  youtube: string | null
  facebook: string | null
}

function formatDMY(iso: string) {
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return ''
  }
}

type TeamSearchRow = { id: string; nombre: string }

function initialFromUser(u: ProfileUserRow) {
  const rolOk = u.rol && ROLE_OPTIONS.some((o) => o.value === u.rol)
  return {
    nombre: u.nombre ?? '',
    alias: u.alias ?? '',
    ciudad: u.ciudad ?? '',
    rol: (rolOk ? u.rol : 'rifleman') as string,
    bio: u.bio ?? '',
    instagram: u.instagram ?? '',
    tiktok: u.tiktok ?? '',
    youtube: u.youtube ?? '',
    facebook: u.facebook ?? '',
  }
}

function Spinner({ className = 'text-[#FFFFFF]' }: { className?: string }) {
  return (
    <svg
      className={`h-5 w-5 animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

type Props = {
  user: ProfileUserRow
  teamNombre: string | null
  teamSlug: string | null
  pendingJoinPending?: { id: string; nombre: string }[]
}

export function ProfileView({
  user: initialUser,
  teamNombre,
  teamSlug,
  pendingJoinPending = [],
}: Props) {
  const [user, setUser] = useState<ProfileUserRow>(initialUser)
  const [readTeamNombre, setReadTeamNombre] = useState(teamNombre ?? '')
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState(() => initialFromUser(initialUser))
  const [teamIdDraft, setTeamIdDraft] = useState<string | null>(null)
  const [teamSearchText, setTeamSearchText] = useState('')
  const [teamLockedName, setTeamLockedName] = useState<string | null>(null)
  const [teamResults, setTeamResults] = useState<TeamSearchRow[]>([])
  const [teamSearchLoading, setTeamSearchLoading] = useState(false)
  const [teamMenuOpen, setTeamMenuOpen] = useState(false)
  const teamWrapRef = useRef<HTMLDivElement>(null)
  const teamSearchAbortRef = useRef<AbortController | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [portadaUploading, setPortadaUploading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [portadaError, setPortadaError] = useState('')
  const [formError, setFormError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const portadaFileRef = useRef<HTMLInputElement>(null)
  const [shareLabel, setShareLabel] = useState('COMPARTIR PERFIL')
  const shareCopiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [localPendingJoins, setLocalPendingJoins] = useState<
    { id: string; nombre: string }[]
  >([])
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('')
  const [portadaUrl, setPortadaUrl] = useState<string | null>(
    () => initialUser.foto_portada_url ?? null
  )

  const displayPendingJoins = useMemo(() => {
    const seen = new Set(pendingJoinPending.map((p) => p.id))
    const extra = localPendingJoins.filter((p) => !seen.has(p.id))
    return [...pendingJoinPending, ...extra]
  }, [pendingJoinPending, localPendingJoins])

  useEffect(() => {
    setReadTeamNombre(teamNombre ?? '')
  }, [teamNombre])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!teamWrapRef.current?.contains(e.target as Node)) setTeamMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    if (!editMode) return
    const q = teamSearchText.trim()
    if (q.length < 2) {
      teamSearchAbortRef.current?.abort()
      setTeamResults([])
      setTeamSearchLoading(false)
      setTeamMenuOpen(false)
      return
    }

    const t = window.setTimeout(() => {
      teamSearchAbortRef.current?.abort()
      const ac = new AbortController()
      teamSearchAbortRef.current = ac
      setTeamSearchLoading(true)
      const params = new URLSearchParams({ search: q })
      void fetch(`${API_URL}/teams?${params.toString()}`, { signal: ac.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error('bad')
          const json = (await res.json()) as { teams?: TeamSearchRow[] }
          const list = Array.isArray(json.teams) ? json.teams : []
          setTeamResults(list.slice(0, 5))
          setTeamMenuOpen(true)
        })
        .catch(() => {
          if (ac.signal.aborted) return
          setTeamResults([])
          setTeamMenuOpen(false)
        })
        .finally(() => {
          if (!ac.signal.aborted) setTeamSearchLoading(false)
        })
    }, 280)

    return () => window.clearTimeout(t)
  }, [editMode, teamSearchText])

  const openFile = () => fileRef.current?.click()

  const copyPublicProfileUrl = () => {
    const url = `https://airnation.online/u/${user.id}`
    void navigator.clipboard.writeText(url)
    if (shareCopiedTimeoutRef.current) clearTimeout(shareCopiedTimeoutRef.current)
    setShareLabel('¡COPIADO!')
    shareCopiedTimeoutRef.current = setTimeout(() => {
      setShareLabel('COMPARTIR PERFIL')
      shareCopiedTimeoutRef.current = null
    }, 2000)
  }

  const aliasInitial = (user.alias?.trim()?.[0] || user.nombre?.trim()?.[0] || '?').toUpperCase()

  const onAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setAvatarError('')
      if (!MIME_OK.has(file.type)) {
        setAvatarError('Usa JPEG, PNG o WebP.')
        return
      }
      if (file.size > MAX_BYTES) {
        setAvatarError('Máximo 10 MB.')
        return
      }
      setAvatarUploading(true)
      try {
        const url = await uploadFile(file)
        const patch = await apiFetch(`/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ avatar_url: url }),
        })
        if (!patch.ok) {
          setAvatarError('No se pudo guardar la foto.')
          return
        }
        const body = (await patch.json()) as { user?: ProfileUserRow }
        if (body.user) setUser(body.user)
        else setUser((s) => ({ ...s, avatar_url: url ?? null }))
      } catch {
        setAvatarError('Error de red. Intenta de nuevo.')
      } finally {
        setAvatarUploading(false)
      }
    },
    [user.id]
  )

  const onPortadaChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      setPortadaError('')
      if (!MIME_OK.has(file.type)) {
        setPortadaError('Usa JPEG, PNG o WebP.')
        return
      }
      if (file.size > MAX_BYTES) {
        setPortadaError('Máximo 10 MB.')
        return
      }
      setPortadaUploading(true)
      try {
        const url = await uploadFile(file)
        const patch = await apiFetch(`/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ foto_portada_url: url }),
        })
        if (!patch.ok) {
          setPortadaError('No se pudo guardar la portada.')
          return
        }
        const body = (await patch.json()) as { user?: ProfileUserRow }
        if (body.user) setUser(body.user)
        else setUser((s) => ({ ...s, foto_portada_url: url ?? null }))
        setPortadaUrl(url ?? null)
      } catch {
        setPortadaError('Error de red. Intenta de nuevo.')
      } finally {
        setPortadaUploading(false)
      }
    },
    [user.id]
  )

  const startEdit = () => {
    setFormError('')
    setProfileSuccessMsg('')
    setForm(initialFromUser(user))
    setPortadaUrl(user.foto_portada_url ?? null)
    setTeamIdDraft(user.team_id)
    setTeamSearchText(user.team_id ? readTeamNombre : '')
    setTeamLockedName(user.team_id ? readTeamNombre : null)
    setTeamResults([])
    setTeamMenuOpen(false)
    setTeamSearchLoading(false)
    teamSearchAbortRef.current?.abort()
    setEditMode(true)
  }

  const cancelEdit = () => {
    setFormError('')
    teamSearchAbortRef.current?.abort()
    setTeamResults([])
    setTeamMenuOpen(false)
    setTeamSearchLoading(false)
    setEditMode(false)
  }

  const clearTeamSelection = () => {
    setTeamIdDraft(null)
    setTeamSearchText('')
    setTeamLockedName(null)
    setTeamResults([])
    setTeamMenuOpen(false)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setProfileSuccessMsg('')
    const aliasT = form.alias.trim()
    if (aliasT.length < 2 || aliasT.length > 30) {
      setFormError('El alias debe tener entre 2 y 30 caracteres.')
      return
    }
    setSaveLoading(true)
    try {
      const wantsNewTeam =
        teamIdDraft != null &&
        teamIdDraft !== user.team_id &&
        teamSearchText.trim().length > 0

      const res = await apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          alias: form.alias.trim(),
          ciudad: form.ciudad.trim(),
          rol: form.rol,
          bio: form.bio.trim() || null,
          foto_portada_url: portadaUrl ?? null,
          instagram: form.instagram.trim() || null,
          tiktok: form.tiktok.trim() || null,
          youtube: form.youtube.trim() || null,
          facebook: form.facebook.trim() || null,
        }),
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string }
        setFormError(j.error || 'No se pudo guardar.')
        return
      }
      const body = (await res.json()) as { user?: ProfileUserRow }
      if (body.user) {
        setUser(body.user)
        setPortadaUrl(body.user.foto_portada_url ?? null)
      } else
        setUser((s) => ({
          ...s,
          nombre: form.nombre.trim(),
          alias: form.alias.trim(),
          ciudad: form.ciudad.trim(),
          rol: form.rol,
          bio: form.bio.trim() || null,
          foto_portada_url: portadaUrl ?? null,
          instagram: form.instagram.trim() || null,
          tiktok: form.tiktok.trim() || null,
          youtube: form.youtube.trim() || null,
          facebook: form.facebook.trim() || null,
        }))

      if (wantsNewTeam && teamIdDraft) {
        const nombreSolicitud = teamSearchText.trim()
        const { data: joinRow, error: joinErr } = await supabase
          .from('team_join_requests')
          .insert({
            team_id: teamIdDraft,
            user_id: user.id,
            mensaje: 'Solicitud desde editar perfil',
            status: 'pendiente',
          })
          .select('id')
          .maybeSingle()

        const code = (joinErr as { code?: string } | null)?.code
        if (joinErr && code !== '23505') {
          setFormError('Perfil guardado, pero no se pudo enviar la solicitud al equipo.')
          setEditMode(false)
          return
        }
        const newId = (joinRow as { id?: string } | null)?.id
        const alreadyListed =
          pendingJoinPending.some((p) => p.nombre === nombreSolicitud) ||
          localPendingJoins.some((p) => p.nombre === nombreSolicitud)
        if (!alreadyListed) {
          const id =
            newId ||
            (code === '23505' ? `dup-${teamIdDraft}` : `local-${teamIdDraft}`)
          setLocalPendingJoins((prev) => {
            if (prev.some((p) => p.id === id || p.nombre === nombreSolicitud)) {
              return prev
            }
            return [...prev, { id, nombre: nombreSolicitud }]
          })
        }
        setProfileSuccessMsg('Solicitud enviada — pendiente de aprobación')
      }

      const keptTeamId = body.user?.team_id ?? user.team_id
      if (!wantsNewTeam && keptTeamId && teamSearchText.trim()) {
        setReadTeamNombre(teamSearchText.trim())
      }
      setEditMode(false)
    } catch {
      setFormError('Error de red. Intenta de nuevo.')
    } finally {
      setSaveLoading(false)
    }
  }

  const fieldShell =
    'border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-3'

  return (
    <div className="mt-8 max-w-[640px]">
      {!user.avatar_url && (
        <div className="w-full bg-[#FFF5F4] border-b border-[#FFCCC7] px-4 py-3 flex items-center gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="#CC4B37" strokeWidth="1.8" />
            <path
              d="M12 8v4M12 16h.01"
              stroke="#CC4B37"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          <p
            className="text-[#CC4B37] text-xs leading-snug flex-1"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            <strong>Tu perfil está incompleto.</strong> Sin foto de perfil no puedes acceder a tu
            credencial digital.
          </p>
        </div>
      )}
      <section className="flex flex-col items-center border-b border-solid border-[#EEEEEE] pb-8">
        <div
          className="relative shrink-0 overflow-hidden rounded-full bg-[#CC4B37] md:h-[120px] md:w-[120px] h-24 w-24"
          style={{ borderRadius: '50%' }}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              width={120}
              height={120}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[36px] text-[#FFFFFF]"
              style={jost}
            >
              {aliasInitial}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={copyPublicProfileUrl}
          style={jost}
          className="mt-3 inline-flex items-center gap-2 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-[14px] py-[6px] text-[11px] font-extrabold uppercase text-[#666666]"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          {shareLabel}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={onAvatarChange}
        />
        <button
          type="button"
          onClick={openFile}
          disabled={avatarUploading}
          style={jost}
          className="mt-4 flex min-h-[40px] min-w-[140px] items-center justify-center gap-2 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2 text-[11px] font-extrabold uppercase text-[#111111] disabled:opacity-60"
        >
          {avatarUploading ? (
            <Spinner className="text-[#111111]" />
          ) : null}
          {avatarUploading ? 'SUBIENDO…' : 'CAMBIAR FOTO'}
        </button>
        {avatarError ? (
          <p className="mt-2 text-center text-[13px] text-[#CC4B37]" style={lato}>
            {avatarError}
          </p>
        ) : null}
      </section>

      {!editMode ? (
        <>
          {user.bio ? (
            <div className={`${fieldShell} md:col-span-2 mt-6`}>
              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                BIO
              </p>
              <p className="mt-1 text-[14px] leading-relaxed text-[#111111]" style={lato}>
                {user.bio}
              </p>
            </div>
          ) : null}
          <div className="mt-6 grid grid-cols-1 gap-0 md:grid-cols-2">
            <div className={fieldShell}>
              <p
                style={jost}
                className="text-[10px] font-extrabold uppercase text-[#666666]"
              >
                Nº MIEMBRO
              </p>
              <p
                style={jost}
                className="mt-1 text-[20px] font-extrabold text-[#CC4B37]"
              >
                {user.member_number != null && String(user.member_number).trim() !== ''
                  ? `#${user.member_number}`
                  : '—'}
              </p>
            </div>
            <div className={fieldShell}>
              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                NOMBRE
              </p>
              <p className="mt-1 text-[15px] text-[#111111]" style={lato}>
                {user.nombre || '—'}
              </p>
            </div>
            <div className={fieldShell}>
              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                ALIAS
              </p>
              <p className="mt-1 text-[15px] text-[#111111]" style={lato}>
                {user.alias || '—'}
              </p>
            </div>
            <div className={fieldShell}>
              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                CIUDAD
              </p>
              <p className="mt-1 text-[15px] text-[#111111]" style={lato}>
                {user.ciudad || '—'}
              </p>
            </div>
            <div className={fieldShell}>
              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                ROL DE JUEGO
              </p>
              <p className="mt-1">
                <span
                  style={jost}
                  className="inline-block rounded-[2px] bg-[#F4F4F4] px-2 py-1 text-[12px] font-extrabold uppercase text-[#111111]"
                >
                  {user.rol ? ROLE_LABELS[user.rol] || user.rol : '—'}
                </span>
              </p>
            </div>
            <div className={fieldShell}>
              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                EQUIPO
              </p>
              {user.team_id ? (
                readTeamNombre ? (
                  <p className="mt-1 text-[15px]" style={lato}>
                    {teamSlug ? (
                      <Link
                        href={`/equipos/${encodeURIComponent(teamSlug)}`}
                        className="font-semibold text-[#111111] underline decoration-[#EEEEEE] underline-offset-2 transition-colors hover:text-[#CC4B37] hover:decoration-[#CC4B37]"
                      >
                        {readTeamNombre}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[#111111]">
                        {readTeamNombre}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="mt-1 text-[15px] text-[#AAAAAA]" style={lato}>
                    —
                  </p>
                )
              ) : displayPendingJoins.length > 0 ? (
                <ul className="mt-1 list-none space-y-1 p-0">
                  {displayPendingJoins.map((row) => (
                    <li
                      key={row.id}
                      className="flex items-start gap-2 text-[12px] text-[#999999]"
                      style={lato}
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#E8A317]"
                        aria-hidden
                      />
                      Solicitud pendiente en {row.nombre}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-1">
                  <p className="text-[12px] text-[#999999]" style={lato}>
                    ¿Quieres unirte a un equipo?{' '}
                    <Link
                      href="/equipos"
                      className="font-semibold text-[#CC4B37]"
                    >
                      Buscar equipos →
                    </Link>
                  </p>
                </div>
              )}
            </div>
            <div className={`${fieldShell} md:col-span-2`}>
              <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                MIEMBRO DESDE
              </p>
              <p className="mt-1 text-[15px] text-[#111111]" style={lato}>
                {formatDMY(user.created_at)}
              </p>
            </div>
            {(user.instagram || user.tiktok || user.youtube || user.facebook) ? (
              <div className={`${fieldShell} md:col-span-2`}>
                <p style={jost} className="text-[10px] font-extrabold uppercase text-[#666666]">
                  REDES SOCIALES
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user.instagram ? (
                    <a
                      href={user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                      style={lato}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
                      </svg>
                      <span>Instagram</span>
                    </a>
                  ) : null}
                  {user.tiktok ? (
                    <a
                      href={user.tiktok.startsWith('http') ? user.tiktok : `https://tiktok.com/@${user.tiktok.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                      style={lato}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>TikTok</span>
                    </a>
                  ) : null}
                  {user.youtube ? (
                    <a
                      href={user.youtube.startsWith('http') ? user.youtube : `https://youtube.com/${user.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                      style={lato}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                        <rect x="2" y="4" width="20" height="16" rx="4" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
                      </svg>
                      <span>YouTube</span>
                    </a>
                  ) : null}
                  {user.facebook ? (
                    <a
                      href={user.facebook.startsWith('http') ? user.facebook : `https://facebook.com/${user.facebook.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-[#EEEEEE] px-3 py-2 text-[13px] text-[#111111] transition-colors hover:border-[#CCCCCC]"
                      style={lato}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                        <rect x="3" y="3" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M13.5 10.5h-2v-1c0-.5.3-.6.8-.6h1.2V6.2h-2.1c-2 0-2.9 1-2.9 2.6V10.5H7v2.8h1.5V22h3.2v-8.7h2.2l.3-2.8z" fill="currentColor" />
                      </svg>
                      <span>Facebook</span>
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {profileSuccessMsg ? (
            <p
              className="mt-6 text-center text-[13px] text-[#2E7D32]"
              style={lato}
              role="status"
            >
              {profileSuccessMsg}
            </p>
          ) : null}

          <Link
            href={`/u/${user.id}`}
            style={jost}
            className="mt-8 flex h-12 w-full items-center justify-center gap-2 border border-solid border-[#EEEEEE] text-[11px] font-extrabold uppercase tracking-wide text-[#111111] md:w-auto md:min-w-[200px]"
          >
            VER MI PERFIL PÚBLICO
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <button
            type="button"
            onClick={startEdit}
            style={jost}
            className="mt-4 w-full rounded-[2px] bg-[#111111] py-3 text-[12px] font-extrabold uppercase text-[#FFFFFF] md:w-auto md:min-w-[200px]"
          >
            EDITAR PERFIL
          </button>
        </>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              NOMBRE
            </label>
            <input
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              ALIAS
            </label>
            <input
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.alias}
              maxLength={30}
              onChange={(e) => setForm((f) => ({ ...f, alias: e.target.value }))}
            />
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              CIUDAD
            </label>
            <input
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.ciudad}
              onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
            />
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              BIO
            </label>
            <div className="relative mt-2">
              <textarea
                className={`${inputClass} min-h-[80px] resize-y pb-6`}
                style={lato}
                value={form.bio}
                maxLength={300}
                placeholder="Cuéntale a la comunidad quién eres..."
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 300) }))}
              />
              <span
                className="pointer-events-none absolute bottom-2 right-2 text-[11px] text-[#999999]"
                style={lato}
              >
                {300 - form.bio.length}
              </span>
            </div>
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              FOTO DE PORTADA
            </label>
            {user.foto_portada_url ? (
              <div className="mt-2 h-[100px] w-full overflow-hidden bg-[#F4F4F4]">
                <img
                  src={user.foto_portada_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
            ) : null}
            <input
              ref={portadaFileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={onPortadaChange}
            />
            <button
              type="button"
              onClick={() => portadaFileRef.current?.click()}
              disabled={portadaUploading}
              style={jost}
              className="mt-2 flex min-h-[40px] items-center justify-center gap-2 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2 text-[11px] font-extrabold uppercase text-[#111111] disabled:opacity-60"
            >
              {portadaUploading ? (
                <Spinner className="text-[#111111]" />
              ) : null}
              {portadaUploading ? 'SUBIENDO…' : 'CAMBIAR PORTADA'}
            </button>
            {portadaError ? (
              <p className="mt-2 text-[13px] text-[#CC4B37]" style={lato}>
                {portadaError}
              </p>
            ) : null}
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              INSTAGRAM
            </label>
            <input
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.instagram}
              placeholder="@tu_usuario"
              onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))}
            />
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              TIKTOK
            </label>
            <input
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.tiktok}
              placeholder="@tu_usuario"
              onChange={(e) => setForm((f) => ({ ...f, tiktok: e.target.value }))}
            />
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              YOUTUBE
            </label>
            <input
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.youtube}
              placeholder="URL de tu canal"
              onChange={(e) => setForm((f) => ({ ...f, youtube: e.target.value }))}
            />
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              FACEBOOK
            </label>
            <input
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.facebook}
              placeholder="URL de tu perfil"
              onChange={(e) => setForm((f) => ({ ...f, facebook: e.target.value }))}
            />
          </div>
          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              ROL DE JUEGO
            </label>
            <select
              className={`${inputClass} mt-2`}
              style={lato}
              value={form.rol}
              onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className={fieldShell}>
            <label style={jost} className="block text-[10px] font-extrabold uppercase text-[#666666]">
              EQUIPO
            </label>
            <div ref={teamWrapRef} className="relative mt-2">
              <div className="relative">
                <input
                  type="text"
                  className={`${inputClass} pr-10`}
                  style={lato}
                  placeholder="Buscar equipo por nombre..."
                  value={teamSearchText}
                  onChange={(e) => {
                    const v = e.target.value
                    setTeamSearchText(v)
                    if (teamLockedName !== null && v !== teamLockedName) {
                      setTeamIdDraft(null)
                      setTeamLockedName(null)
                    }
                  }}
                  onFocus={() => {
                    if (teamSearchText.trim().length >= 2 && teamResults.length > 0) {
                      setTeamMenuOpen(true)
                    }
                  }}
                  autoComplete="off"
                />
                {(teamIdDraft || teamSearchText.length > 0) && (
                  <button
                    type="button"
                    aria-label="Quitar equipo"
                    onClick={clearTeamSelection}
                    className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path
                        d="M2.5 2.5l7 7M9.5 2.5l-7 7"
                        stroke="#111111"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {teamMenuOpen && teamSearchText.trim().length >= 2 ? (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[220px] overflow-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF]">
                  {teamSearchLoading ? (
                    <div className="flex justify-center py-3">
                      <Spinner className="text-[#111111]" />
                    </div>
                  ) : teamResults.length === 0 ? (
                    <p className="px-3 py-2 text-[13px] text-[#666666]" style={lato}>
                      Sin resultados
                    </p>
                  ) : (
                    teamResults.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTeamIdDraft(t.id)
                          setTeamSearchText(t.nombre)
                          setTeamLockedName(t.nombre)
                          setTeamMenuOpen(false)
                        }}
                        className="block w-full border-0 bg-transparent px-3 py-2 text-left text-[14px] text-[#111111] hover:bg-[#F4F4F4]"
                        style={lato}
                      >
                        {t.nombre}
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {formError ? (
            <p className="text-[13px] text-[#CC4B37]" style={lato}>
              {formError}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={saveLoading}
              style={jost}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[2px] bg-[#CC4B37] py-2.5 text-[12px] font-extrabold uppercase text-[#FFFFFF] disabled:opacity-70"
            >
              {saveLoading ? <Spinner className="text-[#FFFFFF]" /> : null}
              GUARDAR
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saveLoading}
              style={jost}
              className="min-h-[44px] flex-1 rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] py-2.5 text-[12px] font-extrabold uppercase text-[#111111] disabled:opacity-70"
            >
              CANCELAR
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
