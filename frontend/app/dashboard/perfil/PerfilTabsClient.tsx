'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
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
import { ProfileView, type ProfileUserRow } from './ProfileView'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

type TabId =
  | 'perfil'
  | 'notificaciones'
  | 'credencial'
  | 'sos'
  | 'administrar'
  | 'configuracion'

type SubTabAdmin = 'eventos' | 'equipos' | 'campos'

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

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
  const {
    canShow: canShowPush,
    trigger: triggerPush,
    loading: pushLoading,
  } = usePushNotifButton()

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
              { id: 'sos' as TabId, label: 'SOS' },
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
              followersCount={0}
              followingCount={0}
              isFollowing={false}
              currentUserId={user.id}
              teamRole={null}
              isOwner
              onEditClick={() => setActiveTab('configuracion')}
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
          <div className="px-4 pt-4">
            <iframe
              src="/dashboard/credencial"
              className="w-full border-0"
              style={{ minHeight: '600px' }}
              title="Credencial digital"
            />
          </div>
        )}

        {activeTab === 'sos' && (
          <div className="px-4 pt-4">
            <iframe
              src="/dashboard/sos"
              className="w-full border-0"
              style={{ minHeight: '600px' }}
              title="SOS"
            />
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
              Configuración
            </h1>
            <ProfileView
              user={user}
              teamNombre={teamNombre}
              teamSlug={teamSlug}
              pendingJoinPending={pendingJoinPending}
            />
            <div className="mt-8 space-y-3">
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
              {canShowPush && (
                <button
                  type="button"
                  onClick={() => void triggerPush()}
                  disabled={pushLoading}
                  style={jost}
                  className="flex h-12 w-full items-center justify-center gap-2 bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:opacity-60"
                >
                  {pushLoading ? 'ACTIVANDO...' : 'ACTIVAR NOTIFICACIONES'}
                </button>
              )}
              <div className="border-t border-[#EEEEEE] pt-8">
                <PerfilLogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
