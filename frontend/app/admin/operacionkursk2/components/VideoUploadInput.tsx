'use client'

import { useState, useRef } from 'react'
import { uploadVideo } from '@/lib/apiFetch'

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/webm']
const MAX_MB = 100

type Props = {
  value: string
  onChange: (url: string) => void
}

export function VideoUploadInput({ value, onChange }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (file.size === 0) {
      setError('Video vacío o corrupto.')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Video excede ${MAX_MB}MB`)
      return
    }
    if (!ACCEPTED.includes(file.type)) {
      setError('Formato no soportado. Usa MP4, MOV o WebM.')
      return
    }

    setBusy(true)
    setProgress('Subiendo video a R2…')
    try {
      const result = await uploadVideo(file)
      if (!result?.video_url) throw new Error('Upload sin URL')
      onChange(result.video_url)
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
    onChange('')
    setError(null)
  }

  return (
    <div className="block">
      {value ? (
        <div className="mb-2 border border-[#EEEEEE] bg-[#F4F4F4] p-2">
          <video
            src={value}
            controls
            muted
            playsInline
            className="block max-h-40 w-full bg-black object-contain"
          />
          <button
            type="button"
            onClick={handleClear}
            className="mt-2 text-[10px] uppercase tracking-[0.12em] text-[#CC4B37] hover:underline"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
          >
            × Quitar video
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={handleFile}
        disabled={busy}
        className="block w-full text-[12px] text-[#666] file:mr-3 file:cursor-pointer file:border file:border-solid file:border-[#CC4B37] file:bg-white file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em] file:text-[#CC4B37] hover:file:bg-[#CC4B37] hover:file:text-white"
      />

      <p className="mt-1 text-[11px] text-[#999]">
        MP4 / MOV / WebM · máx {MAX_MB}MB
      </p>

      {progress ? (
        <p className="mt-1 text-[11px] text-[#CC4B37]">{progress}</p>
      ) : null}

      {error ? (
        <p
          className="mt-1.5 text-[11px] text-[#CC4B37]"
          style={{ fontFamily: 'Jost, sans-serif', fontWeight: 600 }}
        >
          ⚠ {error}
        </p>
      ) : null}
    </div>
  )
}
