'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { ImageUploadField } from '@/components/ui/ImageUploadField'
import { createUserEvento } from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type NuevoFieldOption = {
  id: string
  nombre: string
  ciudad: string | null
}

export function EventoNuevoForm({
  publicFields,
  privateFields,
  canCreatePrivate,
  lockedField,
}: {
  publicFields: NuevoFieldOption[]
  privateFields: NuevoFieldOption[]
  canCreatePrivate: boolean
  lockedField?: { id: string; nombre: string } | null
}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fieldId, setFieldId] = useState(() => lockedField?.id ?? '')
  const [fechaLocal, setFechaLocal] = useState('')
  const [cupo, setCupo] = useState('0')
  const [tipo, setTipo] = useState<'publico' | 'privado'>('publico')
  const [imagenUrl, setImagenUrl] = useState('')
  const [clientError, setClientError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeUploads, setActiveUploads] = useState(0)

  const fieldOptions = useMemo(() => {
    return tipo === 'privado' ? privateFields : publicFields
  }, [tipo, privateFields, publicFields])

  const setTipoSafe = useCallback(
    (next: 'publico' | 'privado') => {
      if (lockedField && next === 'privado') return
      setTipo(next)
      if (!lockedField) setFieldId('')
      setClientError('')
    },
    [lockedField]
  )

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
      if (tipo === 'privado' && !canCreatePrivate) {
        setClientError('No tienes campos privados de equipo para evento privado.')
        return
      }
      const fid = lockedField ? lockedField.id : fieldId.trim()
      if (tipo === 'privado' && !fid) {
        setClientError('Selecciona el campo privado.')
        return
      }
      const cupoNum = Number.parseInt(cupo, 10)
      if (!Number.isFinite(cupoNum) || cupoNum < 0) {
        setClientError('Cupo inválido.')
        return
      }
      const fechaIso = new Date(fechaLocal).toISOString()

      setSaving(true)
      const res = await createUserEvento({
        title: t,
        descripcion: descripcion.trim(),
        field_id: fid || null,
        fecha: fechaIso,
        cupo: cupoNum,
        tipo,
        imagen_url: imagenUrl.trim() || null,
      })
      setSaving(false)
      if ('error' in res) {
        setClientError(res.error)
        return
      }
      router.push(`/eventos/${res.id}`)
      router.refresh()
    },
    [
      title,
      descripcion,
      fieldId,
      fechaLocal,
      cupo,
      tipo,
      imagenUrl,
      canCreatePrivate,
      router,
      lockedField,
    ]
  )

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mx-auto max-w-[640px] space-y-8 pb-12"
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
            onClick={() => setTipoSafe('publico')}
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
            disabled={!canCreatePrivate || Boolean(lockedField)}
            onClick={() => canCreatePrivate && setTipoSafe('privado')}
            className={`flex-1 border border-solid px-4 py-3 text-[10px] tracking-[0.12em] ${
              tipo === 'privado'
                ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666]'
            } disabled:cursor-not-allowed disabled:opacity-40`}
            style={jostHeading}
          >
            PRIVADO
          </button>
        </div>
        {!canCreatePrivate ? (
          <p className="mt-2 text-[11px] text-[#999999]" style={latoBody}>
            El tipo privado solo está disponible si eres fundador o admin de un
            equipo con campo privado aprobado.
          </p>
        ) : null}
        {lockedField ? (
          <p className="mt-2 text-[11px] text-[#999999]" style={latoBody}>
            El evento se crea en el campo desde el que llegaste; no puedes
            cambiarlo aquí.
          </p>
        ) : null}
      </div>

      <div>
        <p
          className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
          style={jostHeading}
        >
          Campo asociado
          {tipo === 'privado' && !lockedField ? (
            <span className="text-[#CC4B37]"> *</span>
          ) : null}
        </p>
        {lockedField ? (
          <p className="text-sm text-[#666666]" style={latoBody}>
            Campo: {lockedField.nombre}
          </p>
        ) : (
          <select
            value={fieldId}
            onChange={(e) => setFieldId(e.target.value)}
            required={tipo === 'privado'}
            className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] focus:border-[#CC4B37] focus:outline-none"
            style={{ borderRadius: 2 }}
          >
            <option value="">
              {tipo === 'privado'
                ? 'Selecciona un campo privado'
                : '— Sin campo —'}
            </option>
            {fieldOptions.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nombre}
                {f.ciudad?.trim() ? ` · ${f.ciudad.trim()}` : ''}
                {tipo === 'privado' ? ' · PRIVADO' : ''}
              </option>
            ))}
          </select>
        )}
      </div>

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
          {saving ? 'PUBLICANDO…' : 'PUBLICAR EVENTO'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/eventos')}
          disabled={saving}
          className="min-h-[48px] min-w-[140px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-6 text-[11px] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          CANCELAR
        </button>
      </div>
    </form>
  )
}
