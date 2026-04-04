'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import type { JoinRequestRow } from '@/lib/pending-join-requests'
import { MisEquiposSection, type MisEquipoItem } from './MisEquiposSection'
import { NotificacionesTab } from './NotificacionesTab'
import { PerfilLogoutButton } from './PerfilLogoutButton'
import { ProfileView, type ProfileUserRow } from './ProfileView'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

type TabId = 'perfil' | 'equipos' | 'notificaciones'

const tabBtn =
  'relative shrink-0 border-b-2 border-transparent px-4 py-[14px] text-[12px] font-extrabold uppercase text-[#666666] transition-[color,border-color] duration-150'

const tabBtnActive =
  'border-[#CC4B37] text-[#111111]'

export function PerfilTabsClient({
  user,
  teamNombre,
  misEquipos,
  initialJoinRequests,
  isAdmin,
}: {
  user: ProfileUserRow
  teamNombre: string | null
  misEquipos: MisEquipoItem[]
  initialJoinRequests: JoinRequestRow[]
  isAdmin: boolean
}) {
  const [tab, setTab] = useState<TabId>('perfil')
  const [joinRequests, setJoinRequests] = useState(initialJoinRequests)
  const pendingCount = joinRequests.length

  const removeRequest = useCallback((id: string) => {
    setJoinRequests((r) => r.filter((x) => x.id !== id))
  }, [])

  useEffect(() => {
    const el = document.getElementById('dashboard-scroll-root')
    el?.scrollTo({ top: 0 })
  }, [tab])

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
            onClick={() => setTab('perfil')}
            className={`${tabBtn} ${tab === 'perfil' ? tabBtnActive : ''}`}
          >
            MI PERFIL
          </button>
          <button
            type="button"
            onClick={() => setTab('equipos')}
            className={`${tabBtn} ${tab === 'equipos' ? tabBtnActive : ''}`}
          >
            MIS EQUIPOS
          </button>
          <button
            type="button"
            onClick={() => setTab('notificaciones')}
            className={`${tabBtn} inline-flex items-center gap-1.5 ${
              tab === 'notificaciones' ? tabBtnActive : ''
            }`}
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
          {/* Bloque 5 — MIS CAMPOS: añadir aquí un <button> tab adicional */}
        </div>
      </div>

      <div className="mt-6">
        {tab === 'perfil' ? (
          <>
            <ProfileView user={user} teamNombre={teamNombre} />
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

        {tab === 'equipos' ? (
          <MisEquiposSection teams={misEquipos} variant="tab" />
        ) : null}

        {tab === 'notificaciones' ? (
          <NotificacionesTab requests={joinRequests} onRemove={removeRequest} />
        ) : null}
      </div>
    </main>
  )
}
