'use client'

import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

// Mismos topes que backend/src/lib/openrouterImage.js
const REF_MAX_BYTES = 8 * 1024 * 1024
const REF_MAX_COUNT = 6
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

type Preview = { url: string; ext: string }
type RefItem = { id: string; url: string; file: File }
type Phase = 'idle' | 'running' | 'ready' | 'error' | 'cancelled'

function fileToB64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const raw = String(reader.result || '')
      const comma = raw.indexOf(',')
      resolve(comma >= 0 ? raw.slice(comma + 1) : raw)
    }
    reader.onerror = () => reject(new Error('No se pudo leer una imagen.'))
    reader.readAsDataURL(file)
  })
}

function filesFromList(list: FileList | File[] | null | undefined): File[] {
  if (!list) return []
  return [...list]
}

function isAbort(err: unknown) {
  return err instanceof Error && err.name === 'AbortError'
}

export function GenerarFotosClient() {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [refs, setRefs] = useState<RefItem[]>([])
  const previewUrl = useRef<string | null>(null)
  const blobRef = useRef<Blob | null>(null)
  const refsRef = useRef<RefItem[]>([])
  const abortRef = useRef<AbortController | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
      for (const item of refsRef.current) URL.revokeObjectURL(item.url)
    }
  }, [])

  useEffect(() => {
    if (phase !== 'running') return
    const started = Date.now()
    setSeconds(0)
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - started) / 1000))
    }, 250)
    return () => window.clearInterval(id)
  }, [phase])

  function setRefList(next: RefItem[]) {
    refsRef.current = next
    setRefs(next)
  }

  function holdPreview(blob: Blob, ext: string) {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current)
    const url = URL.createObjectURL(blob)
    previewUrl.current = url
    blobRef.current = blob
    setPreview({ url, ext })
  }

  function addFiles(list: File[]) {
    if (loading) return
    const next = [...refsRef.current]
    let message = ''
    for (const file of list) {
      if (next.length >= REF_MAX_COUNT) {
        message = `Puedes adjuntar hasta ${REF_MAX_COUNT} imágenes.`
        break
      }
      if (file.size > REF_MAX_BYTES) {
        message = 'Cada referencia puede pesar hasta 8 MB.'
        continue
      }
      if (file.type && !ALLOWED_TYPES.has(file.type)) {
        message = 'Ese formato no se puede usar. Elige JPG, PNG o WebP.'
        continue
      }
      next.push({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
      })
    }
    setRefList(next)
    if (message) {
      setError(message)
      setPhase('error')
    }
  }

  function removeRef(id: string) {
    const item = refsRef.current.find((ref) => ref.id === id)
    if (item) URL.revokeObjectURL(item.url)
    setRefList(refsRef.current.filter((ref) => ref.id !== id))
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragOver(false)
    addFiles(filesFromList(e.dataTransfer.files))
  }

  function onPaste(e: ClipboardEvent) {
    const files = filesFromList(e.clipboardData.files)
    const fromItems: File[] = []
    if (!files.length) {
      for (const item of e.clipboardData.items) {
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file) fromItems.push(file)
        }
      }
    }
    const images = (files.length ? files : fromItems).filter(
      (file) => !file.type || file.type.startsWith('image/')
    )
    if (!images.length) return
    e.preventDefault()
    addFiles(images)
  }

  function cancel() {
    abortRef.current?.abort()
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading) return
    setError('')
    if (prompt.trim() === '') {
      setError('Escribe un prompt.')
      setPhase('error')
      return
    }
    if (model.trim() === '') {
      setError('Escribe el modelo de OpenRouter.')
      setPhase('error')
      return
    }

    const ac = new AbortController()
    abortRef.current = ac
    setLoading(true)
    setPhase('running')
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Sesión expirada. Vuelve a entrar.')
        setPhase('error')
        return
      }
      const references = await Promise.all(
        refsRef.current.map(async (item) => ({ b64: await fileToB64(item.file) }))
      )
      if (ac.signal.aborted) {
        setPhase('cancelled')
        return
      }
      const image = await api.admin.generarFoto(
        token,
        { prompt, model: model.trim(), references },
        ac.signal
      )
      const blob = await fetch(`data:${image.mediaType};base64,${image.b64}`).then((r) =>
        r.blob()
      )
      holdPreview(blob, image.ext || 'png')
      setPhase('ready')
    } catch (err) {
      if (isAbort(err)) {
        setError('')
        setPhase('cancelled')
        return
      }
      setError(err instanceof Error ? err.message : 'No se pudo generar la imagen.')
      setPhase('error')
    } finally {
      if (abortRef.current === ac) abortRef.current = null
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

  const status =
    phase === 'running'
      ? `Generando… ${seconds} s`
      : phase === 'ready'
        ? 'Listo.'
        : phase === 'cancelled'
          ? 'Cancelado.'
          : phase === 'error'
            ? error
            : ''

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 border-b border-solid border-[#EEEEEE] pb-4">
        <h1 className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl" style={jost}>
          Generar fotos
        </h1>
        <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#666666]" style={lato}>
          La imagen y las referencias se quedan en esta pantalla hasta que recargues. No se guardan en el servidor.
        </p>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} onPaste={onPaste} className="flex max-w-xl flex-col gap-4">
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

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`border border-dashed p-3 ${dragOver ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.05)]' : 'border-[#DDDDDD]'}`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              disabled={loading}
              className="sr-only"
              onChange={(e) => {
                addFiles(filesFromList(e.target.files))
                e.target.value = ''
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
              className="border border-solid border-[#111111] px-4 py-3 text-[12px] text-[#111111] disabled:opacity-50"
              style={jost}
            >
              Adjuntar imágenes
            </button>
            <p className="text-[13px] normal-case tracking-normal text-[#666666]" style={lato}>
              O arrástralas o pégalas. JPG, PNG o WebP. Hasta 6, de 8 MB cada una.
            </p>
          </div>
          {refs.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {refs.map((item, index) => (
                <li key={item.id} className="relative">
                  <img
                    src={item.url}
                    alt={`Referencia ${index + 1}`}
                    className="h-20 w-20 border border-solid border-[#EEEEEE] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeRef(item.id)}
                    disabled={loading}
                    aria-label={`Quitar referencia ${index + 1}`}
                    className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center bg-[#111111] text-[14px] text-white disabled:opacity-50"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="bg-[#111111] px-6 py-3 text-[12px] text-white disabled:opacity-50"
            style={jost}
          >
            {loading ? 'Generando…' : 'Generar'}
          </button>
          {loading ? (
            <button
              type="button"
              onClick={cancel}
              className="border border-solid border-[#111111] px-6 py-3 text-[12px] text-[#111111]"
              style={jost}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`mt-4 flex max-w-xl items-center gap-2 text-[13px] ${
          phase === 'error' ? 'text-[#CC4B37]' : phase === 'cancelled' ? 'text-[#666666]' : 'text-[#111111]'
        } ${status ? '' : 'sr-only'}`}
        style={lato}
      >
        {phase === 'running' ? (
          <span
            className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#111111] border-t-transparent"
            aria-hidden
          />
        ) : null}
        {status}
      </p>

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
