import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../../supabase-server'
import {
  approveFieldForm,
  rejectFieldForm,
  saveOrdenDestacadoForm,
  toggleDestacadoForm,
} from '../actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

type FieldStatus = 'pendiente' | 'aprobado' | 'rechazado'

type FieldRow = {
  id: string
  nombre: string
  slug: string
  descripcion: string | null
  ciudad: string | null
  ubicacion_lat: number | string | null
  ubicacion_lng: number | string | null
  disciplinas: string[] | null
  horarios: unknown
  foto_portada_url: string | null
  galeria_urls: string[] | null
  telefono: string | null
  instagram: string | null
  status: FieldStatus
  destacado: boolean
  orden_destacado: number | null
  created_by: string | null
  created_at: string | null
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function StatusBadge({ status }: { status: FieldStatus }) {
  if (status === 'pendiente') {
    return (
      <span
        className="inline-block text-[11px] font-semibold tracking-wide"
        style={{
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: '#FFF3CD',
          color: '#856404',
          ...jostHeading,
          fontSize: 10,
        }}
      >
        PENDIENTE
      </span>
    )
  }
  if (status === 'aprobado') {
    return (
      <span
        className="inline-block text-[11px] font-semibold tracking-wide text-[#FFFFFF]"
        style={{
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: '#111111',
          ...jostHeading,
          fontSize: 10,
        }}
      >
        APROBADO
      </span>
    )
  }
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide text-[#666666]"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: '#EEEEEE',
        ...jostHeading,
        fontSize: 10,
      }}
    >
      RECHAZADO
    </span>
  )
}

function HorariosBlock({ value }: { value: unknown }) {
  if (value == null) {
    return (
      <p className="text-sm text-[#666666]" style={latoBody}>
        Sin horarios
      </p>
    )
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <p className="text-sm text-[#666666]" style={latoBody}>
          Sin horarios
        </p>
      )
    }
    const first = value[0]
    if (first !== null && typeof first === 'object') {
      const rows = value as Record<string, unknown>[]
      const cols = Object.keys(rows[0] as object)
      return (
        <div className="overflow-x-auto border border-solid border-[#EEEEEE]">
          <table className="w-full border-collapse text-left text-sm text-[#111111]">
            <thead>
              <tr className="bg-[#F4F4F4]">
                {cols.map((c) => (
                  <th
                    key={c}
                    className="border border-solid border-[#EEEEEE] px-3 py-2 text-[11px] text-[#111111]"
                    style={jostHeading}
                  >
                    {c.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
                >
                  {cols.map((c) => {
                    const cell = row[c]
                    const text =
                      cell !== null && typeof cell === 'object'
                        ? JSON.stringify(cell)
                        : cell == null
                          ? '—'
                          : String(cell)
                    return (
                      <td
                        key={c}
                        className="border border-solid border-[#EEEEEE] px-3 py-2"
                        style={latoBody}
                      >
                        {text}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto border border-solid border-[#EEEEEE]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#F4F4F4]">
              <th
                className="border border-solid border-[#EEEEEE] px-3 py-2 text-[11px] text-[#111111]"
                style={jostHeading}
              >
                HORARIO
              </th>
            </tr>
          </thead>
          <tbody>
            {(value as unknown[]).map((row, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
              >
                <td
                  className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#111111]"
                  style={latoBody}
                >
                  {String(row)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) {
      return (
        <p className="text-sm text-[#666666]" style={latoBody}>
          Sin horarios
        </p>
      )
    }
    return (
      <div className="overflow-x-auto border border-solid border-[#EEEEEE]">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#F4F4F4]">
              <th
                className="border border-solid border-[#EEEEEE] px-3 py-2 text-[11px] text-[#111111]"
                style={jostHeading}
              >
                DÍA / CLAVE
              </th>
              <th
                className="border border-solid border-[#EEEEEE] px-3 py-2 text-[11px] text-[#111111]"
                style={jostHeading}
              >
                VALOR
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([k, v], i) => (
              <tr
                key={k}
                className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
              >
                <td
                  className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#111111]"
                  style={latoBody}
                >
                  {k}
                </td>
                <td
                  className="border border-solid border-[#EEEEEE] px-3 py-2 text-[#111111]"
                  style={latoBody}
                >
                  {v !== null && typeof v === 'object'
                    ? JSON.stringify(v)
                    : v == null
                      ? '—'
                      : String(v)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <p className="text-sm text-[#111111]" style={latoBody}>
      {String(value)}
    </p>
  )
}

function instagramHref(raw: string): string {
  const t = raw.trim()
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  const handle = t.replace(/^@/, '')
  return `https://instagram.com/${handle}`
}

export default async function AdminCampoDetallePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { err?: string }
}) {
  const id = params.id
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('fields')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    redirect('/admin/campos')
  }

  const field = data as FieldRow
  const errMsg = searchParams.err

  return (
    <div className="p-6" style={latoBody}>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/admin/campos"
          className="inline-flex w-fit items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          VOLVER A CAMPOS
        </Link>
      </div>

      {errMsg ? (
        <p
          className="mb-6 border border-solid border-[#CC4B37] bg-[#FFF3CD] px-4 py-3 text-sm text-[#856404]"
          role="alert"
        >
          {errMsg}
        </p>
      ) : null}

      <div className="mb-8 max-w-[400px] border border-solid border-[#EEEEEE] bg-[#F4F4F4]">
        {field.foto_portada_url ? (
          <img
            src={field.foto_portada_url}
            alt=""
            className="max-h-[400px] w-full max-w-[400px] object-cover"
          />
        ) : (
          <div
            className="flex h-[200px] w-full max-w-[400px] items-center justify-center bg-[#EEEEEE] text-sm text-[#666666]"
            aria-hidden
          >
            Sin foto de portada
          </div>
        )}
      </div>

      <div className="mb-10 space-y-6">
        <header>
          <h1
            className="mb-2 text-2xl tracking-[0.08em] text-[#111111] md:text-3xl"
            style={jostHeading}
          >
            {field.nombre}
          </h1>
          <p className="text-sm text-[#666666]">
            {field.ciudad ?? 'Sin ciudad'} · Slug: {field.slug}
          </p>
        </header>

        <section>
          <h2
            className="mb-2 text-[11px] tracking-[0.14em] text-[#111111]"
            style={jostHeading}
          >
            DESCRIPCIÓN
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#111111]">
            {field.descripcion?.trim() ? field.descripcion : '—'}
          </p>
        </section>

        <section>
          <h2
            className="mb-2 text-[11px] tracking-[0.14em] text-[#111111]"
            style={jostHeading}
          >
            DISCIPLINAS
          </h2>
          {field.disciplinas && field.disciplinas.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {field.disciplinas.map((d) => (
                <span
                  key={d}
                  className="inline-block border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-2 py-1 text-[11px] font-semibold text-[#111111]"
                  style={{ ...jostHeading, borderRadius: 2, fontSize: 10 }}
                >
                  {d}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#666666]">—</p>
          )}
        </section>

        <section>
          <h2
            className="mb-2 text-[11px] tracking-[0.14em] text-[#111111]"
            style={jostHeading}
          >
            HORARIOS
          </h2>
          <HorariosBlock value={field.horarios} />
        </section>

        <section className="flex flex-wrap gap-8 text-sm">
          <div>
            <h3
              className="mb-1 text-[11px] tracking-[0.14em] text-[#666666]"
              style={jostHeading}
            >
              TELÉFONO
            </h3>
            {field.telefono ? (
              <a
                href={`tel:${field.telefono.replace(/\s/g, '')}`}
                className="text-[#CC4B37] underline-offset-2 hover:underline"
              >
                {field.telefono}
              </a>
            ) : (
              <span className="text-[#666666]">—</span>
            )}
          </div>
          <div>
            <h3
              className="mb-1 text-[11px] tracking-[0.14em] text-[#666666]"
              style={jostHeading}
            >
              INSTAGRAM
            </h3>
            {field.instagram ? (
              <a
                href={instagramHref(field.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#CC4B37] underline-offset-2 hover:underline"
              >
                {field.instagram}
              </a>
            ) : (
              <span className="text-[#666666]">—</span>
            )}
          </div>
        </section>

        {field.galeria_urls && field.galeria_urls.length > 0 ? (
          <section>
            <h2
              className="mb-3 text-[11px] tracking-[0.14em] text-[#111111]"
              style={jostHeading}
            >
              GALERÍA
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {field.galeria_urls.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
                >
                  <img
                    src={url}
                    alt=""
                    className="aspect-square w-full object-cover"
                  />
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <section className="flex flex-wrap items-center gap-3">
          <h2
            className="text-[11px] tracking-[0.14em] text-[#111111]"
            style={jostHeading}
          >
            STATUS
          </h2>
          <StatusBadge status={field.status} />
        </section>

        <section>
          <h2
            className="mb-1 text-[11px] tracking-[0.14em] text-[#111111]"
            style={jostHeading}
          >
            UBICACIÓN
          </h2>
          <p className="text-sm text-[#111111]">
            Lat: {field.ubicacion_lat ?? '—'} · Lng: {field.ubicacion_lng ?? '—'}
          </p>
        </section>

        <section className="text-sm text-[#666666]">
          <p>Creado: {formatFecha(field.created_at)}</p>
          {field.created_by ? (
            <p className="mt-1 break-all">Creado por (UUID): {field.created_by}</p>
          ) : null}
        </section>
      </div>

      <div className="border-t border-solid border-[#EEEEEE] pt-8">
        <h2
          className="mb-4 text-[11px] tracking-[0.14em] text-[#111111]"
          style={jostHeading}
        >
          ACCIONES
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {field.status === 'pendiente' ? (
              <form action={approveFieldForm}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  className="bg-[#1B5E20] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90"
                  style={{ ...jostHeading, borderRadius: 2 }}
                >
                  APROBAR
                </button>
              </form>
            ) : null}
            {field.status === 'pendiente' || field.status === 'aprobado' ? (
              <form action={rejectFieldForm}>
                <input type="hidden" name="id" value={id} />
                <button
                  type="submit"
                  className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
                  style={{ ...jostHeading, borderRadius: 2 }}
                >
                  RECHAZAR
                </button>
              </form>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {!field.destacado ? (
              <form action={toggleDestacadoForm}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="destacado" value="true" />
                <button
                  type="submit"
                  className="bg-[#111111] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                  style={{ ...jostHeading, borderRadius: 2 }}
                >
                  MARCAR DESTACADO
                </button>
              </form>
            ) : (
              <form action={toggleDestacadoForm}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="destacado" value="false" />
                <button
                  type="submit"
                  className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CC4B37]"
                  style={{ ...jostHeading, borderRadius: 2 }}
                >
                  QUITAR DESTACADO
                </button>
              </form>
            )}
          </div>

          {field.destacado ? (
            <form action={saveOrdenDestacadoForm} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={id} />
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="orden_destacado"
                  className="text-[11px] tracking-[0.12em] text-[#666666]"
                  style={jostHeading}
                >
                  ORDEN DESTACADO
                </label>
                <input
                  id="orden_destacado"
                  name="orden_destacado"
                  type="number"
                  step={1}
                  defaultValue={field.orden_destacado ?? 0}
                  className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-sm text-[#111111]"
                  style={{ ...latoBody, borderRadius: 2, maxWidth: 120 }}
                />
              </div>
              <button
                type="submit"
                className="bg-[#CC4B37] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                GUARDAR ORDEN
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  )
}
