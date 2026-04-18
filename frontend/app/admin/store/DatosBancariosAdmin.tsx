'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { saveDatosBancarios } from './banco-actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

type Datos = { banco: string; clabe: string; titular: string; concepto: string }

export function DatosBancariosAdmin({ initialDatos }: { initialDatos: Datos }) {
  const router = useRouter()
  const [datos, setDatos] = useState<Datos>(initialDatos)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function setField(key: keyof Datos, value: string) {
    setDatos((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await saveDatosBancarios(datos)
    setSaving(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    router.refresh()
  }

  const inputCls =
    'w-full border border-[#E4E4E4] bg-white px-3 py-2.5 text-[13px] text-[#111111] outline-none focus:border-[#111111]'
  const labelCls =
    'block text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#888888] mb-1'

  return (
    <div className="flex max-w-[520px] flex-col gap-5" style={lato}>
      <div>
        <h2 className="text-[13px] tracking-[0.14em] text-[#111111]" style={jost}>
          Datos bancarios
        </h2>
        <p className="mt-1 text-[12px] text-[#999999]">
          Se muestran al comprador al confirmar un pedido con transferencia.
        </p>
      </div>
      <div className="flex flex-col gap-4 border border-[#EEEEEE] bg-white p-5">
        <div>
          <label className={labelCls}>Banco</label>
          <input
            type="text"
            className={inputCls}
            value={datos.banco}
            onChange={(e) => setField('banco', e.target.value)}
            placeholder="BBVA, Banamex, HSBC..."
          />
        </div>
        <div>
          <label className={labelCls}>CLABE interbancaria</label>
          <input
            type="text"
            className={inputCls}
            value={datos.clabe}
            onChange={(e) => setField('clabe', e.target.value)}
            placeholder="18 dígitos"
            maxLength={18}
          />
        </div>
        <div>
          <label className={labelCls}>Nombre del titular</label>
          <input
            type="text"
            className={inputCls}
            value={datos.titular}
            onChange={(e) => setField('titular', e.target.value)}
            placeholder="Nombre completo o razón social"
          />
        </div>
        <div>
          <label className={labelCls}>Concepto de pago</label>
          <input
            type="text"
            className={inputCls}
            value={datos.concepto}
            onChange={(e) => setField('concepto', e.target.value)}
            placeholder="Pedido AirNation #[ORDER_NUMBER]"
          />
          <p className="mt-1 text-[10px] text-[#AAAAAA]">
            Usa [ORDER_NUMBER] para insertar el número de pedido automáticamente.
          </p>
        </div>
      </div>
      {error && (
        <div className="border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]">{error}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="flex w-fit items-center gap-2 bg-[#CC4B37] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        style={jost}
      >
        {saving ? 'Guardando…' : saved ? '✓ Guardado' : 'Guardar datos bancarios'}
      </button>
      <div className="border border-[#EEEEEE] bg-[#F9F9F9] px-4 py-3">
        <p className="text-[11px] text-[#888888]">
          <strong style={{ ...jost, fontSize: 10 }}>NOTA:</strong>{' '}
          Si los datos están vacíos, le diremos al comprador que le enviaremos los datos por email.
        </p>
      </div>
    </div>
  )
}
