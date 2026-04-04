'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { ApprovedFieldNotice } from '@/lib/approved-field-notices'
import type { JoinRequestRow } from '@/lib/pending-join-requests'
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

type TabId = 'perfil' | 'equipos' | 'campos' | 'eventos' | 'notificaciones'

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

function initialTabFromParam(tab?: TabId): TabId {
  if (tab === 'campos' || tab === 'eventos') return tab
  return 'perfil'
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
  isAdmin,
  pendingJoinPending,
  initialTab,
  campoRegistradoNotice,
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
  isAdmin: boolean
  pendingJoinPending: { id: string; nombre: string }[]
  initialTab?: TabId
  campoRegistradoNotice?: boolean
}) {
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    initialTabFromParam(initialTab)
  )
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests)
  const pendingCount =
    joinRequests.length + approvedFieldNotices.length

  const tabClass = (tabId: TabId) =>
    activeTab === tabId
      ? 'border-b-2 border-[#CC4B37] text-[#111111] pb-[14px] px-4'
      : 'border-b-2 border-transparent text-[#666666] pb-[14px] px-4'

  const removeRequest = useCallback((id: string) => {
    setJoinRequests((r) => r.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    const el = document.getElementById('dashboard-scroll-root')
    el?.scrollTo({ top: 0 })
  }, [activeTab])

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <h1
        style={jost}
        className="text-[22px] font-extrabold uppercase leading-tight text-[#111111] md:text-[26px]"
      >
        PERFIL
      </h1>

      <div className="sticky top-0 z-40 -mx-4 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] md:-mx-6 md:top-16">
        <div className="flex overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            style={jost}
            className={`${tabBase} ${tabClass('perfil')}`}
          >
            MI PERFIL
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('equipos')}
            style={jost}
            className={`${tabBase} ${tabClass('equipos')}`}
          >
            MIS EQUIPOS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campos')}
            style={jost}
            className={`${tabBase} ${tabClass('campos')}`}
          >
            MIS CAMPOS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('eventos')}
            style={jost}
            className={`${tabBase} ${tabClass('eventos')}`}
          >
            MIS EVENTOS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notificaciones')}
            style={jost}
            className={`${tabBase} inline-flex items-center gap-1.5 ${tabClass(
              'notificaciones'
            )}`}
          >
            <span>NOTIFICACIONES</span>
            {pendingCount > 0 ? (
              <span
                style={jost}
                className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#CC4B37] px-1 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
              >
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === 'perfil' ? (
          <>
            <ProfileView
              user={user}
              teamNombre={teamNombre}
              teamSlug={teamSlug}
              pendingJoinPending={pendingJoinPending}
            />
            <div className="mx-auto mt-8 max-w-[640px] space-y-8">
              {isAdmin ? (
                <Link
                  href="/admin"
                  style={jost}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <rect
                      x="3"
                      y="3"
                      width="8"
                      height="8"
                      stroke="#111111"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="13"
                      y="3"
                      width="8"
                      height="8"
                      stroke="#111111"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="3"
                      y="13"
                      width="8"
                      height="8"
                      stroke="#111111"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="13"
                      y="13"
                      width="8"
                      height="8"
                      stroke="#111111"
                      strokeWidth="1.5"
                    />
                  </svg>
                  ADMINISTRACIÓN
                </Link>
              ) : null}
              <div className="border-t border-solid border-[#EEEEEE] pt-8">
                <PerfilLogoutButton />
              </div>
            </div>
          </>
        ) : null}

        {activeTab === 'equipos' ? (
          <MisEquiposSection
            teams={misEquipos}
            userId={user.id}
            variant="tab"
          />
        ) : null}

        {activeTab === 'campos' ? (
          <>
            {campoRegistradoNotice ? (
              <div
                className="mb-4 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3 text-[13px] leading-relaxed text-[#111111]"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                Tu campo quedará visible cuando un administrador lo apruebe.
              </div>
            ) : null}
            <MisCamposTab items={misCampos} />
          </>
        ) : null}

        {activeTab === 'eventos' ? (
          <div className="mx-auto max-w-[640px]">
            <MisEventosRsvpSection
              proximos={misEventosProximos}
              pasados={misEventosPasados}
            />
          </div>
        ) : null}

        {activeTab === 'notificaciones' ? (
          <NotificacionesTab
            requests={joinRequests}
            approvedFieldNotices={approvedFieldNotices}
            onRemove={removeRequest}
          />
        ) : null}
      </div>
    </main>
  )
}
