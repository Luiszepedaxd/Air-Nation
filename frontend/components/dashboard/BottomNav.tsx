"use client"
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  fetchPendingJoinRequestCount,
  PENDING_JOIN_UPDATED_EVENT,
} from '@/lib/pending-join-requests'
import {
  fetchUnreadNotifCount,
  NOTIF_UPDATED_EVENT,
} from '@/lib/user-notifications'
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
    label: 'Mensajes',
    href: '/dashboard/mensajes',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  },
  {
    label: 'Arsenal',
    href: '/dashboard/arsenal',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 7v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V7L12 3Z"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 12l2 2 4-4"
          stroke={active ? '#CC4B37' : '#767676'}
          strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
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
]

const NAV_ITEMS_MOBILE = [
  { ...NAV_ITEMS[0], label: 'HOME' },
  { ...NAV_ITEMS[1], label: 'OPERADOR' },
  { ...NAV_ITEMS[2], label: 'MENSAJES' },
  { ...NAV_ITEMS[3], label: 'ARSENAL' },
  { ...NAV_ITEMS[4], label: 'CAMPOS' },
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
  showDot,
}: {
  active: boolean
  badgeCount: number
  showDot: boolean
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
      {showDot && badgeCount === 0 ? (
        <span className="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-[#CC4B37] border border-white" />
      ) : null}
    </span>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingJoinCount, setPendingJoinCount] = useState(0)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [unreadMsgCount, setUnreadMsgCount] = useState(0)
  const [hasAvatar, setHasAvatar] = useState(true)

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

  const refreshUnreadNotifCount = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setUnreadNotifCount(0)
      return
    }
    const n = await fetchUnreadNotifCount(supabase, user.id)
    setUnreadNotifCount(n)
  }, [])

  useEffect(() => {
    void refreshPendingJoinCount()
  }, [pathname, refreshPendingJoinCount])

  useEffect(() => {
    void refreshUnreadNotifCount()
  }, [pathname, refreshUnreadNotifCount])

  useEffect(() => {
    const onUpd = () => {
      void refreshPendingJoinCount()
    }
    window.addEventListener(PENDING_JOIN_UPDATED_EVENT, onUpd)
    return () => window.removeEventListener(PENDING_JOIN_UPDATED_EVENT, onUpd)
  }, [refreshPendingJoinCount])

  useEffect(() => {
    const onUpd = () => void refreshUnreadNotifCount()
    window.addEventListener(NOTIF_UPDATED_EVENT, onUpd)
    return () => window.removeEventListener(NOTIF_UPDATED_EVENT, onUpd)
  }, [refreshUnreadNotifCount])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channel = supabase
        .channel('user-notifs-badge')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'user_notifications',
            filter: `recipient_id=eq.${user.id}`,
          },
          () => {
            void refreshUnreadNotifCount()
          }
        )
        .subscribe()
    })
    return () => {
      if (channel) void supabase.removeChannel(channel)
    }
  }, [refreshUnreadNotifCount])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const [userData, q1, q2] = await Promise.all([
        supabase
          .from('users')
          .select('app_role, avatar_url')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('participant_1', user.id)
          .gt('unread_1', 0),
        supabase
          .from('conversations')
          .select('*', { count: 'exact', head: true })
          .eq('participant_2', user.id)
          .gt('unread_2', 0),
      ])
      if (userData.data?.app_role === 'admin') setIsAdmin(true)
      setHasAvatar(!!(userData.data?.avatar_url))
      let msgUnread = 0
      if (!q1.error) msgUnread += q1.count ?? 0
      if (!q2.error) msgUnread += q2.count ?? 0
      setUnreadMsgCount(msgUnread)
    })
  }, [pathname])

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
                    badgeCount={pendingJoinCount + unreadNotifCount}
                    showDot={!hasAvatar}
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

      {/* Bottom Nav — mobile (5 ítems: HOME, OPERADOR, MENSAJES, CAMPOS, ARSENAL) */}
      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-[#EEEEEE] md:hidden"
           style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
        <div className="grid h-16 w-full grid-cols-5 items-center">
          {NAV_ITEMS_MOBILE.map((item) => {
            const active = isNavItemActive(pathname, item.href)
            const isPerfil = item.href === perfilHref
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-w-0 flex-col items-center justify-center gap-0.5"
              >
                {isPerfil ? (
                  <ProfileIconWithBadge
                    active={active}
                    badgeCount={pendingJoinCount + unreadNotifCount}
                    showDot={!hasAvatar}
                  />
                ) : item.href === '/dashboard/mensajes' ? (
                  <span className="relative inline-flex">
                    {item.icon(active)}
                    {unreadMsgCount > 0 && (
                      <span
                        className="absolute -right-1 -top-0.5 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#CC4B37] px-0.5 text-[10px] font-extrabold leading-none text-white"
                        style={{ fontFamily: "'Jost', sans-serif" }}
                      >
                        {unreadMsgCount > 99 ? '99+' : unreadMsgCount}
                      </span>
                    )}
                  </span>
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

    </>
  )
}
