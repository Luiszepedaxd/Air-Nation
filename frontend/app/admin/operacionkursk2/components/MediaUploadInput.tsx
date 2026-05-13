'use client'

import { useRef, useState } from 'react'
import { uploadFile, uploadVideo } from '@/lib/apiFetch'

const ACCEPTED_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/jfif', 'image/pjpeg', 'image/pjp']
const ACCEPTED_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_VIDEO_MB = 100
const MAX_IMAGE_MB = 5

export type HeroMediaType = 'image' | 'video'

type Props = {
  label: string
  currentUrl: string
  currentType: HeroMediaType
  slug: string
  onChange: (url: string, type: HeroMediaType) => void
}

export function MediaUploadInput({
  label,
  currentUrl,
  currentType,
  slug,
  onChange,
}: Props) {
  void slug
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setBusy(true)
    setProgress('Subiendo…')

    try {
      const isVideo = ACCEPTED_VIDEO.includes(file.type)
      const isImage = ACCEPTED_IMAGE.includes(file.type)

      if (!isVideo && !isImage) {
        throw new Error('Formato no soportado. Usa JPG, PNG, WebP o MP4/MOV/WebM.')
      }

      if (isImage && file.size > MAX_IMAGE_MB * 1024 * 1024) {
        throw new Error(`Imagen excede ${MAX_IMAGE_MB}MB.`)
      }
      if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
        throw new Error(`Video excede ${MAX_VIDEO_MB}MB.`)
      }

      if (isVideo) {
        setProgress('Subiendo video…')
        const result = await uploadVideo(file)
        if (!result?.video_url) throw new Error('Upload de video sin URL.')
        onChange(result.video_url, 'video')
      } else {
        setProgress('Subiendo imagen…')
        const url = await uploadFile(file)
        if (!url) throw new Error('Upload de imagen sin URL.')
        onChange(url, 'image')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
    } finally {
      setBusy(false)
      setProgress('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleClear() {
    onChange('', 'image')
  }

  return (
    <div className="block">
      <span
        className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
        style={{ fontFamily: 'Jost, sans-serif' }}
      >
        {label}
      </span>

      {currentUrl ? (
        <div className="mt-2 border border-[#EEEEEE] bg-[#F4F4F4] p-3">
          {currentType === 'video' ? (
            <video
              src={currentUrl}
              controls
              muted
              playsInline
              className="block max-h-48 w-full bg-black object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- preview admin
            <img src={currentUrl} alt="" className="block max-h-48 w-full bg-black object-contain" />
          )}
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-[#666]">
              {currentType === 'video' ? 'VIDEO' : 'IMAGEN'} actual
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-[10px] uppercase tracking-[0.12em] text-[#CC4B37] hover:underline"
            >
              Quitar
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-2">
        <input
          ref={fileInputRef}
          type="file"
          accept={[...ACCEPTED_IMAGE, ...ACCEPTED_VIDEO].join(',')}
          onChange={handleFile}
          disabled={busy}
          className="block w-full text-[12px] text-[#666] file:mr-3 file:cursor-pointer file:border file:border-solid file:border-[#CC4B37] file:bg-white file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em] file:text-[#CC4B37] hover:file:bg-[#CC4B37] hover:file:text-white"
        />
        <p className="mt-1.5 text-[11px] text-[#999]">
          JPG/PNG/WebP máx 5MB · MP4/MOV/WebM máx 100MB
        </p>
        {progress ? <p className="mt-1 text-[11px] text-[#CC4B37]">{progress}</p> : null}
        {error ? <p className="mt-1 text-[11px] text-[#CC4B37]">{error}</p> : null}
      </div>
    </div>
  )
}
