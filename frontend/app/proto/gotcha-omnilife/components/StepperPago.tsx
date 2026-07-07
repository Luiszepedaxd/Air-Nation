'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Info, Minus, Plus } from 'lucide-react'
import { CalendarioReserva } from './CalendarioReserva'
import { TarjetaInput } from './TarjetaInput'
import { ResumenReserva } from './ResumenReserva'
import { ScrollCarousel } from './ScrollCarousel'
import {
  getPaquetes,
  findPaquete,
  HORARIOS,
  CLABE_MOCK,
  calcularTotal,
} from '../constants'
import { jost, lato } from '../theme'
import type { MetodoPago, ModalidadId, PaqueteId, ReservaState } from '../types'
import { PaqueteCard } from './PaquetesSection'

interface StepperPagoProps {
  state: ReservaState
  onChange: (patch: Partial<ReservaState>) => void
  onToast: (msg: string) => void
}

const STEPS = [
  { num: 1, label: 'FECHA' },
  { num: 2, label: 'DATOS' },
  { num: 3, label: 'PAGO' },
] as const

const inputClass =
  'w-full border border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#666666]/60 focus:border-[#CC4B37] focus:outline-none'

function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[#FFFFFF]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </span>
  )
}

function AnimatedCheck() {
  return (
    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#CC4B37]">
      <svg viewBox="0 0 52 52" className="h-12 w-12">
        <motion.circle
          cx="26"
          cy="26"
          r="24"
          fill="none"
          stroke="#CC4B37"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
        <motion.path
          d="M14 27l8 8 16-16"
          fill="none"
          stroke="#CC4B37"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
        />
      </svg>
    </div>
  )
}

export function StepperPago({ state, onChange, onToast }: StepperPagoProps) {
  const [tarjetaNum, setTarjetaNum] = useState('')
  const [tarjetaVenc, setTarjetaVenc] = useState('')
  const [tarjetaCvc, setTarjetaCvc] = useState('')
  const [tarjetaNombre, setTarjetaNombre] = useState('')

  const total = calcularTotal(state.modalidad, state.paquete, state.jugadores)
  const paquetesActuales = getPaquetes(state.modalidad)
  const pasoActivo = state.paso === 'confirmado' ? 4 : state.paso

  const paso1Valido =
    state.fecha !== null &&
    state.horario !== '' &&
    state.jugadores >= 2 &&
    state.paquete !== null

  const paso2Valido =
    state.nombre.trim() !== '' &&
    state.telefono.trim() !== '' &&
    state.email.trim() !== ''

  function handleConfirmar() {
    onChange({ cargando: true })
    setTimeout(() => {
      onChange({
        cargando: false,
        paso: 'confirmado',
        numeroReserva: 'GOT-2026-00142',
      })
    }, 1500)
  }

  function copyClabe() {
    navigator.clipboard.writeText(CLABE_MOCK)
    onToast('CLABE copiada al portapapeles')
  }

  if (state.paso === 'confirmado') {
    const paqueteInfo = state.paquete
      ? findPaquete(state.modalidad, state.paquete)
      : undefined
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border border-[#EEEEEE] bg-[#FFFFFF] p-8 text-center md:p-12"
      >
        <AnimatedCheck />
        <h3
          className="mb-6 text-4xl text-[#CC4B37] md:text-5xl"
          style={jost}
        >
          ¡RESERVA CONFIRMADA!
        </h3>

        <div className="mx-auto mb-8 max-w-md border border-[#EEEEEE] bg-[#FFFFFF] p-5 text-left">
          <dl className="space-y-2 text-sm" style={lato}>
            <div className="flex justify-between">
              <dt className="text-[#666666]">Número de reserva</dt>
              <dd className="font-semibold text-[#CC4B37]">{state.numeroReserva}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#666666]">Fecha</dt>
              <dd className="text-[#111111] capitalize">
                {state.fecha?.toLocaleDateString('es-MX', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#666666]">Horario</dt>
              <dd className="text-[#111111]">{state.horario}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#666666]">Modalidad</dt>
              <dd className="text-[#111111] capitalize">
                {state.modalidad === 'gotcha' ? 'Gotcha' : 'Airsoft'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#666666]">Paquete</dt>
              <dd className="text-[#111111]">{paqueteInfo?.label}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#666666]">Jugadores</dt>
              <dd className="text-[#111111]">{state.jugadores}</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-[#EEEEEE] pt-2 font-bold text-[#111111]">
              <dt>Total pagado</dt>
              <dd>${total.toLocaleString('es-MX')} MXN</dd>
            </div>
          </dl>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => onToast('Próximamente')}
            className="border border-[#EEEEEE] px-6 py-3 text-sm font-semibold text-[#111111] hover:border-[#CC4B37]"
            style={lato}
          >
            DESCARGAR CONFIRMACIÓN
          </button>
          <Link
            href="/dashboard/perfil"
            className="bg-[#CC4B37] px-6 py-3 text-sm font-bold text-white hover:bg-[#CC4B37]/90"
            style={lato}
          >
            VER EN MI PERFIL →
          </Link>
        </div>

        <p className="mt-6 text-xs text-[#666666]" style={lato}>
          Recibirás confirmación por email y WhatsApp 24h antes de tu partida.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
      {/* Resumen mobile — arriba, colapsable */}
      <div className="mb-4 lg:hidden">
        <ResumenReserva state={state} variant="mobile" />
      </div>

      {/* Formulario */}
      <div className="min-w-0">
        <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4 shadow-sm sm:p-6">
        {/* Stepper */}
        <div className="mb-6 flex items-center justify-between gap-2 overflow-x-auto pb-1">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-2">
                <motion.span
                  layout
                  className={[
                    'flex h-8 w-8 items-center justify-center text-xs font-bold',
                    pasoActivo >= step.num
                      ? 'bg-[#CC4B37] text-white'
                      : 'border border-[#EEEEEE] text-[#666666]',
                  ].join(' ')}
                  style={jost}
                >
                  {step.num}
                </motion.span>
                <span
                  className={[
                    'text-[10px] font-extrabold uppercase tracking-[0.12em]',
                    pasoActivo >= step.num ? 'text-[#CC4B37]' : 'text-[#999999]',
                  ].join(' ')}
                  style={jost}
                >
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span className="mx-1 text-[#DDDDDD]">—</span>
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {state.paso === 1 && (
            <motion.div
              key="paso1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <CalendarioReserva
                fecha={state.fecha}
                onSelect={(date) => onChange({ fecha: date })}
              />

              <div>
                <label
                  className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#666666]"
                  style={jost}
                >
                  Horario
                </label>
                <ScrollCarousel showArrows={false}>
                  {HORARIOS.map((h) => (
                    <button
                      key={h.value}
                      type="button"
                      disabled={!h.disponible}
                      onClick={() => onChange({ horario: h.value })}
                      className={[
                        'snap-start shrink-0 px-4 py-2.5 text-sm font-medium transition-all',
                        !h.disponible
                          ? 'cursor-not-allowed border border-[#EEEEEE] text-[#CCCCCC] line-through'
                          : state.horario === h.value
                            ? 'bg-[#CC4B37] text-white shadow-sm'
                            : 'border border-[#EEEEEE] bg-[#FFFFFF] text-[#111111] hover:border-[#CC4B37]',
                      ].join(' ')}
                      style={lato}
                    >
                      {h.label}
                      {!h.disponible && ' · lleno'}
                    </button>
                  ))}
                </ScrollCarousel>
              </div>

              <div>
                <label
                  className="mb-2 block text-xs font-medium uppercase tracking-widest text-[#666666]"
                  style={lato}
                >
                  Número de jugadores
                </label>
                <div className="inline-flex items-center border border-[#EEEEEE]">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ jugadores: Math.max(2, state.jugadores - 1) })
                    }
                    className="px-3 py-2 text-[#111111] hover:bg-[#F4F4F4]"
                    aria-label="Menos jugadores"
                  >
                    <Minus size={16} />
                  </button>
                  <span
                    className="min-w-[3rem] px-4 text-center font-semibold text-[#111111]"
                    style={lato}
                  >
                    {state.jugadores}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onChange({ jugadores: Math.min(80, state.jugadores + 1) })
                    }
                    className="px-3 py-2 text-[#111111] hover:bg-[#F4F4F4]"
                    aria-label="Más jugadores"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#666666]"
                  style={jost}
                >
                  Modalidad y paquete
                </label>
                <div className="mb-3 flex gap-2">
                  {(['gotcha', 'airsoft'] as ModalidadId[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        onChange({
                          modalidad: m,
                          paquete:
                            state.paquete && getPaquetes(m).some((p) => p.id === state.paquete)
                              ? state.paquete
                              : null,
                        })
                      }
                      className={[
                        'flex-1 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em]',
                        state.modalidad === m
                          ? 'bg-[#111111] text-white'
                          : 'border border-[#EEEEEE] text-[#666666]',
                      ].join(' ')}
                      style={jost}
                    >
                      {m === 'gotcha' ? 'Gotcha' : 'Airsoft'}
                    </button>
                  ))}
                </div>
                <ScrollCarousel showArrows className="md:hidden">
                  {paquetesActuales.map((p) => (
                    <PaqueteCard
                      key={p.id}
                      paquete={p}
                      selected={state.paquete === p.id}
                      onSelect={() => onChange({ paquete: p.id })}
                    />
                  ))}
                </ScrollCarousel>
                <div className="hidden gap-4 md:grid md:grid-cols-3">
                  {paquetesActuales.map((p) => (
                    <PaqueteCard
                      key={p.id}
                      paquete={p}
                      selected={state.paquete === p.id}
                      onSelect={() => onChange({ paquete: p.id })}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={!paso1Valido}
                onClick={() => onChange({ paso: 2 })}
                className="w-full bg-[#CC4B37] py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-10"
                style={lato}
              >
                SIGUIENTE →
              </button>
            </motion.div>
          )}

          {state.paso === 2 && (
            <motion.div
              key="paso2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
                  Nombre o alias
                </label>
                <input
                  type="text"
                  placeholder="Tu alias en AirNation"
                  value={state.nombre}
                  onChange={(e) => onChange({ nombre: e.target.value })}
                  className={inputClass}
                  style={{ ...lato, borderRadius: '4px' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
                  Teléfono de contacto
                </label>
                <input
                  type="tel"
                  placeholder="+52 33 ..."
                  value={state.telefono}
                  onChange={(e) => onChange({ telefono: e.target.value })}
                  className={inputClass}
                  style={{ ...lato, borderRadius: '4px' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={state.email}
                  onChange={(e) => onChange({ email: e.target.value })}
                  className={inputClass}
                  style={{ ...lato, borderRadius: '4px' }}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-[#111111]" style={lato}>
                <input
                  type="checkbox"
                  checked={state.cuentaAirNation}
                  onChange={(e) => onChange({ cuentaAirNation: e.target.checked })}
                  className="accent-[#CC4B37]"
                />
                ¿Tienes cuenta AirNation?
              </label>

              {state.cuentaAirNation && (
                <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
                  <p className="mb-2 text-xs text-[#666666]" style={lato}>
                    Inicia sesión para auto-completar
                  </p>
                  <button
                    type="button"
                    onClick={() => onToast('Inicio de sesión simulado')}
                    className="border border-[#CC4B37] px-4 py-2 text-xs font-semibold text-[#CC4B37]"
                    style={lato}
                  >
                    INICIAR SESIÓN
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
                  Notas especiales para el campo (opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Cumpleaños, equipo corporativo, necesidades especiales..."
                  value={state.notas}
                  onChange={(e) => onChange({ notas: e.target.value })}
                  className={inputClass}
                  style={{ ...lato, borderRadius: '4px' }}
                />
              </div>

              <div className="flex items-start gap-2 border border-[#EEEEEE] bg-[#FFFFFF] p-3 text-xs text-[#666666]">
                <Info size={14} className="mt-0.5 shrink-0 text-[#CC4B37]" />
                <span style={lato}>
                  Cancelación gratuita hasta 7 días antes
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ paso: 1 })}
                  className="border border-[#EEEEEE] px-6 py-3 text-sm text-[#111111]"
                  style={lato}
                >
                  ← ATRÁS
                </button>
                <button
                  type="button"
                  disabled={!paso2Valido}
                  onClick={() => onChange({ paso: 3 })}
                  className="flex-1 bg-[#CC4B37] py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-10"
                  style={lato}
                >
                  SIGUIENTE →
                </button>
              </div>
            </motion.div>
          )}

          {state.paso === 3 && (
            <motion.div
              key="paso3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div>
                <h4
                  className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#666666]"
                  style={lato}
                >
                  Método de pago
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'tarjeta', label: 'Tarjeta' },
                      { id: 'transferencia', label: 'Transferencia' },
                      { id: 'efectivo', label: 'Efectivo en campo' },
                    ] as { id: MetodoPago; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onChange({ metodoPago: tab.id })}
                      className={[
                        'px-4 py-2 text-sm font-medium',
                        state.metodoPago === tab.id
                          ? 'border border-[#CC4B37] bg-[#CC4B37]/10 text-[#CC4B37]'
                          : 'border border-[#EEEEEE] text-[#111111]',
                      ].join(' ')}
                      style={{ ...lato, borderRadius: '4px' }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {state.metodoPago === 'tarjeta' && (
                <TarjetaInput
                  numero={tarjetaNum}
                  vencimiento={tarjetaVenc}
                  cvc={tarjetaCvc}
                  nombre={tarjetaNombre}
                  onNumeroChange={setTarjetaNum}
                  onVencimientoChange={setTarjetaVenc}
                  onCvcChange={setTarjetaCvc}
                  onNombreChange={setTarjetaNombre}
                />
              )}

              {state.metodoPago === 'transferencia' && (
                <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-5 space-y-3 text-sm" style={lato}>
                  <p className="text-[#111111]">Realiza tu transferencia a:</p>
                  <dl className="space-y-2 text-[#666666]">
                    <div><dt className="inline font-medium text-[#111111]">Banco: </dt>BBVA México</div>
                    <div className="flex items-center gap-2">
                      <dt className="font-medium text-[#111111]">CLABE: </dt>
                      <dd className="font-mono text-[#111111]">{CLABE_MOCK}</dd>
                      <button
                        type="button"
                        onClick={copyClabe}
                        className="flex items-center gap-1 text-[#CC4B37] hover:underline"
                      >
                        <Copy size={14} /> Copiar CLABE
                      </button>
                    </div>
                    <div>
                      <dt className="inline font-medium text-[#111111]">Referencia: </dt>
                      Tu número de reserva (se generará al confirmar)
                    </div>
                  </dl>
                </div>
              )}

              {state.metodoPago === 'efectivo' && (
                <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-5 text-sm text-[#666666]" style={lato}>
                  Paga al llegar al campo. Tu reserva queda como{' '}
                  <span className="font-semibold text-[#CC4B37]">PENDIENTE</span>{' '}
                  hasta confirmar con el staff.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => onChange({ paso: 2 })}
                  className="border border-[#EEEEEE] px-6 py-3 text-sm text-[#111111]"
                  style={lato}
                >
                  ← ATRÁS
                </button>
                <button
                  type="button"
                  disabled={state.cargando}
                  onClick={handleConfirmar}
                  className="flex flex-1 items-center justify-center gap-2 bg-[#CC4B37] py-4 text-sm font-bold text-white disabled:opacity-70"
                  style={lato}
                >
                  {state.cargando ? (
                    <>
                      Procesando <LoadingDots />
                    </>
                  ) : (
                    `CONFIRMAR RESERVA — $${total.toLocaleString('es-MX')} MXN`
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Sidebar desktop — sticky separado del formulario */}
      <aside className="hidden lg:block">
        <div className="sticky top-20">
          <ResumenReserva state={state} variant="sidebar" />
        </div>
      </aside>
    </div>
  )
}
