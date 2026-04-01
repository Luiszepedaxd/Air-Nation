"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()
  const [alias, setAlias] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('users').select('alias').eq('id', user.id).single()
      if (data?.alias) setAlias(data.alias)
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-[#F4F4F4]">
      <nav className="bg-white border-b border-[#EEEEEE] px-6 sm:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
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
        <button onClick={handleLogout}
          className="text-[#767676] text-xs font-bold uppercase tracking-[0.15em] hover:text-[#CC4B37] transition-colors">
          Cerrar sesión
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <p className="text-[#CC4B37] text-[0.65rem] font-bold uppercase tracking-[0.28em] mb-4">
          Alpha
        </p>
        <h1 style={{fontFamily:'Jost,sans-serif'}}
            className="font-black text-[3rem] sm:text-[5rem] uppercase leading-[0.9] text-[#111111] mb-6">
          {alias ? `BIENVENIDO,\n${alias}.` : 'EN\nCONSTRUCCIÓN.'}
        </h1>
        <p className="text-[#767676] text-base max-w-sm mx-auto">
          Estamos construyendo tu dashboard. Pronto verás tu perfil, 
          credencial y réplicas aquí.
        </p>
      </div>
    </main>
  )
}
