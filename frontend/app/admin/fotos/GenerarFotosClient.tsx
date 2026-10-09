'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

type Preview = { url: string; ext: string }

export function GenerarFotosClient() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)
  const previewUrl = useRef<string | null>(null)
  const blobRef = useRef<Blob | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    }
  }, [])

  function holdPreview(blob: Blob, ext: string) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    const url = URL.createObjectURL(blob)
    previewUrl.current = url
    blobRef.current = blob
    setPreview({ url, ext })
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    if (prompt.trim() === '') {
      setError('Escribe un prompt.')
      return
    }
    if (model.trim() === '') {
      setError('Escribe el modelo de OpenRouter.')
      return
    }

    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Sesión expirada. Vuelve a entrar.')
        return
      }
      const image = await api.admin.generarFoto(token, {
        prompt,
        model: model.trim(),
      })
      const blob = await fetch(`data:${image.mediaType};base64,${image.b64}`).then((r) =>
        r.blob()
      )
      holdPreview(blob, image.ext || 'png')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la imagen.')
    } finally {
      setLoading(false)
    }
  }

  function download() {
    const blob = blobRef.current
    if (!blob || !preview) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `airnation-foto.${preview.ext}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 border-b border-solid border-[#EEEEEE] pb-4">
        <h1 className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl" style={jost}>
          Generar fotos
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#666666]" style={lato}>
          La imagen se queda en esta pantalla hasta que la descargues o recargues. No se guarda en el servidor.
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="flex max-w-xl flex-col gap-4">
        <label className="flex flex-col gap-1 text-[11px] tracking-[0.14em] text-[#666666]" style={jost}>
          Prompt
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            required
            disabled={loading}
            className="border border-solid border-[#DDDDDD] px-3 py-2 text-[14px] normal-case tracking-normal text-[#111111] outline-none focus:border-[#111111]"
            style={lato}
          />
        </label>
        <label className="flex flex-col gap-1 text-[11px] tracking-[0.14em] text-[#666666]" style={jost}>
          Modelo de OpenRouter
          <input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="google/gemini-2.5-flash-image"
            required
            disabled={loading}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="border border-solid border-[#DDDDDD] px-3 py-3 text-[14px] normal-case tracking-normal text-[#111111] outline-none focus:border-[#111111]"
            style={lato}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="bg-[#111111] px-6 py-3 text-[12px] text-white disabled:opacity-50"
          style={jost}
        >
          {loading ? 'Generando…' : 'Generar'}
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-4 max-w-xl text-[13px] text-[#CC4B37]" style={lato}>
          {error}
        </p>
      ) : null}

      {preview ? (
        <div className="mt-6 max-w-xl">
          <img
            src={preview.url}
            alt="Imagen generada"
            className="h-auto w-full border border-solid border-[#EEEEEE] bg-[#FAFAFA]"
          />
          <button
            type="button"
            onClick={download}
            className="mt-3 border border-solid border-[#111111] px-6 py-3 text-[12px] text-[#111111]"
            style={jost}
          >
            Descargar
          </button>
        </div>
      ) : null}
    </div>
  )
}
