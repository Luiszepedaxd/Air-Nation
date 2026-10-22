'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

/**
 * Nav del portal del dueño. Solo apunta a sus propias rutas
 * (`/mi-campo/[id]/arena/*`): nunca al admin general, que además está cerrado
 * por `middleware.ts` y por `requireAdmin` en el backend.
 */
export function PortalNav() {
  const pathname = usePathname()
  const tab = useSearchParams().get('tab') ?? 'agenda'

  // /mi-campo y /mi-campo/cambiar-password no son de un campo: sin nav.
  const id = pathname.match(/^\/mi-campo\/([0-9a-f-]{36})(\/|$)/i)?.[1]
  if (!id) return null

  const base = `/mi-campo/${id}/arena`
  const escaneando = pathname.startsWith(`${base}/escanear`)
  const items: { label: string; href: string; activo: boolean }[] = [
    { label: 'AGENDA', href: base, activo: !escaneando && tab === 'agenda' },
    { label: 'CATÁLOGO', href: `${base}?tab=catalogo`, activo: !escaneando && tab === 'catalogo' },
    { label: 'ESCANEAR', href: `${base}/escanear`, activo: escaneando },
    { label: 'SALDOS', href: `${base}?tab=saldos`, activo: !escaneando && tab === 'saldos' },
    { label: 'CONFIGURACIÓN', href: `${base}?tab=config`, activo: !escaneando && tab === 'config' },
  ]

  return (
    <nav
      aria-label="Portal del dueño"
      className="border-b border-solid border-[#EEEEEE] bg-[#FFFFFF]"
    >
      <ul className="flex gap-1 overflow-x-auto px-4 md:px-6">
        {items.map((it) => (
          <li key={it.label}>
            <Link
              href={it.href}
              aria-current={it.activo ? 'page' : undefined}
              style={jost}
              className={`inline-flex min-h-[44px] items-center whitespace-nowrap border-b-2 border-solid px-3 text-[11px] tracking-[0.12em] ${
                it.activo
                  ? 'border-[#CC4B37] text-[#111111]'
                  : 'border-transparent text-[#666666]'
              }`}
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
