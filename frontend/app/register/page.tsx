"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!email || !password) return
    if (password.length < 6) {
      setError('Mínimo 6 caracteres')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/onboarding')
  }

  return (
    <main className="min-h-screen bg-white flex">
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-24 py-16">
        <Link href="/" className="flex items-center gap-2.5 mb-16">
          <span className="w-7 h-7 bg-[#CC4B37] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff"/>
            </svg>
          </span>
          <span style={{fontFamily:'Jost,sans-serif'}}
                className="font-black text-[1.1rem] tracking-[0.18em] text-[#111111] uppercase">
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </Link>

        <div className="max-w-[400px]">
          <p className="text-[#CC4B37] text-[0.65rem] font-bold uppercase tracking-[0.28em] mb-3">
            Crear cuenta
          </p>
          <h1 style={{fontFamily:'Jost,sans-serif'}}
              className="font-black text-[2.8rem] uppercase leading-[0.9] text-[#111111] mb-10">
            EMPIEZA<br/>GRATIS.
          </h1>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] mb-2">
                Correo
              </label>
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full px-4 py-3 border border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] text-sm placeholder-[#AAAAAA] focus:outline-none focus:border-[#CC4B37] transition-colors"/>
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] mb-2">
                Contraseña
              </label>
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 border border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] text-sm placeholder-[#AAAAAA] focus:outline-none focus:border-[#CC4B37] transition-colors"/>
            </div>
            {error && <p className="text-[#CC4B37] text-xs">{error}</p>}
            <button onClick={handleRegister}
              disabled={loading || !email || !password}
              className="w-full py-3.5 bg-[#CC4B37] text-white font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:bg-[#D95540] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
            </button>
          </div>

          <p className="text-[#767676] text-sm mt-8">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-[#CC4B37] font-bold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:block w-[45%] relative bg-[#111111]">
        <img src="https://images.unsplash.com/photo-1563456372-c1e059ba5ddc?auto=format&fit=crop&w=900&q=80"
          alt="" className="w-full h-full object-cover opacity-60"/>
        <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent"/>
        <div className="absolute bottom-12 left-10 right-10">
          <p style={{fontFamily:'Jost,sans-serif'}}
             className="font-black text-white text-2xl uppercase leading-tight">
            "LA PLATAFORMA QUE<br/>LA COMUNIDAD<br/>NECESITABA."
          </p>
        </div>
      </div>
    </main>
  )
}
