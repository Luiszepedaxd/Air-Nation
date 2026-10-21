'use client'

import { useRef, useState } from 'react'
import { arenaErrorMessage, arenaUploadFoto } from '@/lib/arena-api'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function PhotoUploader({
  fieldId,
  urls,
  onChange,
  max = 6,
}: {
  fieldId: string
  urls: string[]
  onChange: (urls: string[]) => void
  max?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const lleno = urls.length >= max

  const subir = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError('')
    setSubiendo(true)
    const nuevas = [...urls]
    try {
      for (const file of Array.from(files)) {
        if (nuevas.length >= max) break
        nuevas.push(await arenaUploadFoto(fieldId, file))
      }
      onChange(nuevas)
    } catch (err) {
      setError(arenaErrorMessage(err))
      if (nuevas.length !== urls.length) onChange(nuevas)
    } finally {
      setSubiendo(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative h-20 w-20 overflow-hidden border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((_, j) => j !== i))}
              aria-label={`Quitar foto ${i + 1}`}
              className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[#111111] text-[12px] leading-none text-white"
            >
              ×
            </button>
          </div>
        ))}
        {!lleno ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            style={jost}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 border border-dashed border-[#CCCCCC] bg-[#FFFFFF] text-[10px] text-[#666666] disabled:opacity-50"
          >
            {subiendo ? '...' : '+ FOTO'}
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => void subir(e.target.files)}
      />
      <p className="text-[11px] text-[#999999]" style={lato}>
        {urls.length}/{max} fotos · JPG, PNG o WebP, hasta 10 MB
      </p>
      {error ? (
        <p className="text-[12px] text-[#CC4B37]" style={lato}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
