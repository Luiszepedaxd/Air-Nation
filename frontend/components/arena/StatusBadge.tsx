import type { ArenaBookingStatus } from '@/lib/arena-api'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const ESTILOS: Record<ArenaBookingStatus, { label: string; className: string }> = {
  pendiente_pago: { label: 'POR PAGAR', className: 'bg-[#FFF3CD] text-[#856404]' },
  confirmada: { label: 'CONFIRMADA', className: 'bg-[#1B5E20] text-[#FFFFFF]' },
  completada: { label: 'LLEGÓ', className: 'bg-[#111111] text-[#FFFFFF]' },
  cancelada: { label: 'CANCELADA', className: 'bg-[#EEEEEE] text-[#666666]' },
  no_show: { label: 'NO LLEGÓ', className: 'bg-[#CC4B37] text-[#FFFFFF]' },
  expirada: { label: 'VENCIDA', className: 'bg-[#EEEEEE] text-[#999999]' },
}

export function StatusBadge({ status }: { status: ArenaBookingStatus }) {
  const e = ESTILOS[status] ?? { label: String(status).toUpperCase(), className: 'bg-[#EEEEEE] text-[#666666]' }
  return (
    <span style={jost} className={`inline-block px-2 py-1 text-[9px] tracking-[0.08em] ${e.className}`}>
      {e.label}
    </span>
  )
}
