'use client'

import { useEffect, useRef } from 'react'
import type { CapsulaItem } from '../../lib/types'
import type { CapsulasProgress } from '../../lib/progreso-capsulas'
import { MiniaturaCapsula } from './MiniaturaCapsula'

export function RielCapsulas({
  lista,
  progreso,
  destacadaId,
  onElegir,
  layoutIdPrefix,
}: {
  lista: CapsulaItem[]
  progreso: CapsulasProgress
  destacadaId: string
  onElegir: (id: string, rect: DOMRect) => void
  layoutIdPrefix: string
}) {
  const scrollRef = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const idx = lista.findIndex((c) => c.id === destacadaId)
    if (idx < 0) return
    const item = root.children[idx] as HTMLElement | undefined
    if (!item) return
    const target = item.offsetLeft - (root.clientWidth - item.clientWidth) / 2
    root.scrollLeft = Math.max(0, target)
  }, [destacadaId, lista])

  return (
    <ol
      ref={scrollRef}
      className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scroll-padding-inline:1rem] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
    >
      {lista.map((c) => (
        <MiniaturaCapsula
          key={c.id}
          capsula={c}
          progreso={progreso}
          destacada={c.id === destacadaId}
          layoutId={`${layoutIdPrefix}-${c.id}`}
          onElegir={(rect) => onElegir(c.id, rect)}
        />
      ))}
    </ol>
  )
}
