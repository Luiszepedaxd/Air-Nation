'use client'

import { useState } from 'react'

type Tipo = 'patrocinio' | 'feedback' | 'alianza' | 'otro'

const TIPOS: { value: Tipo; label: string }[] = [
  { value: 'patrocinio', label: 'Patrocinio de evento' },
  { value: 'feedback', label: 'Feedback / sugerencia' },
  { value: 'alianza', label: 'Alianza comercial' },
  { value: 'otro', label: 'Otro' },
]

const inputBase =
  'w-full bg-white/5 border border-solid border-white/15 px-4 py-3 text-[0.9rem] text-white placeholder-white/40 outline-none transition-colors focus:border-[#CC4B37] focus:bg-white/10'

export function ContactoForm() {
  const [tipo, setTipo] = useState<Tipo>('patrocinio')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [mensaje, setMensaje] = useState('')

  const [estado, setEstado] = useState<
    'idle' | 'enviando' | 'ok' | 'error'
  >('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (estado === 'enviando') return

    setEstado('enviando')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contacto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          nombre: nombre.trim(),
          email: email.trim(),
          empresa: empresa.trim(),
          mensaje: mensaje.trim(),
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
      }

      if (!res.ok) {
        setEstado('error')
        setErrorMsg(data.error ?? 'Error al enviar. Intenta de nuevo.')
        return
      }

      setEstado('ok')
      setTipo('patrocinio')
      setNombre('')
      setEmail('')
      setEmpresa('')
      setMensaje('')
    } catch {
      setEstado('error')
      setErrorMsg('Error de red. Intenta de nuevo.')
    }
  }

  if (estado === 'ok') {
    return (
      <div
        className="border border-solid border-[#CC4B37] bg-[#CC4B37]/10 p-8 text-center"
        style={{ borderRadius: 2 }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden
          className="mx-auto mb-4"
        >
          <circle cx="24" cy="24" r="22" stroke="#CC4B37" strokeWidth="2" />
          <path
            d="M16 24l6 6 12-14"
            stroke="#CC4B37"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="mb-2 font-display text-[1.5rem] font-black uppercase text-white">
          Mensaje enviado
        </h3>
        <p className="font-body text-[0.9rem] leading-relaxed text-white/75">
          Gracias por contactarnos. Te responderemos en menos de 48 horas a tu correo.
        </p>
        <button
          type="button"
          onClick={() => setEstado('idle')}
          className="mt-6 inline-flex items-center gap-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#CC4B37] hover:underline"
        >
          Enviar otro mensaje
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-solid border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm sm:p-8"
      style={{ borderRadius: 2 }}
    >
      {/* Tipo de contacto */}
      <fieldset className="mb-6">
        <legend className="mb-3 font-body text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/60">
          Tipo de contacto
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TIPOS.map((t) => (
            <label
              key={t.value}
              className={`flex cursor-pointer items-center gap-2.5 border border-solid px-3 py-2.5 text-[0.8rem] transition-colors ${
                tipo === t.value
                  ? 'border-[#CC4B37] bg-[#CC4B37]/15 text-white'
                  : 'border-white/15 bg-white/[0.02] text-white/70 hover:border-white/30'
              }`}
              style={{ borderRadius: 2 }}
            >
              <input
                type="radio"
                name="tipo"
                value={t.value}
                checked={tipo === t.value}
                onChange={() => setTipo(t.value)}
                className="sr-only"
              />
              <span
                className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                  tipo === t.value
                    ? 'border-[#CC4B37]'
                    : 'border-white/30'
                }`}
              >
                {tipo === t.value ? (
                  <span className="block h-1.5 w-1.5 rounded-full bg-[#CC4B37]" />
                ) : null}
              </span>
              <span className="font-body">{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Nombre */}
      <div className="mb-4">
        <label
          htmlFor="contacto-nombre"
          className="mb-2 block font-body text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/60"
        >
          Nombre completo *
        </label>
        <input
          id="contacto-nombre"
          type="text"
          required
          minLength={2}
          maxLength={120}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre"
          className={inputBase}
          style={{ borderRadius: 2 }}
        />
      </div>

      {/* Email */}
      <div className="mb-4">
        <label
          htmlFor="contacto-email"
          className="mb-2 block font-body text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/60"
        >
          Email *
        </label>
        <input
          id="contacto-email"
          type="email"
          required
          maxLength={200}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className={inputBase}
          style={{ borderRadius: 2 }}
        />
      </div>

      {/* Empresa / Equipo */}
      <div className="mb-4">
        <label
          htmlFor="contacto-empresa"
          className="mb-2 block font-body text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/60"
        >
          Empresa / Equipo (opcional)
        </label>
        <input
          id="contacto-empresa"
          type="text"
          maxLength={200}
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          placeholder="Nombre de tu marca, equipo o productora"
          className={inputBase}
          style={{ borderRadius: 2 }}
        />
      </div>

      {/* Mensaje */}
      <div className="mb-6">
        <label
          htmlFor="contacto-mensaje"
          className="mb-2 block font-body text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/60"
        >
          Mensaje *
        </label>
        <textarea
          id="contacto-mensaje"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Cuéntanos qué tienes en mente..."
          className={`${inputBase} resize-none`}
          style={{ borderRadius: 2 }}
        />
      </div>

      {/* Error */}
      {estado === 'error' && errorMsg ? (
        <div
          className="mb-4 border border-solid border-[#CC4B37] bg-[#CC4B37]/10 p-3 font-body text-[0.85rem] text-white"
          style={{ borderRadius: 2 }}
          role="alert"
        >
          {errorMsg}
        </div>
      ) : null}

      {/* Submit */}
      <button
        type="submit"
        disabled={estado === 'enviando'}
        className="group inline-flex w-full items-center justify-center gap-2.5 bg-[#CC4B37] px-7 py-[1rem] font-body text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white transition-all hover:bg-[#CC4B37]/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {estado === 'enviando' ? 'Enviando...' : 'Enviar mensaje'}
        {estado !== 'enviando' ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            aria-hidden
            className="transition-transform group-hover:translate-x-1"
          >
            <path
              d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </button>
    </form>
  )
}
