'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Ban, Check, Clock, FileText, Shield, Users, X } from 'lucide-react'
import { REGLAS, EQUIPO_INCLUIDO, EQUIPO_NO_INCLUIDO } from '../constants'
import { jost, jostHeading, lato } from '../theme'

function reglaIcon(name: string) {
  const cls = 'shrink-0 text-[#CC4B37]'
  const size = 14
  switch (name) {
    case 'shield': return <Shield size={size} className={cls} />
    case 'alert': return <AlertTriangle size={size} className={cls} />
    case 'users': return <Users size={size} className={cls} />
    case 'clock': return <Clock size={size} className={cls} />
    case 'ban': return <Ban size={size} className={cls} />
    default: return <FileText size={size} className={cls} />
  }
}

function Chip({
  children,
  variant,
}: {
  children: React.ReactNode
  variant: 'in' | 'out'
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-1 text-[11px]',
        variant === 'in'
          ? 'bg-[#FFF3F1] text-[#111111]'
          : 'bg-[#F4F4F4] text-[#666666] line-through decoration-[#CC4B37]/40',
      ].join(' ')}
      style={lato}
    >
      {variant === 'in' ? (
        <Check size={10} className="shrink-0 text-[#CC4B37]" strokeWidth={3} />
      ) : (
        <X size={10} className="shrink-0 text-[#CC4B37]" />
      )}
      {children}
    </span>
  )
}

export function ReglasSection() {
  const [tab, setTab] = useState<'reglas' | 'equipo'>('reglas')

  return (
    <section className="mb-12">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-4 text-[11px] tracking-[0.14em] text-[#111111]"
        style={jostHeading}
      >
        Reglas y seguridad
      </motion.h2>

      {/* Mobile: tabs compactos */}
      <div className="mb-4 border-b border-[#EEEEEE] md:hidden">
        <nav className="flex gap-4">
          {(
            [
              ['reglas', 'Reglas'],
              ['equipo', 'Equipo'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={[
                'border-b-2 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em]',
                tab === id
                  ? 'border-[#CC4B37] text-[#111111]'
                  : 'border-transparent text-[#999999]',
              ].join(' ')}
              style={jost}
            >
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile content */}
      <div className="md:hidden">
        <AnimatePresence mode="wait">
          {tab === 'reglas' ? (
            <motion.div
              key="reglas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="border border-[#EEEEEE] bg-[#F4F4F4] p-3"
            >
              <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {REGLAS.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs leading-snug text-[#111111]"
                    style={lato}
                  >
                    <span
                      className="mt-px flex h-4 w-4 shrink-0 items-center justify-center bg-[#CC4B37] text-[9px] font-extrabold text-white"
                      style={jost}
                    >
                      {i + 1}
                    </span>
                    <span>{r.text}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          ) : (
            <motion.div
              key="equipo"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 border border-[#EEEEEE] bg-[#FFFFFF] p-3"
            >
              <div>
                <p
                  className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  Incluido
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPO_INCLUIDO.map((item) => (
                    <Chip key={item} variant="in">
                      {item}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <p
                  className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                  style={jost}
                >
                  No incluido
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {EQUIPO_NO_INCLUIDO.map((item) => (
                    <Chip key={item} variant="out">
                      {item}
                    </Chip>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-[#CC4B37]" style={lato}>
                Equipo propio sujeto a revisión del staff.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop: 2 columnas compactas */}
      <div className="hidden gap-5 md:grid md:grid-cols-2">
        <div className="border border-[#EEEEEE] bg-[#F4F4F4] p-4">
          <ol className="space-y-2.5">
            {REGLAS.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#111111]" style={lato}>
                <span className="font-extrabold text-[#CC4B37]" style={jost}>
                  {i + 1}.
                </span>
                {reglaIcon(r.icon)}
                <span>{r.text}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="space-y-4 border border-[#EEEEEE] bg-[#FFFFFF] p-4">
          <div>
            <h3
              className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#111111]"
              style={jost}
            >
              Incluido
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPO_INCLUIDO.map((item) => (
                <Chip key={item} variant="in">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
          <div>
            <h3
              className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#111111]"
              style={jost}
            >
              No incluido
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPO_NO_INCLUIDO.map((item) => (
                <Chip key={item} variant="out">
                  {item}
                </Chip>
              ))}
            </div>
          </div>
          <p className="text-xs text-[#CC4B37]" style={lato}>
            Equipo propio sujeto a revisión del staff.
          </p>
        </div>
      </div>
    </section>
  )
}
