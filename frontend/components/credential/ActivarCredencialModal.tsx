'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

type Step =
  | 'data'
  | 'upload'
  | 'camera'
  | 'validating'
  | 'rejected'
  | 'confirm'
  | 'saving'
  | 'done'

type Props = {
  userId: string
  initialNombre?: string | null
  initialFechaNac?: string | null
  initialFotoUrl?: string | null
  mode?: 'create' | 'edit'
  onClose: () => void
  onActivated: (payload: {
    fotoUrl: string
    nombreCompleto: string
    fechaNacimiento: string
  }) => void
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

export function ActivarCredencialModal({
  userId,
  initialNombre,
  initialFechaNac,
  initialFotoUrl,
  mode = 'create',
  onClose,
  onActivated,
}: Props) {
  const [step, setStep] = useState<Step>('data')
  const [nombreCompleto, setNombreCompleto] = useState<string>(initialNombre || '')
  const [fechaNac, setFechaNac] = useState<string>(initialFechaNac || '')
  const [dataError, setDataError] = useState<string | null>(null)
  const [keepExistingPhoto, setKeepExistingPhoto] = useState<boolean>(
    mode === 'edit' && !!initialFotoUrl
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [rejectMsg, setRejectMsg] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const validateData = (): boolean => {
    setDataError(null)
    const trimmed = nombreCompleto.trim()
    if (trimmed.length < 3) {
      setDataError('Escribe tu nombre completo (mínimo 3 caracteres).')
      return false
    }
    if (trimmed.length > 120) {
      setDataError('El nombre completo es demasiado largo (máx 120).')
      return false
    }
    if (!fechaNac) {
      setDataError('Selecciona tu fecha de nacimiento.')
      return false
    }
    const isoDateRe = /^\d{4}-\d{2}-\d{2}$/
    if (!isoDateRe.test(fechaNac)) {
      setDataError('Fecha de nacimiento inválida.')
      return false
    }
    const d = new Date(fechaNac + 'T00:00:00')
    if (Number.isNaN(d.getTime())) {
      setDataError('Fecha de nacimiento inválida.')
      return false
    }
    const now = new Date()
    const minDate = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate())
    const maxDate = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate())
    if (d < minDate || d > maxDate) {
      setDataError('Fecha fuera de rango. Debes tener al menos 13 años.')
      return false
    }
    return true
  }

  const goFromDataToUpload = () => {
    if (!validateData()) return
    setStep('upload')
  }

  const validateCapturedBlob = async (blob: Blob) => {
    setStep('validating')
    setErrorMsg(null)
    setRejectMsg(null)
    try {
      const base64 = await blobToBase64(blob)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setErrorMsg('Sesión expirada. Vuelve a iniciar sesión.')
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

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 1280 },
        },
        audio: false,
      })
      streamRef.current = stream
      setStep('camera')
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current
          void videoRef.current.play().catch(() => {})
        }
      }, 50)
    } catch (err) {
      console.error('[camera]', err)
      const name = err instanceof Error ? err.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError(
          'Necesitamos permiso para usar la cámara. Revisa los permisos del navegador o sube una foto desde tu galería.'
        )
      } else if (name === 'NotFoundError') {
        setCameraError('No se encontró cámara en este dispositivo. Sube una foto desde tu galería.')
      } else {
        setCameraError('No se pudo abrir la cámara. Sube una foto desde tu galería.')
      }
    }
  }

  const capturePhoto = async () => {
    const video = videoRef.current
    if (!video) return
    const w = video.videoWidth
    const h = video.videoHeight
    if (!w || !h) return

    const minSide = Math.min(w, h)
    const sx = Math.round((w - minSide) / 2)
    const sy = Math.round((h - minSide) / 2)
    const targetSide = Math.min(minSide, MAX_SIDE)

    const canvas = document.createElement('canvas')
    canvas.width = targetSide
    canvas.height = targetSide
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.translate(targetSide, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, sx, sy, minSide, minSide, 0, 0, targetSide, targetSide)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
    })
    if (!blob) return

    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)

    stopCamera()
    setPreviewBlob(blob)
    setPreviewUrl(dataUrl)
    await validateCapturedBlob(blob)
  }

  const handleFile = async (file: File) => {
    setErrorMsg(null)
    setRejectMsg(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setErrorMsg('Formato no soportado. Usa JPG, PNG o WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Imagen demasiado grande. Máx 10MB.')
      return
    }
    try {
      const { blob, dataUrl } = await compressImage(file)
      setPreviewBlob(blob)
      setPreviewUrl(dataUrl)
      await validateCapturedBlob(blob)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStep('upload')
    }
  }

  const handleClose = useCallback(() => {
    stopCamera()
    onClose()
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  const handleConfirm = async () => {
    setStep('saving')
    setErrorMsg(null)
    try {
      let signedUrl = initialFotoUrl || ''

      if (previewBlob) {
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
        signedUrl = signed.signedUrl
      }

      if (!signedUrl) {
        throw new Error('Falta foto de credencial')
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Sesión expirada')

      const patchRes = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          foto_credencial_url: signedUrl,
          credencial_nombre_completo: nombreCompleto.trim(),
          credencial_fecha_nacimiento: fechaNac,
        }),
      })
      if (!patchRes.ok) {
        const j = await patchRes.json().catch(() => ({}))
        throw new Error(j.error || 'No se pudo guardar la credencial')
      }

      setStep('done')
      onActivated({
        fotoUrl: signedUrl,
        nombreCompleto: nombreCompleto.trim(),
        fechaNacimiento: fechaNac,
      })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
      setStep('confirm')
    }
  }

  const reset = () => {
    stopCamera()
    setPreviewUrl(null)
    setPreviewBlob(null)
    setRejectMsg(null)
    setErrorMsg(null)
    setCameraError(null)
    setStep('upload')
    setKeepExistingPhoto(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/60 pb-6 pt-6 sm:items-center"
      onClick={handleClose}
    >
      <div
        className="relative my-auto w-full max-w-md bg-[#FFFFFF] p-5 shadow-xl sm:rounded-[2px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h2 style={jost} className="text-[16px] font-extrabold uppercase text-[#111111]">
            {mode === 'edit' ? 'EDITAR CREDENCIAL' : 'ACTIVAR CREDENCIAL'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar"
            className="text-[20px] leading-none text-[#666666] hover:text-[#111111]"
          >
            ×
          </button>
        </div>

        {step === 'data' && (
          <div className="mt-4">
            <p style={lato} className="text-[13px] leading-relaxed text-[#666666]">
              Estos datos aparecerán en tu credencial. No se muestran en tu perfil público.
            </p>

            <label style={lato} className="mt-4 block text-[12px] text-[#666666]">
              Nombre completo
              <input
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                placeholder="Ej. Luis García Pérez"
                maxLength={120}
                style={lato}
                className="mt-1.5 block h-12 w-full rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 text-[14px] text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </label>

            <label style={lato} className="mt-4 block text-[12px] text-[#666666]">
              Fecha de nacimiento
              <input
                type="date"
                value={fechaNac}
                onChange={(e) => setFechaNac(e.target.value)}
                max={new Date(new Date().getFullYear() - 13, new Date().getMonth(), new Date().getDate()).toISOString().slice(0, 10)}
                min={new Date(new Date().getFullYear() - 100, new Date().getMonth(), new Date().getDate()).toISOString().slice(0, 10)}
                style={lato}
                className="mt-1.5 block h-12 w-full rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 text-[14px] text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </label>

            {dataError && (
              <p style={lato} className="mt-3 text-[12px] text-[#CC4B37]">
                {dataError}
              </p>
            )}

            {mode === 'edit' && initialFotoUrl && (
              <div className="mt-5 flex items-center gap-3 border border-solid border-[#EEEEEE] p-3">
                <input
                  type="checkbox"
                  id="keepPhoto"
                  checked={keepExistingPhoto}
                  onChange={(e) => setKeepExistingPhoto(e.target.checked)}
                  className="h-4 w-4 accent-[#CC4B37]"
                />
                <label htmlFor="keepPhoto" style={lato} className="text-[12px] text-[#111111]">
                  Conservar foto actual (solo cambiar datos)
                </label>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (mode === 'edit' && keepExistingPhoto && initialFotoUrl) {
                  if (!validateData()) return
                  setPreviewUrl(initialFotoUrl)
                  setPreviewBlob(null)
                  setStep('confirm')
                } else {
                  goFromDataToUpload()
                }
              }}
              style={jost}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[2px] bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              CONTINUAR
            </button>
          </div>
        )}

        {step === 'upload' && (
          <div className="mt-4">
            <p style={lato} className="text-[13px] leading-relaxed text-[#666666]">
              Toma una foto tipo INE o pasaporte: rostro de frente, hombros visibles, fondo neutro. Verás un contorno guía mientras tomas la foto.
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

            {cameraError && (
              <p style={lato} className="mt-3 text-[12px] text-[#CC4B37]">
                {cameraError}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) void handleFile(f)
              }}
            />

            <button
              type="button"
              onClick={() => void startCamera()}
              style={jost}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
            >
              ABRIR CÁMARA
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={jost}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
            >
              SUBIR DESDE GALERÍA
            </button>
          </div>
        )}

        {step === 'camera' && (
          <div className="mt-4">
            <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 38% 52% at 50% 50%, transparent 98%, rgba(0,0,0,0.65) 100%)',
                }}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div
                  className="h-[78%] w-[58%] border-2 border-dashed border-white/90"
                  style={{ borderRadius: '50%' }}
                />
              </div>
            </div>

            <p style={lato} className="mt-3 text-center text-[12px] text-[#666666]">
              Coloca tu rostro dentro del óvalo. Hombros visibles.
            </p>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  stopCamera()
                  setStep('upload')
                }}
                style={jost}
                className="flex h-12 flex-1 items-center justify-center rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={() => void capturePhoto()}
                style={jost}
                className="flex h-12 flex-1 items-center justify-center rounded-[2px] bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
              >
                TOMAR FOTO
              </button>
            </div>
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
              onClick={handleClose}
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
