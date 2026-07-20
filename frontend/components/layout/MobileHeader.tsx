'use client'

import { usePathname, useRouter } from 'next/navigation'

const ROOT_ROUTES = new Set([
  '/',
  '/welcome',
  '/dashboard',
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

export default function MobileHeader() {
  const pathname = usePathname()
  const router = useRouter()

  if (ROOT_ROUTES.has(pathname)) return null

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <header className="md:hidden flex items-center h-12 px-2 bg-[#FFFFFF] border-b border-[#EEEEEE] shrink-0">
      <button
        onClick={handleBack}
        className="flex items-center justify-center w-10 h-10 active:bg-[#F4F4F4] rounded-sm"
        aria-label="Volver"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M15 18l-6-6 6-6"
            stroke="#111111"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </header>
  )
}
