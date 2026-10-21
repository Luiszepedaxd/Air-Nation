'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ScrollableTabsNav } from '@/components/ScrollableTabsNav'
import { BlackoutsEditor } from '@/components/arena/BlackoutsEditor'
import { BookingsAgenda } from '@/components/arena/BookingsAgenda'
import { HorarioEditor } from '@/components/arena/HorarioEditor'
import { ItemsList } from '@/components/arena/ItemsList'
import { ManualBookingForm } from '@/components/arena/ManualBookingForm'
import { SaldosPanel } from '@/components/arena/SaldosPanel'
import { ArenaSettingsTab } from './ArenaSettingsTab'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const tabBase =
  'relative shrink-0 pt-[14px] text-[12px] font-extrabold uppercase transition-[color,border-color] duration-150'

type Tab = 'agenda' | 'catalogo' | 'horario' | 'saldos' | 'config'

const TABS: { id: Tab; label: string }[] = [
  { id: 'agenda', label: 'AGENDA' },
  { id: 'catalogo', label: 'CATÁLOGO' },
  { id: 'horario', label: 'HORARIO' },
  { id: 'saldos', label: 'SALDOS' },
  { id: 'config', label: 'CONFIGURACIÓN' },
]

export function MiCampoArenaClient({
  fieldId,
  nombre,
  slug,
  horariosJson,
}: {
  fieldId: string
  nombre: string
  slug: string
  horariosJson: unknown
}) {
  const [tab, setTab] = useState<Tab>('agenda')
  const [manual, setManual] = useState(false)
  const [recarga, setRecarga] = useState(0)

  const tabClass = (id: Tab) =>
    tab === id
      ? 'border-b-2 border-[#CC4B37] text-[#111111] pb-[14px] px-4'
      : 'border-b-2 border-transparent text-[#666666] pb-[14px] px-4'

  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pt-6 md:px-6">
      <Link
        href={`/mi-campo/${fieldId}`}
        style={jost}
        className="text-[11px] tracking-[0.12em] text-[#666666] underline"
      >
        ← {nombre}
      </Link>
      <h1 style={jost} className="mt-2 text-[22px] leading-tight text-[#111111] md:text-[26px]">
        ARENA
      </h1>
      <p className="mt-1 text-[13px] text-[#666666]" style={{ fontFamily: "'Lato', sans-serif" }}>
        Reservas en línea de {nombre} · /campos/{slug}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setManual((o) => !o)}
          style={jost}
          className="inline-flex min-h-[44px] items-center justify-center bg-[#CC4B37] px-4 text-[11px] tracking-[0.12em] text-[#FFFFFF]"
        >
          {manual ? 'CERRAR' : '+ RESERVA MANUAL'}
        </button>
        <Link
          href={`/mi-campo/${fieldId}/arena/escanear`}
          style={jost}
          className="inline-flex min-h-[44px] items-center justify-center bg-[#111111] px-4 text-[11px] tracking-[0.12em] text-[#FFFFFF]"
        >
          ESCANEAR QR
        </Link>
      </div>

      {manual ? (
        <div className="mt-4">
          <ManualBookingForm
            fieldId={fieldId}
            onCreada={() => setRecarga((n) => n + 1)}
          />
        </div>
      ) : null}

      <div className="sticky top-0 z-40 -mx-4 mt-5 border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] md:-mx-6">
        <ScrollableTabsNav>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={(e) => {
                e.currentTarget.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'nearest',
                  block: 'nearest',
                })
                setTab(t.id)
              }}
              style={jost}
              className={`${tabBase} ${tabClass(t.id)}`}
            >
              {t.label}
            </button>
          ))}
        </ScrollableTabsNav>
      </div>

      <div className="mt-6 pb-16">
        {tab === 'agenda' ? <BookingsAgenda key={recarga} fieldId={fieldId} /> : null}
        {tab === 'catalogo' ? <ItemsList fieldId={fieldId} /> : null}
        {tab === 'horario' ? (
          <div className="flex flex-col gap-8">
            <HorarioEditor fieldId={fieldId} horariosJson={horariosJson} />
            <BlackoutsEditor fieldId={fieldId} />
          </div>
        ) : null}
        {tab === 'saldos' ? <SaldosPanel fieldId={fieldId} /> : null}
        {tab === 'config' ? <ArenaSettingsTab fieldId={fieldId} /> : null}
      </div>
    </main>
  )
}
