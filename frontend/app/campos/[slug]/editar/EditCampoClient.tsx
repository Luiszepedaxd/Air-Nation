'use client'

import { useCallback, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ImageUploadField } from '@/components/ui/ImageUploadField'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const UPLOAD_ENDPOINT = `${API_URL}/upload`

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_GALLERY = 6
const MAX_GALLERY_MB = 5

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

async function postUpload(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(UPLOAD_ENDPOINT, { method: 'POST', body: fd })
  const json = (await res.json().catch(() => ({}))) as {
    url?: string
    error?: string
  }
  if (!res.ok) {
    throw new Error(json.error || 'Error al subir la imagen.')
  }
  if (!json.url || typeof json.url !== 'string') {
    throw new Error('Respuesta inválida del servidor.')
  }
  return json.url
}

function horariosToString(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'string') return raw
  try {
    return JSON.stringify(raw)
  } catch {
    return String(raw)
  }
}

export type EditableFieldPayload = {
  id: string
  nombre: string
  descripcion: string | null
  horarios: unknown
  ubicacion_lat: number | string | null
  ubicacion_lng: number | string | null
  telefono: string | null
  instagram: string | null
  foto_portada_url: string | null
  galeria_urls: string[]
  team_id: string | null
}

function FormSection({
  title,
  children,
  first,
}: {
  title: string
  children: ReactNode
  first?: boolean
}) {
  return (
    <div className={first ? '' : 'mt-10 border-t border-solid border-[#EEEEEE] pt-10'}>
      <p
        className="mb-5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
        style={jost}
      >
        {title}
      </p>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label
        className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
        style={jost}
      >
        {label}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  'w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'

export function EditCampoClient({
  fieldId,
  publicSlug,
  field,
  teamsForSelect,
}: {
  fieldId: string
  publicSlug: string
  field: EditableFieldPayload
  teamsForSelect: { id: string; nombre: string }[]
}) {
  const router = useRouter()
  const [nombre, setNombre] = useState(field.nombre)
  const [descripcion, setDescripcion] = useState(field.descripcion ?? '')
  const [horarios, setHorarios] = useState(horariosToString(field.horarios))
  const [teamId, setTeamId] = useState(field.team_id ?? '')
  const [lat, setLat] = useState(
    field.ubicacion_lat != null && field.ubicacion_lat !== ''
      ? String(field.ubicacion_lat)
      : ''
  )
  const [lng, setLng] = useState(
    field.ubicacion_lng != null && field.ubicacion_lng !== ''
      ? String(field.ubicacion_lng)
      : ''
  )
  const [telefono, setTelefono] = useState(field.telefono ?? '')
  const [instagram, setInstagram] = useState(field.instagram ?? '')
  const [fotoPortadaUrl, setFotoPortadaUrl] = useState(
    field.foto_portada_url ?? ''
  )
  const [galeriaUrls, setGaleriaUrls] = useState<string[]>(field.galeria_urls)
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([])
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeUploads, setActiveUploads] = useState(0)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const totalGalleryCount = galeriaUrls.length + newGalleryFiles.length

  const removeExistingGalleryAt = (index: number) => {
    setGaleriaUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const removeNewGalleryAt = (index: number) => {
    URL.revokeObjectURL(newGalleryPreviews[index] ?? '')
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const onGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const nextFiles = [...newGalleryFiles]
    const nextPreviews = [...newGalleryPreviews]

    for (const file of files) {
      if (galeriaUrls.length + nextFiles.length >= MAX_GALLERY) {
        setError(`Máximo ${MAX_GALLERY} fotos en la galería.`)
        break
      }
      if (!ALLOWED.has(file.type)) {
        setError('Solo se permiten imágenes JPG, PNG o WebP.')
        continue
      }
      if (file.size > MAX_GALLERY_MB * 1024 * 1024) {
        setError(`Cada foto debe pesar como máximo ${MAX_GALLERY_MB} MB.`)
        continue
      }
      setError('')
      nextFiles.push(file)
      nextPreviews.push(URL.createObjectURL(file))
    }

    setNewGalleryFiles(nextFiles)
    setNewGalleryPreviews(nextPreviews)
  }

  const parseCoord = (raw: string): number | null => {
    const t = raw.trim()
    if (!t) return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }

  const handleSave = useCallback(async () => {
    const n = nombre.trim()
    if (!n || n.length > 80) {
      setError('El nombre es obligatorio (máx. 80 caracteres).')
      return
    }
    if (descripcion.length > 500 || horarios.length > 200) {
      setError('Revisa los límites de descripción u horarios.')
      return
    }
    if (activeUploads > 0) return

    setSaving(true)
    setError('')

    let uploaded: string[] = []
    try {
      for (const file of newGalleryFiles) {
        uploaded.push(await postUpload(file))
      }
    } catch (e) {
      setSaving(false)
      setError(e instanceof Error ? e.message : 'Error al subir la galería.')
      return
    }

    const mergedGallery = [...galeriaUrls, ...uploaded].slice(0, MAX_GALLERY)

    const team_id = teamId.trim() || null

    const payload = {
      nombre: n,
      descripcion: descripcion.trim() || null,
      horarios: horarios.trim() || null,
      ubicacion_lat: parseCoord(lat),
      ubicacion_lng: parseCoord(lng),
      telefono: telefono.trim() || null,
      instagram: instagram.trim() || null,
      foto_portada_url: fotoPortadaUrl.trim() || null,
      galeria_urls: mergedGallery.length > 0 ? mergedGallery : null,
      team_id,
    }

    const { error: upErr } = await supabase
      .from('fields')
      .update(payload)
      .eq('id', fieldId)

    setSaving(false)

    if (upErr) {
      console.error('[EditCampoClient] fields UPDATE:', upErr)
      setError(upErr.message)
      return
    }

    newGalleryPreviews.forEach((u) => URL.revokeObjectURL(u))
    setNewGalleryFiles([])
    setNewGalleryPreviews([])

    router.refresh()
    router.push(`/mi-campo/${encodeURIComponent(fieldId)}`)
  }, [
    nombre,
    descripcion,
    horarios,
    lat,
    lng,
    telefono,
    instagram,
    fotoPortadaUrl,
    galeriaUrls,
    newGalleryFiles,
    newGalleryPreviews,
    teamId,
    fieldId,
    router,
    activeUploads,
  ])

  return (
    <div className="mx-auto max-w-[480px] px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1
          style={jost}
          className="text-[20px] font-extrabold uppercase leading-tight text-[#111111] md:text-[24px]"
        >
          Editar campo
        </h1>
        <Link
          href={`/campos/${encodeURIComponent(publicSlug)}`}
          className="text-[12px] text-[#666666] underline"
          style={lato}
        >
          Ver ficha pública
        </Link>
      </div>

      <FormSection title="INFORMACIÓN BÁSICA" first>
        <Field label="Nombre del campo">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={80}
            className={inputClass}
          />
        </Field>
        <Field label="Descripción">
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            maxLength={500}
            className={`${inputClass} resize-y`}
          />
          <p className="mt-1 text-[11px] text-[#999999]" style={lato}>
            {descripcion.length}/500
          </p>
        </Field>
        <Field label="Horarios">
          <textarea
            value={horarios}
            onChange={(e) => setHorarios(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Sáb y Dom 8am-6pm / Previa cita"
            className={`${inputClass} resize-y`}
          />
        </Field>
        <Field label="Asociar equipo (opcional)">
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className={inputClass}
          >
            <option value="">Sin equipo asociado</option>
            {teamsForSelect.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </Field>
      </FormSection>

      <FormSection title="UBICACIÓN Y CONTACTO">
        <Field label="Latitud">
          <input
            type="number"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            step="any"
            placeholder="20.6597"
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-[#999999]" style={lato}>
            Abre Google Maps, clic derecho en tu ubicación, copia las coordenadas.
          </p>
        </Field>
        <Field label="Longitud">
          <input
            type="number"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            step="any"
            placeholder="-103.3496"
            className={inputClass}
          />
        </Field>
        <Field label="Teléfono">
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+52 33 1234 5678"
            className={inputClass}
          />
        </Field>
        <Field label="Instagram">
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@campo_airsoft_gdl"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="IMÁGENES">
        <ImageUploadField
          label="FOTO DE PORTADA"
          currentUrl={fotoPortadaUrl.trim() || null}
          onUpload={(url) => setFotoPortadaUrl(url)}
          onError={(msg) => setError(msg)}
          aspectRatio="landscape"
          maxSizeMB={5}
          minWidth={800}
          minHeight={300}
          recommendedText="JPG, PNG o WebP · Mínimo 800×300px · Máx 5MB"
          onUploadStart={() => setActiveUploads((n) => n + 1)}
          onUploadEnd={() => setActiveUploads((n) => Math.max(0, n - 1))}
        />

        <div>
          <p
            className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jost}
          >
            Galería (hasta 6 fotos)
          </p>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={onGalleryPick}
          />
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            disabled={totalGalleryCount >= MAX_GALLERY || saving}
            style={jost}
            className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:opacity-45"
          >
            Añadir fotos
          </button>
          {galeriaUrls.length > 0 || newGalleryPreviews.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {galeriaUrls.map((src, i) => (
                <div
                  key={`u-${src}-${i}`}
                  className="relative h-20 w-20 overflow-hidden bg-[#F4F4F4]"
                >
                  <img
                    src={src}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeExistingGalleryAt(i)}
                    className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[#111111] text-[11px] font-bold text-white"
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
              {newGalleryPreviews.map((src, i) => (
                <div
                  key={`n-${src}-${i}`}
                  className="relative h-20 w-20 overflow-hidden bg-[#F4F4F4]"
                >
                  <img
                    src={src}
                    alt=""
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewGalleryAt(i)}
                    className="absolute right-0 top-0 flex h-6 w-6 items-center justify-center bg-[#111111] text-[11px] font-bold text-white"
                    aria-label="Quitar foto"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </FormSection>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || activeUploads > 0}
          style={jost}
          className="rounded-[2px] bg-[#CC4B37] px-6 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link
          href={`/mi-campo/${encodeURIComponent(fieldId)}`}
          style={jost}
          className="inline-flex items-center rounded-[2px] border border-[#EEEEEE] px-6 py-3 text-[12px] font-extrabold uppercase text-[#666666]"
        >
          Cancelar
        </Link>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[#CC4B37]" style={lato} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
