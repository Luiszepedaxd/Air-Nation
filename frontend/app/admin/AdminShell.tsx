'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

type NavItem = {
  href: string
  label: string
  icon: (active: boolean) => ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/usuarios',
    label: 'Usuarios',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/posts',
    label: 'Posts',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M7 3h10l4 4v14a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h3Z"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M17 3v4h4M8 11h8M8 15h5"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/videos',
    label: 'Videos',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="2"
          y="5"
          width="20"
          height="14"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
        />
        <path
          d="M10 9.5v5l4-2.5-4-2.5z"
          fill={active ? '#CC4B37' : '#666666'}
        />
      </svg>
    ),
  },
  {
    href: '/admin/campos',
    label: 'Campos',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10z"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
        />
        <circle
          cx="12"
          cy="11"
          r="2.5"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
        />
      </svg>
    ),
  },
  {
    href: '/admin/equipos',
    label: 'Equipos',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 11a3 3 0 100-6 3 3 0 000 6zM17 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 20.5v-.5a4 4 0 014-4h4a4 4 0 014 4v.5M14 20.5v-.5a3 3 0 013-3h1"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/eventos',
    label: 'Eventos',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
        />
        <path
          d="M3 10h18M8 3v4M16 3v4"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/documentos',
    label: 'Documentos',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 7a2 2 0 012-2h5l2 2h7a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/assets',
    label: 'ASSETS',
    icon: (active) => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect
          x="3"
          y="5"
          width="18"
          height="14"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
        />
        <path
          d="M3 17l5-5 4 4 4-6 5 7"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="8"
          cy="9"
          r="1.5"
          fill={active ? '#CC4B37' : '#666666'}
        />
      </svg>
    ),
  },
  {
    href: '/admin/store',
    label: 'Store',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M3 6h18M16 10a4 4 0 01-8 0"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: '/admin/bloodmoney2',
    label: 'Blood Money 2',
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 2l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-1.5L12 2z"
          stroke={active ? '#CC4B37' : '#666666'}
          strokeWidth="1.7"
          strokeLinejoin="round"
          fill={active ? '#CC4B37' : 'none'}
          fillOpacity={active ? 0.15 : 0}
        />
      </svg>
    ),
  },
]

function navActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-0.5 px-2 py-4">
      {NAV_ITEMS.map((item) => {
        const active = navActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 text-[0.7rem] tracking-[0.12em] transition-colors ${
              active
                ? 'bg-[#EEEEEE] text-[#CC4B37]'
                : 'text-[#666666] hover:bg-[#EEEEEE]/70 hover:text-[#111111]'
            }`}
            style={{ ...jostHeading, borderRadius: 0 }}
          >
            <span className="shrink-0">{item.icon(active)}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export default function AdminShell({
  children,
  displayName,
}: {
  children: ReactNode
  displayName: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div
      className="flex min-h-screen min-h-dvh bg-[#FFFFFF] text-[#111111]"
      style={latoBody}
    >
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#111111]/40 md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[220px] border-r border-solid border-[#EEEEEE] bg-[#F4F4F4] transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:flex md:flex-col`}
      >
        <div className="flex h-14 items-center border-b border-solid border-[#EEEEEE] px-4 md:h-[3.75rem]">
          <span
            className="text-[0.65rem] tracking-[0.2em] text-[#CC4B37]"
            style={jostHeading}
          >
            AIRNATION
            <span className="text-[#666666]"> ADMIN</span>
          </span>
        </div>
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex min-h-screen min-h-dvh flex-1 flex-col md:ml-[220px]">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 md:h-[3.75rem] md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] md:hidden"
              style={{ borderRadius: 2 }}
              aria-expanded={mobileOpen}
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="#111111"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span
              className="text-[0.6rem] tracking-[0.18em] text-[#CC4B37] sm:text-[0.65rem] sm:tracking-[0.2em]"
              style={jostHeading}
            >
              AIRNATION ADMIN
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span
              className="max-w-[140px] truncate text-sm text-[#666666] md:max-w-[240px]"
              style={latoBody}
            >
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="bg-[#111111] px-3 py-2 text-[0.65rem] uppercase tracking-[0.14em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
              style={{ ...latoBody, borderRadius: 2, fontWeight: 700 }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#FFFFFF] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
