'use client'

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { updateFieldAdmin } from '@/app/admin/campos/field-edit-actions'
import { supabase } from '@/lib/supabase'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import {
  FIELD_DAY_KEYS,
  FIELD_DAY_LABELS,
  type FieldDayKey,
  type WeekScheduleState,
  defaultWeekSchedule,
  weekScheduleFromJson,
  weekScheduleToJson,
} from '@/lib/field-schedule'
import { useLoadScript, Autocomplete } from '@react-google-maps/api'

const GOOGLE_LIBRARIES: ('places')[] = ['places']

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

export type EditableFieldPayload = {
  id: string
  nombre: string
  ciudad: string | null
  descripcion: string | null
  horarios_json: unknown
  direccion: string | null
  maps_url: string | null
  logo_url: string | null
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

function HorariosSemanaEditor({
  value,
  onChange,
}: {
  value: WeekScheduleState
  onChange: (next: WeekScheduleState) => void
}) {
  const setDay = (key: FieldDayKey, patch: Partial<WeekScheduleState[FieldDayKey]>) => {
    onChange({
      ...value,
      [key]: { ...value[key], ...patch },
    })
  }

  return (
    <div className="w-full">
      {FIELD_DAY_KEYS.map((day) => {
        const row = value[day]
        const open = row.abierto
        return (
          <div
            key={day}
            className="flex flex-wrap items-center gap-3 border-b border-[#EEEEEE] py-3 first:pt-0"
          >
            <span
              className="w-28 shrink-0 font-bold text-sm text-[#111111]"
              style={lato}
            >
              {FIELD_DAY_LABELS[day]}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#111111]" style={lato}>
              <input
                type="checkbox"
                checked={open}
                onChange={(e) =>
                  setDay(day, { abierto: e.target.checked })
                }
                className="h-4 w-4 rounded border-[#CCCCCC] text-[#CC4B37] focus:ring-[#CC4B37]"
              />
              Abierto
            </label>
            {open ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={row.apertura}
                  onChange={(e) =>
                    setDay(day, { apertura: e.target.value })
                  }
                  className="rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-2 py-2 text-sm text-[#111111]"
                />
                <span className="text-[#999999]">—</span>
                <input
                  type="time"
                  value={row.cierre}
                  onChange={(e) =>
                    setDay(day, { cierre: e.target.value })
                  }
                  className="rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-2 py-2 text-sm text-[#111111]"
                />
              </div>
            ) : (
              <span className="text-sm text-dim" style={lato}>
                CERRADO
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function EditCampoClient({
  fieldId,
  publicSlug,
  field,
  teamsForSelect,
  adminReturnPath,
}: {
  fieldId: string
  publicSlug: string
  field: EditableFieldPayload
  teamsForSelect: { id: string; nombre: string }[]
  adminReturnPath?: string | null
}) {
  const router = useRouter()
  const [nombre, setNombre] = useState(field.nombre)
  const [ciudad, setCiudad] = useState(field.ciudad ?? '')
  const [ciudadInput, setCiudadInput] = useState(field.ciudad ?? '')
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ?? '',
    libraries: GOOGLE_LIBRARIES,
  })
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [descripcion, setDescripcion] = useState(field.descripcion ?? '')
  const [schedule, setSchedule] = useState<WeekScheduleState>(() =>
    weekScheduleFromJson(field.horarios_json)
  )
  const [teamId, setTeamId] = useState(field.team_id ?? '')
  const [direccion, setDireccion] = useState(field.direccion ?? '')
  const [mapsUrl, setMapsUrl] = useState(field.maps_url ?? '')
  const [logoUrl, setLogoUrl] = useState(field.logo_url ?? '')
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

  const horariosJsonObj = useMemo(
    () => weekScheduleToJson(schedule) as Record<string, unknown>,
    [schedule]
  )

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

  const handleSave = useCallback(async () => {
    const n = nombre.trim()
    if (!n || n.length > 80) {
      setError('El nombre es obligatorio (máx. 80 caracteres).')
      return
    }
    if (descripcion.length > 500) {
      setError('Revisa el límite de descripción.')
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
      ciudad: ciudad.trim() || null,
      descripcion: descripcion.trim() || null,
      horarios_json: horariosJsonObj,
      direccion: direccion.trim() || null,
      maps_url: mapsUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
      telefono: telefono.trim() || null,
      instagram: instagram.trim() || null,
      foto_portada_url: fotoPortadaUrl.trim() || null,
      galeria_urls: mergedGallery.length > 0 ? mergedGallery : null,
      team_id,
    }

    if (adminReturnPath) {
      const result = await updateFieldAdmin({
        fieldId,
        nombre: payload.nombre,
        ciudad: payload.ciudad,
        descripcion: payload.descripcion,
        horarios_json: payload.horarios_json,
        direccion: payload.direccion,
        maps_url: payload.maps_url,
        logo_url: payload.logo_url,
        telefono: payload.telefono,
        instagram: payload.instagram,
        foto_portada_url: payload.foto_portada_url,
        galeria_urls: mergedGallery.length > 0 ? mergedGallery : null,
        team_id,
      })
      setSaving(false)
      if ('error' in result) {
        setError(result.error)
        return
      }
      newGalleryPreviews.forEach((u) => URL.revokeObjectURL(u))
      setNewGalleryFiles([])
      setNewGalleryPreviews([])
      router.push(adminReturnPath)
      return
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
    ciudad,
    descripcion,
    horariosJsonObj,
    direccion,
    mapsUrl,
    logoUrl,
    telefono,
    instagram,
    fotoPortadaUrl,
    galeriaUrls,
    newGalleryFiles,
    newGalleryPreviews,
    teamId,
    fieldId,
    adminReturnPath,
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
        {adminReturnPath ? (
          <Link
            href={adminReturnPath}
            className="text-[12px] text-[#666666] underline"
            style={lato}
          >
            Volver al listado
          </Link>
        ) : (
          <Link
            href={`/campos/${encodeURIComponent(publicSlug)}`}
            className="text-[12px] text-[#666666] underline"
            style={lato}
          >
            Ver ficha pública
          </Link>
        )}
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
        <Field label="Ciudad">
          {mapsLoaded ? (
            <Autocomplete
              onLoad={(ac) => {
                autocompleteRef.current = ac
              }}
              onPlaceChanged={() => {
                const place = autocompleteRef.current?.getPlace()
                if (!place?.address_components) return
                const locality =
                  place.address_components.find((c) =>
                    c.types.includes('locality')
                  )?.long_name ||
                  place.address_components.find((c) =>
                    c.types.includes('administrative_area_level_2')
                  )?.long_name ||
                  place.address_components.find((c) =>
                    c.types.includes('administrative_area_level_1')
                  )?.long_name ||
                  ''
                if (locality) {
                  setCiudad(locality)
                  setCiudadInput(locality)
                }
              }}
              options={{
                types: ['(cities)'],
                componentRestrictions: { country: 'mx' },
              }}
            >
              <input
                type="text"
                className={inputClass}
                placeholder="Busca tu ciudad..."
                value={ciudadInput}
                onChange={(e) => {
                  setCiudadInput(e.target.value)
                  if (e.target.value === '') setCiudad('')
                }}
                autoComplete="off"
              />
            </Autocomplete>
          ) : (
            <input
              type="text"
              className={inputClass}
              placeholder="Cargando..."
              disabled
            />
          )}
          {ciudad ? (
            <p className="mt-1 text-[11px] text-[#999]">✓ {ciudad}</p>
          ) : null}
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
          <HorariosSemanaEditor value={schedule} onChange={setSchedule} />
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
        <Field label="Dirección">
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Av. Vallarta 1234, Guadalajara, Jalisco"
            maxLength={300}
            className={inputClass}
          />
        </Field>
        <Field label="Link de Google Maps">
          <input
            type="url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-[#999999]" style={lato}>
            Pega el link compartido desde Google Maps
          </p>
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
        <div className="[&_div.relative.h-20.w-20]:overflow-hidden [&_div.relative.h-20.w-20]:rounded-full [&_div.relative.h-20.w-20]:border-[3px] [&_div.relative.h-20.w-20]:border-white [&_img]:object-cover">
          <ImageUploadField
            label="LOGO DEL CAMPO"
            currentUrl={logoUrl.trim() || null}
            onUpload={(url) => setLogoUrl(url)}
            onError={(msg) => setError(msg)}
            aspectRatio="square"
            maxSizeMB={5}
            minWidth={64}
            minHeight={64}
            recommendedText="JPG, PNG o WebP · Mínimo 64×64px · Máx 5MB"
            onUploadStart={() => setActiveUploads((n) => n + 1)}
            onUploadEnd={() => setActiveUploads((n) => Math.max(0, n - 1))}
          />
        </div>

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
          href={adminReturnPath ?? `/mi-campo/${encodeURIComponent(fieldId)}`}
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
