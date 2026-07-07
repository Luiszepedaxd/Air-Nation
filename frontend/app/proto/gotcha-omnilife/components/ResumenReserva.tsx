'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CAMPO, findPaquete, calcularTotal } from '../constants'
import { jost, lato } from '../theme'
import type { ReservaState } from '../types'
import { PhotoPlaceholder } from './PhotoPlaceholder'

interface ResumenReservaProps {
  state: ReservaState
  variant?: 'mobile' | 'sidebar'
}

function formatFecha(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('es-MX', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function ResumenReserva({ state, variant = 'sidebar' }: ResumenReservaProps) {
  const [expanded, setExpanded] = useState(false)
  const paqueteInfo = state.paquete
    ? findPaquete(state.modalidad, state.paquete)
    : undefined
  const subtotal = calcularTotal(state.modalidad, state.paquete, state.jugadores)

  const content = (
    <>
      {variant === 'sidebar' && (
        <PhotoPlaceholder label="Portada" className="mb-4 h-20 w-full" compact />
      )}
      <h4 className="text-sm font-extrabold uppercase text-[#111111]" style={jost}>
        {CAMPO.nombre}
      </h4>
      {variant === 'sidebar' && (
        <p className="mb-3 text-xs text-[#666666]" style={lato}>
          {CAMPO.ubicacion}
        </p>
      )}

      <dl className="space-y-1.5 text-sm" style={lato}>
        <div className="flex justify-between gap-2">
          <dt className="text-[#666666]">Fecha</dt>
          <dd className="text-right capitalize text-[#111111]">{formatFecha(state.fecha)}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#666666]">Horario</dt>
          <dd className="text-[#111111]">{state.horario || '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#666666]">Modalidad</dt>
          <dd className="capitalize text-[#111111]">
            {state.modalidad === 'gotcha' ? 'Gotcha' : 'Airsoft'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#666666]">Paquete</dt>
          <dd className="text-right text-[#111111]">
            {paqueteInfo?.label ?? '—'}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-[#666666]">Jugadores</dt>
          <dd className="text-[#111111]">{state.jugadores}</dd>
        </div>
      </dl>

      <div className="my-3 h-px bg-[#EEEEEE]" />

      <div className="flex items-center justify-between" style={lato}>
        <span className="text-sm text-[#666666]">Total</span>
        <span className="text-lg font-extrabold text-[#111111]" style={jost}>
          ${subtotal.toLocaleString('es-MX')} MXN
        </span>
      </div>
    </>
  )

  if (variant === 'mobile') {
    return (
      <div className="overflow-hidden border border-[#EEEEEE] bg-[#FFFFFF] shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3"
        >
          <div className="min-w-0 text-left">
            <span
              className="block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#999999]"
              style={jost}
            >
              Resumen
            </span>
            <span className="text-base font-extrabold text-[#111111]" style={jost}>
              ${subtotal.toLocaleString('es-MX')} MXN
            </span>
          </div>
          {expanded ? (
            <ChevronUp size={18} className="shrink-0 text-[#666666]" />
          ) : (
            <ChevronDown size={18} className="shrink-0 text-[#666666]" />
          )}
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[#EEEEEE] px-4 pb-4 pt-3">{content}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4 shadow-sm md:p-5">
      <h3
        className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#111111]"
        style={jost}
      >
        Resumen de reserva
      </h3>
      {content}
      <p className="mt-3 text-[10px] text-[#999999]" style={lato}>
        Precio final en MXN incluye IVA
      </p>
    </div>
  )
}
