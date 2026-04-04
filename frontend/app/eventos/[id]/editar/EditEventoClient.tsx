'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import { formatEventoFechaCorta } from '@/app/eventos/lib/format-evento-fecha'
import { updateEventoEdicion } from './actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type EditarFieldOption = {
  id: string
  nombre: string
  ciudad: string | null
}

type Props = {
  eventId: string
  isAdmin: boolean
  fieldsOptions: EditarFieldOption[]
  initial: {
    title: string
    descripcion: string | null
    imagen_url: string | null
    cupo: number
    tipo: string | null
    field_id: string | null
    fecha: string
    status: string
    field_nombre: string | null
    field_ciudad: string | null
  }
}

function toDatetimeLocalValue(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

export function EditEventoClient({
  eventId,
  isAdmin,
  fieldsOptions,
  initial,
}: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initial.title)
  const [descripcion, setDescripcion] = useState(initial.descripcion ?? '')
  const [imagenUrl, setImagenUrl] = useState<string | null>(
    initial.imagen_url?.trim() || null
  )
  const [cupo, setCupo] = useState(String(initial.cupo ?? 0))
  const [tipo, setTipo] = useState<'publico' | 'privado'>(
    (initial.tipo || '').toLowerCase() === 'privado' ? 'privado' : 'publico'
  )
  const [fieldId, setFieldId] = useState(initial.field_id ?? '')
  const [fechaLocal, setFechaLocal] = useState(() =>
    toDatetimeLocalValue(initial.fecha)
  )
  const [status, setStatus] = useState(() =>
    (initial.status || 'publicado').toLowerCase()
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadBusy, setUploadBusy] = useState(0)

  const campoReadonlyLabel = useMemo(() => {
    const n = initial.field_nombre?.trim()
    const c = initial.field_ciudad?.trim()
    if (n && c) return `${n} · ${c}`
    return n || '—'
  }, [initial.field_ciudad, initial.field_nombre])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      const t = title.trim()
      if (!t) {
        setError('El título es obligatorio.')
        return
      }
      const cupoNum = Number.parseInt(cupo, 10)
      if (!Number.isFinite(cupoNum) || cupoNum < 0) {
        setError('Cupo inválido.')
        return
      }
      let fechaIso: string | undefined
      if (isAdmin) {
        if (!fechaLocal) {
          setError('Indica fecha y hora.')
          return
        }
        fechaIso = new Date(fechaLocal).toISOString()
      }

      setSaving(true)
      const res = await updateEventoEdicion(eventId, {
        title: t,
        descripcion: descripcion.trim() || null,
        imagen_url: imagenUrl,
        cupo: cupoNum,
        tipo,
        ...(isAdmin
          ? {
              field_id: fieldId.trim() || null,
              fecha: fechaIso,
              status,
            }
          : {}),
      })
      setSaving(false)
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.push(`/eventos/${eventId}`)
      router.refresh()
    },
    [
      title,
      descripcion,
      imagenUrl,
      cupo,
      tipo,
      eventId,
      router,
      isAdmin,
      fechaLocal,
      fieldId,
      status,
    ]
  )

  return (
    <form
      onSubmit={(ev) => void handleSubmit(ev)}
      className="mx-auto w-full max-w-[640px] px-4 py-8 md:px-6"
    >
      <h1
        className="text-[22px] font-extrabold uppercase leading-tight tracking-[0.08em] text-[#111111] md:text-[26px]"
        style={jost}
      >
        EDITAR EVENTO
      </h1>

      <div className="mt-8 space-y-6">
        <label className="block">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
            style={jost}
          >
            Título
          </span>
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(ev) => setTitle(ev.target.value)}
            className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
            style={{ borderRadius: 0, ...lato }}
          />
        </label>

        <label className="block">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
            style={jost}
          >
            Descripción
          </span>
          <textarea
            value={descripcion}
            maxLength={1000}
            rows={5}
            onChange={(ev) => setDescripcion(ev.target.value)}
            className="mt-1.5 w-full resize-y border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
            style={{ borderRadius: 0, ...lato }}
          />
        </label>

        <ImageUploadField
          label="IMAGEN"
          currentUrl={imagenUrl}
          onUpload={(url) => setImagenUrl(url)}
          onError={(msg) => setError(msg)}
          aspectRatio="landscape"
          maxSizeMB={5}
          minWidth={800}
          minHeight={300}
          recommendedText="JPG, PNG o WebP · Máx 5MB"
          onUploadStart={() => setUploadBusy((n) => n + 1)}
          onUploadEnd={() => setUploadBusy((n) => Math.max(0, n - 1))}
        />

        <label className="block">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
            style={jost}
          >
            Cupo
          </span>
          <input
            type="number"
            min={0}
            max={100000}
            value={cupo}
            onChange={(ev) => setCupo(ev.target.value)}
            className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
            style={{ borderRadius: 0, ...lato }}
          />
        </label>

        <fieldset>
          <legend
            className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
            style={jost}
          >
            Tipo
          </legend>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-6">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="tipo"
                checked={tipo === 'publico'}
                onChange={() => setTipo('publico')}
                className="accent-[#CC4B37]"
              />
              <span className="text-[14px] text-[#111111]" style={lato}>
                Público
              </span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="tipo"
                checked={tipo === 'privado'}
                onChange={() => setTipo('privado')}
                className="accent-[#CC4B37]"
              />
              <span className="text-[14px] text-[#111111]" style={lato}>
                Privado
              </span>
            </label>
          </div>
        </fieldset>

        {isAdmin ? (
          <>
            <label className="block">
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                style={jost}
              >
                Campo asociado
              </span>
              <select
                value={fieldId}
                onChange={(ev) => setFieldId(ev.target.value)}
                className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
                style={{ borderRadius: 0, ...lato }}
              >
                <option value="">Sin campo</option>
                {fieldsOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre}
                    {f.ciudad?.trim() ? ` · ${f.ciudad.trim()}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                style={jost}
              >
                Fecha
              </span>
              <input
                type="datetime-local"
                value={fechaLocal}
                onChange={(ev) => setFechaLocal(ev.target.value)}
                className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
                style={{ borderRadius: 0, ...lato }}
              />
            </label>

            <label className="block">
              <span
                className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                style={jost}
              >
                Status
              </span>
              <select
                value={status}
                onChange={(ev) => setStatus(ev.target.value.toLowerCase())}
                className="mt-1.5 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2.5 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]"
                style={{ borderRadius: 0, ...lato }}
              >
                <option value="publicado">Publicado</option>
                <option value="borrador">Borrador</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <div>
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                style={jost}
              >
                Campo asociado
              </p>
              <p
                className="mt-1.5 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2.5 text-[14px] text-[#666666]"
                style={{ borderRadius: 0, ...lato }}
              >
                {campoReadonlyLabel}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                style={jost}
              >
                Fecha
              </p>
              <p
                className="mt-1.5 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2.5 text-[14px] text-[#666666]"
                style={{ borderRadius: 0, ...lato }}
              >
                {formatEventoFechaCorta(initial.fecha) || '—'}
              </p>
            </div>

            <div>
              <p
                className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#999999]"
                style={jost}
              >
                Status
              </p>
              <p
                className="mt-1.5 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2.5 text-[14px] text-[#666666]"
                style={{ borderRadius: 0, ...lato }}
              >
                {initial.status || '—'}
              </p>
            </div>
          </>
        )}
      </div>

      {error ? (
        <p className="mt-4 text-[13px] text-[#CC4B37]" style={lato}>
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={saving || uploadBusy > 0}
          style={jost}
          className="min-h-[48px] flex-1 bg-[#CC4B37] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#FFFFFF] disabled:opacity-60"
        >
          {saving ? 'GUARDANDO…' : 'GUARDAR'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => router.push(`/eventos/${eventId}`)}
          style={jost}
          className="min-h-[48px] flex-1 border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#111111]"
        >
          CANCELAR
        </button>
      </div>
    </form>
  )
}
