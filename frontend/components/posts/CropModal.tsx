'use client'

import { useCallback, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

async function getCroppedFile(
  imageSrc: string,
  pixelCrop: Area,
  originalFile: File
): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = reject
    i.src = imageSrc
  })

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas vacío'))
        const ext = originalFile.type === 'image/png' ? 'png' : 'jpg'
        const type = originalFile.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(new File([blob], `crop_${Date.now()}.${ext}`, { type }))
      },
      originalFile.type === 'image/png' ? 'image/png' : 'image/jpeg',
      0.92
    )
  })
}

type Props = {
  imageSrc: string
  originalFile: File
  onConfirm: (croppedFile: File, preview: string) => void
  onCancel: () => void
}

export function CropModal({ imageSrc, originalFile, onConfirm, onCancel }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [loading, setLoading] = useState(false)

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setLoading(true)
    try {
      const croppedFile = await getCroppedFile(imageSrc, croppedAreaPixels, originalFile)
      const preview = URL.createObjectURL(croppedFile)
      onConfirm(croppedFile, preview)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          style={jost}
          className="text-[12px] font-extrabold uppercase text-white/70"
        >
          CANCELAR
        </button>
        <p style={jost} className="text-[12px] font-extrabold uppercase text-white">
          AJUSTAR FOTO
        </p>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={loading}
          style={jost}
          className="text-[12px] font-extrabold uppercase text-[#CC4B37] disabled:opacity-50"
        >
          {loading ? 'CARGANDO…' : 'LISTO'}
        </button>
      </div>

      {/* Cropper área — altura fija para que el slider siempre sea visible */}
      <div className="relative" style={{ height: 'calc(100dvh - 120px - env(safe-area-inset-bottom))' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          showGrid
          style={{
            containerStyle: { background: '#000' },
            cropAreaStyle: {
              border: '2px solid #CC4B37',
            },
          }}
        />
      </div>

      {/* Zoom slider — pegado bajo el cropper, sobre safe area */}
      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="white" strokeWidth="1.8" />
          <path d="M8 11h6M11 8v6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.5 16.5L21 21" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 accent-[#CC4B37]"
          aria-label="Zoom"
        />
      </div>
    </div>
  )
}
