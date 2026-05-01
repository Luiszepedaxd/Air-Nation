'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { PlayerHero } from '@/app/u/[id]/PlayerHero'
import { PlayerProfileClient } from '@/app/u/[id]/PlayerProfileClient'
import type {
  PlayerPostRow,
  PublicReplicaRow,
  PublicUserProfile,
} from '@/app/u/[id]/types'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import { usePwaInstall } from '@/components/PwaInstallPrompt'
import { usePushNotifButton } from '@/components/PushNotifManager'
import type { ApprovedFieldNotice } from '@/lib/approved-field-notices'
import type { PendingFieldOwnerRequest } from '@/lib/pending-field-owner-requests'
import type { JoinRequestRow } from '@/lib/pending-join-requests'
import { supabase } from '@/lib/supabase'
import {
  fetchUnreadNotifCount,
  NOTIF_UPDATED_EVENT,
} from '@/lib/user-notifications'
import { MisCamposTab, type MisCampoItem } from './MisCamposTab'
import {
  MisEventosRsvpSection,
  type MisEventoRsvpItem,
} from './MisEventosRsvpSection'
import { MisEquiposSection, type MisEquipoItem } from './MisEquiposSection'
import { NotificacionesTab } from './NotificacionesTab'
import { PerfilLogoutButton } from './PerfilLogoutButton'
import {
  ProfileView,
  type ProfileUserRow,
  type ProfileViewHandle,
} from './ProfileView'
import { CredencialClient } from '@/components/credential/CredencialClient'
import type { CredentialUserData } from '@/components/credential/CredentialCard'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

type TabId =
  | 'perfil'
  | 'notificaciones'
  | 'credencial'
  | 'administrar'
  | 'configuracion'

type SubTabAdmin = 'eventos' | 'equipos' | 'campos'

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

const lato = { fontFamily: "'Lato', sans-serif" } as const

function ConfigMiniAvatarSpinner({ className = 'text-[#111111]' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className}`}
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

const permisosLabelStyle = {
  ...jost,
  fontSize: 10,
  color: '#999999',
} as const

function IosToggle({
  checked,
  disabled,
  onToggle,
  ariaLabel,
}: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (!disabled) onToggle()
      }}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200 ${
        checked ? 'bg-[#CC4B37]' : 'bg-[#DDDDDD]'
      } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <span
        className={`absolute top-[3px] h-[25px] w-[25px] rounded-full bg-white shadow transition-[left] duration-200 ${
          checked ? 'left-[23px]' : 'left-[3px]'
        }`}
      />
    </button>
  )
}

function PermisosSection({
  userId,
  triggerPush,
  pushLoading,
}: {
  userId: string
  triggerPush: () => void | Promise<void>
  pushLoading: boolean
}) {
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(() =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  )
  const [locationGranted, setLocationGranted] = useState(false)
  const [geoDenied, setGeoDenied] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission)
    }
  }, [])

  useEffect(() => {
    if (!pushLoading && typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission)
    }
  }, [pushLoading])

  useEffect(() => {
    let cancelled = false
    void supabase
      .from('users')
      .select('location_lat')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.location_lat != null) {
          setLocationGranted(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    let cancelled = false
    let permStatus: PermissionStatus | null = null

    const persistCoords = (lat: number, lng: number) =>
      supabase
        .from('users')
        .update({ location_lat: lat, location_lng: lng })
        .eq('id', userId)

    const refreshCoords = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (!cancelled) {
            void persistCoords(pos.coords.latitude, pos.coords.longitude)
          }
        },
        () => {},
        { enableHighAccuracy: false, maximumAge: 300_000, timeout: 15_000 }
      )
    }

    const onGranted = () => {
      if (cancelled) return
      setLocationGranted(true)
      setGeoDenied(false)
      refreshCoords()
    }

    const onDenied = () => {
      if (cancelled) return
      setGeoDenied(true)
      setLocationGranted(false)
    }

    const onPrompt = () => {
      if (cancelled) return
      setGeoDenied(false)
      setLocationGranted(false)
    }

    const onPermChange = () => {
      if (!permStatus || cancelled) return
      if (permStatus.state === 'granted') onGranted()
      else if (permStatus.state === 'denied') onDenied()
      else onPrompt()
    }

    ;(async () => {
      try {
        const status = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        })
        if (cancelled) return
        permStatus = status
        if (status.state === 'granted') onGranted()
        else if (status.state === 'denied') onDenied()
        else onPrompt()

        status.addEventListener('change', onPermChange)
      } catch {
        if (!cancelled) onPrompt()
      }
    })()

    return () => {
      cancelled = true
      permStatus?.removeEventListener('change', onPermChange)
    }
  }, [userId])

  const onNotifToggle = () => {
    if (pushLoading || notifPerm === 'denied') return
    if (notifPerm === 'granted') return
    void (async () => {
      await triggerPush()
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotifPerm(Notification.permission)
      }
    })()
  }

  const onLocationToggle = () => {
    if (locationLoading || geoDenied || locationGranted) return
    if (!navigator.geolocation) return
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase
          .from('users')
          .update({
            location_lat: pos.coords.latitude,
            location_lng: pos.coords.longitude,
          })
          .eq('id', userId)
        setLocationLoading(false)
        if (error) {
          console.error('[perfil] ubicación:', error)
          return
        }
        setLocationGranted(true)
        setGeoDenied(false)
      },
      () => {
        setLocationLoading(false)
        void navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((st) => {
            if (st.state === 'denied') {
              setGeoDenied(true)
              setLocationGranted(false)
            }
          })
          .catch(() => {})
      },
      { enableHighAccuracy: false, maximumAge: 0, timeout: 15_000 }
    )
  }

  const notifOn = notifPerm === 'granted'
  const notifDisabled = notifPerm === 'denied' || pushLoading
  const notifSub =
    notifPerm === 'denied'
      ? 'Bloqueadas en tu navegador'
      : 'Recibe alertas de mensajes y eventos'

  const locSub = geoDenied
    ? 'Bloqueada en tu navegador'
    : 'Mejora tu feed con contenido cercano'
  const locDisabled = geoDenied || locationLoading
  const locOn = locationGranted

  return (
    <section className="mt-8 border-t border-[#EEEEEE] pt-8">
      <h2 style={permisosLabelStyle} className="mb-4">
        PERMISOS
      </h2>
      <div className="divide-y divide-[#EEEEEE] border border-[#EEEEEE] bg-[#FFFFFF]">
        <div className="flex items-center justify-between gap-3 px-3 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="shrink-0 text-[22px] leading-none" aria-hidden>
              🔔
            </span>
            <div className="min-w-0">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                Notificaciones push
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                {notifSub}
              </p>
            </div>
          </div>
          <IosToggle
            checked={notifOn}
            disabled={notifDisabled}
            onToggle={onNotifToggle}
            ariaLabel="Notificaciones push"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-3 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="shrink-0 text-[22px] leading-none" aria-hidden>
              📍
            </span>
            <div className="min-w-0">
              <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
                Ubicación
              </p>
              <p className="mt-0.5 text-[12px] leading-snug text-[#666666]" style={lato}>
                {locSub}
              </p>
            </div>
          </div>
          <IosToggle
            checked={locOn}
            disabled={locDisabled}
            onToggle={onLocationToggle}
            ariaLabel="Ubicación"
          />
        </div>
      </div>
    </section>
  )
}

function PerfilPwaInstallBlock() {
  const { canInstall, triggerInstall } = usePwaInstall()
  if (!canInstall) return null
  return (
    <div className="mt-6 border-t border-[#EEEEEE] pt-6">
      <button
        type="button"
        onClick={() => void triggerInstall()}
        className="flex w-full items-center justify-center gap-2 bg-[#111111] py-[14px] font-body text-[0.75rem] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
        style={{ borderRadius: 2 }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#FFFFFF" />
        </svg>
        INSTALAR AIRNATION
      </button>
    </div>
  )
}

export function PerfilTabsClient({
  user,
  teamNombre,
  teamSlug,
  misEquipos,
  misCampos,
  misEventosProximos,
  misEventosPasados,
  initialJoinRequests,
  approvedFieldNotices,
  ownerPendingFieldRequests,
  isAdmin,
  pendingJoinPending,
  initialTab,
  campoRegistradoNotice,
  credencialData,
  posts,
  replicas,
}: {
  user: ProfileUserRow
  teamNombre: string | null
  teamSlug: string | null
  misEquipos: MisEquipoItem[]
  misCampos: MisCampoItem[]
  misEventosProximos: MisEventoRsvpItem[]
  misEventosPasados: MisEventoRsvpItem[]
  initialJoinRequests: JoinRequestRow[]
  approvedFieldNotices: ApprovedFieldNotice[]
  ownerPendingFieldRequests: PendingFieldOwnerRequest[]
  isAdmin: boolean
  pendingJoinPending: { id: string; nombre: string }[]
  initialTab?: TabId
  campoRegistradoNotice?: boolean
  credencialData: CredentialUserData
  posts: PlayerPostRow[]
  replicas: PublicReplicaRow[]
}) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? 'perfil')
  const [adminSubTab, setAdminSubTab] = useState<SubTabAdmin>('equipos')
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests)
  const [localApprovedFieldNotices, setLocalApprovedFieldNotices] =
    useState(approvedFieldNotices)
  const [localOwnerPendingFieldRequests, setLocalOwnerPendingFieldRequests] =
    useState(ownerPendingFieldRequests)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const { trigger: triggerPush, loading: pushLoading } = usePushNotifButton()
  const profileViewRef = useRef<ProfileViewHandle>(null)
  const [configProfileUser, setConfigProfileUser] = useState(user)
  const [configProfileEditing, setConfigProfileEditing] = useState(false)
  const [compactAvatarUi, setCompactAvatarUi] = useState({
    uploading: false,
    error: '',
  })

  const handleConfigUserUpdated = useCallback((u: ProfileUserRow) => {
    setConfigProfileUser(u)
  }, [])

  const handleCompactAvatarState = useCallback(
    (s: { uploading: boolean; error: string }) => {
      setCompactAvatarUi(s)
    },
    []
  )

  const pendingCount =
    joinRequests.length +
    localApprovedFieldNotices.length +
    localOwnerPendingFieldRequests.length

  const tabClass = (tabId: TabId) =>
    activeTab === tabId
      ? 'border-b-2 border-[#CC4B37] text-[#111111] pb-[14px] px-4'
      : 'border-b-2 border-transparent text-[#666666] pb-[14px] px-4'

  const removeRequest = useCallback((id: string) => {
    setJoinRequests((r) => r.filter((x) => x.id !== id))
    setLocalApprovedFieldNotices((r) => r.filter((x) => x.id !== id))
    setLocalOwnerPendingFieldRequests((r) => r.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    setJoinRequests(initialJoinRequests)
  }, [initialJoinRequests])
  useEffect(() => {
    setLocalApprovedFieldNotices(approvedFieldNotices)
  }, [approvedFieldNotices])
  useEffect(() => {
    setLocalOwnerPendingFieldRequests(ownerPendingFieldRequests)
  }, [ownerPendingFieldRequests])

  useEffect(() => {
    const el = document.getElementById('dashboard-scroll-root')
    el?.scrollTo({ top: 0 })
  }, [activeTab])

  useEffect(() => {
    let cancelled = false
    fetchUnreadNotifCount(supabase, user.id).then((n) => {
      if (!cancelled) setUnreadNotifCount(n)
    })
    const onUpd = () => {
      fetchUnreadNotifCount(supabase, user.id).then((n) => {
        if (!cancelled) setUnreadNotifCount(n)
      })
    }
    window.addEventListener(NOTIF_UPDATED_EVENT, onUpd)
    return () => {
      cancelled = true
      window.removeEventListener(NOTIF_UPDATED_EVENT, onUpd)
    }
  }, [user.id])

  useEffect(() => {
    setConfigProfileUser(user)
  }, [user])

  useEffect(() => {
    if (activeTab !== 'configuracion') setConfigProfileEditing(false)
  }, [activeTab])

  useEffect(() => {
    const loadFollows = async () => {
      const [{ count: fc }, { count: fg }] = await Promise.all([
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', user.id),
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', user.id),
      ])
      setFollowersCount(fc ?? 0)
      setFollowingCount(fg ?? 0)
    }
    void loadFollows()
  }, [user.id])

  const publicUser: PublicUserProfile = {
    ...user,
    perfil_publico: true,
    teams: null,
    teams_list: misEquipos.map((e) => ({
      id: e.id,
      nombre: e.nombre,
      slug: e.slug,
      logo_url: e.logo_url,
      team_role: e.rol_plataforma,
    })),
  }

  const isVerified =
    !!publicUser.avatar_url &&
    !!publicUser.foto_portada_url &&
    (replicas.length > 0 || posts.length > 0)

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] pb-10">
      <div className="sticky top-0 z-40 -mx-0 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] md:top-16">
        <ScrollableTabsNav>
          {(
            [
              { id: 'perfil' as TabId, label: 'MI PERFIL' },
              {
                id: 'notificaciones' as TabId,
                label: 'NOTIFICACIONES',
                badge: pendingCount + unreadNotifCount,
              },
              { id: 'credencial' as TabId, label: 'CREDENCIAL' },
              { id: 'administrar' as TabId, label: 'ADMINISTRAR' },
              { id: 'configuracion' as TabId, label: 'CONFIGURACIÓN' },
            ] as { id: TabId; label: string; badge?: number }[]
          ).map(({ id, label, badge }) => (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'nearest',
                  block: 'nearest',
                })
                setActiveTab(id)
                if (id === 'notificaciones') setUnreadNotifCount(0)
              }}
              style={jost}
              className={`${tabBase} inline-flex items-center gap-1.5 ${tabClass(id)}`}
            >
              <span>{label}</span>
              {badge && badge > 0 ? (
                <span
                  style={jost}
                  className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#CC4B37] px-1 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              ) : null}
            </button>
          ))}
        </ScrollableTabsNav>
      </div>

      <div className="mt-0">
        {activeTab === 'perfil' && (
          <div>
            <PlayerHero
              user={publicUser}
              subtitle={
                [user.ciudad, user.rol].filter(Boolean).join(' · ') || '—'
              }
              followersCount={followersCount}
              followingCount={followingCount}
              isFollowing={false}
              currentUserId={user.id}
              teamRole={null}
              isVerified={isVerified}
              isOwner
              onEditClick={() => setActiveTab('configuracion')}
              arsenalCount={replicas.length}
              postsCount={posts.length}
            />
            <PlayerProfileClient
              user={publicUser}
              posts={posts}
              events={[]}
              replicas={replicas}
              rolLabels={{
                rifleman: 'Jugador',
                sniper: 'Francotirador',
                support: 'Support',
                medic: 'Medic',
                team_leader: 'Líder de equipo',
                scout: 'Scout',
                rookie: 'Rookie',
              }}
              currentUserId={user.id}
              currentUserAlias={user.alias ?? null}
              currentUserAvatar={user.avatar_url ?? null}
              showPostBox
            />
          </div>
        )}

        {activeTab === 'notificaciones' && (
          <div className="px-4 pt-4">
            <NotificacionesTab
              userId={user.id}
              requests={joinRequests}
              approvedFieldNotices={localApprovedFieldNotices}
              ownerPendingFieldRequests={localOwnerPendingFieldRequests}
              onRemove={removeRequest}
            />
          </div>
        )}

        {activeTab === 'credencial' && (
          <div className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
            <h1 style={jost} className="text-[24px] font-extrabold uppercase leading-tight text-[#111111]">
              MI CREDENCIAL
            </h1>
            <p className="mt-2 text-[14px] leading-relaxed text-[#666666]" style={{ fontFamily: "'Lato', sans-serif" }}>
              Tu identificación digital AirNation
            </p>
            <CredencialClient data={credencialData} />
          </div>
        )}

        {activeTab === 'administrar' && (
          <div className="pt-4">
            <div className="flex gap-4 border-b border-[#EEEEEE] px-4">
              {(
                [
                  { id: 'equipos' as SubTabAdmin, label: 'MIS EQUIPOS' },
                  { id: 'campos' as SubTabAdmin, label: 'MIS CAMPOS' },
                  { id: 'eventos' as SubTabAdmin, label: 'MIS EVENTOS' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setAdminSubTab(id)}
                  style={jost}
                  className={`shrink-0 pb-3 pt-2 text-[11px] font-extrabold uppercase transition-colors ${
                    adminSubTab === id
                      ? 'border-b-2 border-[#CC4B37] text-[#111111]'
                      : 'border-b-2 border-transparent text-[#666666]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="px-4 pt-4">
              {adminSubTab === 'equipos' && (
                <MisEquiposSection
                  teams={misEquipos}
                  userId={user.id}
                  variant="tab"
                />
              )}
              {adminSubTab === 'campos' && (
                <>
                  {campoRegistradoNotice && (
                    <div
                      className="mb-4 border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-[13px] leading-relaxed text-[#111111]"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Tu campo quedará visible cuando un administrador lo
                      apruebe.
                    </div>
                  )}
                  <MisCamposTab items={misCampos} />
                </>
              )}
              {adminSubTab === 'eventos' && (
                <MisEventosRsvpSection
                  proximos={misEventosProximos}
                  pasados={misEventosPasados}
                  currentUserId={user.id}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'configuracion' && (
          <div className="px-4 pt-4">
            <h1
              style={jost}
              className="mb-6 text-[22px] font-extrabold uppercase text-[#111111]"
            >
              CONFIGURACIÓN
            </h1>
            {!configProfileEditing ? (
              <div className="mb-2 max-w-[640px]">
                <div className="flex flex-col items-center border-b border-[#EEEEEE] pb-6">
                  <div
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#CC4B37] md:h-[88px] md:w-[88px]"
                    style={{ borderRadius: '50%' }}
                  >
                    {configProfileUser.avatar_url ? (
                      <img
                        src={configProfileUser.avatar_url}
                        alt=""
                        width={88}
                        height={88}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-[28px] text-[#FFFFFF] md:text-[32px]"
                        style={jost}
                      >
                        {(
                          configProfileUser.alias?.trim()?.[0] ||
                          configProfileUser.nombre?.trim()?.[0] ||
                          '?'
                        ).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <p
                    className="mt-3 text-center text-[15px] font-semibold text-[#111111]"
                    style={lato}
                  >
                    {configProfileUser.nombre?.trim() || '—'}
                  </p>
                  <p
                    className="mt-1 text-center text-[13px] text-[#666666]"
                    style={lato}
                  >
                    {configProfileUser.alias?.trim()
                      ? configProfileUser.alias.trim().startsWith('@')
                        ? configProfileUser.alias.trim()
                        : `@${configProfileUser.alias.trim()}`
                      : '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => profileViewRef.current?.openAvatarPicker()}
                    disabled={compactAvatarUi.uploading}
                    style={jost}
                    className="mt-3 inline-flex min-h-[36px] items-center justify-center gap-2 rounded-[2px] border border-solid border-[#111111] bg-transparent px-3 py-1.5 text-[10px] font-extrabold uppercase text-[#111111] disabled:opacity-60"
                  >
                    {compactAvatarUi.uploading ? <ConfigMiniAvatarSpinner /> : null}
                    {compactAvatarUi.uploading ? 'SUBIENDO…' : 'CAMBIAR FOTO'}
                  </button>
                  {compactAvatarUi.error ? (
                    <p className="mt-2 text-center text-[12px] text-[#CC4B37]" style={lato}>
                      {compactAvatarUi.error}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => profileViewRef.current?.startEdit()}
                    style={jost}
                    className="mt-3 w-full max-w-[240px] rounded-[2px] bg-[#111111] py-2.5 text-[11px] font-extrabold uppercase text-[#FFFFFF]"
                  >
                    EDITAR PERFIL
                  </button>
                </div>
              </div>
            ) : null}
            <ProfileView
              ref={profileViewRef}
              user={user}
              teamNombre={teamNombre}
              teamSlug={teamSlug}
              pendingJoinPending={pendingJoinPending}
              compactReadMode
              onEditModeChange={setConfigProfileEditing}
              onUserUpdated={handleConfigUserUpdated}
              onCompactAvatarState={handleCompactAvatarState}
            />
            <PermisosSection
              userId={user.id}
              triggerPush={triggerPush}
              pushLoading={pushLoading}
            />
            <div className="mt-8 space-y-3 border-t border-[#EEEEEE] pt-8">
              {isAdmin && (
                <Link
                  href="/admin"
                  style={jost}
                  className="flex h-12 w-full items-center justify-center gap-2 border border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                >
                  ADMINISTRACIÓN
                </Link>
              )}
              <PerfilPwaInstallBlock />
              <PerfilLogoutButton />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
