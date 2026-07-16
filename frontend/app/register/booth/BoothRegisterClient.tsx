'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createBoothUser } from './actions'

export function BoothRegisterClient({ eventName }: { eventName: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister() {
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('Llena correo y contraseña.')
      return
    }
    if (password.length < 6) {
      setError('Mínimo 6 caracteres.')
      return
    }

    setLoading(true)
    const res = await createBoothUser({ email: email.trim().toLowerCase(), password })
    if ('error' in res) {
      setError(res.error)
      setLoading(false)
      return
    }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    setLoading(false)
    if (signInErr) {
      setError('Cuenta creada pero login falló. Intenta entrar en /login.')
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen min-h-dvh items-center justify-center bg-white px-5 py-10">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center bg-[#CC4B37]">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff" />
            </svg>
          </span>
          <span
            style={{ fontFamily: 'Jost,sans-serif' }}
            className="text-[1.1rem] font-black uppercase tracking-[0.18em] text-[#111111]"
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </div>

        <div className="mb-5 inline-flex items-center gap-2 border-2 border-[#CC4B37] bg-[rgba(204,75,55,0.06)] px-3 py-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-[#CC4B37]" />
          <span
            className="text-[10px] tracking-[0.18em] text-[#CC4B37]"
            style={{ fontFamily: 'Jost,sans-serif', fontWeight: 800 }}
          >
            MODO BOOTH · {eventName}
          </span>
        </div>

        <h1
          style={{ fontFamily: 'Jost,sans-serif' }}
          className="mb-2 text-[2.4rem] font-black uppercase leading-[0.9] text-[#111111]"
        >
          REGISTRO
          <br />
          RÁPIDO.
        </h1>
        <p className="mb-8 text-sm text-[#666666]">
          Solo correo y contraseña. Entras directo a tu cuenta sin confirmar email.
        </p>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444]">
              Correo
            </label>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3.5 text-base text-[#111111] placeholder-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444]">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3.5 pr-11 text-base text-[#111111] placeholder-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAAAAA] hover:text-[#111111] transition-colors"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-[#CC4B37]">{error}</p>}
          <p className="text-[0.7rem] leading-relaxed text-[#767676]">
            Al crear cuenta aceptas los Términos y Condiciones y el Aviso de Privacidad de AirNation.
          </p>
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading || !email || !password}
            className="mt-2 w-full bg-[#CC4B37] py-4 text-[0.8rem] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#D95540] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creando…' : 'Crear cuenta y entrar →'}
          </button>
        </div>
      </div>
    </main>
  )
}
