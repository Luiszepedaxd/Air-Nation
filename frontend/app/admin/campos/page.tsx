import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import {
  deleteField,
  toggleDestacado,
  updateFieldStatus,
  updateOrdenDestacado,
} from './actions'

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
  ciudad: string | null
  status: FieldStatus
  destacado: boolean
  orden_destacado: number | null
  foto_portada_url: string | null
  created_at: string | null
  created_by: string | null
  placeholder_owner_nombre: string | null
  placeholder_owner_contacto: string | null
  transferred_to: string | null
  transferred_at: string | null
}

type FilterTab = 'todos' | 'pendiente' | 'aprobado' | 'rechazado'

type UserSearchRow = {
  id: string
  nombre: string | null
  alias: string | null
  email: string | null
  avatar_url: string | null
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

function formatFechaHora(iso: string | null): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d)
  } catch {
    return iso
  }
}

function hasPlaceholder(f: FieldRow) {
  return !!(
    (f.placeholder_owner_nombre && f.placeholder_owner_nombre.trim()) ||
    (f.placeholder_owner_contacto && f.placeholder_owner_contacto.trim())
  )
}

function tabFromParam(v: string | undefined): FilterTab {
  if (v === 'pendiente' || v === 'aprobado' || v === 'rechazado') return v
  return 'todos'
}

async function listToggleDestacado(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  const raw = formData.get('destacado')
  const destacado = raw === 'true'
  const tab = String(formData.get('tab') ?? '')
  const result = await toggleDestacado(id, destacado)
  if ('error' in result && result.error) {
    console.error(result.error)
    return
  }
  redirect(
    '/admin/campos' + (tab ? `?tab=${encodeURIComponent(tab)}` : '')
  )
}

async function listOrdenDestacado(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  const raw = formData.get('orden_destacado')
  const orden =
    typeof raw === 'string' ? Number.parseInt(raw, 10) : Number.NaN
  const tab = String(formData.get('tab') ?? '')
  const result = await updateOrdenDestacado(id, orden)
  if ('error' in result && result.error) {
    console.error(result.error)
    return
  }
  redirect(
    '/admin/campos' + (tab ? `?tab=${encodeURIComponent(tab)}` : '')
  )
}

async function listFieldStatus(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  const status = String(formData.get('status') ?? '') as FieldStatus
  const tab = String(formData.get('tab') ?? '')
  if (status !== 'pendiente' && status !== 'aprobado' && status !== 'rechazado') {
    return
  }
  const result = await updateFieldStatus(id, status)
  if ('error' in result && result.error) {
    console.error(result.error)
    return
  }
  redirect(
    '/admin/campos' + (tab ? `?tab=${encodeURIComponent(tab)}` : '')
  )
}

async function listDeleteField(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  const tab = String(formData.get('tab') ?? '')
  const result = await deleteField(id)
  if ('error' in result && result.error) {
    console.error(result.error)
    return
  }
  redirect(
    '/admin/campos' + (tab ? `?tab=${encodeURIComponent(tab)}` : '')
  )
}

async function actionFieldPlaceholder(formData: FormData) {
  'use server'
  const id = String(formData.get('field_id') ?? '').trim()
  const tab = String(formData.get('tab') ?? '')
  if (!id) return
  const nombre = String(formData.get('placeholder_owner_nombre') ?? '').trim()
  const contacto = String(formData.get('placeholder_owner_contacto') ?? '').trim()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('fields')
    .update({
      placeholder_owner_nombre: nombre || null,
      placeholder_owner_contacto: contacto || null,
    })
    .eq('id', id)
  if (error) {
    console.error(error)
    return
  }
  revalidatePath('/admin/campos')
  redirect(
    '/admin/campos' + (tab ? `?tab=${encodeURIComponent(tab)}` : '')
  )
}

async function actionTransferField(formData: FormData) {
  'use server'
  const fieldId = String(formData.get('field_id') ?? '').trim()
  const newUserId = String(formData.get('new_user_id') ?? '').trim()
  const tab = String(formData.get('tab') ?? '')
  if (!fieldId || !newUserId) return
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('fields')
    .update({
      created_by: newUserId,
      transferred_to: newUserId,
      transferred_at: now,
    })
    .eq('id', fieldId)
  if (error) {
    console.error(error)
    return
  }
  revalidatePath('/admin/campos')
  redirect(
    '/admin/campos' + (tab ? `?tab=${encodeURIComponent(tab)}` : '')
  )
}

export default async function AdminCamposPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const supabase = createAdminClient()

  const tabParam = Array.isArray(searchParams.tab)
    ? searchParams.tab[0]
    : searchParams.tab
  const tab = tabFromParam(tabParam)

  const transferFieldRaw = searchParams.transferField
  const transferFieldId = Array.isArray(transferFieldRaw)
    ? transferFieldRaw[0]
    : transferFieldRaw

  const qRaw = searchParams.q
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw)?.trim() ?? ''

  const askDeleteRaw = searchParams.askDelete
  const askDelete = Array.isArray(askDeleteRaw) ? askDeleteRaw[0] : askDeleteRaw

  const { data, error } = await supabase
    .from('fields')
    .select(
      `
      id,
      nombre,
      ciudad,
      status,
      destacado,
      orden_destacado,
      foto_portada_url,
      created_at,
      created_by,
      placeholder_owner_nombre,
      placeholder_owner_contacto,
      transferred_to,
      transferred_at
    `
    )
    .order('created_at', { ascending: false })

  const fields: FieldRow[] =
    !error && data ? (data as FieldRow[]) : []

  const pending = fields.filter((f) => f.status === 'pendiente').length
  const approved = fields.filter((f) => f.status === 'aprobado').length
  const rejected = fields.filter((f) => f.status === 'rechazado').length

  const filtered =
    tab === 'todos' ? fields : fields.filter((f) => f.status === tab)

  let searchResults: UserSearchRow[] = []
  if (transferFieldId && q.length >= 2) {
    const raw = q.replace(/[%_,]/g, '').trim()
    if (raw.length >= 2) {
      const term = `%${raw}%`
      const { data: udata } = await supabase
        .from('users')
        .select('id, nombre, alias, email, avatar_url')
        .or(`alias.ilike.${term},email.ilike.${term}`)
        .limit(20)
      searchResults = (udata as UserSearchRow[]) ?? []
    }
  }

  const base = '/admin/campos'
  const tabQs = tab !== 'todos' ? `?tab=${encodeURIComponent(tab)}` : ''

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'todos', label: 'TODOS' },
    { id: 'pendiente', label: 'PENDIENTES' },
    { id: 'aprobado', label: 'APROBADOS' },
    { id: 'rechazado', label: 'RECHAZADOS' },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          CAMPOS
        </h1>
        <div
          className="flex flex-wrap items-center gap-3 text-sm text-[#666666]"
          style={latoBody}
        >
          <span className="inline-flex items-center gap-2">
            <span
              style={jostHeading}
              className="text-[10px] tracking-[0.12em] text-[#111111]"
            >
              PENDIENTES
            </span>
            <span
              className="inline-flex min-w-[1.75rem] items-center justify-center px-2 py-1 text-[11px] font-semibold text-[#FFFFFF]"
              style={{
                ...jostHeading,
                backgroundColor: '#CC4B37',
                borderRadius: 2,
              }}
            >
              {pending}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              style={jostHeading}
              className="text-[10px] tracking-[0.12em] text-[#111111]"
            >
              APROBADOS
            </span>
            <span
              className="inline-flex min-w-[1.75rem] items-center justify-center px-2 py-1 text-[11px] font-semibold text-[#FFFFFF]"
              style={{
                ...jostHeading,
                backgroundColor: '#111111',
                borderRadius: 2,
              }}
            >
              {approved}
            </span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              style={jostHeading}
              className="text-[10px] tracking-[0.12em] text-[#111111]"
            >
              RECHAZADOS
            </span>
            <span
              className="inline-flex min-w-[1.75rem] items-center justify-center border border-solid border-[#EEEEEE] px-2 py-1 text-[11px] font-semibold text-[#666666]"
              style={{
                ...jostHeading,
                backgroundColor: '#EEEEEE',
                borderRadius: 2,
              }}
            >
              {rejected}
            </span>
          </span>
        </div>
      </div>

      {transferFieldId ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-field-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="transfer-field-title"
                className="text-lg text-[#111111]"
                style={jostHeading}
              >
                TRANSFERIR CAMPO
              </h2>
              <Link
                href={base + tabQs}
                className="shrink-0 text-[12px] text-[#666666] hover:text-[#111111]"
                style={latoBody}
              >
                Cerrar
              </Link>
            </div>
            <p className="mt-2 text-[13px] text-[#666666]" style={latoBody}>
              Busca por alias o email y confirma al nuevo propietario.
            </p>
            <form method="get" className="mt-4 flex flex-wrap gap-2">
              <input
                type="hidden"
                name="transferField"
                value={transferFieldId}
              />
              <input type="hidden" name="tab" value={tab} />
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="Alias o email"
                className="min-w-0 flex-1 border border-solid border-[#EEEEEE] px-3 py-2 text-sm text-[#111111]"
                style={{ ...latoBody, borderRadius: 2 }}
              />
              <button
                type="submit"
                className="bg-[#111111] px-4 py-2 text-[10px] text-[#FFFFFF]"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                BUSCAR
              </button>
            </form>

            {q.length > 0 && q.length < 2 ? (
              <p className="mt-3 text-[12px] text-[#666666]" style={latoBody}>
                Escribe al menos 2 caracteres.
              </p>
            ) : null}

            {transferFieldId && q.length >= 2 ? (
              <ul className="mt-4 flex flex-col gap-2">
                {searchResults.length === 0 ? (
                  <li className="text-[13px] text-[#666666]" style={latoBody}>
                    Sin resultados.
                  </li>
                ) : (
                  searchResults.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 border border-solid border-[#EEEEEE] p-3"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden bg-[#F4F4F4]">
                        {u.avatar_url ? (
                          <img
                            src={u.avatar_url}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-[11px] text-[#CC4B37]"
                            style={jostHeading}
                          >
                            {(u.alias?.[0] || u.nombre?.[0] || '?').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-[13px] text-[#111111]"
                          style={latoBody}
                        >
                          {u.nombre?.trim() || '—'}
                          {u.alias?.trim() ? (
                            <span className="text-[#666666]">
                              {' '}
                              · @{u.alias.trim()}
                            </span>
                          ) : null}
                        </p>
                        <p
                          className="truncate text-[12px] text-[#666666]"
                          style={latoBody}
                        >
                          {u.email ?? '—'}
                        </p>
                      </div>
                      <form action={actionTransferField}>
                        <input
                          type="hidden"
                          name="field_id"
                          value={transferFieldId}
                        />
                        <input type="hidden" name="new_user_id" value={u.id} />
                        <input type="hidden" name="tab" value={tab} />
                        <button
                          type="submit"
                          className="bg-[#1B5E20] px-3 py-2 text-[10px] text-[#FFFFFF]"
                          style={{ ...jostHeading, borderRadius: 2 }}
                        >
                          CONFIRMAR TRANSFERENCIA
                        </button>
                      </form>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4" style={latoBody}>
        <div className="flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-3">
          {TABS.map((t) => {
            const active = tab === t.id
            const href =
              t.id === 'todos' ? base : `${base}?tab=${encodeURIComponent(t.id)}`
            return (
              <Link
                key={t.id}
                href={href}
                className={`px-3 py-2 text-[11px] tracking-[0.12em] transition-colors ${
                  active
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666] hover:text-[#111111]'
                }`}
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                {t.label}
              </Link>
            )
          })}
        </div>

        {fields.length === 0 ? (
          <p className="py-16 text-center text-[#666666]">
            No hay campos registrados
          </p>
        ) : filtered.length === 0 ? (
          <p className="py-12 text-center text-[#666666]">
            No hay campos en esta categoría
          </p>
        ) : (
          <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
            <table className="w-full border-collapse text-left text-sm text-[#111111]">
              <thead>
                <tr className="bg-[#F4F4F4]">
                  {(
                    [
                      'FOTO',
                      'NOMBRE',
                      'CIUDAD',
                      'STATUS',
                      'DESTACADO',
                      'ACCIONES',
                    ] as const
                  ).map((col) => (
                    <th
                      key={col}
                      className="border border-solid border-[#EEEEEE] px-3 py-3 text-[12px] text-[#111111]"
                      style={jostHeading}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((f, i) => {
                  const transferred = !!f.transferred_to
                  const showTransferBtn = !transferred && hasPlaceholder(f)
                  const transferHref =
                    `${base}${tabQs ? tabQs + '&' : '?'}transferField=${encodeURIComponent(f.id)}`

                  return (
                    <tr
                      key={f.id}
                      className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
                    >
                      <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                        {f.foto_portada_url ? (
                          <img
                            src={f.foto_portada_url}
                            alt=""
                            width={60}
                            height={60}
                            className="h-[60px] w-[60px] object-cover"
                            style={{ borderRadius: 0 }}
                          />
                        ) : (
                          <div
                            className="h-[60px] w-[60px] shrink-0 bg-[#EEEEEE]"
                            aria-hidden
                          />
                        )}
                      </td>
                      <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-top">
                        <div className="font-semibold">{f.nombre}</div>
                        {transferred ? (
                          <span
                            className="mt-1 inline-block text-[10px] font-semibold uppercase text-[#FFFFFF]"
                            style={{
                              padding: '4px 8px',
                              borderRadius: 2,
                              backgroundColor: '#1B5E20',
                              ...jostHeading,
                            }}
                          >
                            TRANSFERIDO{' '}
                            {f.transferred_at
                              ? formatFechaHora(f.transferred_at)
                              : ''}
                          </span>
                        ) : null}
                        <details className="mt-2">
                          <summary
                            className="cursor-pointer text-[11px] text-[#666666] marker:hidden [&::-webkit-details-marker]:hidden"
                            style={jostHeading}
                          >
                            Dueño placeholder
                          </summary>
                          <form action={actionFieldPlaceholder} className="mt-2 space-y-2">
                            <input type="hidden" name="field_id" value={f.id} />
                            <input type="hidden" name="tab" value={tab} />
                            <label className="block text-[11px] text-[#666666]" style={latoBody}>
                              Nombre del dueño real
                              <input
                                type="text"
                                name="placeholder_owner_nombre"
                                defaultValue={f.placeholder_owner_nombre ?? ''}
                                className="mt-1 w-full max-w-[220px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1 text-[12px] text-[#111111]"
                                style={{ borderRadius: 2 }}
                              />
                            </label>
                            <label className="block text-[11px] text-[#666666]" style={latoBody}>
                              Contacto (WhatsApp/Instagram)
                              <input
                                type="text"
                                name="placeholder_owner_contacto"
                                defaultValue={f.placeholder_owner_contacto ?? ''}
                                className="mt-1 w-full max-w-[220px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1 text-[12px] text-[#111111]"
                                style={{ borderRadius: 2 }}
                              />
                            </label>
                            <button
                              type="submit"
                              className="bg-[#111111] px-3 py-1.5 text-[10px] text-[#FFFFFF]"
                              style={{ ...jostHeading, borderRadius: 2 }}
                            >
                              GUARDAR
                            </button>
                          </form>
                        </details>
                      </td>
                      <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                        {f.ciudad ?? '—'}
                      </td>
                      <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={listToggleDestacado}>
                            <input type="hidden" name="id" value={f.id} />
                            <input type="hidden" name="tab" value={tab} />
                            <input
                              type="hidden"
                              name="destacado"
                              value={(!f.destacado).toString()}
                            />
                            <button
                              type="submit"
                              className="text-[10px] uppercase text-[#111111] underline"
                              style={jostHeading}
                            >
                              {f.destacado ? 'Quitar destacado' : 'Destacar'}
                            </button>
                          </form>
                          {f.destacado ? (
                            <form
                              action={listOrdenDestacado}
                              className="flex items-center gap-1"
                            >
                              <input type="hidden" name="id" value={f.id} />
                              <input type="hidden" name="tab" value={tab} />
                              <input
                                type="number"
                                name="orden_destacado"
                                min={1}
                                defaultValue={
                                  f.orden_destacado != null
                                    ? String(f.orden_destacado)
                                    : '1'
                                }
                                className="h-8 w-[56px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-1 text-center text-sm text-[#111111] tabular-nums"
                                style={{ ...latoBody, borderRadius: 2 }}
                                aria-label="Orden destacado"
                              />
                              <button
                                type="submit"
                                className="border border-solid border-[#EEEEEE] px-2 py-1 text-[9px] text-[#111111]"
                                style={jostHeading}
                              >
                                OK
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </td>
                      <td className="border border-solid border-[#EEEEEE] px-3 py-2 align-middle">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href={`/admin/campos/${f.id}`}
                            className="inline-flex items-center justify-center bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
                            style={{
                              ...jostHeading,
                              fontSize: 11,
                              padding: '4px 10px',
                              borderRadius: 2,
                            }}
                          >
                            VER
                          </Link>
                          {f.status === 'pendiente' ? (
                            <form action={listFieldStatus}>
                              <input type="hidden" name="id" value={f.id} />
                              <input type="hidden" name="tab" value={tab} />
                              <input type="hidden" name="status" value="aprobado" />
                              <button
                                type="submit"
                                className="inline-flex items-center justify-center bg-[#1B5E20] text-[#FFFFFF] transition-colors hover:opacity-90"
                                style={{
                                  ...jostHeading,
                                  fontSize: 11,
                                  padding: '4px 10px',
                                  borderRadius: 2,
                                }}
                              >
                                APROBAR
                              </button>
                            </form>
                          ) : null}
                          {(f.status === 'pendiente' ||
                            f.status === 'aprobado') ? (
                            <form action={listFieldStatus}>
                              <input type="hidden" name="id" value={f.id} />
                              <input type="hidden" name="tab" value={tab} />
                              <input type="hidden" name="status" value="rechazado" />
                              <button
                                type="submit"
                                className="inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37]"
                                style={{
                                  ...jostHeading,
                                  fontSize: 11,
                                  padding: '4px 10px',
                                  borderRadius: 2,
                                }}
                              >
                                RECHAZAR
                              </button>
                            </form>
                          ) : null}
                          {showTransferBtn ? (
                            <Link
                              href={transferHref}
                              className="inline-flex items-center justify-center border border-solid border-[#111111] bg-[#FFFFFF] text-[#111111]"
                              style={{
                                ...jostHeading,
                                fontSize: 11,
                                padding: '4px 10px',
                                borderRadius: 2,
                              }}
                            >
                              TRANSFERIR
                            </Link>
                          ) : null}
                          {askDelete === f.id ? (
                            <form action={listDeleteField} className="inline-flex items-center gap-2">
                              <input type="hidden" name="id" value={f.id} />
                              <input type="hidden" name="tab" value={tab} />
                              <span className="text-[11px] text-[#111111]" style={latoBody}>
                                ¿Eliminar?
                              </span>
                              <button
                                type="submit"
                                className="border border-[#CC4B37] px-2 py-1 text-[10px] text-[#CC4B37]"
                                style={jostHeading}
                              >
                                SÍ
                              </button>
                              <Link
                                href={base + tabQs}
                                className="border border-solid border-[#EEEEEE] px-2 py-1 text-[10px] text-[#666666]"
                                style={jostHeading}
                              >
                                NO
                              </Link>
                            </form>
                          ) : (
                            <Link
                              href={`${base}${tabQs ? tabQs + '&' : '?'}askDelete=${encodeURIComponent(f.id)}`}
                              className="border border-[#CC4B37] px-3 py-1.5 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-white"
                              style={{ borderRadius: 2 }}
                            >
                              ELIMINAR
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
