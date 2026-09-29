'use client'

import { useState, type CSSProperties } from 'react'
import { NIVELES_RANKING, factoresTamano } from '@/lib/ranking'
import { TEXTOS_PUNTOS } from '@/lib/ranking-contenido'
import { IconoPersona } from './RankingIconos'

const MAX_PUNTOS = Math.max(...NIVELES_RANKING.map((n) => n.puntos))
const OPACIDAD = [0.5, 0.65, 0.8, 1] as const

function estiloBarra(puntos: number, i: number): CSSProperties {
  const r = puntos / MAX_PUNTOS
  return {
    ['--hm' as string]: `${Math.max(4, Math.round(r * 36))}px`,
    ['--hd' as string]: `${Math.max(8, Math.round(r * 148))}px`,
    opacity: OPACIDAD[i] ?? 1,
  }
}

function iconosDe(porcentaje: number) {
  return Math.max(1, Math.round(porcentaje / 25) - 1)
}

export function EscaleraTamano() {
  const inicial = NIVELES_RANKING[0]
  const [nivelActivo, setNivelActivo] = useState<(typeof NIVELES_RANKING)[number]['nivel']>(
    inicial.nivel,
  )
  const activo = NIVELES_RANKING.find((n) => n.nivel === nivelActivo) ?? inicial
  const bandas = factoresTamano(activo.nivel)

  return (
    <div className="space-y-2 sm:space-y-10">
      <div>
        <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#111111] sm:mb-6 sm:text-xs sm:tracking-[0.2em]">
          {TEXTOS_PUNTOS.tipoTitulo}
        </h3>
        <div className="grid grid-cols-2 items-end gap-1.5 sm:grid-cols-4 sm:gap-3">
          {NIVELES_RANKING.map((n, i) => {
            const on = n.nivel === activo.nivel
            return (
              <button
                key={n.nivel}
                type="button"
                aria-pressed={on}
                onClick={() => setNivelActivo(n.nivel)}
                className={`flex w-full cursor-pointer flex-col items-center border-2 px-1.5 pb-1.5 pt-1.5 text-center transition-colors sm:px-3 sm:pb-4 sm:pt-5 ${
                  on
                    ? 'border-[#CC4B37] bg-[#FFF4F2]'
                    : 'border-[#E5E5E5] bg-white hover:border-[#CC4B37]'
                }`}
              >
                <p
                  className={`font-display text-lg font-black tabular-nums leading-none sm:text-2xl ${
                    on ? 'text-[#CC4B37]' : 'text-[#111111]'
                  }`}
                >
                  {n.puntos}
                </p>
                <div
                  className="mt-1 h-[var(--hm)] w-full bg-[#CC4B37] sm:mt-3 sm:h-[var(--hd)]"
                  style={estiloBarra(n.puntos, i)}
                />
                <p className="mt-1 line-clamp-2 w-full text-[11px] font-bold leading-tight text-[#111111] sm:mt-4 sm:text-sm sm:leading-snug">
                  {n.nombre}
                </p>
                <p className="mt-0.5 line-clamp-4 w-full text-[10px] leading-snug text-[#666666] sm:mt-2 sm:line-clamp-none sm:min-h-[3.65rem] sm:text-xs sm:leading-relaxed">
                  {n.descripcion}
                </p>
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-[11px] leading-snug text-[#555555] sm:mt-4 sm:text-sm">
          {TEXTOS_PUNTOS.tipoNota}
        </p>
      </div>

      <div>
        <h3 className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#111111] sm:mb-6 sm:text-xs sm:tracking-[0.2em]">
          {TEXTOS_PUNTOS.tamanoTitulo}
        </h3>
        <ul
          className={`grid grid-cols-6 items-stretch gap-1.5 sm:gap-3 ${
            bandas.length > 4 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'
          }`}
        >
          {bandas.map((f, i) => {
            const puntos = Math.round((activo.puntos * f.porcentaje) / 100)
            const span =
              bandas.length > 4 ? (i < 3 ? 'col-span-2' : 'col-span-3') : 'col-span-3'
            return (
              <li
                key={f.min}
                className={`flex min-w-0 flex-col border border-[#E5E5E5] bg-white px-1.5 py-1 sm:col-span-1 sm:px-4 sm:py-4 ${span}`}
              >
                <div className="flex flex-nowrap text-[#CC4B37]">
                  {Array.from({ length: iconosDe(f.porcentaje) }, (_, j) => (
                    <IconoPersona key={j} className="h-2.5 w-2.5 shrink-0 sm:h-4 sm:w-4" />
                  ))}
                </div>
                <p className="mt-1 text-[11px] font-bold leading-tight text-[#111111] sm:mt-3 sm:text-sm">
                  {f.etiqueta}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-[#666666] sm:mt-1 sm:text-xs">
                  {f.rango} jugadores
                </p>
                <p className="mt-auto pt-1 font-display text-lg font-black tabular-nums leading-none text-[#111111] sm:pt-2 sm:text-2xl">
                  {f.porcentaje}%
                </p>
                <p className="mt-0.5 text-[9px] font-bold tabular-nums leading-none text-[#888888] sm:text-[11px]">
                  {puntos} pts
                </p>
                <div className="mt-1 h-1 w-full bg-[#EEEEEE] sm:mt-3 sm:h-1.5" aria-hidden>
                  <div
                    className="h-full bg-[#CC4B37]"
                    style={{ width: `${Math.min(100, (f.porcentaje / 150) * 100)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-1 text-[11px] leading-tight text-[#555555] sm:mt-4 sm:text-sm sm:leading-relaxed">
          {TEXTOS_PUNTOS.tamanoNota}
        </p>
        <p className="mt-1 border border-[#E5E5E5] border-l-[3px] border-l-[#CC4B37] bg-white px-2.5 py-1.5 text-[11px] leading-tight text-[#111111] sm:mt-4 sm:px-4 sm:py-3 sm:text-sm sm:leading-relaxed">
          {TEXTOS_PUNTOS.ejemploCuenta}
        </p>
      </div>
    </div>
  )
}
