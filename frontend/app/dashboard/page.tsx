"use client"
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const [alias, setAlias] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('users')
        .select('alias')
        .eq('id', user.id)
        .single()

      if (!profile?.alias) {
        router.push('/onboarding')
        return
      }

      setAlias(profile.alias)
    })
  }, [])

  return (
    <main className="h-full flex flex-col bg-[#F4F4F4]">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 text-center">
        <p className="text-[#CC4B37] text-[0.65rem] font-bold uppercase tracking-[0.28em] mb-4">
          Alpha
        </p>
        <h1 style={{fontFamily:'Jost,sans-serif'}}
            className="font-black text-[2.4rem] sm:text-[4rem] uppercase leading-[0.9] text-[#111111] mb-6">
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
