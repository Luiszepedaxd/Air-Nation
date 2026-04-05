"use client"
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchPendingJoinRequestCount,
  PENDING_JOIN_UPDATED_EVENT,
} from '@/lib/pending-join-requests'
import { supabase } from '@/lib/supabase'

const NAV_ITEMS = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: (active: boolean) => {
      const color = active ? '#CC4B37' : '#767676'
      return (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z"
            stroke={color}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )
    },
  },
  {
    label: 'Operador',
    href: '/dashboard/perfil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8"/>
        <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    label: 'Credencial',
    href: '/dashboard/credencial',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="13" rx="1.5"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8"/>
        <circle cx="8" cy="12" r="2.5"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8"/>
        <path d="M13 10h5M13 13.5h3.5"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    label: 'Campos',
    href: '/campos',
    icon: (active: boolean) => {
      const stroke = active ? '#CC4B37' : '#767676'
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
            stroke={stroke}
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="11"
            r="2.25"
            fill={active ? '#CC4B37' : 'none'}
            stroke={stroke}
            strokeWidth="1.5"
          />
        </svg>
      )
    },
  },
  {
    label: 'Réplicas',
    href: '/dashboard/replicas',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M4 12h16M4 12c0-1 .5-2 1.5-2.5L14 5M4 12c0 1 .5 2 1.5 2.5L14 19M20 12l-3-4M20 12l-3 4"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
]

function sosNavIcon(active: boolean) {
  const stroke = active ? '#CC4B37' : '#767676'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.8" />
      <path
        d="M12 8v4M12 16h.01"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

const NAV_ITEMS_MOBILE = [
  { ...NAV_ITEMS[0], label: 'HOME' },
  { ...NAV_ITEMS[1], label: 'PERFIL' },
  { ...NAV_ITEMS[2], label: 'CREDENCIAL' },
  { ...NAV_ITEMS[3], label: 'CAMPOS' },
  { ...NAV_ITEMS[4], label: 'RÉPLICAS' },
  {
    label: 'SOS',
    href: '/dashboard/sos',
    icon: sosNavIcon,
  },
]

function AdminShieldIcon({ active }: { active: boolean }) {
  const stroke = active ? '#CC4B37' : '#767676'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3L4 7v5c0 4.418 3.358 8.193 8 9 4.642-.807 8-4.582 8-9V7L12 3Z"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const perfilHref = '/dashboard/perfil'

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/campos') {
    return pathname === '/campos' || pathname.startsWith('/campos/')
  }
  return pathname === href
}

function ProfileIconWithBadge({
  active,
  badgeCount,
}: {
  active: boolean
  badgeCount: number
}) {
  return (
    <span className="relative inline-flex">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8"
        />
        <path
          d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {badgeCount > 0 ? (
        <span
          className="absolute -right-1 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#CC4B37] px-0.5 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      ) : null}
    </span>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [panicModal, setPanicModal] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingJoinCount, setPendingJoinCount] = useState(0)

  const refreshPendingJoinCount = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setPendingJoinCount(0)
      return
    }
    const n = await fetchPendingJoinRequestCount(supabase, user.id)
    setPendingJoinCount(n)
  }, [])

  useEffect(() => {
    void refreshPendingJoinCount()
  }, [pathname, refreshPendingJoinCount])

  useEffect(() => {
    const onUpd = () => {
      void refreshPendingJoinCount()
    }
    window.addEventListener(PENDING_JOIN_UPDATED_EVENT, onUpd)
    return () => window.removeEventListener(PENDING_JOIN_UPDATED_EVENT, onUpd)
  }, [refreshPendingJoinCount])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('users')
        .select('app_role')
        .eq('id', user.id)
        .maybeSingle()
      if (data?.app_role === 'admin') setIsAdmin(true)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/login')
    router.refresh()
  }

  const adminNavActive = pathname === '/admin'

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 inset-x-0 z-50 bg-white border-b border-[#EEEEEE] h-16 items-center justify-between px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="w-7 h-7 bg-[#CC4B37] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff"/>
            </svg>
          </span>
          <span style={{fontFamily:'Jost,sans-serif'}}
                className="font-black text-[1.1rem] tracking-[0.18em] text-[#111111] uppercase">
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isNavItemActive(pathname, item.href)
            const isPerfil = item.href === perfilHref
            return (
              <Link key={item.href} href={item.href}
                    className={`flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
                      active ? 'border-b-2 border-[#CC4B37]' : 'border-b-2 border-transparent'
                    }`}>
                {isPerfil ? (
                  <ProfileIconWithBadge
                    active={active}
                    badgeCount={pendingJoinCount}
                  />
                ) : (
                  item.icon(active)
                )}
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  active ? 'text-[#CC4B37]' : 'text-[#767676]'
                }`}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          <button onClick={() => setPanicModal(true)}
                  className="flex flex-col items-center gap-1 px-4 py-2 relative">
            <span className="absolute top-1 right-3 w-1.5 h-1.5 bg-[#CC4B37] rounded-full animate-pulse"/>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#CCCCCC" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="#CCCCCC" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#CCCCCC]">SOS</span>
          </button>

          {isAdmin && (
            <Link
              href="/admin"
              className={`flex flex-col items-center gap-1 px-4 py-2 relative transition-colors ${
                adminNavActive ? 'border-b-2 border-[#CC4B37]' : 'border-b-2 border-transparent'
              }`}
            >
              <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#CC4B37] rounded-full animate-pulse" />
              <AdminShieldIcon active={adminNavActive} />
              <span
                className={`text-[9px] font-bold uppercase tracking-wider ${
                  adminNavActive ? 'text-[#CC4B37]' : 'text-[#767676]'
                }`}
              >
                Admin
              </span>
            </Link>
          )}

          <div className="w-px h-8 bg-[#EEEEEE] mx-2"/>

          <button onClick={handleLogout}
                  className="text-[#767676] text-[0.7rem] font-bold uppercase tracking-[0.15em] hover:text-[#CC4B37] transition-colors px-3">
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Bottom Nav — mobile (5 ítems: sin Docs ni Admin; SOS enlaza a /dashboard/sos) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#EEEEEE] md:hidden"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="grid h-14 w-full grid-cols-6 items-stretch">
          {NAV_ITEMS_MOBILE.map((item) => {
            const active = isNavItemActive(pathname, item.href)
            const isPerfil = item.href === perfilHref
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 flex-col items-center justify-center gap-1"
              >
                {isPerfil ? (
                  <ProfileIconWithBadge
                    active={active}
                    badgeCount={pendingJoinCount}
                  />
                ) : (
                  item.icon(active)
                )}
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider leading-none ${
                    active ? 'text-[#CC4B37]' : 'text-[#767676]'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      {panicModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
             onClick={() => setPanicModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"/>

          <div className="relative w-full max-w-lg bg-white z-10 p-8 pb-12"
               onClick={(e) => e.stopPropagation()}>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#CC4B37] flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <span className="text-[#CC4B37] text-[0.6rem] font-bold uppercase tracking-[0.25em] block">
                  Próximamente
                </span>
                <h3 style={{fontFamily:'Jost,sans-serif'}}
                    className="font-black text-xl uppercase text-[#111111] leading-none">
                  BOTÓN DE PÁNICO
                </h3>
              </div>
            </div>

            <div className="flex flex-col gap-4 mb-8">
              {[
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="9" stroke="#CC4B37" strokeWidth="1.8"/>
                      <path d="M12 8v4M12 16h.01" stroke="#CC4B37" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ),
                  text: 'Alerta inmediata a tu equipo con tu ubicación'
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12h6M9 16h4M7 3h10l4 4v14a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h3Z"
                        stroke="#CC4B37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ),
                  text: 'Guía paso a paso según la autoridad que te detuvo'
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="6" width="20" height="13" rx="1.5" stroke="#CC4B37" strokeWidth="1.8"/>
                      <path d="M8 11h8M8 14.5h5" stroke="#CC4B37" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ),
                  text: 'Tus documentos listos para mostrar al instante'
                },
                {
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3v4M4.93 7.93l2.83 2.83M3 15h4M4.93 20.07l2.83-2.83M12 21v-4M19.07 20.07l-2.83-2.83M21 15h-4M19.07 7.93l-2.83 2.83"
                        stroke="#CC4B37" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ),
                  text: 'Información de tus derechos según tu estado'
                },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <span className="shrink-0 mt-0.5">{icon}</span>
                  <p className="text-[#444444] text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-[#F4F4F4] border-l-2 border-[#CC4B37] mb-6">
              <p className="text-[#444444] text-xs leading-relaxed">
                Estamos construyendo esto con cuidado. Tu seguridad y la de tu equipo merecen que lo hagamos bien.
              </p>
            </div>

            <button onClick={() => setPanicModal(false)}
                    className="w-full py-3.5 bg-[#111111] text-white font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:bg-[#333333] transition-colors">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  )
}
