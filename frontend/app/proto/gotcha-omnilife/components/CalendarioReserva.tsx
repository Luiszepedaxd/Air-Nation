'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { DisponibilidadDia } from '../types'
import { jost, lato } from '../theme'

interface CalendarioReservaProps {
  fecha: Date | null
  onSelect: (date: Date) => void
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getDisponibilidad(date: Date): DisponibilidadDia | null {
  const dow = date.getDay()
  if (dow !== 0 && dow !== 6) return null
  const d = date.getDate()
  if (d % 7 === 0) return 'lleno'
  if (d % 5 === 0) return 'pocos'
  return 'disponible'
}

function dotColor(d: DisponibilidadDia) {
  if (d === 'disponible') return 'bg-[#111111]'
  if (d === 'pocos') return 'bg-[#CC4B37]'
  return 'bg-[#CCCCCC]'
}

export function CalendarioReserva({ fecha, onSelect }: CalendarioReservaProps) {
  const today = useMemo(() => new Date(), [])
  const [monthOffset, setMonthOffset] = useState(0)

  const months = useMemo(() => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const result: Date[] = []
    for (let i = 0; i < 2; i++) {
      result.push(new Date(start.getFullYear(), start.getMonth() + i, 1))
    }
    return result
  }, [today])

  const visibleMonth = months[monthOffset] ?? months[0]

  function renderMonth(monthDate: Date) {
    const year = monthDate.getFullYear()
    const month = monthDate.getMonth()
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []

    for (let i = 0; i < firstDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d))
    }

    return (
      <div className="w-full min-w-0">
        <div className="grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-extrabold uppercase tracking-wider text-[#999999]"
              style={jost}
            >
              {d}
            </div>
          ))}
          {cells.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />
            }

            const disp = getDisponibilidad(date)
            const isWeekday = disp === null
            const isPast =
              date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const isSelected = fecha ? isSameDay(date, fecha) : false
            const isFull = disp === 'lleno'
            const disabled = isWeekday || isPast || isFull

            return (
              <motion.button
                key={date.toISOString()}
                type="button"
                disabled={disabled}
                whileTap={disabled ? undefined : { scale: 0.92 }}
                onClick={() => !disabled && onSelect(date)}
                className={[
                  'relative flex aspect-square flex-col items-center justify-center text-sm transition-colors',
                  disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-[#F4F4F4]',
                  isSelected ? 'bg-[#CC4B37] text-white' : 'text-[#111111]',
                ].join(' ')}
                style={lato}
              >
                <span className={isSelected ? 'font-bold' : ''}>{date.getDate()}</span>
                {disp && !isPast && (
                  <span
                    className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${
                      isSelected ? 'bg-white' : dotColor(disp)
                    }`}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span
          className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#666666]"
          style={jost}
        >
          Selecciona fecha
        </span>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#999999]" style={lato}>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#111111]" /> Disp.
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#CC4B37]" /> Pocos
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#CCCCCC]" /> Lleno
          </span>
        </div>
      </div>

      <div className="overflow-hidden border border-[#EEEEEE] bg-[#FFFFFF] p-3 sm:p-4">
        {/* Mobile: un mes con flechas */}
        <div className="md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              disabled={monthOffset === 0}
              onClick={() => setMonthOffset(0)}
              className="p-1 disabled:opacity-30"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <h4 className="text-sm font-extrabold text-[#111111]" style={jost}>
              {MESES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
            </h4>
            <button
              type="button"
              disabled={monthOffset >= months.length - 1}
              onClick={() => setMonthOffset(1)}
              className="p-1 disabled:opacity-30"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={monthOffset}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderMonth(visibleMonth)}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop: dos meses */}
        <div className="hidden gap-6 md:grid md:grid-cols-2">
          {months.map((m) => (
            <div key={m.toISOString()}>
              <h4 className="mb-3 text-center text-sm font-extrabold text-[#111111]" style={jost}>
                {MESES[m.getMonth()]} {m.getFullYear()}
              </h4>
              {renderMonth(m)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
