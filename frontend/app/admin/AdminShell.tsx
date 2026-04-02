'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

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
          stroke={active ? '#CC4B37' : '#8A8A88'}
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
          stroke={active ? '#CC4B37' : '#8A8A88'}
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
          stroke={active ? '#CC4B37' : '#8A8A88'}
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path
          d="M17 3v4h4M8 11h8M8 15h5"
          stroke={active ? '#CC4B37' : '#8A8A88'}
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
          stroke={active ? '#CC4B37' : '#8A8A88'}
          strokeWidth="1.7"
        />
        <path
          d="M10 9.5v5l4-2.5-4-2.5z"
          fill={active ? '#CC4B37' : '#8A8A88'}
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
          stroke={active ? '#CC4B37' : '#8A8A88'}
          strokeWidth="1.7"
        />
        <circle
          cx="12"
          cy="11"
          r="2.5"
          stroke={active ? '#CC4B37' : '#8A8A88'}
          strokeWidth="1.7"
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
          stroke={active ? '#CC4B37' : '#8A8A88'}
          strokeWidth="1.7"
        />
        <path
          d="M3 10h18M8 3v4M16 3v4"
          stroke={active ? '#CC4B37' : '#8A8A88'}
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
          stroke={active ? '#CC4B37' : '#8A8A88'}
          strokeWidth="1.7"
          strokeLinejoin="round"
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
            className={`flex items-center gap-3 px-3 py-2.5 text-[0.7rem] font-bold uppercase tracking-[0.12em] transition-colors ${
              active
                ? 'bg-[#1E2226] text-[#CC4B37]'
                : 'text-[#8A8A88] hover:bg-[#1A1C1F] hover:text-[#EDEDEB]'
            }`}
            style={{ borderRadius: 0 }}
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
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen min-h-dvh flex bg-[#0B0C0D] text-[#EDEDEB]">
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-[220px] border-r border-[#1E2226] bg-[#111315] transition-transform duration-200 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:flex md:flex-col`}
      >
        <div
          className="flex h-14 items-center border-b border-[#1E2226] px-4 md:h-[3.75rem]"
          style={{ fontFamily: 'Jost, sans-serif' }}
        >
          <span className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-[#CC4B37]">
            AIRNATION
            <span className="text-[#8A8A88]"> ADMIN</span>
          </span>
        </div>
        <SidebarNav onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="flex min-h-screen min-h-dvh flex-1 flex-col md:ml-[220px]">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-[#1E2226] bg-[#111315] px-4 md:h-[3.75rem] md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center border border-[#1E2226] bg-[#0B0C0D] md:hidden"
              style={{ borderRadius: 2 }}
              aria-expanded={mobileOpen}
              aria-label="Abrir menú"
              onClick={() => setMobileOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="#EDEDEB"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <span
              className="text-[0.6rem] font-black uppercase tracking-[0.18em] text-[#CC4B37] sm:text-[0.65rem] sm:tracking-[0.2em]"
              style={{ fontFamily: 'Jost, sans-serif' }}
            >
              AIRNATION ADMIN
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="max-w-[140px] truncate text-sm text-[#8A8A88] md:max-w-[240px]">
              {displayName}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="border border-[#1E2226] bg-[#0B0C0D] px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#EDEDEB] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
              style={{ borderRadius: 2 }}
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#0B0C0D] px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
