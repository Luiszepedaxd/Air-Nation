'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCart } from '@/app/store/CartContext'
import { AddressAutocomplete } from '@/components/AddressAutocomplete'
import type { DireccionCompleta } from '@/components/AddressAutocomplete'
import { createOrder } from './actions'
import type { DireccionEnvio } from './actions'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Props = {
  user: { id: string; email: string; nombre: string } | null
  datosBancarios: { banco: string; clabe: string; titular: string; concepto: string }
}

type Step = 'datos' | 'pago' | 'confirmacion'

export function CheckoutClient({ user, datosBancarios }: Props) {
  const router = useRouter()
  const { items, total, clearCart } = useCart()
  const [step, setStep] = useState<Step>('datos')
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'tarjeta'>('transferencia')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [orderResult, setOrderResult] = useState<{ order_id: string; order_number: string } | null>(
    null
  )

  const [form, setForm] = useState<DireccionEnvio>({
    nombre: user?.nombre ?? '',
    email: user?.email ?? '',
    telefono: '',
    calle: '',
    numero: '',
    colonia: '',
    ciudad: '',
    estado: '',
    cp: '',
    referencias: '',
  })

  function setField(key: keyof DireccionEnvio, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAddressSelect(dir: DireccionCompleta) {
    setForm((prev) => ({
      ...prev,
      calle: dir.calle,
      numero: dir.numero,
      colonia: dir.colonia,
      ciudad: dir.ciudad,
      estado: dir.estado,
      cp: dir.cp,
    }))
  }

  const subtotal = total
  const descuento = metodoPago === 'transferencia' ? Math.round(total * 0.04) : 0
  const totalFinal = subtotal - descuento
  const concepto = datosBancarios.concepto.replace(
    '[ORDER_NUMBER]',
    orderResult?.order_number ?? '...'
  )

  function handleSubmitDatos(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim() || !form.email.trim() || !form.calle.trim() || !form.cp.trim()) {
      setError('Completa todos los campos requeridos.')
      return
    }
    setError(null)
    setStep('pago')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleConfirmar() {
    if (!items.length) {
      router.push('/store')
      return
    }
    setSubmitting(true)
    setError(null)

    const res = await createOrder({
      items,
      direccion: form,
      metodo_pago: metodoPago,
      user_id: user?.id ?? null,
    })

    setSubmitting(false)
    if ('error' in res) {
      setError(res.error)
      return
    }

    setOrderResult({ order_id: res.order_id, order_number: res.order_number })
    clearCart()
    setStep('confirmacion')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2.5 text-[13px] text-[#111111] outline-none focus:border-[#111111] placeholder-[#AAAAAA]'
  const labelCls = 'block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888] mb-1'

  if (items.length === 0 && step !== 'confirmacion') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F7] px-4 text-center">
        <p className="text-[14px] font-extrabold uppercase text-[#666666]" style={jost}>
          Tu carrito está vacío
        </p>
        <Link
          href="/store"
          className="mt-4 bg-[#CC4B37] px-6 py-3 text-[11px] font-extrabold uppercase tracking-wide text-white"
          style={jost}
        >
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <header className="border-b border-[#EEEEEE] bg-white px-4 py-4">
        <div className="mx-auto flex max-w-[720px] items-center justify-between">
          <Link href="/store" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
              </svg>
            </span>
            <span
              className="text-[1rem] font-black uppercase tracking-[0.18em] text-[#111111]"
              style={jost}
            >
              AIR<span className="text-[#CC4B37]">NATION</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {(['datos', 'pago', 'confirmacion'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                {i > 0 && <div className="h-px w-4 bg-[#EEEEEE]" />}
                <div
                  className={`flex h-6 w-6 items-center justify-center text-[10px] font-extrabold ${
                    step === s
                      ? 'bg-[#CC4B37] text-white'
                      : (['datos', 'pago', 'confirmacion'] as Step[]).indexOf(step) > i
                      ? 'bg-[#111111] text-white'
                      : 'bg-[#EEEEEE] text-[#999999]'
                  }`}
                  style={jost}
                >
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-4 py-6 md:py-10">
        {step === 'datos' && (
          <form onSubmit={handleSubmitDatos} className="flex flex-col gap-6">
            <div>
              <h1 className="text-[1.4rem] font-extrabold uppercase text-[#111111]" style={jost}>
                Datos de envío
              </h1>
              {!user && (
                <p className="mt-1 text-[12px] text-[#999999]" style={lato}>
                  ¿Ya tienes cuenta?{' '}
                  <Link href="/login" className="font-bold text-[#CC4B37] hover:underline">
                    Inicia sesión
                  </Link>{' '}
                  para autocompletar tus datos.
                </p>
              )}
            </div>

            <div className="border border-[#EEEEEE] bg-white p-4">
              <p
                className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
                style={jost}
              >
                Tu pedido ({items.length} {items.length === 1 ? 'producto' : 'productos'})
              </p>
              <ul className="flex flex-col gap-2">
                {items.map((item) => (
                  <li key={item.product_id} className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 border border-[#EEEEEE] bg-[#F4F4F4]">
                      {item.foto_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.foto_url}
                          alt=""
                          className="h-full w-full object-contain p-0.5"
                        />
                      ) : (
                        <div className="h-full w-full bg-[#EEEEEE]" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                      <p className="truncate text-[12px] text-[#333333]" style={lato}>
                        {item.nombre}
                      </p>
                      <p
                        className="shrink-0 text-[12px] font-bold text-[#111111]"
                        style={jost}
                      >
                        x{item.cantidad} — ${(item.precio * item.cantidad).toLocaleString('es-MX')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-[#EEEEEE] pt-3 text-right">
                <span className="text-[13px] font-extrabold text-[#111111]" style={jost}>
                  Subtotal: ${subtotal.toLocaleString('es-MX')}
                </span>
              </div>
            </div>

            <div className="border border-[#EEEEEE] bg-white p-5">
              <p
                className="mb-4 text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                style={jost}
              >
                Contacto
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Nombre completo *</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nombre}
                    onChange={(e) => setField('nombre', e.target.value)}
                    required
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className={labelCls}>Email *</label>
                  <input
                    type="email"
                    className={inputCls}
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    required
                    placeholder="tu@email.com"
                  />
                </div>
                <div>
                  <label className={labelCls}>Teléfono</label>
                  <input
                    type="tel"
                    className={inputCls}
                    value={form.telefono}
                    onChange={(e) => setField('telefono', e.target.value)}
                    placeholder="10 dígitos"
                  />
                </div>
              </div>

              <p
                className="mb-4 mt-6 text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
                style={jost}
              >
                Dirección de envío
              </p>

              <div className="mb-4">
                <label className={labelCls}>Busca tu dirección</label>
                <AddressAutocomplete
                  onSelect={handleAddressSelect}
                  placeholder="Ej: Av. Vallarta 1234, Guadalajara"
                  className={inputCls}
                />
                <p className="mt-1 text-[10px] text-[#AAAAAA]" style={lato}>
                  Selecciona tu dirección y verifica los campos abajo
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Calle *</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.calle}
                    onChange={(e) => setField('calle', e.target.value)}
                    required
                    placeholder="Nombre de la calle"
                  />
                </div>
                <div>
                  <label className={labelCls}>Número ext/int</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.numero}
                    onChange={(e) => setField('numero', e.target.value)}
                    placeholder="123 / 4B"
                  />
                </div>
                <div>
                  <label className={labelCls}>Colonia</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.colonia}
                    onChange={(e) => setField('colonia', e.target.value)}
                    placeholder="Nombre de la colonia"
                  />
                </div>
                <div>
                  <label className={labelCls}>Ciudad *</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.ciudad}
                    onChange={(e) => setField('ciudad', e.target.value)}
                    required
                    placeholder="Tu ciudad"
                  />
                </div>
                <div>
                  <label className={labelCls}>Estado</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.estado}
                    onChange={(e) => setField('estado', e.target.value)}
                    placeholder="Tu estado"
                  />
                </div>
                <div>
                  <label className={labelCls}>Código postal *</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.cp}
                    onChange={(e) => setField('cp', e.target.value)}
                    required
                    placeholder="00000"
                    maxLength={5}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Referencias (opcional)</label>
                  <input
                    type="text"
                    className={inputCls}
                    value={form.referencias ?? ''}
                    onChange={(e) => setField('referencias', e.target.value)}
                    placeholder="Entre calles, color de fachada, etc."
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
                <p className="text-[12px] text-[#CC4B37]" style={lato}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#CC4B37] py-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90"
              style={jost}
            >
              Continuar al pago →
            </button>
          </form>
        )}

        {step === 'pago' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('datos')}
                className="text-[#666666] hover:text-[#111111]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M19 12H5M12 19l-7-7 7-7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <h1 className="text-[1.4rem] font-extrabold uppercase text-[#111111]" style={jost}>
                Método de pago
              </h1>
            </div>

            <div className="border border-[#EEEEEE] bg-white px-4 py-3">
              <p className="text-[11px] text-[#999999]" style={lato}>
                Enviando a <strong className="text-[#111111]">{form.nombre}</strong> — {form.calle}{' '}
                {form.numero}, {form.colonia}, {form.ciudad}, {form.estado} CP {form.cp}
              </p>
              <button
                type="button"
                onClick={() => setStep('datos')}
                className="mt-1 text-[11px] font-bold text-[#CC4B37] hover:underline"
                style={jost}
              >
                Editar
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setMetodoPago('transferencia')}
                className={`flex items-start gap-4 border p-4 text-left transition-colors ${
                  metodoPago === 'transferencia'
                    ? 'border-[#CC4B37] bg-[#FFF5F4]'
                    : 'border-[#EEEEEE] bg-white hover:border-[#CCCCCC]'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                    metodoPago === 'transferencia' ? 'border-[#CC4B37]' : 'border-[#CCCCCC]'
                  }`}
                  style={{ borderRadius: '50%' }}
                >
                  {metodoPago === 'transferencia' && (
                    <div
                      className="h-2.5 w-2.5 bg-[#CC4B37]"
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-extrabold uppercase text-[#111111]" style={jost}>
                    Transferencia / Depósito bancario
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#666666]" style={lato}>
                    Recibe un <strong className="text-[#22C55E]">4% de descuento</strong> al pagar
                    por este método
                  </p>
                </div>
                {metodoPago === 'transferencia' && (
                  <span
                    className="shrink-0 bg-[#22C55E] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white"
                    style={jost}
                  >
                    −4%
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('tarjeta')}
                className={`flex items-start gap-4 border p-4 text-left transition-colors ${
                  metodoPago === 'tarjeta'
                    ? 'border-[#CC4B37] bg-[#FFF5F4]'
                    : 'border-[#EEEEEE] bg-white hover:border-[#CCCCCC]'
                }`}
              >
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                    metodoPago === 'tarjeta' ? 'border-[#CC4B37]' : 'border-[#CCCCCC]'
                  }`}
                  style={{ borderRadius: '50%' }}
                >
                  {metodoPago === 'tarjeta' && (
                    <div
                      className="h-2.5 w-2.5 bg-[#CC4B37]"
                      style={{ borderRadius: '50%' }}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-extrabold uppercase text-[#111111]" style={jost}>
                      Tarjeta de crédito / débito
                    </p>
                    <span
                      className="bg-[#F4F4F4] px-2 py-0.5 text-[9px] font-extrabold uppercase text-[#999999]"
                      style={jost}
                    >
                      Próximamente
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#666666]" style={lato}>
                    Pago seguro con Stripe
                  </p>
                </div>
              </button>
            </div>

            <div className="border border-[#EEEEEE] bg-white p-4">
              <p
                className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
                style={jost}
              >
                Resumen del pedido
              </p>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between text-[12px]"
                  >
                    <span className="text-[#555555]" style={lato}>
                      {item.nombre} x{item.cantidad}
                    </span>
                    <span className="font-bold text-[#111111]" style={jost}>
                      ${(item.precio * item.cantidad).toLocaleString('es-MX')}
                    </span>
                  </div>
                ))}
                <div className="flex flex-col gap-1.5 border-t border-[#EEEEEE] pt-2">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#555555]" style={lato}>
                      Subtotal
                    </span>
                    <span style={jost}>${subtotal.toLocaleString('es-MX')}</span>
                  </div>
                  {descuento > 0 && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-[#22C55E]" style={lato}>
                        Descuento transferencia (4%)
                      </span>
                      <span className="text-[#22C55E]" style={jost}>
                        −${descuento.toLocaleString('es-MX')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[#999999]" style={lato}>
                      Envío
                    </span>
                    <span className="text-[#999999]" style={lato}>
                      Se cotiza después
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between border-t border-[#EEEEEE] pt-2">
                    <span
                      className="text-[14px] font-extrabold uppercase text-[#111111]"
                      style={jost}
                    >
                      Total
                    </span>
                    <span className="text-[16px] font-extrabold text-[#111111]" style={jost}>
                      ${totalFinal.toLocaleString('es-MX')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
                <p className="text-[12px] text-[#CC4B37]" style={lato}>
                  {error}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmar}
              disabled={submitting || metodoPago === 'tarjeta'}
              className="w-full bg-[#CC4B37] py-4 text-[13px] font-extrabold uppercase tracking-wide text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={jost}
            >
              {submitting
                ? 'Procesando...'
                : metodoPago === 'tarjeta'
                ? 'Disponible próximamente'
                : 'Confirmar pedido →'}
            </button>

            {metodoPago === 'transferencia' && (
              <p className="text-center text-[11px] text-[#999999]" style={lato}>
                Al confirmar recibirás los datos bancarios para realizar tu transferencia. Tu pedido
                se reserva por <strong>48 horas</strong>.
              </p>
            )}
          </div>
        )}

        {step === 'confirmacion' && orderResult && (
          <div className="flex flex-col gap-6">
            <div className="border border-[#22C55E] bg-white p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-[#22C55E]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M5 12l5 5L20 7"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-[1.3rem] font-extrabold uppercase text-[#111111]" style={jost}>
                ¡Pedido confirmado!
              </h1>
              <p className="mt-1 text-[13px] text-[#666666]" style={lato}>
                Número de pedido:
              </p>
              <p className="mt-1 text-[1.1rem] font-extrabold text-[#CC4B37]" style={jost}>
                #{orderResult.order_number}
              </p>
            </div>

            {metodoPago === 'transferencia' && (
              <div className="border border-[#EEEEEE] bg-[#0A0A0A] p-5">
                <p
                  className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-[#CC4B37]"
                  style={jost}
                >
                  Realiza tu transferencia
                </p>
                {datosBancarios.clabe ? (
                  <div className="flex flex-col gap-2">
                    {datosBancarios.banco && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/50" style={lato}>
                          Banco
                        </span>
                        <span className="text-[13px] font-bold text-white" style={jost}>
                          {datosBancarios.banco}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50" style={lato}>
                        CLABE
                      </span>
                      <span className="font-mono text-[13px] font-bold text-white">
                        {datosBancarios.clabe}
                      </span>
                    </div>
                    {datosBancarios.titular && (
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-white/50" style={lato}>
                          Titular
                        </span>
                        <span className="text-[13px] font-bold text-white" style={jost}>
                          {datosBancarios.titular}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-white/10 pt-2">
                      <span className="text-[11px] text-white/50" style={lato}>
                        Monto
                      </span>
                      <span className="text-[16px] font-extrabold text-[#22C55E]" style={jost}>
                        ${totalFinal.toLocaleString('es-MX')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-white/50" style={lato}>
                        Concepto
                      </span>
                      <span className="text-[11px] font-bold text-white" style={jost}>
                        {concepto}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] text-white/60" style={lato}>
                    Te enviaremos los datos bancarios a{' '}
                    <strong className="text-white">{form.email}</strong> en los próximos minutos.
                  </p>
                )}
                <div className="mt-4 border border-white/10 bg-white/5 p-3">
                  <p className="text-[11px] leading-relaxed text-white/60" style={lato}>
                    Envía tu comprobante a{' '}
                    <strong className="text-white">info@airnation.online</strong> con el número{' '}
                    <strong className="text-[#CC4B37]">#{orderResult.order_number}</strong>. Tu
                    pedido se reserva por <strong className="text-white">48 horas</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="border border-[#EEEEEE] bg-white p-4">
              <p
                className="mb-3 text-[10px] font-extrabold uppercase tracking-wide text-[#999999]"
                style={jost}
              >
                ¿Qué sigue?
              </p>
              <ol className="flex flex-col gap-2">
                {[
                  metodoPago === 'transferencia'
                    ? 'Realiza la transferencia con los datos de arriba'
                    : 'Tu pago está siendo procesado',
                  'Confirmaremos tu pedido por email',
                  'Cotizamos el envío y te avisamos antes de proceder',
                  'Enviamos tu pedido con número de guía',
                ].map((paso, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center bg-[#CC4B37] text-[9px] font-extrabold text-white"
                      style={jost}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[12px] text-[#555555]" style={lato}>
                      {paso}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {!user && (
              <div className="border border-[#CC4B37] bg-[#FFF5F4] p-4">
                <p className="text-[12px] font-bold text-[#CC4B37]" style={jost}>
                  ¿Quieres rastrear tu pedido?
                </p>
                <p className="mt-1 text-[11px] text-[#666666]" style={lato}>
                  Crea una cuenta con el mismo email para ver el estado de tu pedido en tiempo real.
                </p>
                <Link
                  href={`/register?email=${encodeURIComponent(form.email)}`}
                  className="mt-3 inline-block bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white"
                  style={jost}
                >
                  Crear cuenta →
                </Link>
              </div>
            )}

            <Link
              href="/store"
              className="flex w-full items-center justify-center border border-[#EEEEEE] bg-white py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-[#111111] transition-colors hover:border-[#111111]"
              style={jost}
            >
              Seguir comprando
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
