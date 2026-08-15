'use client'

import { useRouter } from 'next/navigation'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function PartidasTab() {
  const router = useRouter()

  return (
    <div className="mx-auto max-w-[640px] pb-10">
      <h1 style={jost} className="text-[22px] font-extrabold uppercase text-[#111111]">
        PARTIDAS
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-[#666666]" style={lato}>
        Crea torneos o únete como árbitro para registrar partidas en tiempo real.
      </p>

      <button
        type="button"
        onClick={() => router.push('/dashboard/partidas/torneo')}
        className="mt-6 flex w-full flex-col items-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-8 transition-all hover:border-[#CC4B37]/40 hover:shadow-sm active:scale-[0.99]"
      >
        <span className="text-[48px]" role="img" aria-label="Trofeo">
          🏆
        </span>
        <p style={jost} className="mt-4 text-[16px] font-extrabold uppercase text-[#111111]">
          TORNEO
        </p>
        <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
          Arbitraje en tiempo real · Crear o unirse
        </p>
      </button>
    </div>
  )
}
