'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/apiFetch'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[16px] text-[#111111] outline-none focus:border-[#CC4B37]'

/**
 * Primer login de una cuenta de dueño creada por el super admin: el
 * middleware manda aquí mientras `app_metadata.must_change_password` siga
 * puesta, y el backend la baja al cambiar el password.
 */
export default function CambiarPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirma, setConfirma] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setError('')
    if (password.length < 8) return setError('Usa al menos 8 caracteres.')
    if (password !== confirma) return setError('Las dos contraseñas no coinciden.')
    setGuardando(true)
    try {
      const res = await apiFetch('/account/password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(json.error || 'No se pudo cambiar la contraseña.')
      // La bandera viaja en el JWT: sin refrescar la sesión el middleware
      // seguiría regresando a esta pantalla.
      await supabase.auth.refreshSession()
      router.replace('/mi-campo')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cambiar la contraseña.')
      setGuardando(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-[480px] px-4 py-10 md:px-6" style={lato}>
      <h1 style={jost} className="text-[22px] leading-tight text-[#111111] md:text-[26px]">
        CAMBIA TU CONTRASEÑA
      </h1>
      <p className="mt-2 text-[13px] text-[#666666]">
        Tu cuenta la creó AirNation con una contraseña temporal. Elige una tuya
        para entrar a tu campo.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Nueva contraseña
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Repítela
          <input
            className={inputClass}
            type="password"
            autoComplete="new-password"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
          />
        </label>
        {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}
        <button
          type="button"
          onClick={() => void guardar()}
          disabled={guardando}
          style={jost}
          className="inline-flex min-h-[48px] items-center justify-center bg-[#CC4B37] px-5 text-[12px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
        >
          {guardando ? 'GUARDANDO…' : 'GUARDAR Y ENTRAR'}
        </button>
      </div>
    </main>
  )
}
