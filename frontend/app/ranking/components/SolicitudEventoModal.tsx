'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'
import { TEXTOS_ORGANIZADORES, TEXTOS_SOLICITUD } from '@/lib/ranking-contenido'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800 as const,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[#111111] outline-none focus:border-[#CC4B37]'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Origen = 'home' | 'ranking' | 'feed'

type FieldErrors = Partial<Record<string, string>>

function validateForm(values: {
  nombre: string
  whatsapp: string
  email: string
  organizacion: string
  tipo_evento: string
  ciudad: string
  mensaje: string
  fecha_aproximada: string
  jugadores_esperados: string
}): FieldErrors {
  const err: FieldErrors = {}
  const nombre = values.nombre.trim()
  if (nombre.length < 2 || nombre.length > 120) {
    err.nombre = 'Entre 2 y 120 caracteres'
  }
  const digits = values.whatsapp.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 13) {
    err.whatsapp = 'Ingresa 10 dígitos (México)'
  }
  const email = values.email.trim()
  if (email.length > 0 && (!EMAIL_RE.test(email) || email.length > 200)) {
    err.email = 'Correo no válido'
  }
  const org = values.organizacion.trim()
  if (org.length < 2 || org.length > 150) {
    err.organizacion = 'Entre 2 y 150 caracteres'
  }
  const tipos = TEXTOS_SOLICITUD.tiposEvento as readonly string[]
  if (!values.tipo_evento || !tipos.includes(values.tipo_evento)) {
    err.tipo_evento = 'Selecciona un tipo'
  }
  const ciudad = values.ciudad.trim()
  if (ciudad.length < 2 || ciudad.length > 100) {
    err.ciudad = 'Entre 2 y 100 caracteres'
  }
  if (values.fecha_aproximada.trim().length > 60) {
    err.fecha_aproximada = 'Máximo 60 caracteres'
  }
  if (values.mensaje.trim().length > 1000) {
    err.mensaje = 'Máximo 1000 caracteres'
  }
  return err
}

const emptyForm = () => ({
  nombre: '',
  whatsapp: '',
  email: '',
  organizacion: '',
  tipo_evento: '',
  ciudad: '',
  jugadores_esperados: '',
  fecha_aproximada: '',
  mensaje: '',
  sitio_web: '',
})

export function SolicitudEventoModal({
  open,
  onClose,
  origen,
}: {
  open: boolean
  onClose: () => void
  origen: Origen
}) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)
  const [exito, setExito] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    setPortalEl(document.body)
  }, [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return
      const u = data.user
      setUserId(u?.id ?? null)
      if (u?.email) {
        setForm((prev) => ({
          ...prev,
          email: prev.email.trim() ? prev.email : u.email ?? '',
        }))
      }
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const closeModal = useCallback(() => {
    if (sending) return
    onClose()
  }, [sending, onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, closeModal])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setExito(false)
      setSubmitError('')
      setFieldErrors({})
      setForm(emptyForm())
    }
  }, [open])

  const handleCloseAfterSuccess = () => {
    setForm(emptyForm())
    setExito(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm(form)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setSubmitError(TEXTOS_SOLICITUD.errorCampos)
      return
    }
    setSending(true)
    setSubmitError('')
    const digits = form.whatsapp.replace(/\D/g, '')
    const result = await api.ranking.solicitarEvento({
      nombre: form.nombre.trim(),
      whatsapp: digits,
      email: form.email.trim() || null,
      organizacion: form.organizacion.trim(),
      tipo_evento: form.tipo_evento,
      ciudad: form.ciudad.trim(),
      jugadores_esperados: form.jugadores_esperados || null,
      fecha_aproximada: form.fecha_aproximada.trim() || null,
      mensaje: form.mensaje.trim() || null,
      user_id: userId,
      origen,
      sitio_web: form.sitio_web,
    })
    setSending(false)
    if (!result.success) {
      setSubmitError(result.error || TEXTOS_SOLICITUD.errorGeneral)
      return
    }
    setExito(true)
    setForm(emptyForm())
  }

  if (!open || !portalEl) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-0 sm:items-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeModal()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="solicitud-ranking-title"
        className="relative flex max-h-[92vh] w-full max-w-[520px] flex-col overflow-y-auto bg-white p-6 shadow-lg sm:max-h-[90vh]"
        style={{ borderRadius: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          disabled={sending}
          className="absolute right-4 top-4 text-[#111111] opacity-60 hover:opacity-100 disabled:opacity-30"
          aria-label="Cerrar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {exito ? (
          <div className="py-4">
            <h2
              id="solicitud-ranking-title"
              className="pr-10 text-[20px] leading-tight text-[#111111]"
              style={jostHeading}
            >
              {TEXTOS_SOLICITUD.exitoTitulo}
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-[#666666]" style={latoBody}>
              {TEXTOS_SOLICITUD.exitoTexto}
            </p>
            <button
              type="button"
              onClick={handleCloseAfterSuccess}
              className="mt-8 w-full py-3 text-white"
              style={{
                ...jostHeading,
                backgroundColor: '#CC4B37',
                borderRadius: 0,
                fontSize: 14,
              }}
            >
              {TEXTOS_SOLICITUD.cerrar}
            </button>
          </div>
        ) : (
          <>
            <h2
              id="solicitud-ranking-title"
              className="pr-10 text-[20px] leading-tight text-[#111111]"
              style={jostHeading}
            >
              {TEXTOS_SOLICITUD.titulo}
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-[#666666]" style={latoBody}>
              {TEXTOS_SOLICITUD.intro}
            </p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="sitio_web"
                value={form.sitio_web}
                onChange={(e) => setForm((f) => ({ ...f, sitio_web: e.target.value }))}
                className="sr-only"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
              />

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-nombre">
                  {TEXTOS_SOLICITUD.nombre}
                </label>
                <input
                  id="sol-nombre"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder={TEXTOS_SOLICITUD.nombrePlaceholder}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                  maxLength={120}
                />
                {fieldErrors.nombre ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.nombre}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-whatsapp">
                  {TEXTOS_SOLICITUD.whatsapp}
                </label>
                <input
                  id="sol-whatsapp"
                  inputMode="tel"
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                  placeholder={TEXTOS_SOLICITUD.whatsappPlaceholder}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                />
                {fieldErrors.whatsapp ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.whatsapp}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-email">
                  {TEXTOS_SOLICITUD.email}
                </label>
                <input
                  id="sol-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder={TEXTOS_SOLICITUD.emailPlaceholder}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                  autoComplete="email"
                />
                {fieldErrors.email ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.email}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-org">
                  {TEXTOS_SOLICITUD.organizacion}
                </label>
                <input
                  id="sol-org"
                  value={form.organizacion}
                  onChange={(e) => setForm((f) => ({ ...f, organizacion: e.target.value }))}
                  placeholder={TEXTOS_SOLICITUD.organizacionPlaceholder}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                  maxLength={150}
                />
                {fieldErrors.organizacion ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.organizacion}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-tipo">
                  {TEXTOS_SOLICITUD.tipoEvento}
                </label>
                <select
                  id="sol-tipo"
                  value={form.tipo_evento}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_evento: e.target.value }))}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                >
                  <option value="">Selecciona…</option>
                  {TEXTOS_SOLICITUD.tiposEvento.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {fieldErrors.tipo_evento ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.tipo_evento}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-ciudad">
                  {TEXTOS_SOLICITUD.ciudad}
                </label>
                <input
                  id="sol-ciudad"
                  value={form.ciudad}
                  onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
                  placeholder={TEXTOS_SOLICITUD.ciudadPlaceholder}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                  maxLength={100}
                />
                {fieldErrors.ciudad ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.ciudad}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-jugadores">
                  {TEXTOS_SOLICITUD.jugadores}
                </label>
                <select
                  id="sol-jugadores"
                  value={form.jugadores_esperados}
                  onChange={(e) => setForm((f) => ({ ...f, jugadores_esperados: e.target.value }))}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                >
                  <option value="">Opcional</option>
                  {TEXTOS_SOLICITUD.jugadoresOpciones.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-fecha">
                  {TEXTOS_SOLICITUD.fecha}
                </label>
                <input
                  id="sol-fecha"
                  value={form.fecha_aproximada}
                  onChange={(e) => setForm((f) => ({ ...f, fecha_aproximada: e.target.value }))}
                  placeholder={TEXTOS_SOLICITUD.fechaPlaceholder}
                  className={inputClass}
                  style={{ borderRadius: 2, ...latoBody }}
                  maxLength={60}
                />
                {fieldErrors.fecha_aproximada ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.fecha_aproximada}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]" style={jostHeading} htmlFor="sol-mensaje">
                  {TEXTOS_SOLICITUD.mensaje}
                </label>
                <textarea
                  id="sol-mensaje"
                  value={form.mensaje}
                  onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value.slice(0, 1000) }))}
                  rows={4}
                  maxLength={1000}
                  placeholder={TEXTOS_SOLICITUD.mensajePlaceholder}
                  className={`${inputClass} min-h-[100px]`}
                  style={{ borderRadius: 2, ...latoBody, resize: 'vertical' }}
                />
                <p className="mt-1 text-right text-xs text-[#666666]" style={latoBody}>
                  {form.mensaje.length}/1000
                </p>
                {fieldErrors.mensaje ? (
                  <p className="mt-1 text-xs text-[#CC4B37]" style={latoBody}>{fieldErrors.mensaje}</p>
                ) : null}
              </div>

              {submitError ? (
                <p className="text-sm text-[#CC4B37]" style={latoBody}>{submitError}</p>
              ) : null}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 text-white transition-opacity disabled:opacity-40"
                style={{
                  ...jostHeading,
                  backgroundColor: '#CC4B37',
                  borderRadius: 0,
                  fontSize: 14,
                }}
              >
                {sending ? TEXTOS_SOLICITUD.enviando : TEXTOS_SOLICITUD.enviar}
              </button>
            </form>
          </>
        )}
      </div>
    </div>,
    portalEl
  )
}

export function BotonSolicitudEvento({
  origen,
  className,
  children,
}: {
  origen: Origen
  className?: string
  children?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children ?? TEXTOS_ORGANIZADORES.cta}
      </button>
      <SolicitudEventoModal
        open={open}
        onClose={() => setOpen(false)}
        origen={origen}
      />
    </>
  )
}
