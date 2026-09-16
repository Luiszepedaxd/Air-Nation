'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/ranking-contenido'
import { TEXTOS_FAQ } from '@/lib/ranking-contenido'

const jostSub = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const FAQ_VISIBLE_MOBILE = 5

function ListaFaq({
  items,
  expanded,
  onToggle,
}: {
  items: FaqItem[]
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div>
      <div className="space-y-2">
        {items.map((faq, i) => (
          <details
            key={`${faq.pregunta.slice(0, 32)}-${i}`}
            className={`group border border-solid border-[#EEEEEE] bg-white transition-colors open:border-l-[3px] open:border-l-[#CC4B37] ${
              i >= FAQ_VISIBLE_MOBILE && !expanded ? 'max-lg:hidden' : ''
            }`}
          >
            <summary
              className="cursor-pointer list-none px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#111111] marker:hidden [&::-webkit-details-marker]:hidden"
              style={jostSub}
            >
              <span className="flex items-start justify-between gap-2">
                {faq.pregunta}
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[#CC4B37] transition-transform duration-200 group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </span>
            </summary>
            <div
              className="border-t border-solid border-[#EEEEEE] px-4 py-3 text-[14px] leading-relaxed text-[#333333]"
              style={{ fontFamily: "'Lato', sans-serif" }}
            >
              <p>{faq.respuesta}</p>
            </div>
          </details>
        ))}
      </div>
      {items.length > FAQ_VISIBLE_MOBILE ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-4 w-full border border-[#111111] py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#111111] lg:hidden"
          style={jostSub}
        >
          {expanded ? TEXTOS_FAQ.verMenos : TEXTOS_FAQ.verTodas(items.length)}
        </button>
      ) : null}
    </div>
  )
}

export function FaqRanking({
  jugadores,
  organizadores,
}: {
  jugadores: FaqItem[]
  organizadores: FaqItem[]
}) {
  const [tab, setTab] = useState<'jugadores' | 'organizadores'>('jugadores')
  const [expandedJugadores, setExpandedJugadores] = useState(false)
  const [expandedOrganizadores, setExpandedOrganizadores] = useState(false)

  const tabBtn =
    'flex-1 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors'

  return (
    <div>
      <div className="mb-6 flex border border-[#E5E5E5] bg-white p-1 lg:hidden">
        <button
          type="button"
          className={`${tabBtn} ${
            tab === 'jugadores' ? 'bg-[#111111] text-white' : 'text-[#666666]'
          }`}
          style={jostSub}
          onClick={() => setTab('jugadores')}
        >
          {TEXTOS_FAQ.tabJugadores}
        </button>
        <button
          type="button"
          className={`${tabBtn} ${
            tab === 'organizadores' ? 'bg-[#111111] text-white' : 'text-[#666666]'
          }`}
          style={jostSub}
          onClick={() => setTab('organizadores')}
        >
          {TEXTOS_FAQ.tabOrganizadores}
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className={tab === 'jugadores' ? 'block' : 'hidden lg:block'}>
          <p className="mb-4 hidden font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37] lg:block">
            {TEXTOS_FAQ.tabJugadores}
          </p>
          <ListaFaq
            items={jugadores}
            expanded={expandedJugadores}
            onToggle={() => setExpandedJugadores((v) => !v)}
          />
        </div>
        <div className={tab === 'organizadores' ? 'block' : 'hidden lg:block'}>
          <p className="mb-4 hidden font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37] lg:block">
            {TEXTOS_FAQ.tabOrganizadores}
          </p>
          <ListaFaq
            items={organizadores}
            expanded={expandedOrganizadores}
            onToggle={() => setExpandedOrganizadores((v) => !v)}
          />
        </div>
      </div>
    </div>
  )
}
