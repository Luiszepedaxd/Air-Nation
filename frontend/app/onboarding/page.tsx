"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const ROLES = ['Francotirador','Asalto','Soporte','Médico',
               'Reconocimiento','Fundador','Capitán','Jugador']

export default function Onboarding() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [nombre, setNombre] = useState('')
  const [alias, setAlias] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [rol, setRol] = useState('')
  const [equipo, setEquipo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFinish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('users').update({
      nombre, alias, ciudad, rol,
      equipo: equipo || null
    }).eq('id', user.id)

    router.push('/dashboard')
  }

  const inputClass = "w-full px-4 py-3 border border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] text-sm placeholder-[#AAAAAA] focus:outline-none focus:border-[#CC4B37] transition-colors"
  const btnPrimary = "flex-1 py-3.5 bg-[#CC4B37] text-white font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:bg-[#D95540] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  const btnSecondary = "flex-1 py-3.5 border border-[#EEEEEE] text-[#444444] font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:border-[#CC4B37] transition-colors"

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-[480px]">

        <div className="flex items-center gap-2.5 mb-12">
          <span className="w-7 h-7 bg-[#CC4B37] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z" fill="#fff"/>
            </svg>
          </span>
          <span style={{fontFamily:'Jost,sans-serif'}}
                className="font-black text-[1.1rem] tracking-[0.18em] text-[#111111] uppercase">
            AIR<span className="text-[#CC4B37]">NATION</span>
          </span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-10">
          {[1,2,3].map((s) => (
            <div key={s} className={`h-[3px] flex-1 transition-colors duration-300 ${
              s <= step ? 'bg-[#CC4B37]' : 'bg-[#EEEEEE]'
            }`}/>
          ))}
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <p className="text-[#CC4B37] text-[0.65rem] font-bold uppercase tracking-[0.28em]">
              Paso 1 de 3
            </p>
            <h2 style={{fontFamily:'Jost,sans-serif'}}
                className="font-black text-[2.4rem] uppercase leading-[0.9] text-[#111111] mb-4">
              ¿CÓMO TE<br/>LLAMAMOS?
            </h2>
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] mb-2">Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre real" className={inputClass}/>
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] mb-2">Alias en el campo</label>
              <input type="text" value={alias} onChange={(e) => setAlias(e.target.value)}
                placeholder="GHOST_MX, Viper..." className={inputClass}/>
            </div>
            <button onClick={() => setStep(2)} disabled={!nombre || !alias} className={btnPrimary}>
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <p className="text-[#CC4B37] text-[0.65rem] font-bold uppercase tracking-[0.28em]">
              Paso 2 de 3
            </p>
            <h2 style={{fontFamily:'Jost,sans-serif'}}
                className="font-black text-[2.4rem] uppercase leading-[0.9] text-[#111111] mb-4">
              ¿DÓNDE Y<br/>QUÉ ROL?
            </h2>
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] mb-2">Ciudad</label>
              <input type="text" value={ciudad} onChange={(e) => setCiudad(e.target.value)}
                placeholder="CDMX, Guadalajara..." className={inputClass}/>
            </div>
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] mb-2">Rol</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button key={r} onClick={() => setRol(r)}
                    className={`py-2.5 px-3 text-xs font-bold uppercase tracking-wider border transition-colors ${
                      rol === r
                        ? 'bg-[#CC4B37] text-white border-[#CC4B37]'
                        : 'bg-white text-[#444444] border-[#EEEEEE] hover:border-[#CC4B37]'
                    }`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className={btnSecondary}>← Atrás</button>
              <button onClick={() => setStep(3)} disabled={!ciudad || !rol} className={btnPrimary}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <p className="text-[#CC4B37] text-[0.65rem] font-bold uppercase tracking-[0.28em]">
              Paso 3 de 3
            </p>
            <h2 style={{fontFamily:'Jost,sans-serif'}}
                className="font-black text-[2.4rem] uppercase leading-[0.9] text-[#111111] mb-2">
              ¿TIENES<br/>EQUIPO?
            </h2>
            <p className="text-[#767676] text-sm mb-2">Opcional — puedes agregarlo después.</p>
            <div>
              <label className="block text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] mb-2">Nombre del equipo</label>
              <input type="text" value={equipo} onChange={(e) => setEquipo(e.target.value)}
                placeholder="Equipo Sombra, Los Fantasmas..." className={inputClass}/>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className={btnSecondary}>← Atrás</button>
              <button onClick={handleFinish} disabled={loading} className={btnPrimary}>
                {loading ? 'Guardando...' : 'Entrar →'}
              </button>
            </div>
            <button onClick={handleFinish} disabled={loading}
              className="text-[#767676] text-xs underline underline-offset-2 hover:text-[#444444] transition-colors text-center">
              Saltar por ahora
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
