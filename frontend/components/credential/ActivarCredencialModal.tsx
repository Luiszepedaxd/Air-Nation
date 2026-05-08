'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

type Step = 'upload' | 'validating' | 'rejected' | 'confirm' | 'saving' | 'done'

type Props = {
  userId: string
  onClose: () => void
  onActivated: (signedUrl: string) => void
}

const MAX_SIDE = 1024
const JPEG_QUALITY = 0.85

async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  const img = document.createElement('img')
  const reader = new FileReader()
  const fileDataUrl = await new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  img.src = fileDataUrl
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })

  // Recorte cuadrado centrado para encuadre tipo credencial
  const minSide = Math.min(img.width, img.height)
  const sx = Math.round((img.width - minSide) / 2)
  const sy = Math.round((img.height - minSide) / 2)

  const targetSide = Math.min(minSide, MAX_SIDE)

  const canvas = document.createElement('canvas')
  canvas.width = targetSide
  canvas.height = targetSide
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo procesar la imagen')

  ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSide, targetSide)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Error al comprimir'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  })

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  return { blob, dataUrl }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1] || ''
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function ActivarCredencialModal({ userId, onClose, onActivated }: Props) {
  const [step, setStep] = useState<Step>('upload')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [rejectMsg, setRejectMsg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleFile = async (file: File) => {
    setErrorMsg(null)
    setRejectMsg(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Formato no soportado. Usa JPG, PNG o WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Imagen demasiado grande. Max 10MB.')
      return
    }
    setStep('validating')
    try {
      const { blob, dataUrl } = await compressImage(file)
      setPreviewBlob(blob)
      setPreviewUrl(dataUrl)

      const base64 = await blobToBase64(blob)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setErrorMsg('Sesion expirada. Vuelve a iniciar sesion.')
        setStep('upload')
        return
      }

      const res = await fetch(`${API_BASE}/credencial/validar-foto`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          image_base64: base64,
          mime_type: 'image/jpeg',
        }),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setErrorMsg(j.error || 'No se pudo validar la foto. Intenta de nuevo.')
        setStep('upload')
        return
      }

      const result = await res.json()
      if (result.ok) {
        setStep('confirm')
      } else {
        setRejectMsg(result.motivo || 'La foto no cumple los requisitos.')
        setStep('rejected')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStep('upload')
    }
  }

  const handleConfirm = async () => {
    if (!previewBlob) return
    setStep('saving')
    setErrorMsg(null)
    try {
      const path = `${userId}/credencial-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('credenciales')
        .upload(path, previewBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        })
      if (upErr) throw upErr

      const { data: signed, error: signErr } = await supabase.storage
        .from('credenciales')
        .createSignedUrl(path, 60 * 60 * 24 * 365)
      if (signErr || !signed?.signedUrl) {
        throw new Error('No se pudo generar la URL firmada')
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Sesion expirada')

      const patchRes = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ foto_credencial_url: signed.signedUrl }),
      })
      if (!patchRes.ok) {
        const j = await patchRes.json().catch(() => ({}))
        throw new Error(j.error || 'No se pudo guardar la credencial')
      }

      setStep('done')
      onActivated(signed.signedUrl)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStep('confirm')
    }
  }

  const reset = () => {
    setPreviewUrl(null)
    setPreviewBlob(null)
    setRejectMsg(null)
    setErrorMsg(null)
    setStep('upload')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/60 pb-6 pt-6 sm:items-center"
      onClick={onClose}
    >
      <div
        className="relative my-auto w-full max-w-md bg-[#FFFFFF] p-5 shadow-xl sm:rounded-[2px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 style={jost} className="text-[16px] font-extrabold uppercase text-[#111111]">
            ACTIVAR CREDENCIAL
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-[20px] leading-none text-[#666666] hover:text-[#111111]"
          >
            x
          </button>
        </div>

        {step === 'upload' && (
          <div className="mt-4">
            <p style={lato} className="text-[13px] leading-relaxed text-[#666666]">
              Toma una foto tipo INE o pasaporte: rostro de frente, hombros visibles, fondo neutro. La
              recortaremos en cuadrado y la validaremos al instante.
            </p>

            <ul className="mt-3 space-y-1.5">
              {[
                'Rostro de frente, mirando a la cámara',
                'Hombros visibles, encuadre tipo pasaporte',
                'Sin lentes oscuros, gorras ni headsets',
                'Buena iluminación, fondo neutro',
              ].map((req) => (
                <li key={req} style={lato} className="flex items-center gap-2 text-[12px] text-[#111111]">
                  <span className="h-1 w-1 rounded-full bg-[#CC4B37]" />
                  {req}
                </li>
              ))}
            </ul>

            {errorMsg && (
              <p style={lato} className="mt-3 text-[12px] text-[#CC4B37]">
                {errorMsg}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={jost}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[#111111] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              SUBIR / TOMAR FOTO
            </button>
          </div>
        )}

        {step === 'validating' && (
          <div className="mt-4 flex flex-col items-center py-8">
            {previewUrl && (
              <div className="relative h-40 w-40">
                <img
                  src={previewUrl}
                  alt=""
                  className="h-40 w-40 object-cover rounded-[2px]"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 40% 55% at 50% 50%, transparent 98%, rgba(0,0,0,0.55) 100%)',
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className="h-[78%] w-[58%] border-2 border-dashed border-white/80"
                    style={{ borderRadius: '50%' }}
                  />
                </div>
              </div>
            )}
            <p style={lato} className="mt-4 text-[13px] text-[#666666]">
              Validando foto...
            </p>
          </div>
        )}

        {step === 'rejected' && (
          <div className="mt-4">
            {previewUrl && (
              <div className="relative mx-auto h-40 w-40">
                <img
                  src={previewUrl}
                  alt=""
                  className="h-40 w-40 object-cover rounded-[2px] opacity-60"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 40% 55% at 50% 50%, transparent 98%, rgba(0,0,0,0.55) 100%)',
                  }}
                />
              </div>
            )}
            <p style={jost} className="mt-4 text-center text-[12px] font-extrabold uppercase text-[#CC4B37]">
              FOTO RECHAZADA
            </p>
            <p style={lato} className="mt-2 text-center text-[13px] text-[#111111]">
              {rejectMsg}
            </p>
            <button
              type="button"
              onClick={reset}
              style={jost}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[2px] bg-[#111111] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              SUBIR OTRA FOTO
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="mt-4">
            <p style={lato} className="text-[13px] text-[#666666]">
              Foto aprobada. Así se verá en tu credencial:
            </p>
            {previewUrl && (
              <div className="relative mx-auto mt-3 h-40 w-40">
                <img
                  src={previewUrl}
                  alt=""
                  className="h-40 w-40 object-cover rounded-[2px] border border-solid border-[#EEEEEE]"
                />
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse 40% 55% at 50% 50%, transparent 98%, rgba(0,0,0,0.55) 100%)',
                  }}
                />
              </div>
            )}

            {errorMsg && (
              <p style={lato} className="mt-3 text-center text-[12px] text-[#CC4B37]">
                {errorMsg}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={reset}
                style={jost}
                className="flex h-12 flex-1 items-center justify-center rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
              >
                REINTENTAR
              </button>
              <button
                type="button"
                onClick={() => void handleConfirm()}
                style={jost}
                className="flex h-12 flex-1 items-center justify-center rounded-[2px] bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
              >
                CONFIRMAR
              </button>
            </div>
          </div>
        )}

        {step === 'saving' && (
          <div className="mt-4 flex flex-col items-center py-8">
            <p style={lato} className="text-[13px] text-[#666666]">
              Guardando credencial...
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="mt-4 flex flex-col items-center py-6">
            <p style={jost} className="text-[14px] font-extrabold uppercase text-[#CC4B37]">
              CREDENCIAL ACTIVADA
            </p>
            <p style={lato} className="mt-2 text-center text-[13px] text-[#666666]">
              Tu credencial ya muestra tu foto institucional.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={jost}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[2px] bg-[#111111] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              LISTO
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
