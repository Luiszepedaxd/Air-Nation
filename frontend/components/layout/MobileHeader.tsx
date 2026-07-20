'use client'

import { usePathname, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/search/SearchBar'

const jost = { fontFamily: "'Jost', sans-serif" } as const

const ROOT_ROUTES = new Set([
  '/',
  '/welcome',
  '/dashboard/perfil',
  '/dashboard/mensajes',
  '/dashboard/arsenal',
  '/campos',
  '/login',
  '/register',
  '/onboarding',
  '/equipos',
  '/eventos',
  '/marketplace',
  '/blog',
])

// Rutas con header full-screen propio — MobileHeader no renderiza
function isSelfManagedRoute(pathname: string): boolean {
  return /^\/dashboard\/mensajes\/.+/.test(pathname)
}

function getBackLabel(pathname: string): string {
  if (pathname.startsWith('/dashboard/arsenal/')) return 'Arsenal'
  if (pathname.startsWith('/replicas/')) return 'Arsenal'
  if (pathname.startsWith('/marketplace/')) return 'Explorar'
  if (pathname.startsWith('/mi-campo/')) return 'Perfil'
  if (
    pathname.startsWith('/equipos/') &&
    (pathname.includes('/admin') || pathname.includes('/editar'))
  ) return 'Equipo'
  if (pathname === '/equipos/nuevo') return 'Panel'
  if (pathname.startsWith('/campos/') && pathname.includes('/editar')) return 'Campo'
  if (pathname === '/campos/nuevo') return 'Perfil'
  if (pathname.startsWith('/u/')) return 'Operador'
  if (pathname.startsWith('/equipos/')) return 'Equipos'
  if (pathname.startsWith('/eventos/')) return 'Eventos'
  if (pathname.startsWith('/blog/')) return 'Blog'
  if (pathname.startsWith('/campos/')) return 'Campos'
  return 'Volver'
}

export default function MobileHeader() {
  const pathname = usePathname()
  const router = useRouter()

  if (ROOT_ROUTES.has(pathname)) return null
  if (isSelfManagedRoute(pathname)) return null

  const label = getBackLabel(pathname)

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  const isDashboardHome = pathname === '/dashboard'

  if (isDashboardHome) {
    return (
      <header
        className="md:hidden flex flex-col bg-[#FFFFFF] border-b border-[#EEEEEE] shrink-0"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center h-12 px-3">
          <SearchBar className="flex-1" />
        </div>
      </header>
    )
  }

  return (
    <header
      className="md:hidden flex flex-col bg-[#FFFFFF] border-b border-[#EEEEEE] shrink-0"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
    <div className="flex items-center h-12 px-2">
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 px-2 h-10 active:bg-[#F4F4F4] rounded-sm"
        aria-label={`Volver a ${label}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18l-6-6 6-6"
            stroke="#111111"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span
          style={jost}
          className="text-[11px] font-extrabold uppercase tracking-widest text-[#111111]"
        >
          {label}
        </span>
      </button>
    </div>
    </header>
  )
}
