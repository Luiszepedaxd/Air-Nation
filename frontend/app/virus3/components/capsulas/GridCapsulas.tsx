'use client'

import type { CapsulaItem } from '../../lib/types'
import type { CapsulasProgress } from '../../lib/progreso-capsulas'
import { MiniaturaCapsula } from './MiniaturaCapsula'

export function GridCapsulas({
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
  return (
    <ul className="hidden grid-cols-4 gap-3 lg:grid xl:grid-cols-5 2xl:grid-cols-6">
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
    </ul>
  )
}
