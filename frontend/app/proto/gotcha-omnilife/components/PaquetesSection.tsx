'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Clock, Target, Crosshair } from 'lucide-react'
import { PAQUETES_POR_MODALIDAD } from '../constants'
import { jost, jostHeading, lato } from '../theme'
import type { ModalidadId, PaqueteId, PaqueteInfo } from '../types'
import { ScrollCarousel } from './ScrollCarousel'

const TABS: { id: ModalidadId; label: string; icon: typeof Target }[] = [
  { id: 'gotcha', label: 'Paquetes Gotcha', icon: Target },
  { id: 'airsoft', label: 'Paquetes Airsoft', icon: Crosshair },
]

function PaqueteCard({
  paquete,
  selected,
  onSelect,
}: {
  paquete: PaqueteInfo
  selected?: boolean
  onSelect: () => void
}) {
  const isPopular = paquete.popular

  return (
    <motion.article
      layout
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      className={[
        'relative flex h-full w-[min(100%,300px)] shrink-0 snap-center flex-col overflow-hidden md:w-auto',
        isPopular
          ? 'ring-2 ring-[#CC4B37] ring-offset-2 ring-offset-[#FFFFFF]'
          : '',
      ].join(' ')}
    >
      {isPopular && (
        <div
          className="absolute right-0 top-0 z-10 bg-[#CC4B37] px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-white"
          style={jost}
        >
          {paquete.destacado ?? 'Más popular'}
        </div>
      )}

      {/* Header */}
      <div
        className={[
          'px-5 pb-4 pt-5',
          isPopular ? 'bg-[#111111] text-white' : 'border-b border-[#EEEEEE] bg-[#F4F4F4]',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span
              className={[
                'text-[10px] font-extrabold uppercase tracking-[0.14em]',
                isPopular ? 'text-[#CC4B37]' : 'text-[#999999]',
              ].join(' ')}
              style={jost}
            >
              {paquete.badge}
            </span>
            <p
              className="mt-1 text-2xl font-extrabold uppercase leading-none"
              style={jost}
            >
              {paquete.label}
            </p>
          </div>
          <span
            className={[
              'flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase',
              isPopular
                ? 'bg-white/10 text-white'
                : 'border border-[#DDDDDD] bg-white text-[#666666]',
            ].join(' ')}
            style={jost}
          >
            <Clock size={11} />
            {paquete.duracion}
          </span>
        </div>
      </div>

      {/* Precio */}
      <div className="border-x border-[#EEEEEE] bg-[#FFFFFF] px-5 py-4">
        <div className="flex items-end gap-1">
          <span className="text-[11px] font-bold uppercase text-[#999999]" style={jost}>
            Desde
          </span>
        </div>
        <p className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold leading-none text-[#111111]" style={jost}>
            ${paquete.precio}
          </span>
          <span className="text-sm text-[#666666]" style={lato}>
            MXN /persona
          </span>
        </p>
      </div>

      {/* Includes */}
      <div className="flex flex-1 flex-col border border-[#EEEEEE] border-t-0 bg-[#FFFFFF] px-5 pb-5 pt-4">
        <ul className="mb-4 flex-1 space-y-2.5">
          {paquete.includes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-[#111111]"
              style={lato}
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center bg-[#FFF3F1]">
                <Check size={11} className="text-[#CC4B37]" strokeWidth={3} />
              </span>
              {item}
            </li>
          ))}
        </ul>

        <p className="mb-4 text-[11px] leading-relaxed text-[#999999]" style={lato}>
          {paquete.nota}
        </p>

        <button
          type="button"
          onClick={onSelect}
          className={[
            'w-full py-3.5 text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all',
            selected
              ? 'bg-[#CC4B37] text-white'
              : isPopular
                ? 'bg-[#111111] text-white hover:opacity-90'
                : 'border-2 border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white',
          ].join(' ')}
          style={jost}
        >
          {selected ? 'Seleccionado ✓' : 'Seleccionar'}
        </button>
      </div>
    </motion.article>
  )
}

interface PaquetesSectionProps {
  selectedModalidad?: ModalidadId
  selectedPaquete?: PaqueteId | null
  onSelect: (modalidad: ModalidadId, paqueteId: PaqueteId) => void
}

export function PaquetesSection({
  selectedModalidad,
  selectedPaquete,
  onSelect,
}: PaquetesSectionProps) {
  const [tab, setTab] = useState<ModalidadId>(selectedModalidad ?? 'gotcha')
  const paquetes = PAQUETES_POR_MODALIDAD[tab]

  return (
    <section id="paquetes">
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-2 text-[11px] tracking-[0.14em] text-[#111111]"
        style={jostHeading}
      >
        Paquetes
      </motion.h2>
      <p className="mb-5 text-sm text-[#666666]" style={lato}>
        Elige modalidad y experiencia. Precios por persona, equipamiento incluido.
      </p>

      {/* Tabs — estilo CampoPublicTabs */}
      <div className="mb-6 border-b border-[#EEEEEE]">
        <nav className="flex gap-6" aria-label="Modalidad de paquetes">
          {TABS.map(({ id, label, icon: Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={[
                  'flex shrink-0 items-center gap-2 border-b-2 py-3 text-[0.7rem] uppercase tracking-[0.14em] transition-colors',
                  active
                    ? 'border-[#CC4B37] font-bold text-[#111111]'
                    : 'border-transparent font-normal text-[#666666] hover:text-[#111111]',
                ].join(' ')}
                style={jost}
              >
                <Icon size={14} className={active ? 'text-[#CC4B37]' : 'text-[#999999]'} />
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === 'gotcha' ? -16 : 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: tab === 'gotcha' ? 16 : -16 }}
          transition={{ duration: 0.25 }}
        >
          {/* Mobile carrusel */}
          <div className="md:hidden">
            <ScrollCarousel showArrows>
              {paquetes.map((p) => (
                <PaqueteCard
                  key={p.id}
                  paquete={p}
                  selected={selectedModalidad === tab && selectedPaquete === p.id}
                  onSelect={() => onSelect(tab, p.id)}
                />
              ))}
            </ScrollCarousel>
          </div>

          {/* Desktop grid */}
          <div className="hidden gap-5 md:grid md:grid-cols-3">
            {paquetes.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <PaqueteCard
                  paquete={p}
                  selected={selectedModalidad === tab && selectedPaquete === p.id}
                  onSelect={() => onSelect(tab, p.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

export { PaqueteCard }
