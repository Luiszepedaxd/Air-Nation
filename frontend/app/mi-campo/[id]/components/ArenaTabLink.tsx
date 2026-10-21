'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { arenaGet, type ArenaOwnerField } from '@/lib/arena-api'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

/**
 * Pestaña ARENA de /mi-campo/[id]. No es una pestaña de contenido: lleva al
 * panel. Solo aparece si ARENA está activo en este campo.
 */
export function ArenaTabLink({ fieldId }: { fieldId: string }) {
  const [campo, setCampo] = useState<ArenaOwnerField | null>(null)

  useEffect(() => {
    let vivo = true
    arenaGet<{ fields: ArenaOwnerField[] }>('/owner/fields')
      .then((r) => {
        if (!vivo) return
        setCampo(r.fields.find((f) => f.id === fieldId) ?? null)
      })
      .catch(() => {
        /* sin ARENA la pestaña simplemente no se muestra */
      })
    return () => {
      vivo = false
    }
  }, [fieldId])

  if (!campo?.arena?.activo) return null

  return (
    <Link
      href={`/mi-campo/${fieldId}/arena`}
      style={jost}
      className={`${tabBase} inline-flex items-center gap-1.5 border-b-2 border-transparent px-4 pb-[14px] text-[#666666]`}
    >
      <span>ARENA</span>
      {campo.reservas_hoy > 0 ? (
        <span
          style={jost}
          className="inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#CC4B37] px-1 text-[10px] font-extrabold leading-none text-[#FFFFFF]"
          title="Reservas de hoy"
        >
          {campo.reservas_hoy > 99 ? '99+' : campo.reservas_hoy}
        </span>
      ) : null}
    </Link>
  )
}
