'use client'

import { useState } from 'react'
import { submitReport, type ReportReason, type ReportTargetType } from '@/lib/report-content'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const REASONS: { value: ReportReason; label: string; desc: string }[] = [
  { value: 'spam', label: 'Spam', desc: 'Publicidad no solicitada o repetitiva' },
  { value: 'inappropriate', label: 'Contenido inapropiado', desc: 'Sexual, violento o que no debería estar aquí' },
  { value: 'harassment', label: 'Acoso', desc: 'Insultos, bullying o intimidación' },
  { value: 'other', label: 'Otro', desc: 'Describe el motivo abajo' },
]

export function ReportModal({
  open,
  onClose,
  reporterId,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean
  onClose: () => void
  reporterId: string | null
  targetType: ReportTargetType
  targetId: string
  targetLabel: string
}) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSubmit = async () => {
    if (!reporterId) {
      setError('Debes iniciar sesión para reportar')
      return
    }
    if (!reason) {
      setError('Selecciona un motivo')
      return
    }
    setSubmitting(true)
    setError(null)
    const result = await submitReport({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    })
    setSubmitting(false)
    if (result.ok) {
      setDone(true)
    } else {
      setError(result.error)
    }
  }

  const handleClose = () => {
    if (submitting) return
    setReason(null)
    setDetails('')
    setError(null)
    setDone(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/60"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-3">
          <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
            {done ? 'Reporte enviado' : 'Reportar'}
          </p>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="text-[#999999] hover:text-[#111111] disabled:opacity-30"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        {done ? (
          <div className="px-4 py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#E1F5EE]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 13l4 4L19 7" stroke="#085041" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p style={lato} className="text-[14px] text-[#111111] mb-1">
              Gracias por tu reporte.
            </p>
            <p style={lato} className="text-[12px] text-[#666666]">
              Lo revisaremos en las próximas 24-48 horas.
            </p>
            <button
              type="button"
              onClick={handleClose}
              style={jost}
              className="mt-5 bg-[#111111] px-6 py-2.5 text-[11px] font-extrabold uppercase text-white"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="px-4 py-4">
            <p style={lato} className="text-[12px] text-[#666666] mb-3">
              Reportando: <span className="font-semibold text-[#111111]">{targetLabel}</span>
            </p>

            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#111111] mb-2">
              Motivo
            </p>
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={`w-full border px-3 py-2.5 text-left transition-colors ${
                    reason === r.value
                      ? 'border-[#CC4B37] bg-[#FFF8F7]'
                      : 'border-[#EEEEEE] bg-white hover:bg-[#F9F9F9]'
                  }`}
                >
                  <p
                    style={jost}
                    className={`text-[12px] font-extrabold uppercase ${
                      reason === r.value ? 'text-[#CC4B37]' : 'text-[#111111]'
                    }`}
                  >
                    {r.label}
                  </p>
                  <p style={lato} className="text-[11px] text-[#666666] mt-0.5">
                    {r.desc}
                  </p>
                </button>
              ))}
            </div>

            <p style={jost} className="text-[10px] font-extrabold uppercase text-[#111111] mb-2">
              Detalles (opcional)
            </p>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 500))}
              placeholder="Cuéntanos más sobre el problema…"
              rows={3}
              style={lato}
              className="w-full resize-none border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[13px] text-[#111111] placeholder:text-[#AAAAAA] focus:outline-none focus:border-[#CC4B37] rounded-[2px]"
            />
            <p style={lato} className="text-[10px] text-[#999999] mt-1 text-right">
              {details.length}/500
            </p>

            {error && (
              <p style={lato} className="text-[12px] text-[#CC4B37] mt-2">
                {error}
              </p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={submitting}
                style={jost}
                className="flex-1 border border-[#EEEEEE] bg-white px-3 py-2.5 text-[11px] font-extrabold uppercase text-[#666666] disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={!reason || submitting}
                style={jost}
                className="flex-1 bg-[#CC4B37] px-3 py-2.5 text-[11px] font-extrabold uppercase text-white disabled:opacity-40"
              >
                {submitting ? 'Enviando…' : 'Enviar reporte'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
