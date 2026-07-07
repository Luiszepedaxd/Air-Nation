'use client'

import { useState } from 'react'
import { CreditCard, HelpCircle, Lock } from 'lucide-react'
import { lato } from '../theme'

interface TarjetaInputProps {
  numero: string
  vencimiento: string
  cvc: string
  nombre: string
  onNumeroChange: (v: string) => void
  onVencimientoChange: (v: string) => void
  onCvcChange: (v: string) => void
  onNombreChange: (v: string) => void
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const inputClass =
  'w-full border border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#111111] placeholder:text-[#999999] focus:border-[#CC4B37] focus:outline-none'

export function TarjetaInput({
  numero,
  vencimiento,
  cvc,
  nombre,
  onNumeroChange,
  onVencimientoChange,
  onCvcChange,
  onNombreChange,
}: TarjetaInputProps) {
  const [showCvcTip, setShowCvcTip] = useState(false)

  return (
    <div className="space-y-4">
      <div className="relative">
        <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
          Número de tarjeta
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="1234 1234 1234 1234"
          value={numero}
          onChange={(e) => onNumeroChange(formatCardNumber(e.target.value))}
          className={inputClass}
          style={lato}
        />
        <CreditCard size={18} className="absolute right-3 top-[34px] text-[#999999]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
            Vencimiento MM/AA
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={vencimiento}
            onChange={(e) => onVencimientoChange(formatExpiry(e.target.value))}
            className={inputClass}
            style={lato}
          />
        </div>
        <div className="relative">
          <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
            CVC
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123"
            maxLength={4}
            value={cvc}
            onChange={(e) => onCvcChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className={inputClass}
            style={lato}
          />
          <button
            type="button"
            className="absolute right-3 top-[34px] text-[#999999] hover:text-[#111111]"
            onMouseEnter={() => setShowCvcTip(true)}
            onMouseLeave={() => setShowCvcTip(false)}
            onClick={() => setShowCvcTip((s) => !s)}
            aria-label="¿Qué es el CVC?"
          >
            <HelpCircle size={16} />
          </button>
          {showCvcTip && (
            <div
              className="absolute right-0 top-full z-10 mt-1 w-48 border border-[#EEEEEE] bg-[#FFFFFF] p-2 text-[10px] text-[#666666] shadow-sm"
              style={lato}
            >
              Los 3 dígitos al reverso de tu tarjeta (4 en AMEX).
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-[#666666]" style={lato}>
          Nombre en tarjeta
        </label>
        <input
          type="text"
          placeholder="Como aparece en la tarjeta"
          value={nombre}
          onChange={(e) => onNombreChange(e.target.value)}
          className={inputClass}
          style={lato}
        />
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[#666666]" style={lato}>
        <Lock size={14} className="mt-0.5 shrink-0 text-[#CC4B37]" />
        <span>
          Pagos procesados de forma segura por Stripe. AirNation nunca almacena datos de tarjeta.
        </span>
      </div>
    </div>
  )
}
