'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import { supabase } from '@/lib/supabase'
import { upsertEvento } from './actions'
import type { EventosActor } from './eventos-supabase'

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
).replace(/\/$/, '')

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type FieldOption = {
  id: string
  nombre: string
  ciudad: string | null
}

function isoToDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EventoForm({
  mode,
  actor,
  fieldsOptions,
  defaultFieldId,
  initial,
}: {
  mode: 'create' | 'edit'
  actor: EventosActor
  fieldsOptions: FieldOption[]
  defaultFieldId?: string | null
  initial?: {
    id: string
    title: string
    descripcion: string | null
    field_id: string | null
    fecha: string
    cupo: number
    disciplina: string | null
    tipo: string | null
    imagen_url: string | null
    url_externa: string | null
    published: boolean
    status: string
    organizador_id?: string | null
    organizador_display?: string | null
    sede_nombre?: string | null
    sede_ciudad?: string | null
  }
}) {
  const router = useRouter()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [descripcion, setDescripcion] = useState(initial?.descripcion ?? '')
  const [fieldId, setFieldId] = useState(
    initial?.field_id ?? defaultFieldId ?? ''
  )
  const [fechaLocal, setFechaLocal] = useState(
    initial?.fecha ? isoToDatetimeLocal(initial.fecha) : ''
  )
  const [cupo, setCupo] = useState(
    initial?.cupo != null ? String(initial.cupo) : '0'
  )
  const [disciplina] = useState('airsoft')
  const [tipo, setTipo] = useState<'publico' | 'privado'>(
    (initial?.tipo ?? 'publico').toLowerCase() === 'privado'
      ? 'privado'
      : 'publico'
  )
  const [imagenUrl, setImagenUrl] = useState(initial?.imagen_url ?? '')
  const [urlExterna, setUrlExterna] = useState(initial?.url_externa ?? '')
  const [sedeNombre, setSedeNombre] = useState(initial?.sede_nombre ?? '')
  const [sedeCiudad, setSedeCiudad] = useState(initial?.sede_ciudad ?? '')
  const [urlExternaError, setUrlExternaError] = useState('')
  const [published, setPublished] = useState(initial?.published ?? false)
  const [clientError, setClientError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeUploads, setActiveUploads] = useState(0)

  const showOrganizerPicker = actor === 'admin'
  const [organizerQuery, setOrganizerQuery] = useState('')
  const [organizerResults, setOrganizerResults] = useState<
    { id: string; nombre: string | null; alias: string | null; email: string | null }[]
  >([])
  const [organizerOpen, setOrganizerOpen] = useState(false)
  const [selectedOrganizerId, setSelectedOrganizerId] = useState(
    () => initial?.organizador_id?.trim() || ''
  )
  const [selectedOrganizerLabel, setSelectedOrganizerLabel] = useState(
    () =>
      initial?.organizador_display?.trim() ||
      (initial?.organizador_id ? 'Organizador seleccionado' : '')
  )
  const organizerSearchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const requireField = actor === 'field_owner'

  useEffect(() => {
    if (!showOrganizerPicker || organizerQuery.trim().length < 2) {
      setOrganizerResults([])
      return
    }
    if (organizerSearchRef.current) clearTimeout(organizerSearchRef.current)
    organizerSearchRef.current = setTimeout(() => {
      void (async () => {
        const { data: sessionData } = await supabase.auth.getSession()
        const token = sessionData.session?.access_token
        if (!token) return
        try {
          const res = await fetch(
            `${API_BASE}/users/search?q=${encodeURIComponent(organizerQuery.trim())}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (!res.ok) return
          const body = (await res.json()) as {
            users?: { id: string; nombre: string | null; alias: string | null; email: string | null }[]
          }
          setOrganizerResults(body.users ?? [])
          setOrganizerOpen(true)
        } catch {
          setOrganizerResults([])
        }
      })()
    }, 280)
    return () => {
      if (organizerSearchRef.current) clearTimeout(organizerSearchRef.current)
    }
  }, [organizerQuery, showOrganizerPicker])

  const handleCancel = useCallback(() => {
    router.push('/admin/eventos')
  }, [router])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setClientError('')
      const t = title.trim()
      if (!t) {
        setClientError('El título es obligatorio.')
        return
      }
      if (t.length > 100) {
        setClientError('El título admite máximo 100 caracteres.')
        return
      }
      if (descripcion.length > 1000) {
        setClientError('La descripción admite máximo 1000 caracteres.')
        return
      }
      if (!fechaLocal) {
        setClientError('Indica fecha y hora.')
        return
      }
      const fid = fieldId.trim()
      if (requireField && !fid) {
        setClientError('Debes elegir un campo asociado.')
        return
      }
      const cupoNum = Number.parseInt(cupo, 10)
      if (!Number.isFinite(cupoNum) || cupoNum < 0) {
        setClientError('Cupo inválido.')
        return
      }
      const fechaIso = new Date(fechaLocal).toISOString()

      const urlExt = urlExterna.trim()
      if (urlExt && !/^https?:\/\//i.test(urlExt)) {
        setUrlExternaError('Debe iniciar con http:// o https://')
        return
      }
      setUrlExternaError('')

      setSaving(true)
      const res = await upsertEvento({
        id: initial?.id,
        title: t,
        descripcion: descripcion.trim(),
        field_id: fid || null,
        fecha: fechaIso,
        cupo: cupoNum,
        disciplina,
        tipo,
        imagen_url: imagenUrl.trim() || null,
        url_externa: urlExterna.trim() || null,
        published,
        status:
          initial?.status?.toLowerCase() === 'cancelado'
            ? 'cancelado'
            : undefined,
        ...(showOrganizerPicker
          ? {
              organizador_id: selectedOrganizerId.trim() || null,
              sede_nombre: sedeNombre.trim() || null,
              sede_ciudad: sedeCiudad.trim() || null,
            }
          : {}),
      })
      setSaving(false)
      if ('error' in res && res.error) {
        setClientError(res.error)
        return
      }
      router.push('/admin/eventos')
      router.refresh()
    },
    [
      title,
      descripcion,
      fieldId,
      fechaLocal,
      cupo,
      disciplina,
      tipo,
      imagenUrl,
      urlExterna,
      published,
      initial?.id,
      initial?.status,
      requireField,
      router,
      showOrganizerPicker,
      selectedOrganizerId,
      sedeNombre,
      sedeCiudad,
    ]
  )

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto max-w-[640px] space-y-8"
    >
      <div>
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Título <span className="text-[#CC4B37]">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          required
          className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          style={{ borderRadius: 2 }}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Descripción
        </label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={1000}
          rows={5}
          className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          style={{ borderRadius: 2 }}
        />
        <p className="mt-1 text-[11px] text-[#999999]" style={latoBody}>
          {descripcion.length}/1000
        </p>
      </div>

      {showOrganizerPicker ? (
        <div className="relative">
          <label
            className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
            style={jostHeading}
          >
            Organizador (opcional)
          </label>
          <p className="mb-2 text-[12px] text-[#666666]" style={latoBody}>
            Por defecto eres tú. Busca por alias o nombre para asignar a otro
            usuario.
          </p>
          {selectedOrganizerId ? (
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className="inline-flex max-w-full items-center gap-2 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[12px] text-[#111111]"
                style={{ borderRadius: 2 }}
              >
                <span className="truncate" style={latoBody}>
                  {selectedOrganizerLabel ||
                    selectedOrganizerId.slice(0, 8) + '…'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedOrganizerId('')
                  setSelectedOrganizerLabel('')
                  setOrganizerQuery('')
                  setOrganizerResults([])
                }}
                className="text-[11px] uppercase tracking-wide text-[#CC4B37]"
                style={jostHeading}
              >
                Quitar
              </button>
            </div>
          ) : null}
          <input
            type="text"
            value={organizerQuery}
            onChange={(e) => setOrganizerQuery(e.target.value)}
            onFocus={() => {
              if (organizerResults.length) setOrganizerOpen(true)
            }}
            placeholder="Buscar usuario…"
            autoComplete="off"
            className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
            style={{ borderRadius: 2 }}
          />
          {organizerOpen && organizerResults.length > 0 ? (
            <ul
              className="absolute z-20 mt-1 max-h-48 w-full overflow-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF] shadow-md"
              style={{ borderRadius: 2 }}
            >
              {organizerResults.map((u) => {
                const label =
                  u.alias?.trim() ||
                  u.nombre?.trim() ||
                  u.email?.trim() ||
                  u.id.slice(0, 8)
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOrganizerId(u.id)
                        setSelectedOrganizerLabel(label)
                        setOrganizerQuery('')
                        setOrganizerOpen(false)
                        setOrganizerResults([])
                      }}
                      className="w-full px-3 py-2 text-left text-[13px] text-[#111111] hover:bg-[#F4F4F4]"
                      style={latoBody}
                    >
                      {label}
                      {u.email?.trim() ? (
                        <span className="block text-[11px] text-[#999999]">
                          {u.email}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div>
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Campo asociado {requireField ? <span className="text-[#CC4B37]">*</span> : null}
        </label>
        <select
          value={fieldId}
          onChange={(e) => setFieldId(e.target.value)}
          required={requireField}
          className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          style={{ borderRadius: 2 }}
        >
          <option value="">
            {requireField ? 'Selecciona un campo' : '— Sin campo —'}
          </option>
          {fieldsOptions.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
              {f.ciudad?.trim() ? ` · ${f.ciudad.trim()}` : ''}
            </option>
          ))}
        </select>
      </div>

      {showOrganizerPicker ? (
        <>
          <div>
            <label
              className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
              style={jostHeading}
            >
              Sede (texto libre, opcional)
            </label>
            <input
              type="text"
              value={sedeNombre}
              onChange={(e) => setSedeNombre(e.target.value)}
              maxLength={120}
              placeholder="Ej. Hospital Naturista, La Joya, Campo Privado X..."
              className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
              style={{ borderRadius: 2 }}
            />
            <p className="mt-1 text-[11px] text-[#999999]" style={latoBody}>
              Úsalo solo cuando NO hay un campo AN registrado (eventos editoriales /
              terrenos privados).
            </p>
          </div>

          <div>
            <label
              className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
              style={jostHeading}
            >
              Ciudad (texto libre, opcional)
            </label>
            <input
              type="text"
              value={sedeCiudad}
              onChange={(e) => setSedeCiudad(e.target.value)}
              maxLength={80}
              placeholder="Ej. Ciudad Madero Tampico, León Guanajuato..."
              className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
              style={{ borderRadius: 2 }}
            />
          </div>
        </>
      ) : null}

      <div>
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Fecha y hora <span className="text-[#CC4B37]">*</span>
        </label>
        <input
          type="datetime-local"
          value={fechaLocal}
          onChange={(e) => setFechaLocal(e.target.value)}
          required
          className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          style={{ borderRadius: 2 }}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Cupo (0 = sin límite)
        </label>
        <input
          type="number"
          min={0}
          value={cupo}
          onChange={(e) => setCupo(e.target.value)}
          className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          style={{ borderRadius: 2 }}
        />
      </div>

      <div>
        <p
          className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Disciplina
        </p>
        <select
          value={disciplina}
          disabled
          className="w-full border border-solid border-[#EEEEEE] bg-[#EEEEEE] px-3 py-3 text-sm text-[#666666]"
          style={{ borderRadius: 2 }}
        >
          <option value="airsoft">Airsoft</option>
        </select>
      </div>

      <div>
        <p
          className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Tipo
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipo('publico')}
            className={`flex-1 border border-solid px-4 py-3 text-[10px] tracking-[0.12em] ${
              tipo === 'publico'
                ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
            }`}
            style={jostHeading}
          >
            PÚBLICO
          </button>
          <button
            type="button"
            onClick={() => setTipo('privado')}
            className={`flex-1 border border-solid px-4 py-3 text-[10px] tracking-[0.12em] ${
              tipo === 'privado'
                ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
            }`}
            style={jostHeading}
          >
            PRIVADO
          </button>
        </div>
      </div>

      <div>
        <ImageUploadField
          label="IMAGEN DEL EVENTO"
          currentUrl={imagenUrl.trim() || null}
          onUpload={(url) => {
            setImagenUrl(url)
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
      </div>

      <div>
        <label
          className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Link externo (opcional)
        </label>
        <input
          type="url"
          value={urlExterna}
          onChange={(e) => {
            setUrlExterna(e.target.value)
            if (urlExternaError) setUrlExternaError('')
          }}
          placeholder="https://ejemplo.com/mi-evento"
          maxLength={500}
          className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
          style={{ borderRadius: 2 }}
        />
        <p className="mt-1 text-[11px] text-[#999999]" style={latoBody}>
          Página oficial del productor, reglamento, inscripciones, etc.
        </p>
        {urlExternaError ? (
          <p className="mt-1 text-[11px] text-[#CC4B37]" style={latoBody}>
            {urlExternaError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPublished(!published)}
          className={`h-10 min-w-[120px] border border-solid px-4 text-[10px] tracking-[0.12em] ${
            published
              ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
              : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
          }`}
          style={jostHeading}
        >
          {published ? 'PUBLICADO' : 'NO PUBLICADO'}
        </button>
        <span className="text-[12px] text-[#666666]" style={latoBody}>
          Visible en el sitio cuando está publicado y con estado publicado.
        </span>
      </div>

      {clientError ? (
        <p className="text-sm text-[#CC4B37]" style={latoBody}>
          {clientError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving || activeUploads > 0}
          className="min-h-[48px] min-w-[140px] bg-[#CC4B37] px-6 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
          style={jostHeading}
        >
          {saving ? 'GUARDANDO…' : 'GUARDAR'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={saving}
          className="min-h-[48px] min-w-[140px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-6 text-[11px] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          CANCELAR
        </button>
      </div>

      {mode === 'edit' ? (
        <p className="text-[11px] text-[#999999]" style={latoBody}>
          Para marcar como cancelado usa la lista de eventos (botón CANCELAR).
        </p>
      ) : null}
    </form>
  )
}
