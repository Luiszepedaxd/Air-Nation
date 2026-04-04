'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { notifyPendingJoinUpdated } from '@/lib/pending-join-requests'
import { supabase } from '@/lib/supabase'
import { PostPhotoGallery } from '../components/PostPhotoGallery'
import type {
  TeamAlbumAdminRow,
  TeamJoinRequestAdminRow,
  TeamMemberAdminRow,
  TeamPostAdminRow,
} from './types'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')
const UPLOAD_ENDPOINT = `${API_URL}/upload`

const ALLOWED_IMG = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_POST_PHOTOS = 4
const MAX_ALBUM_PHOTOS = 20
const MAX_MB = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

const RANGO_OPTIONS = [
  'fundador',
  'capitan',
  'lider_escuadra',
  'miembro',
] as const

function one<T>(v: T | T[] | null | undefined): T | null {
  if (v == null) return null
  return Array.isArray(v) ? (v[0] ?? null) : v
}

function sortMembers(a: TeamMemberAdminRow, b: TeamMemberAdminRow) {
  const rank = (r: string | null) => {
    const x = (r || '').toLowerCase()
    if (x === 'founder') return 1
    if (x === 'admin') return 2
    return 3
  }
  const dr = rank(a.rol_plataforma) - rank(b.rol_plataforma)
  if (dr !== 0) return dr
  const an = (a.nombre || a.alias || '').toLowerCase()
  const bn = (b.nombre || b.alias || '').toLowerCase()
  return an.localeCompare(bn, 'es')
}

type TabId = 'solicitudes' | 'integrantes' | 'posts' | 'albumes' | 'perfil'

function relativeTime(iso: string): string {
  try {
    const t = new Date(iso).getTime()
    const diff = Date.now() - t
    const h = Math.floor(diff / (60 * 60 * 1000))
    if (h < 1) return 'hace unos minutos'
    if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`
    const d = Math.floor(h / 24)
    return d === 1 ? 'hace 1 día' : `hace ${d} días`
  } catch {
    return ''
  }
}

function initialFromUser(nombre: string | null, alias: string | null) {
  const s =
    alias?.trim()?.[0] || nombre?.trim()?.[0] || '?'
  return s.toUpperCase()
}

function isFounderRol(rol: string | null | undefined) {
  return (rol || '').toLowerCase() === 'founder'
}

function rolBadgeLabel(rol: string | null | undefined) {
  const r = (rol || '').toLowerCase()
  if (r === 'founder') return 'FUNDADOR'
  if (r === 'admin') return 'ADMIN'
  return 'MIEMBRO'
}

function formatRangoBadge(rango: string | null | undefined) {
  if (!rango) return ''
  return rango.replace(/_/g, ' ').toUpperCase()
}

function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMG.has(file.type)) {
    return 'Solo se permiten JPG, PNG o WebP'
  }
  if (file.size > MAX_BYTES) {
    return `Cada foto puede pesar máximo ${MAX_MB} MB`
  }
  return null
}

async function uploadOneFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd })
  const json = (await res.json().catch(() => ({}))) as {
    url?: string
    error?: string
  }
  if (!res.ok) throw new Error(json.error || 'Error al subir la imagen')
  if (!json.url || typeof json.url !== 'string') {
    throw new Error('Respuesta inválida del servidor')
  }
  return json.url
}

function SpinnerInline({ className }: { className?: string }) {
  return (
    <svg
      className={className ?? 'h-5 w-5 animate-spin text-[#FFFFFF]'}
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

function IconCamera() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 3h6M5 6h14M8 6l1 14h6l1-14M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconImagePlaceholder() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 5h16v14H4V5z"
        stroke="#AAAAAA"
        strokeWidth="1.4"
      />
      <path
        d="M8 14l2.5-3 2 2.5L17 10l3 4v3H4v-4l4-3z"
        stroke="#AAAAAA"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="1.5" fill="#AAAAAA" />
    </svg>
  )
}

export function AdminClient({
  slug,
  teamId,
  teamNombre,
  teamCiudad,
  logoUrl,
  viewerUserId,
  viewerRol,
  initialAlbums,
}: {
  slug: string
  teamId: string
  viewerUserId: string
  viewerRol: string
  teamNombre: string
  teamCiudad: string | null
  logoUrl: string | null
  initialAlbums: TeamAlbumAdminRow[]
}) {
  const [activeTab, setActiveTab] = useState<TabId>('solicitudes')
  const [joinRequests, setJoinRequests] = useState<TeamJoinRequestAdminRow[]>([])
  const [members, setMembers] = useState<TeamMemberAdminRow[]>([])
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true)
  const [loadingIntegrantes, setLoadingIntegrantes] = useState(true)
  const [posts, setPosts] = useState<TeamPostAdminRow[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [albums, setAlbums] = useState(initialAlbums)
  const pendingCount = joinRequests.length

  const viewerIsFounder = isFounderRol(viewerRol)
  const viewerIsAdmin = (viewerRol || '').toLowerCase() === 'admin'

  const tabClass = (tabId: TabId) =>
    activeTab === tabId
      ? 'border-b-2 border-[#CC4B37] text-[#111111] pb-[14px] px-4'
      : 'border-b-2 border-transparent text-[#666666] pb-[14px] px-4'

  const removeRequest = useCallback((id: string) => {
    setJoinRequests((r) => r.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadLists() {
      setLoadingSolicitudes(true)
      setLoadingIntegrantes(true)
      setLoadingPosts(true)

      const joinQuery = supabase
        .from('team_join_requests')
        .select(
          `
          id,
          team_id,
          user_id,
          mensaje,
          created_at,
          users ( nombre, alias, avatar_url, ciudad )
        `
        )
        .eq('team_id', teamId)
        .eq('status', 'pendiente')
        .order('created_at', { ascending: false })

      const membersQuery = supabase
        .from('team_members')
        .select(
          `
          id,
          user_id,
          rol_plataforma,
          rango_militar,
          users ( nombre, alias, avatar_url, ciudad )
        `
        )
        .eq('team_id', teamId)
        .eq('status', 'activo')

      const [{ data: rawJoin, error: joinErr }, { data: rawMembers, error: memErr }] =
        await Promise.all([joinQuery, membersQuery])

      if (cancelled) return

      const mappedJoin: TeamJoinRequestAdminRow[] =
        joinErr || !rawJoin
          ? []
          : (rawJoin as {
              id: string
              team_id: string
              user_id: string
              mensaje: string | null
              created_at: string
              users: unknown
            }[]).map((r) => {
              const u = one(r.users) as {
                nombre: string | null
                alias: string | null
                avatar_url: string | null
                ciudad: string | null
              } | null
              return {
                id: r.id,
                team_id: r.team_id,
                user_id: r.user_id,
                mensaje: r.mensaje,
                created_at: r.created_at,
                nombre: u?.nombre ?? null,
                alias: u?.alias ?? null,
                avatar_url: u?.avatar_url ?? null,
                ciudad: u?.ciudad ?? null,
              }
            })

      let mappedMembers: TeamMemberAdminRow[] =
        memErr || !rawMembers
          ? []
          : (rawMembers as {
              id: string
              user_id: string
              rol_plataforma: string | null
              rango_militar: string | null
              users: unknown
            }[]).map((r) => {
              const u = one(r.users) as {
                nombre: string | null
                alias: string | null
                avatar_url: string | null
                ciudad: string | null
              } | null
              return {
                id: r.id,
                user_id: r.user_id,
                rol_plataforma: r.rol_plataforma,
                rango_militar: r.rango_militar,
                nombre: u?.nombre ?? null,
                alias: u?.alias ?? null,
                avatar_url: u?.avatar_url ?? null,
                ciudad: u?.ciudad ?? null,
              }
            })

      mappedMembers = [...mappedMembers].sort(sortMembers)

      const { data: postsData, error: postsError } = await supabase
        .from('team_posts')
        .select(
          'id, team_id, content, fotos_urls, published, created_by, created_at'
        )
        .eq('team_id', teamId)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) {
        console.error('team_posts fetch error:', postsError)
      }
      setPosts(postsData || [])

      setJoinRequests(mappedJoin)
      setMembers(mappedMembers)
      setLoadingSolicitudes(false)
      setLoadingIntegrantes(false)
      setLoadingPosts(false)
    }

    void loadLists()
    return () => {
      cancelled = true
    }
  }, [teamId])

  useEffect(() => {
    const el = document.getElementById('dashboard-scroll-root')
    el?.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <div className="mb-6">
        <Link
          href={`/equipos/${encodeURIComponent(slug)}`}
          className="inline-flex items-center gap-1 text-[13px] text-[#666666] transition-colors hover:text-[#111111]"
          style={lato}
        >
          <span aria-hidden>←</span>
          <span className="font-semibold text-[#111111]">{teamNombre}</span>
        </Link>
      </div>

      <h1
        style={jost}
        className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]"
      >
        ADMINISTRAR
      </h1>

      <div className="sticky top-0 z-40 -mx-4 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] md:-mx-6">
        <div className="flex overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('solicitudes')}
            style={jost}
            className={`${tabBase} ${tabClass('solicitudes')} inline-flex items-center gap-1.5`}
          >
            <span>SOLICITUDES</span>
            {!loadingSolicitudes && pendingCount > 0 ? (
              <span
                style={jost}
                className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#CC4B37] px-1 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('integrantes')}
            style={jost}
            className={`${tabBase} ${tabClass('integrantes')}`}
          >
            INTEGRANTES
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            style={jost}
            className={`${tabBase} ${tabClass('posts')}`}
          >
            POSTS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('albumes')}
            style={jost}
            className={`${tabBase} ${tabClass('albumes')}`}
          >
            ÁLBUMES
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            style={jost}
            className={`${tabBase} ${tabClass('perfil')}`}
          >
            PERFIL DEL EQUIPO
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'solicitudes' ? (
          <SolicitudesTab
            teamId={teamId}
            joinRequests={joinRequests}
            onRemove={removeRequest}
            loading={loadingSolicitudes}
          />
        ) : null}

        {activeTab === 'integrantes' ? (
          <IntegrantesTab
            teamId={teamId}
            members={members}
            setMembers={setMembers}
            viewerUserId={viewerUserId}
            viewerIsFounder={viewerIsFounder}
            viewerIsAdmin={viewerIsAdmin}
            loading={loadingIntegrantes}
          />
        ) : null}

        {activeTab === 'posts' ? (
          <PostsTab
            teamId={teamId}
            viewerUserId={viewerUserId}
            posts={posts}
            setPosts={setPosts}
            loading={loadingPosts}
          />
        ) : null}

        {activeTab === 'albumes' ? (
          <AlbumsTab
            teamId={teamId}
            viewerUserId={viewerUserId}
            albums={albums}
            setAlbums={setAlbums}
          />
        ) : null}

        {activeTab === 'perfil' ? (
          <PerfilEquipoTab
            slug={slug}
            teamNombre={teamNombre}
            teamCiudad={teamCiudad}
            logoUrl={logoUrl}
          />
        ) : null}
      </div>
    </main>
  )
}

function SolicitudesTabSkeleton() {
  return (
    <ul className="flex flex-col gap-4 pb-10" aria-busy aria-label="Cargando solicitudes">
      {[0, 1, 2].map((k) => (
        <li
          key={k}
          className="animate-pulse border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
        >
          <div className="flex gap-3">
            <div className="h-12 w-12 shrink-0 bg-[#EEEEEE]" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className="h-4 max-w-[200px] rounded-sm bg-[#EEEEEE]" />
              <div className="h-3 max-w-[120px] rounded-sm bg-[#F4F4F4]" />
              <div className="h-3 max-w-[160px] rounded-sm bg-[#F4F4F4]" />
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-10 min-w-[120px] flex-1 bg-[#EEEEEE] sm:flex-none" />
            <div className="h-10 min-w-[120px] flex-1 bg-[#F4F4F4] sm:flex-none" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function IntegrantesTabSkeleton() {
  return (
    <ul className="flex flex-col gap-4 pb-10" aria-busy aria-label="Cargando integrantes">
      {[0, 1, 2, 3].map((k) => (
        <li
          key={k}
          className="animate-pulse border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
        >
          <div className="flex gap-3">
            <div className="h-12 w-12 shrink-0 bg-[#EEEEEE]" />
            <div className="min-w-0 flex-1 space-y-2 pt-0.5">
              <div className="h-4 max-w-[180px] rounded-sm bg-[#EEEEEE]" />
              <div className="h-3 max-w-[100px] rounded-sm bg-[#F4F4F4]" />
              <div className="mt-2 h-6 max-w-[200px] rounded-sm bg-[#F4F4F4]" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

function PostsTabListSkeleton() {
  return (
    <ul className="flex flex-col" aria-busy aria-label="Cargando publicaciones">
      {[0, 1, 2].map((k) => (
        <li key={k} className="list-none">
          <div className="mx-auto mb-4 w-full max-w-[600px] animate-pulse border border-solid border-[#EEEEEE] p-4">
            <div className="mb-3 h-4 max-w-[85%] rounded-sm bg-[#EEEEEE]" />
            <div className="grid grid-cols-2 gap-[2px]">
              <div className="h-[140px] bg-[#EEEEEE]" />
              <div className="h-[140px] bg-[#F4F4F4]" />
            </div>
            <div className="mt-3 h-3 w-24 rounded-sm bg-[#F4F4F4]" />
          </div>
        </li>
      ))}
    </ul>
  )
}

function SolicitudesTab({
  teamId,
  joinRequests,
  onRemove,
  loading,
}: {
  teamId: string
  joinRequests: TeamJoinRequestAdminRow[]
  onRemove: (id: string) => void
  loading: boolean
}) {
  const [busyId, setBusyId] = useState<string | null>(null)

  if (loading) {
    return <SolicitudesTabSkeleton />
  }

  const handleApprove = async (row: TeamJoinRequestAdminRow) => {
    setBusyId(row.id)
    try {
      const { error: uErr } = await supabase
        .from('team_join_requests')
        .update({ status: 'aprobado' })
        .eq('id', row.id)

      if (uErr) throw uErr

      const { error: iErr } = await supabase.from('team_members').insert({
        team_id: teamId,
        user_id: row.user_id,
        rol_plataforma: 'member',
        rango_militar: 'miembro',
        status: 'activo',
      })

      if (iErr) throw iErr

      onRemove(row.id)
      notifyPendingJoinUpdated()
    } catch {
      /* keep row */
    } finally {
      setBusyId(null)
    }
  }

  const handleReject = async (row: TeamJoinRequestAdminRow) => {
    setBusyId(row.id)
    try {
      const { error } = await supabase
        .from('team_join_requests')
        .update({ status: 'rechazado' })
        .eq('id', row.id)

      if (error) throw error

      onRemove(row.id)
      notifyPendingJoinUpdated()
    } catch {
      /* keep row */
    } finally {
      setBusyId(null)
    }
  }

  if (joinRequests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <p
          style={lato}
          className="text-[14px] text-[#666666]"
        >
          No hay solicitudes pendientes
        </p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4 pb-10">
      {joinRequests.map((row) => {
        const name =
          row.nombre?.trim() || row.alias?.trim() || 'Usuario'
        const alias = row.alias?.trim()
        const busy = busyId === row.id
        return (
          <li
            key={row.id}
            className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {row.avatar_url ? (
                  <img
                    src={row.avatar_url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[16px] text-[#CC4B37]"
                    style={jost}
                  >
                    {initialFromUser(row.nombre, row.alias)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#111111]" style={lato}>
                  <span className="font-semibold">{name}</span>
                  {alias ? (
                    <span className="text-[#666666]"> · @{alias}</span>
                  ) : null}
                </p>
                {row.ciudad?.trim() ? (
                  <p
                    className="mt-0.5 text-[12px] text-[#666666]"
                    style={lato}
                  >
                    {row.ciudad.trim()}
                  </p>
                ) : null}
                {row.mensaje?.trim() ? (
                  <p
                    className="mt-2 text-[13px] italic text-[#666666]"
                    style={lato}
                  >
                    {row.mensaje.trim()}
                  </p>
                ) : null}
                <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                  {relativeTime(row.created_at)}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleApprove(row)}
                style={jost}
                className="min-h-[40px] min-w-[120px] flex-1 bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase text-[#FFFFFF] transition-opacity disabled:opacity-50 sm:flex-none"
              >
                APROBAR
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleReject(row)}
                style={jost}
                className="min-h-[40px] min-w-[120px] flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2 text-[11px] font-extrabold uppercase text-[#666666] transition-opacity disabled:opacity-50 sm:flex-none"
              >
                RECHAZAR
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function IntegrantesTab({
  teamId,
  members,
  setMembers,
  viewerUserId,
  viewerIsFounder,
  viewerIsAdmin,
  loading,
}: {
  teamId: string
  members: TeamMemberAdminRow[]
  setMembers: React.Dispatch<React.SetStateAction<TeamMemberAdminRow[]>>
  viewerUserId: string
  viewerIsFounder: boolean
  viewerIsAdmin: boolean
  loading: boolean
}) {
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)

  if (loading) {
    return <IntegrantesTabSkeleton />
  }

  const canShowRango = (m: TeamMemberAdminRow) => {
    if (m.user_id === viewerUserId) return false
    if (isFounderRol(m.rol_plataforma)) return false
    if (viewerIsFounder) return true
    if (viewerIsAdmin) {
      return (m.rol_plataforma || '').toLowerCase() === 'member'
    }
    return false
  }

  const canShowRolToggle = (m: TeamMemberAdminRow) => {
    if (!viewerIsFounder) return false
    if (m.user_id === viewerUserId) return false
    if (isFounderRol(m.rol_plataforma)) return false
    return true
  }

  const canShowRemove = (m: TeamMemberAdminRow) => {
    if (m.user_id === viewerUserId) return false
    if (isFounderRol(m.rol_plataforma)) return false
    if (viewerIsFounder) return true
    if (viewerIsAdmin) {
      return (m.rol_plataforma || '').toLowerCase() === 'member'
    }
    return false
  }

  const updateRango = async (memberId: string, nuevo: string) => {
    setBusyMemberId(memberId)
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ rango_militar: nuevo })
        .eq('id', memberId)
        .eq('team_id', teamId)

      if (error) throw error

      setMembers((prev) =>
        prev.map((x) =>
          x.id === memberId ? { ...x, rango_militar: nuevo } : x
        )
      )
    } catch {
      /* noop */
    } finally {
      setBusyMemberId(null)
    }
  }

  const toggleRol = async (memberId: string, next: 'admin' | 'member') => {
    setBusyMemberId(memberId)
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ rol_plataforma: next })
        .eq('id', memberId)
        .eq('team_id', teamId)

      if (error) throw error

      setMembers((prev) => {
        const nextList = prev.map((x) =>
          x.id === memberId ? { ...x, rol_plataforma: next } : x
        )
        return [...nextList].sort((a, b) => {
          const rank = (r: string | null) => {
            const x = (r || '').toLowerCase()
            if (x === 'founder') return 1
            if (x === 'admin') return 2
            return 3
          }
          const dr = rank(a.rol_plataforma) - rank(b.rol_plataforma)
          if (dr !== 0) return dr
          const an = (a.nombre || a.alias || '').toLowerCase()
          const bn = (b.nombre || b.alias || '').toLowerCase()
          return an.localeCompare(bn, 'es')
        })
      })
    } catch {
      /* noop */
    } finally {
      setBusyMemberId(null)
    }
  }

  const removeMember = async (memberId: string) => {
    setBusyMemberId(memberId)
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ status: 'inactivo' })
        .eq('id', memberId)
        .eq('team_id', teamId)

      if (error) throw error

      setMembers((prev) => prev.filter((x) => x.id !== memberId))
      setConfirmRemoveId(null)
    } catch {
      /* noop */
    } finally {
      setBusyMemberId(null)
    }
  }

  return (
    <ul className="flex flex-col gap-4 pb-10">
      {members.map((m) => {
        const name = m.nombre?.trim() || m.alias?.trim() || 'Usuario'
        const alias = m.alias?.trim()
        const busy = busyMemberId === m.id
        const showRango = canShowRango(m)
        const showRol = canShowRolToggle(m)
        const showRemove = canShowRemove(m)

        return (
          <li
            key={m.id}
            className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[16px] text-[#CC4B37]"
                    style={jost}
                  >
                    {initialFromUser(m.nombre, m.alias)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] text-[#111111]" style={lato}>
                  <span className="font-semibold">{name}</span>
                  {alias ? (
                    <span className="text-[#666666]"> · @{alias}</span>
                  ) : null}
                </p>
                {m.ciudad?.trim() ? (
                  <p
                    className="mt-0.5 text-[12px] text-[#666666]"
                    style={lato}
                  >
                    {m.ciudad.trim()}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    style={jost}
                    className="inline-block bg-[#F4F4F4] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[#111111]"
                  >
                    {rolBadgeLabel(m.rol_plataforma)}
                  </span>
                  {m.rango_militar ? (
                    <span
                      style={lato}
                      className="text-[11px] font-normal uppercase text-[#666666]"
                    >
                      {formatRangoBadge(m.rango_militar)}
                    </span>
                  ) : null}
                </div>

                {showRango ? (
                  <div className="mt-3">
                    <label className="sr-only">Cambiar rango militar</label>
                    <select
                      disabled={busy}
                      value={(() => {
                        const r = (m.rango_militar || 'miembro').trim()
                        return RANGO_OPTIONS.some((o) => o === r)
                          ? r
                          : 'miembro'
                      })()}
                      onChange={(e) =>
                        void updateRango(m.id, e.target.value)
                      }
                      style={lato}
                      className="max-w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] py-2 pl-2 pr-8 text-[13px] text-[#111111]"
                    >
                      {RANGO_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.replace(/_/g, ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {showRol ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span style={jost} className="text-[10px] text-[#666666]">
                      Rol:
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleRol(m.id, 'admin')}
                        style={jost}
                        className={`min-h-[32px] px-3 text-[10px] font-extrabold uppercase ${
                          (m.rol_plataforma || '').toLowerCase() === 'admin'
                            ? 'bg-[#CC4B37] text-[#FFFFFF]'
                            : 'border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
                        }`}
                      >
                        ADMIN
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void toggleRol(m.id, 'member')}
                        style={jost}
                        className={`min-h-[32px] px-3 text-[10px] font-extrabold uppercase ${
                          (m.rol_plataforma || '').toLowerCase() === 'member'
                            ? 'bg-[#CC4B37] text-[#FFFFFF]'
                            : 'border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
                        }`}
                      >
                        MIEMBRO
                      </button>
                    </div>
                  </div>
                ) : null}

                {showRemove ? (
                  <div className="mt-3">
                    {confirmRemoveId === m.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          style={lato}
                          className="text-[13px] text-[#111111]"
                        >
                          ¿Remover a @{alias || name}?
                        </p>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void removeMember(m.id)}
                          style={jost}
                          className="min-h-[32px] bg-[#CC4B37] px-3 text-[10px] font-extrabold uppercase text-[#FFFFFF] disabled:opacity-50"
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmRemoveId(null)}
                          style={jost}
                          className="min-h-[32px] border border-solid border-[#EEEEEE] px-3 text-[10px] font-extrabold uppercase text-[#666666] disabled:opacity-50"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmRemoveId(m.id)}
                        className="inline-flex items-center gap-1 text-[#999999] transition-colors hover:text-[#666666]"
                        aria-label="Remover integrante"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M18 6L6 18M6 6l12 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                        <span style={jost} className="text-[10px] font-extrabold uppercase">
                          Remover
                        </span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function PerfilEquipoTab({
  slug,
  teamNombre,
  teamCiudad,
  logoUrl,
}: {
  slug: string
  teamNombre: string
  teamCiudad: string | null
  logoUrl: string | null
}) {
  const publicHref = `/equipos/${encodeURIComponent(slug)}`

  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex items-center gap-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden bg-[#F4F4F4]">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[18px] text-[#CC4B37]"
              style={jost}
            >
              {(teamNombre[0] || '?').toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p
            style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
            className="truncate text-[16px] text-[#111111]"
          >
            {teamNombre}
          </p>
          {teamCiudad?.trim() ? (
            <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
              {teamCiudad.trim()}
            </p>
          ) : null}
        </div>
      </div>

      <Link
        href={`/equipos/${encodeURIComponent(slug)}/editar`}
        style={jost}
        className="flex h-12 w-full items-center justify-center bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
      >
        EDITAR PERFIL DEL EQUIPO
      </Link>

      <a
        href={publicHref}
        target="_blank"
        rel="noopener noreferrer"
        style={jost}
        className="flex h-12 w-full items-center justify-center border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
      >
        VER PERFIL PÚBLICO
      </a>
    </div>
  )
}

type PendingPhoto = { id: string; file: File; preview: string }

function normalizeFotoUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (u): u is string => typeof u === 'string' && u.trim().length > 0
  )
}

function postUrls(row: TeamPostAdminRow): string[] {
  return normalizeFotoUrls(row.fotos_urls).slice(0, 4)
}

function PostsTab({
  teamId,
  viewerUserId,
  posts,
  setPosts,
  loading,
}: {
  teamId: string
  viewerUserId: string
  posts: TeamPostAdminRow[]
  setPosts: React.Dispatch<React.SetStateAction<TeamPostAdminRow[]>>
  loading: boolean
}) {
  const [postText, setPostText] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [publishing, setPublishing] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [pickErr, setPickErr] = useState('')
  const postInputRef = useRef<HTMLInputElement>(null)
  const pendingRef = useRef(pendingPhotos)
  pendingRef.current = pendingPhotos

  useEffect(() => {
    return () => {
      pendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  }, [])

  const removePending = (id: string) => {
    setPendingPhotos((prev) => {
      const found = prev.find((x) => x.id === id)
      if (found) URL.revokeObjectURL(found.preview)
      return prev.filter((x) => x.id !== id)
    })
  }

  const addPostFiles = (files: FileList | null) => {
    if (!files?.length) return
    setPickErr('')
    const next: PendingPhoto[] = []
    let firstErr: string | null = null
    for (const file of Array.from(files)) {
      if (pendingPhotos.length + next.length >= MAX_POST_PHOTOS) break
      const err = validateImageFile(file)
      if (err) {
        if (!firstErr) firstErr = err
        continue
      }
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      next.push({
        id,
        file,
        preview: URL.createObjectURL(file),
      })
    }
    if (firstErr) setPickErr(firstErr)
    if (next.length) setPendingPhotos((p) => [...p, ...next])
    if (postInputRef.current) postInputRef.current.value = ''
  }

  const canPublish =
    postText.trim().length > 0 || pendingPhotos.length > 0

  const handlePublish = async () => {
    if (!canPublish || publishing) return
    setPublishing(true)
    try {
      const urls: string[] = []
      for (const p of pendingPhotos) {
        urls.push(await uploadOneFile(p.file))
      }
      const text = postText.trim()
      const { data, error } = await supabase
        .from('team_posts')
        .insert({
          team_id: teamId,
          content: text.length ? text : null,
          fotos_urls: urls,
          published: true,
          created_by: viewerUserId,
        })
        .select(
          'id, team_id, content, fotos_urls, published, created_by, created_at'
        )
        .single()

      if (error) throw error

      if (data) {
        setPosts((prev) => [data as TeamPostAdminRow, ...prev])
      }

      setPostText('')
      for (const p of pendingPhotos) {
        URL.revokeObjectURL(p.preview)
      }
      setPendingPhotos([])
    } catch {
      /* noop */
    } finally {
      setPublishing(false)
    }
  }

  const softDeletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_posts')
        .update({ published: false })
        .eq('id', id)
        .eq('team_id', teamId)

      if (error) throw error

      setPosts((prev) => prev.filter((x) => x.id !== id))
      setConfirmDeleteId(null)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="pb-10">
      <div>
        <div className="relative">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value.slice(0, 500))}
            placeholder="¿Qué está pasando en el equipo?"
            rows={4}
            className="min-h-[100px] w-full resize-y border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 pb-8 pt-3 text-[14px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
            style={lato}
            maxLength={500}
          />
          <span
            className="pointer-events-none absolute bottom-2 right-2 text-[11px] text-[#999999]"
            style={lato}
          >
            {postText.length}/500
          </span>
        </div>

        <div className="mt-4">
          <input
            ref={postInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addPostFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => postInputRef.current?.click()}
            disabled={pendingPhotos.length >= MAX_POST_PHOTOS}
            style={jost}
            className="inline-flex items-center gap-2 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconCamera />
            AGREGAR FOTOS
          </button>
        </div>

        {pickErr ? (
          <p className="mt-2 text-[12px] text-[#CC4B37]" style={lato} role="alert">
            {pickErr}
          </p>
        ) : null}

        {pendingPhotos.length > 0 ? (
          <div className="mt-4 grid w-fit grid-cols-2 gap-2">
            {pendingPhotos.map((p) => (
              <div
                key={p.id}
                className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#F4F4F4]"
              >
                <img
                  src={p.preview}
                  alt=""
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[rgba(0,0,0,0.5)] text-[12px] font-bold text-white"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={!canPublish || publishing}
            style={jost}
            className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center gap-2 bg-[#CC4B37] px-6 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? (
              <>
                <SpinnerInline />
                <span>Subiendo…</span>
              </>
            ) : (
              'PUBLICAR'
            )}
          </button>
        </div>
      </div>

      <hr className="my-8 border-0 border-t border-solid border-[#EEEEEE]" />

      {loading ? (
        <PostsTabListSkeleton />
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <p style={lato} className="text-[14px] text-[#666666]">
            Aún no hay publicaciones
          </p>
        </div>
      ) : (
        <ul className="flex w-full min-w-0 flex-col">
          {posts.map((post) => {
            const urls = postUrls(post)
            return (
              <li key={post.id} className="list-none">
                <div className="mx-auto mb-4 w-full max-w-[600px] border border-solid border-[#EEEEEE] p-4">
                  {post.content?.trim() ? (
                    <p
                      className="mb-3 min-w-0 max-w-full break-words whitespace-pre-wrap text-[14px] text-[#111111]"
                      style={lato}
                    >
                      {post.content.trim()}
                    </p>
                  ) : null}
                  {urls.length > 0 ? <PostPhotoGallery urls={urls} /> : null}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-[#999999]" style={lato}>
                      {relativeTime(post.created_at)}
                    </p>
                    <div className="shrink-0">
                      {confirmDeleteId === post.id ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <p
                            style={lato}
                            className="text-[13px] text-[#111111]"
                          >
                            ¿Eliminar este post?
                          </p>
                          <button
                            type="button"
                            onClick={() => void softDeletePost(post.id)}
                            style={jost}
                            className="min-h-[32px] bg-[#CC4B37] px-3 text-[10px] font-extrabold uppercase text-[#FFFFFF]"
                          >
                            SÍ
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={jost}
                            className="min-h-[32px] border border-solid border-[#EEEEEE] px-3 text-[10px] font-extrabold uppercase text-[#666666]"
                          >
                            NO
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="inline-flex items-center gap-1 text-[#999999] transition-colors hover:text-[#666666]"
                          aria-label="Eliminar publicación"
                        >
                          <IconTrash />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

const albumInputClass =
  'w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'

function AlbumsTab({
  teamId,
  viewerUserId,
  albums,
  setAlbums,
}: {
  teamId: string
  viewerUserId: string
  albums: TeamAlbumAdminRow[]
  setAlbums: React.Dispatch<React.SetStateAction<TeamAlbumAdminRow[]>>
}) {
  const [nombre, setNombre] = useState('')
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([])
  const [creating, setCreating] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [pickErr, setPickErr] = useState('')
  const albumInputRef = useRef<HTMLInputElement>(null)
  const albumPendingRef = useRef(pendingPhotos)
  albumPendingRef.current = pendingPhotos

  useEffect(() => {
    return () => {
      albumPendingRef.current.forEach((p) => URL.revokeObjectURL(p.preview))
    }
  }, [])

  const removePending = (id: string) => {
    setPendingPhotos((prev) => {
      const found = prev.find((x) => x.id === id)
      if (found) URL.revokeObjectURL(found.preview)
      return prev.filter((x) => x.id !== id)
    })
  }

  const addAlbumFiles = (files: FileList | null) => {
    if (!files?.length) return
    setPickErr('')
    const next: PendingPhoto[] = []
    let firstErr: string | null = null
    for (const file of Array.from(files)) {
      if (pendingPhotos.length + next.length >= MAX_ALBUM_PHOTOS) break
      const err = validateImageFile(file)
      if (err) {
        if (!firstErr) firstErr = err
        continue
      }
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      next.push({
        id,
        file,
        preview: URL.createObjectURL(file),
      })
    }
    if (firstErr) setPickErr(firstErr)
    if (next.length) setPendingPhotos((p) => [...p, ...next])
    if (albumInputRef.current) albumInputRef.current.value = ''
  }

  const canCreate = nombre.trim().length > 0 && pendingPhotos.length > 0

  const handleCreate = async () => {
    if (!canCreate || creating) return
    setCreating(true)
    try {
      const urls: string[] = []
      for (const p of pendingPhotos) {
        urls.push(await uploadOneFile(p.file))
      }
      const { data, error } = await supabase
        .from('team_albums')
        .insert({
          team_id: teamId,
          nombre: nombre.trim().slice(0, 60),
          fotos_urls: urls,
          created_by: viewerUserId,
        })
        .select('id, nombre, fotos_urls, created_at')
        .single()

      if (error) throw error

      if (data) {
        const row = data as TeamAlbumAdminRow
        setAlbums((prev) => [
          {
            ...row,
            fotos_urls: Array.isArray(row.fotos_urls)
              ? row.fotos_urls.filter(
                  (u): u is string =>
                    typeof u === 'string' && u.trim().length > 0
                )
              : null,
          },
          ...prev,
        ])
      }

      setNombre('')
      for (const p of pendingPhotos) {
        URL.revokeObjectURL(p.preview)
      }
      setPendingPhotos([])
    } catch {
      /* noop */
    } finally {
      setCreating(false)
    }
  }

  const deleteAlbum = async (id: string) => {
    try {
      const { error } = await supabase
        .from('team_albums')
        .delete()
        .eq('id', id)
        .eq('team_id', teamId)

      if (error) throw error

      setAlbums((prev) => prev.filter((x) => x.id !== id))
      setConfirmDeleteId(null)
    } catch {
      /* noop */
    }
  }

  return (
    <div className="pb-10">
      <div>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value.slice(0, 60))}
          placeholder="Nombre del álbum (ej: Partida Enero 2026)"
          maxLength={60}
          className={albumInputClass}
          style={lato}
        />

        <div className="mt-4">
          <input
            ref={albumInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addAlbumFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => albumInputRef.current?.click()}
            disabled={pendingPhotos.length >= MAX_ALBUM_PHOTOS}
            style={jost}
            className="inline-flex items-center gap-2 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <IconCamera />
            AGREGAR FOTOS
          </button>
        </div>

        {pickErr ? (
          <p className="mt-2 text-[12px] text-[#CC4B37]" style={lato} role="alert">
            {pickErr}
          </p>
        ) : null}

        {pendingPhotos.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {pendingPhotos.map((p) => (
              <div
                key={p.id}
                className="relative aspect-square w-full overflow-hidden bg-[#F4F4F4]"
              >
                <img
                  src={p.preview}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePending(p.id)}
                  className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[rgba(0,0,0,0.5)] text-[12px] font-bold text-white"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={!canCreate || creating}
            style={jost}
            className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center gap-2 bg-[#CC4B37] px-6 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <>
                <SpinnerInline />
                <span>Subiendo…</span>
              </>
            ) : (
              'CREAR ÁLBUM'
            )}
          </button>
        </div>
      </div>

      <hr className="my-8 border-0 border-t border-solid border-[#EEEEEE]" />

      {albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <p style={lato} className="text-[14px] text-[#666666]">
            Aún no hay álbumes
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {albums.map((album) => {
            const urls = normalizeFotoUrls(album.fotos_urls)
            const cover = urls[0]
            const count = urls.length

            return (
              <li
                key={album.id}
                className="flex gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-3"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden bg-[#F4F4F4]">
                  {cover ? (
                    <img
                      src={cover}
                      alt=""
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <IconImagePlaceholder />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                    className="text-[14px] text-[#111111]"
                  >
                    {album.nombre?.trim() || 'Álbum'}
                  </p>
                  <p className="mt-1 text-[12px] text-[#666666]" style={lato}>
                    {count} {count === 1 ? 'foto' : 'fotos'}
                  </p>
                  <div className="mt-2">
                    {confirmDeleteId === album.id ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          style={lato}
                          className="text-[13px] text-[#111111]"
                        >
                          ¿Eliminar este álbum?
                        </p>
                        <button
                          type="button"
                          onClick={() => void deleteAlbum(album.id)}
                          style={jost}
                          className="min-h-[32px] bg-[#CC4B37] px-3 text-[10px] font-extrabold uppercase text-[#FFFFFF]"
                        >
                          SÍ
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          style={jost}
                          className="min-h-[32px] border border-solid border-[#EEEEEE] px-3 text-[10px] font-extrabold uppercase text-[#666666]"
                        >
                          NO
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(album.id)}
                        className="inline-flex items-center gap-1 text-[#999999] transition-colors hover:text-[#666666]"
                        aria-label="Eliminar álbum"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
