'use client'

import { useState } from 'react'
import { ArrowDown } from 'lucide-react'
import { NIVELES_RANKING, factoresTamano, type FactorTamanoRanking } from '@/lib/ranking'
import { TEXTOS_PUNTOS } from '@/lib/ranking-contenido'

const MAX_PUNTOS_ESCALERA = Math.max(...NIVELES_RANKING.map((n) => n.puntos))
const ALTURA_ESCALERA = 220
const OPACIDAD_ESCALERA = [0.5, 0.65, 0.8, 1] as const

const CARD_IDLE = 'border border-[#E5E5E5] bg-white hover:border-[#CC4B37]'
const CARD_ON =
  'border border-[#CC4B37] bg-[#FFF4F2] ring-2 ring-[#CC4B37] ring-offset-2 ring-offset-[#F4F4F4]'

function ChipOrden({ texto }: { texto: string }) {
  return (
    <p className="mb-4 flex items-center gap-1.5 text-xs font-bold text-[#CC4B37] md:hidden">
      <ArrowDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
      {texto}
    </p>
  )
}

function SubtituloBloque({ children }: { children: string }) {
  return (
    <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#111111]">
      {children}
    </h3>
  )
}

/** 150% llena la pista; el resto escala contra ese tope. */
const TOPE_BARRA_PORCENTAJE = 150

function anchoBarraTamano(porcentaje: number): string {
  const ancho = Math.min(100, (porcentaje / TOPE_BARRA_PORCENTAJE) * 100)
  return `${ancho}%`
}

function puntosEnJuego(puntosBase: number, porcentaje: number): number {
  return Math.round((puntosBase * porcentaje) / 100)
}

function BarraTamano({
  etiqueta,
  rango,
  porcentaje,
  puntos,
}: {
  etiqueta: string
  rango: string
  porcentaje: number
  puntos: number
}) {
  const ancho = anchoBarraTamano(porcentaje)

  return (
    <li className="border border-[#E5E5E5] bg-white px-4 py-4 sm:px-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 md:grid-cols-[12rem_minmax(0,1fr)_7.5rem] md:gap-x-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#111111]">{etiqueta}</p>
          <p className="mt-0.5 text-xs text-[#666666]">{rango} jugadores</p>
        </div>
        <div className="text-right md:col-start-3 md:row-start-1">
          <p className="font-display text-2xl font-black tabular-nums leading-none text-[#CC4B37]">
            {porcentaje}%
          </p>
          <p className="mt-1 text-xs font-bold tabular-nums text-[#111111]">{puntos} puntos</p>
        </div>
        <div
          className="col-span-2 h-2.5 bg-[#E9E9E9] md:col-span-1 md:col-start-2 md:row-start-1 md:h-7"
          aria-hidden
        >
          <div className="h-full bg-[#CC4B37]" style={{ width: ancho }} />
        </div>
      </div>
    </li>
  )
}

function DetalleTamano({
  nombre,
  puntos,
  bandas,
}: {
  nombre: string
  puntos: number
  bandas: readonly FactorTamanoRanking[]
}) {
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border border-[#E5E5E5] bg-white px-4 py-4 sm:px-5 sm:py-5">
        <p className="font-display text-2xl font-black uppercase leading-none text-[#111111]">
          {nombre}
        </p>
        <p className="text-sm text-[#555555]">{TEXTOS_PUNTOS.baseNormal(puntos)}</p>
      </div>
      <ul className="space-y-4">
        {bandas.map((f) => (
          <BarraTamano
            key={f.min}
            etiqueta={f.etiqueta}
            rango={f.rango}
            porcentaje={f.porcentaje}
            puntos={puntosEnJuego(puntos, f.porcentaje)}
          />
        ))}
      </ul>
    </div>
  )
}

export function EscaleraTamano() {
  const inicial = NIVELES_RANKING[0]
  const [nivelActivo, setNivelActivo] = useState<(typeof NIVELES_RANKING)[number]['nivel']>(
    inicial.nivel,
  )
  const activo = NIVELES_RANKING.find((n) => n.nivel === nivelActivo) ?? inicial

  return (
    <>
      <div>
        <SubtituloBloque>{TEXTOS_PUNTOS.tipoTitulo}</SubtituloBloque>
        <div className="hidden items-end gap-3 md:grid md:grid-cols-4">
          {NIVELES_RANKING.map((n, i) => {
            const seleccionado = n.nivel === activo.nivel
            return (
              <button
                key={n.nivel}
                type="button"
                aria-pressed={seleccionado}
                onClick={() => setNivelActivo(n.nivel)}
                className={`flex w-full cursor-pointer flex-col items-center px-3 pb-4 pt-6 text-center transition-colors ${
                  seleccionado ? CARD_ON : CARD_IDLE
                }`}
              >
                <p className="font-display text-2xl font-black tabular-nums text-[#111111]">
                  {n.puntos}
                </p>
                <div
                  className="mt-3 w-full bg-[#CC4B37]"
                  style={{
                    height: `${(n.puntos / MAX_PUNTOS_ESCALERA) * ALTURA_ESCALERA}px`,
                    opacity: OPACIDAD_ESCALERA[i] ?? 1,
                  }}
                />
                <p className="mt-4 text-center text-sm font-bold text-[#111111]">{n.nombre}</p>
                <p className="mt-2 text-center text-xs leading-relaxed text-[#666666]">
                  {n.descripcion}
                </p>
              </button>
            )
          })}
        </div>
        <div className="md:hidden">
          <ChipOrden texto={TEXTOS_PUNTOS.ordenMenosAMas} />
          <div className="flex flex-col gap-4">
            {NIVELES_RANKING.map((n, i) => {
              const seleccionado = n.nivel === activo.nivel
              return (
                <button
                  key={n.nivel}
                  type="button"
                  aria-pressed={seleccionado}
                  onClick={() => setNivelActivo(n.nivel)}
                  className={`w-full cursor-pointer p-4 text-left transition-colors ${
                    seleccionado ? CARD_ON : CARD_IDLE
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[#111111]">{n.nombre}</p>
                    <p className="font-display text-xl font-black text-[#111111]">{n.puntos}</p>
                  </div>
                  <div className="mt-3 h-2 w-full bg-[#EEEEEE]">
                    <div
                      className="h-full bg-[#CC4B37]"
                      style={{
                        width: `${(n.puntos / MAX_PUNTOS_ESCALERA) * 100}%`,
                        opacity: OPACIDAD_ESCALERA[i] ?? 1,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[#666666]">{n.descripcion}</p>
                </button>
              )
            })}
          </div>
        </div>
        <p className="mt-4 text-sm text-[#555555]">{TEXTOS_PUNTOS.tipoNota}</p>
      </div>

      <div>
        <SubtituloBloque>{TEXTOS_PUNTOS.tamanoTitulo}</SubtituloBloque>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-[#555555]">
          {TEXTOS_PUNTOS.tamanoNota}
        </p>
        <DetalleTamano
          nombre={activo.nombre}
          puntos={activo.puntos}
          bandas={factoresTamano(activo.nivel)}
        />
        <p className="mt-4 border border-[#E5E5E5] border-l-[3px] border-l-[#CC4B37] bg-white px-4 py-3 text-sm leading-relaxed text-[#111111]">
          {TEXTOS_PUNTOS.ejemploCuenta}
        </p>
      </div>
    </>
  )
}
