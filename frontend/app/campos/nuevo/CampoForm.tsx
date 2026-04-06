'use client'

import {
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import { CIUDADES } from '@/lib/ciudades'
import {
  FIELD_DAY_KEYS,
  FIELD_DAY_LABELS,
  type FieldDayKey,
  type WeekScheduleState,
  defaultWeekSchedule,
  weekScheduleToJson,
} from '@/lib/field-schedule'
import { generateFieldSlug } from '@/lib/field-slug'
import {
  createCampoAction,
  prepareCampoSlugAction,
  prepareCampoSlugAdminAction,
} from './actions'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const UPLOAD_ENDPOINT = `${API_URL}/upload`

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_GALLERY = 6
const MAX_GALLERY_MB = 5

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

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
    <div
      className={
        first
          ? ''
          : 'mt-10 border-t border-solid border-[#EEEEEE] pt-10'
      }
    >
      <p
        className="mb-5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
        style={jostHeading}
      >
        {title}
      </p>
      <div className="flex flex-col gap-5">{children}</div>
    </div>
  )
}

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

export function CampoForm({
  teamsForSelect,
  adminContext = false,
}: {
  teamsForSelect: { id: string; nombre: string }[]
  adminContext?: boolean
}) {
  const [nombre, setNombre] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [tipo, setTipo] = useState<'publico' | 'privado'>('publico')
  const [descripcion, setDescripcion] = useState('')
  const [schedule, setSchedule] = useState<WeekScheduleState>(() =>
    defaultWeekSchedule()
  )
  const [teamId, setTeamId] = useState('')
  const [direccion, setDireccion] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')
  const [telefono, setTelefono] = useState('')
  const [instagram, setInstagram] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [fotoPortadaUrl, setFotoPortadaUrl] = useState('')
  const [galleryFiles, setGalleryFiles] = useState<File[]>([])
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])
  const [clientError, setClientError] = useState('')
  const [activeUploads, setActiveUploads] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState('')
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const baseSlug = useMemo(
    () => generateFieldSlug(undefined, nombre),
    [nombre]
  )

  const horariosJsonString = useMemo(
    () => JSON.stringify(weekScheduleToJson(schedule)),
    [schedule]
  )

  const removeGalleryAt = (index: number) => {
    URL.revokeObjectURL(galleryPreviews[index] ?? '')
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index))
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const onGalleryPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0) return

    const nextFiles = [...galleryFiles]
    const nextPreviews = [...galleryPreviews]

    for (const file of files) {
      if (nextFiles.length >= MAX_GALLERY) {
        setClientError(`Máximo ${MAX_GALLERY} fotos en la galería.`)
        break
      }
      if (!ALLOWED.has(file.type)) {
        setClientError('Solo se permiten imágenes JPG, PNG o WebP.')
        continue
      }
      if (file.size > MAX_GALLERY_MB * 1024 * 1024) {
        setClientError(`Cada foto debe pesar como máximo ${MAX_GALLERY_MB} MB.`)
        continue
      }
      setClientError('')
      nextFiles.push(file)
      nextPreviews.push(URL.createObjectURL(file))
    }

    setGalleryFiles(nextFiles)
    setGalleryPreviews(nextPreviews)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setServerError('')
    const n = nombre.trim()
    const c = ciudad.trim()
    if (!n || n.length > 80) {
      setClientError('Indica un nombre (máx. 80 caracteres).')
      return
    }
    if (!c) {
      setClientError('Selecciona una ciudad.')
      return
    }
    if (descripcion.length > 500) {
      setClientError('La descripción no puede superar 500 caracteres.')
      return
    }
    if (activeUploads > 0) {
      return
    }
    setClientError('')

    startTransition(async () => {
      const form = e.currentTarget
      const slugPrep = adminContext
        ? await prepareCampoSlugAdminAction(nombre.trim(), baseSlug)
        : await prepareCampoSlugAction(nombre.trim(), baseSlug)
      if (!slugPrep.ok) {
        setServerError(slugPrep.error)
        return
      }

      let uploadedUrls: string[] = []
      try {
        for (const file of galleryFiles) {
          uploadedUrls.push(await postUpload(file))
        }
      } catch (err) {
        setClientError(
          err instanceof Error ? err.message : 'Error al subir la galería.'
        )
        return
      }
      const fd = new FormData(form)
      fd.set('slug', slugPrep.slug)
      fd.set('galeria_urls', JSON.stringify(uploadedUrls))
      fd.set('horarios_json', horariosJsonString)
      fd.set('logo_url', logoUrl.trim())
      const res = await createCampoAction(null, fd)
      if (res?.error) setServerError(res.error)
    })
  }

  return (
    <form
      className="mx-auto max-w-[480px]"
      onSubmit={(ev) => void handleSubmit(ev)}
      noValidate
    >
      {adminContext ? (
        <input type="hidden" name="admin_context" value="1" readOnly aria-hidden />
      ) : null}
      <input type="hidden" name="slug" value={baseSlug} readOnly aria-hidden />
      <input
        type="hidden"
        name="foto_portada_url"
        value={fotoPortadaUrl}
        readOnly
        aria-hidden
      />
      <input type="hidden" name="tipo" value={tipo} readOnly aria-hidden />

      <h1
        className="text-[22px] font-extrabold leading-tight text-[#111111] md:text-[26px]"
        style={jostHeading}
      >
        Nuevo campo
      </h1>
      <p className="mt-2 text-sm text-[#666666]" style={lato}>
        Completa los datos para registrar tu campo. Un administrador lo
        revisará antes de publicarlo.
      </p>

      <FormSection title="INFORMACIÓN BÁSICA" first>
        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Nombre del campo
          </label>
          <input
            type="text"
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Campo Airsoft GDL"
            maxLength={80}
            required
            autoComplete="organization"
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
          />
          <p className="mt-1.5 text-[12px] text-[#999999]" style={lato}>
            airnation.online/campos/{baseSlug || '…'}
          </p>
        </div>

        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Ciudad
          </label>
          <select
            name="ciudad"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            required
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          >
            {CIUDADES.map((c) => (
              <option key={c.value || 'empty'} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Tipo
          </p>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                className="sr-only"
                checked={tipo === 'publico'}
                onChange={() => setTipo('publico')}
              />
              <span
                className={`border px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide ${
                  tipo === 'publico'
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#111111]'
                }`}
                style={jostHeading}
              >
                Público
              </span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                className="sr-only"
                checked={tipo === 'privado'}
                onChange={() => setTipo('privado')}
              />
              <span
                className={`border px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide ${
                  tipo === 'privado'
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#111111]'
                }`}
                style={jostHeading}
              >
                Privado
              </span>
            </label>
          </div>
          <p className="mt-2 text-[12px] text-[#666666]" style={lato}>
            Público: comercial o abierto. Privado: acceso previa solicitud.
          </p>
        </div>

        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Descripción
          </label>
          <textarea
            name="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            maxLength={500}
            className="w-full resize-y rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
            placeholder="Describe instalaciones, partidas, reglas básicas…"
          />
          <p className="mt-1 text-[11px] text-[#999999]" style={lato}>
            {descripcion.length}/500
          </p>
        </div>

        <div>
          <p
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Horarios
          </p>
          <HorariosSemanaEditor value={schedule} onChange={setSchedule} />
        </div>

        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Asociar equipo (opcional)
          </label>
          <select
            name="team_id"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          >
            <option value="">Sin equipo asociado</option>
            {teamsForSelect.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
      </FormSection>

      <FormSection title="UBICACIÓN Y CONTACTO">
        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Dirección
          </label>
          <input
            type="text"
            name="direccion"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Av. Vallarta 1234, Guadalajara, Jalisco"
            maxLength={300}
            autoComplete="street-address"
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
          />
        </div>
        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Link de Google Maps
          </label>
          <input
            type="url"
            name="maps_url"
            value={mapsUrl}
            onChange={(e) => setMapsUrl(e.target.value)}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
          />
          <p className="mt-1.5 text-[12px] text-[#999999]" style={lato}>
            Pega el link compartido desde Google Maps
          </p>
        </div>
        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Teléfono
          </label>
          <input
            type="text"
            name="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+52 33 1234 5678"
            autoComplete="tel"
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
          />
        </div>
        <div>
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Instagram
          </label>
          <input
            type="text"
            name="instagram"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@campo_airsoft_gdl"
            className="w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none"
          />
        </div>
      </FormSection>

      <FormSection title="IMÁGENES">
        <div className="[&_div.relative.h-20.w-20]:overflow-hidden [&_div.relative.h-20.w-20]:rounded-full [&_div.relative.h-20.w-20]:border-[3px] [&_div.relative.h-20.w-20]:border-white [&_img]:object-cover">
          <ImageUploadField
            label="LOGO DEL CAMPO"
            currentUrl={logoUrl.trim() || null}
            onUpload={(url) => {
              setLogoUrl(url)
              setClientError('')
            }}
            onError={(msg) => setClientError(msg)}
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
          onUpload={(url) => {
            setFotoPortadaUrl(url)
            setClientError('')
          }}
          onError={(msg) => setClientError(msg)}
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
            style={jostHeading}
          >
            Galería (hasta 6 fotos)
          </p>
          <p className="mb-3 text-[11px] text-[#999999]" style={lato}>
            Se suben al enviar el formulario. JPG, PNG o WebP · máx. 5MB cada una.
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
            disabled={galleryFiles.length >= MAX_GALLERY || isPending}
            style={jostHeading}
            className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:opacity-45"
          >
            Añadir fotos
          </button>
          {galleryPreviews.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {galleryPreviews.map((src, i) => (
                <div
                  key={`${src}-${i}`}
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
                    onClick={() => removeGalleryAt(i)}
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

      {serverError ? (
        <p className="mt-4 text-sm text-[#CC4B37]" role="alert">
          {serverError}
        </p>
      ) : null}
      {clientError ? (
        <p className="mt-4 text-sm text-[#CC4B37]" role="alert">
          {clientError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={
          isPending ||
          activeUploads > 0 ||
          !nombre.trim() ||
          !ciudad.trim()
        }
        className="mt-8 w-full rounded-[2px] bg-[#CC4B37] py-3.5 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
        style={jostHeading}
      >
        {isPending ? 'Enviando…' : 'Registrar campo'}
      </button>

      <p className="mt-6 text-center text-sm text-[#666666]" style={lato}>
        <Link href="/dashboard/perfil" className="text-[#CC4B37] hover:underline">
          Volver al perfil
        </Link>
      </p>
    </form>
  )
}
