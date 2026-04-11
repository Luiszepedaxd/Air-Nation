'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadFile } from '@/lib/apiFetch'

const jostBtn = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])

function loadImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ w: img.naturalWidth, h: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo leer la imagen'))
    }
    img.src = url
  })
}

function Spinner() {
  return (
    <svg
      className="h-8 w-8 animate-spin text-[#FFFFFF]"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export type ImageUploadFieldProps = {
  label: string
  currentUrl: string | null
  onUpload: (url: string) => void
  onError: (msg: string) => void
  aspectRatio: 'square' | 'landscape'
  maxSizeMB: number
  minWidth: number
  minHeight: number
  recommendedText: string
  onUploadStart?: () => void
  onUploadEnd?: () => void
}

export function ImageUploadField({
  label,
  currentUrl,
  onUpload,
  onError,
  aspectRatio,
  maxSizeMB,
  minWidth,
  minHeight,
  recommendedText,
  onUploadStart,
  onUploadEnd,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setPreview(currentUrl)
  }, [currentUrl])

  const openPicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return

      if (!ALLOWED.has(file.type)) {
        onError('Solo se permiten imágenes JPG, PNG o WebP')
        return
      }

      const maxBytes = maxSizeMB * 1024 * 1024
      if (file.size > maxBytes) {
        onError(`La imagen no debe pesar más de ${maxSizeMB} MB`)
        return
      }

      let w = 0
      let h = 0
      try {
        const dim = await loadImageDimensions(file)
        w = dim.w
        h = dim.h
      } catch {
        onError('No se pudo leer la imagen.')
        return
      }

      if (w < minWidth || h < minHeight) {
        onError(
          `La imagen debe medir al menos ${minWidth}×${minHeight} px`
        )
        return
      }

      setUploading(true)
      onUploadStart?.()
      try {
        const uploadedUrl = await uploadFile(file)
        setPreview(uploadedUrl)
        onUpload(uploadedUrl)
      } catch {
        onError('Error de red. Intenta de nuevo.')
      } finally {
        setUploading(false)
        onUploadEnd?.()
      }
    },
    [
      maxSizeMB,
      minWidth,
      minHeight,
      onError,
      onUpload,
      onUploadStart,
      onUploadEnd,
    ]
  )

  const previewBox =
    aspectRatio === 'square' ? (
      <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-[#F4F4F4]">
        {preview ? (
          <img
            src={preview}
            alt=""
            width={80}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] text-[#AAAAAA]" style={lato}>
            Sin imagen
          </div>
        )}
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.45)]">
            <Spinner />
          </div>
        ) : null}
      </div>
    ) : (
      <div className="relative w-full max-w-[320px] overflow-hidden bg-[#F4F4F4]">
        <div className="aspect-video w-full">
          {preview ? (
            <img
              src={preview}
              alt=""
              width={640}
              height={360}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[120px] w-full items-center justify-center text-[11px] text-[#AAAAAA]" style={lato}>
              Sin imagen
            </div>
          )}
        </div>
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.45)]">
            <Spinner />
          </div>
        ) : null}
      </div>
    )

  return (
    <div>
      <p
        className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
        style={jostBtn}
      >
        {label}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        {previewBox}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <button
            type="button"
            onClick={openPicker}
            disabled={uploading}
            style={jostBtn}
            className="inline-flex w-fit items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {preview ? 'Cambiar' : 'Subir imagen'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => void handleChange(e)}
          />
          {uploading ? (
            <p className="text-[12px] text-[#666666]" style={lato}>
              Subiendo imagen…
            </p>
          ) : null}
          <p className="text-[11px] leading-snug text-[#999999]" style={lato}>
            {recommendedText}
          </p>
        </div>
      </div>
    </div>
  )
}
