'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/apiFetch'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const ALLOWED_IMG = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_PHOTOS = 4
const MAX_MB = 5
const MAX_BYTES = MAX_MB * 1024 * 1024

type PendingPhoto = { id: string; file: File; preview: string }

function validateImage(file: File): string | null {
  if (!ALLOWED_IMG.has(file.type)) return 'Solo JPG, PNG o WebP'
  if (file.size > MAX_BYTES) return `Máximo ${MAX_MB}MB por foto`
  return null
}

export function EventoPostBoxMini({
  eventId,
  userId,
  userAlias,
  userAvatar,
  onPublished,
}: {
  eventId: string
  userId: string
  userAlias: string | null
  userAvatar: string | null
  onPublished: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [text, setText] = useState('')
  const [pending, setPending] = useState<PendingPhoto[]>([])
  const [publishing, setPublishing] = useState(false)
  const [err, setErr] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const removePhoto = (id: string) => {
    setPending((prev) => {
      const f = prev.find((x) => x.id === id)
      if (f) URL.revokeObjectURL(f.preview)
      return prev.filter((x) => x.id !== id)
    })
  }

  const addFiles = (files: FileList | null) => {
    if (!files?.length) return
    setErr('')
    const next: PendingPhoto[] = []
    let firstErr: string | null = null
    for (const file of Array.from(files)) {
      if (pending.length + next.length >= MAX_PHOTOS) break
      const vErr = validateImage(file)
      if (vErr) {
        if (!firstErr) firstErr = vErr
        continue
      }
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`
      next.push({ id, file, preview: URL.createObjectURL(file) })
    }
    if (firstErr) setErr(firstErr)
    if (next.length) setPending((p) => [...p, ...next])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const canPublish = text.trim().length > 0 || pending.length > 0

  const handlePublish = async () => {
    if (!canPublish || publishing) return
    setPublishing(true)
    setErr('')
    try {
      const urls: string[] = []
      for (const p of pending) {
        urls.push(await uploadFile(p.file))
      }

      const content = text.trim() || null
      const { error } = await supabase.from('player_posts').insert({
        user_id: userId,
        content,
        fotos_urls: urls,
        event_id: eventId,
        published: true,
      })

      if (error) {
        console.error('[EventoPostBoxMini] insert', error)
        setErr('No se pudo publicar. Intenta de nuevo.')
        return
      }

      setText('')
      for (const p of pending) URL.revokeObjectURL(p.preview)
      setPending([])
      setExpanded(false)
      onPublished()
    } catch (e) {
      console.error('[EventoPostBoxMini] handlePublish', e)
      setErr('Error inesperado.')
    } finally {
      setPublishing(false)
    }
  }

  if (!expanded) {
    return (
      <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
            {userAvatar ? (
              <img
                src={userAvatar}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#CC4B37]"
                style={jost}
              >
                {(userAlias || 'T')[0].toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex-1 bg-[#F4F4F4] px-3 py-2 text-left text-[13px] text-[#AAAAAA]"
            style={lato}
          >
            Comparte tu momento del evento…
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
          {userAvatar ? (
            <img src={userAvatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-[13px] font-bold text-[#CC4B37]"
              style={jost}
            >
              {(userAlias || 'T')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="mb-2 text-[11px] font-extrabold uppercase text-[#CC4B37]"
            style={jost}
          >
            PUBLICANDO EN ESTE EVENTO
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="¿Qué pasó en la partida?"
            className="w-full resize-none border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] focus:border-[#CC4B37] focus:outline-none"
            style={lato}
          />
          <p className="mt-1 text-[11px] text-[#999999]" style={lato}>
            {text.length}/500
          </p>
        </div>
      </div>

      {pending.length > 0 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {pending.map((p) => (
            <div key={p.id} className="relative aspect-square overflow-hidden bg-[#F4F4F4]">
              <img
                src={p.preview}
                alt=""
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(p.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center bg-black/70 text-white"
                aria-label="Quitar foto"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {err ? (
        <p className="mt-3 text-[12px] text-[#CC4B37]" style={lato}>
          {err}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending.length >= MAX_PHOTOS || publishing}
            className="flex items-center gap-1.5 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[11px] font-extrabold uppercase text-[#666666] disabled:opacity-50"
            style={jost}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h3l1.5-2h7L17 7h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            FOTO ({pending.length}/{MAX_PHOTOS})
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setExpanded(false)
              setText('')
              for (const p of pending) URL.revokeObjectURL(p.preview)
              setPending([])
              setErr('')
            }}
            disabled={publishing}
            className="min-h-[40px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 text-[11px] font-extrabold uppercase text-[#666666]"
            style={jost}
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={!canPublish || publishing}
            className="min-h-[40px] bg-[#CC4B37] px-4 text-[11px] font-extrabold uppercase text-[#FFFFFF] disabled:opacity-50"
            style={jost}
          >
            {publishing ? 'PUBLICANDO…' : 'PUBLICAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
