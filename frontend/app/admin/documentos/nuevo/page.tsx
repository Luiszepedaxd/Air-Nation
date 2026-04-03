'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createDocument, type Authority } from '../actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

const MAX_BYTES = 20 * 1024 * 1024
const BUCKET = 'documents'

const AUTHORITIES: { value: Authority; label: string }[] = [
  { value: 'GN', label: 'GN' },
  { value: 'SSP', label: 'SSP' },
  { value: 'SCT', label: 'SCT' },
  { value: 'PM', label: 'PM' },
]

function sanitizeFileName(name: string): string {
  const base = name.replace(/^.*[/\\]/, '')
  const cleaned = base.replace(/[^\w.\-]+/g, '_')
  return cleaned.toLowerCase().endsWith('.pdf') ? cleaned : `${cleaned || 'documento'}.pdf`
}

export default function NuevoDocumentoPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [authority, setAuthority] = useState<Authority>('GN')
  const [ciudad, setCiudad] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [published, setPublished] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setError(null)
    if (!f) {
      setFile(null)
      return
    }
    if (f.type !== 'application/pdf') {
      setFile(null)
      setError('Solo se permiten archivos PDF.')
      e.target.value = ''
      return
    }
    if (f.size > MAX_BYTES) {
      setFile(null)
      setError('El archivo no puede superar 20 MB.')
      e.target.value = ''
      return
    }
    setFile(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const t = title.trim()
    const c = ciudad.trim()
    if (!t) {
      setError('El título es obligatorio.')
      return
    }
    if (!c) {
      setError('La ciudad es obligatoria.')
      return
    }
    if (!file) {
      setError('Selecciona un archivo PDF.')
      return
    }

    setUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('Debes iniciar sesión para subir documentos.')
        setUploading(false)
        return
      }

      const safeName = sanitizeFileName(file.name)
      const path = `${authority}/${Date.now()}-${safeName}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'application/pdf',
        })

      if (upErr) {
        setError(upErr.message || 'Error al subir el archivo.')
        setUploading(false)
        return
      }

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const file_url = pub.publicUrl

      const result = await createDocument({
        title: t,
        authority,
        ciudad: c,
        file_url,
        published,
      })

      if ('error' in result && result.error) {
        setError(result.error)
        setUploading(false)
        return
      }

      router.push('/admin/documentos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
      setUploading(false)
    }
  }

  return (
    <div className="p-6" style={latoBody}>
      <div className="mb-8">
        <Link
          href="/admin/documentos"
          className="mb-4 inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[0.65rem] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          VOLVER A DOCUMENTOS
        </Link>
        <h1
          className="mt-4 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          SUBIR DOCUMENTO
        </h1>
      </div>

      {error ? (
        <p className="mb-6 text-sm font-medium text-[#CC4B37]" role="alert">
          {error}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="max-w-xl space-y-6 border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-6"
      >
        <div>
          <label
            htmlFor="doc-title"
            className="mb-2 block text-[11px] tracking-[0.12em] text-[#111111]"
            style={jostHeading}
          >
            TÍTULO
          </label>
          <input
            id="doc-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={uploading}
            className="w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#CC4B37] disabled:opacity-60"
            style={{ ...latoBody, borderRadius: 2 }}
            placeholder="Ej. Lineamiento operativo 2024"
          />
        </div>

        <div>
          <label
            htmlFor="doc-authority"
            className="mb-2 block text-[11px] tracking-[0.12em] text-[#111111]"
            style={jostHeading}
          >
            AUTORIDAD
          </label>
          <select
            id="doc-authority"
            value={authority}
            onChange={(e) => setAuthority(e.target.value as Authority)}
            disabled={uploading}
            className="w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#CC4B37] disabled:opacity-60"
            style={{ ...latoBody, borderRadius: 2 }}
          >
            {AUTHORITIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="doc-ciudad"
            className="mb-2 block text-[11px] tracking-[0.12em] text-[#111111]"
            style={jostHeading}
          >
            CIUDAD
          </label>
          <input
            id="doc-ciudad"
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            required
            disabled={uploading}
            className="w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#CC4B37] disabled:opacity-60"
            style={{ ...latoBody, borderRadius: 2 }}
            placeholder="Nacional, CDMX, Guadalajara…"
          />
        </div>

        <div>
          <label
            htmlFor="doc-file"
            className="mb-2 block text-[11px] tracking-[0.12em] text-[#111111]"
            style={jostHeading}
          >
            ARCHIVO PDF (máx. 20 MB)
          </label>
          <input
            id="doc-file"
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="w-full text-sm text-[#111111] file:mr-3 file:border file:border-solid file:border-[#EEEEEE] file:bg-[#FFFFFF] file:px-3 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.1em] disabled:opacity-60"
            style={{ ...latoBody }}
          />
          {file ? (
            <p className="mt-2 text-sm text-[#666666]">
              Archivo: <span className="text-[#111111]">{file.name}</span> (
              {(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-3">
          <input
            id="doc-published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            disabled={uploading}
            className="h-4 w-4 accent-[#CC4B37] disabled:opacity-60"
          />
          <label
            htmlFor="doc-published"
            className="text-sm text-[#111111]"
          >
            Publicar inmediatamente
          </label>
        </div>

        {uploading ? (
          <div className="space-y-2" aria-live="polite">
            <div className="flex items-center gap-3 text-sm text-[#666666]">
              <span
                className="inline-block h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-solid border-[#EEEEEE] border-t-[#CC4B37]"
                aria-hidden
              />
              <span>Subiendo documento…</span>
            </div>
            <div className="h-2 w-full overflow-hidden bg-[#EEEEEE]">
              <div
                className="h-full w-1/3 animate-pulse bg-[#CC4B37]"
                style={{ animationDuration: '1.2s' }}
              />
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-[#CC4B37] px-4 py-3 text-[0.75rem] tracking-[0.14em] text-[#FFFFFF] transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          SUBIR
        </button>
      </form>
    </div>
  )
}
