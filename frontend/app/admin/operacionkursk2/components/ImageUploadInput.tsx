'use client'

import { useRef, useState } from 'react'
import { uploadFile } from '@/lib/apiFetch'

const MAX_MB = 5

type Props = {
  slug: string
  value: string
  onChange: (url: string) => void
}

export function ImageUploadInput({ slug, value, onChange }: Props) {
  void slug
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    if (file.size === 0) {
      setError('El archivo está vacío. Descárgalo de nuevo.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Imagen excede ${MAX_MB}MB`)
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setBusy(true)
    try {
      const url = (await uploadFile(file)).trim()
      if (!url) {
        throw new Error('Upload sin URL devuelta')
      }
      onChange(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al subir'
      setError(msg)
      console.error('[ImageUploadInput] error:', err)
    } finally {
      setBusy(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleClear() {
    onChange('')
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="block">
      {value ? (
        <div className="mb-2 flex items-center gap-3 border border-[#EEEEEE] bg-[#F4F4F4] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-16 border border-[#EEEEEE] bg-white object-contain"
          />
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] uppercase tracking-[0.12em] text-[#CC4B37] hover:underline"
            style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700 }}
          >
            × Quitar
          </button>
        </div>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.jfif,.pjpeg,.pjp"
        onChange={handleFile}
        disabled={busy}
        className="block w-full text-[12px] text-[#666] file:mr-3 file:cursor-pointer file:border file:border-solid file:border-[#CC4B37] file:bg-white file:px-3 file:py-1.5 file:text-[10px] file:font-bold file:uppercase file:tracking-[0.12em] file:text-[#CC4B37] hover:file:bg-[#CC4B37] hover:file:text-white"
      />

      {busy ? <p className="mt-1 text-[11px] text-[#CC4B37]">Subiendo…</p> : null}

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
