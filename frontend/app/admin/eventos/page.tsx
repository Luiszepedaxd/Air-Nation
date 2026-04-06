import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase-server'
import { cancelEvent, deleteEvent, toggleEventPublished } from './actions'
import { getSupabaseForEventosModule } from './eventos-supabase'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

type FilterTab = 'todos' | 'publicados' | 'borradores' | 'cancelados'

type AdminEventoRow = {
  id: string
  title: string
  field_id: string | null
  fecha: string
  cupo: number
  disciplina: string | null
  tipo: string | null
  published: boolean
  status: string
  imagen_url: string | null
  field_nombre: string | null
  field_ciudad: string | null
  creador_label: string | null
  organizador_id: string | null
  created_by: string | null
  placeholder_owner_nombre: string | null
  placeholder_owner_contacto: string | null
  transferred_to: string | null
  transferred_at: string | null
}

type UserSearchRow = {
  id: string
  nombre: string | null
  alias: string | null
  email: string | null
  avatar_url: string | null
}

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'todos', label: 'TODOS' },
  { id: 'publicados', label: 'PUBLICADOS' },
  { id: 'borradores', label: 'BORRADORES' },
  { id: 'cancelados', label: 'CANCELADOS' },
]

function normalizeFields(raw: unknown): {
  nombre: string | null
  ciudad: string | null
} {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') return { nombre: null, ciudad: null }
  const x = o as Record<string, unknown>
  return {
    nombre: typeof x.nombre === 'string' ? x.nombre : null,
    ciudad: typeof x.ciudad === 'string' ? x.ciudad : null,
  }
}

function normalizeCreador(raw: unknown): string | null {
  const o = Array.isArray(raw) ? raw[0] : raw
  if (!o || typeof o !== 'object') return null
  const x = o as Record<string, unknown>
  const alias = typeof x.alias === 'string' ? x.alias.trim() : ''
  const nombre = typeof x.nombre === 'string' ? x.nombre.trim() : ''
  return alias || nombre || null
}

function statusBadge(status: string, published: boolean) {
  const s = status.toLowerCase()
  if (s === 'cancelado') {
    return (
      <span
        className="inline-block text-[10px] font-semibold tracking-wide text-[#666666]"
        style={{
          padding: '4px 8px',
          backgroundColor: '#EEEEEE',
          ...jostHeading,
        }}
      >
        CANCELADO
      </span>
    )
  }
  if (published && s === 'publicado') {
    return (
      <span
        className="inline-block text-[10px] font-semibold tracking-wide text-[#FFFFFF]"
        style={{
          padding: '4px 8px',
          backgroundColor: '#111111',
          ...jostHeading,
        }}
      >
        PUBLICADO
      </span>
    )
  }
  return (
    <span
      className="inline-block text-[10px] font-semibold tracking-wide text-[#856404]"
      style={{
        padding: '4px 8px',
        backgroundColor: '#FFF3CD',
        ...jostHeading,
      }}
    >
      BORRADOR
    </span>
  )
}

function tipoLabel(tipo: string | null) {
  const t = (tipo ?? '').toLowerCase()
  return t === 'privado' ? 'PRIVADO' : 'PÚBLICO'
}

function formatFecha(iso: string) {
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d)
  } catch {
    return iso
  }
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

function tabFromParam(v: string | undefined): FilterTab {
  if (
    v === 'publicados' ||
    v === 'borradores' ||
    v === 'cancelados'
  ) {
    return v
  }
  return 'todos'
}

function hasPlaceholder(e: AdminEventoRow) {
  return !!(
    (e.placeholder_owner_nombre && e.placeholder_owner_nombre.trim()) ||
    (e.placeholder_owner_contacto && e.placeholder_owner_contacto.trim())
  )
}

function filterRows(rows: AdminEventoRow[], tab: FilterTab): AdminEventoRow[] {
  if (tab === 'todos') return rows
  if (tab === 'cancelados') {
    return rows.filter((r) => r.status.toLowerCase() === 'cancelado')
  }
  if (tab === 'publicados') {
    return rows.filter(
      (r) => r.published && r.status.toLowerCase() === 'publicado'
    )
  }
  if (tab === 'borradores') {
    return rows.filter((r) => {
      if (r.status.toLowerCase() === 'cancelado') return false
      return !r.published || r.status.toLowerCase() === 'borrador'
    })
  }
  return rows
}

function tabQuery(tab: FilterTab): string {
  return tab === 'todos' ? '' : `?tab=${encodeURIComponent(tab)}`
}

async function listTogglePublished(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  const next = String(formData.get('published') ?? '') === '1'
  const tab = tabFromParam(String(formData.get('tab') ?? ''))
  const res = await toggleEventPublished(id, next)
  if (res && 'error' in res && res.error) {
    console.error(res.error)
    return
  }
  redirect('/admin/eventos' + tabQuery(tab))
}

async function listCancelEvent(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  const tab = tabFromParam(String(formData.get('tab') ?? ''))
  const res = await cancelEvent(id)
  if (res && 'error' in res && res.error) {
    console.error(res.error)
    return
  }
  redirect('/admin/eventos' + tabQuery(tab))
}

async function listDeleteEvent(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  const tab = tabFromParam(String(formData.get('tab') ?? ''))
  const res = await deleteEvent(id)
  if (res && 'error' in res && res.error) {
    console.error(res.error)
    return
  }
  redirect('/admin/eventos' + tabQuery(tab))
}

async function actionEventPlaceholder(formData: FormData) {
  'use server'
  const id = String(formData.get('event_id') ?? '').trim()
  const tab = tabFromParam(String(formData.get('tab') ?? ''))
  if (!id) return
  const nombre = String(formData.get('placeholder_owner_nombre') ?? '').trim()
  const contacto = String(formData.get('placeholder_owner_contacto') ?? '').trim()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('events')
    .update({
      placeholder_owner_nombre: nombre || null,
      placeholder_owner_contacto: contacto || null,
    })
    .eq('id', id)
  if (error) {
    console.error(error)
    return
  }
  revalidatePath('/admin/eventos')
  redirect('/admin/eventos' + tabQuery(tab))
}

async function actionTransferEvent(formData: FormData) {
  'use server'
  const eventId = String(formData.get('event_id') ?? '').trim()
  const newUserId = String(formData.get('new_user_id') ?? '').trim()
  const tab = tabFromParam(String(formData.get('tab') ?? ''))
  if (!eventId || !newUserId) return
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('events')
    .update({
      organizador_id: newUserId,
      created_by: newUserId,
      transferred_to: newUserId,
      transferred_at: now,
    })
    .eq('id', eventId)
  if (error) {
    console.error(error)
    return
  }
  revalidatePath('/admin/eventos')
  redirect('/admin/eventos' + tabQuery(tab))
}

export default async function AdminEventosPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const ctx = await getSupabaseForEventosModule()
  if ('error' in ctx) redirect('/dashboard')

  const tabParam = Array.isArray(searchParams.tab)
    ? searchParams.tab[0]
    : searchParams.tab
  const tab = tabFromParam(tabParam)

  const transferEventRaw = searchParams.transferEvent
  const transferEventId = Array.isArray(transferEventRaw)
    ? transferEventRaw[0]
    : transferEventRaw

  const qRaw = searchParams.q
  const q = (Array.isArray(qRaw) ? qRaw[0] : qRaw)?.trim() ?? ''

  const askDeleteRaw = searchParams.askDelete
  const askDelete = Array.isArray(askDeleteRaw) ? askDeleteRaw[0] : askDeleteRaw

  const { data, error } = await ctx.supabase
    .from('events')
    .select(
      `
      id,
      title,
      field_id,
      fecha,
      cupo,
      disciplina,
      tipo,
      published,
      status,
      imagen_url,
      created_at,
      organizador_id,
      created_by,
      placeholder_owner_nombre,
      placeholder_owner_contacto,
      transferred_to,
      transferred_at,
      fields ( nombre, ciudad ),
      creador:users!created_by ( alias, nombre )
    `
    )
    .order('fecha', { ascending: false })

  const rows: AdminEventoRow[] = []
  if (!error && data) {
    for (const r of data as Record<string, unknown>[]) {
      const f = normalizeFields(r.fields)
      rows.push({
        id: String(r.id),
        title: String(r.title ?? ''),
        field_id: (r.field_id as string | null) ?? null,
        fecha: String(r.fecha ?? ''),
        cupo: Number(r.cupo ?? 0),
        disciplina: (r.disciplina as string | null) ?? null,
        tipo: (r.tipo as string | null) ?? null,
        published: Boolean(r.published),
        status: String(r.status ?? ''),
        imagen_url: (r.imagen_url as string | null) ?? null,
        field_nombre: f.nombre,
        field_ciudad: f.ciudad,
        creador_label: normalizeCreador(r.creador),
        organizador_id: (r.organizador_id as string | null) ?? null,
        created_by: (r.created_by as string | null) ?? null,
        placeholder_owner_nombre: (r.placeholder_owner_nombre as string | null) ?? null,
        placeholder_owner_contacto: (r.placeholder_owner_contacto as string | null) ?? null,
        transferred_to: (r.transferred_to as string | null) ?? null,
        transferred_at: (r.transferred_at as string | null) ?? null,
      })
    }
  }

  const filtered = filterRows(rows, tab)

  const supabaseSearch = createAdminClient()
  let searchResults: UserSearchRow[] = []
  if (transferEventId && q.length >= 2) {
    const raw = q.replace(/[%_,]/g, '').trim()
    if (raw.length >= 2) {
      const term = `%${raw}%`
      const { data: udata } = await supabaseSearch
        .from('users')
        .select('id, nombre, alias, email, avatar_url')
        .or(`alias.ilike.${term},email.ilike.${term}`)
        .limit(20)
      searchResults = (udata as UserSearchRow[]) ?? []
    }
  }

  const base = '/admin/eventos'
  const tabQs = tabQuery(tab)

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          EVENTOS
        </h1>
        <Link
          href="/admin/eventos/nuevo"
          className="inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#CC4B37] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          NUEVO EVENTO
        </Link>
      </div>

      {transferEventId ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="transfer-event-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <h2
                id="transfer-event-title"
                className="text-lg text-[#111111]"
                style={jostHeading}
              >
                TRANSFERIR EVENTO
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
              Busca por alias o email y confirma al nuevo organizador.
            </p>
            <form method="get" className="mt-4 flex flex-wrap gap-2">
              <input
                type="hidden"
                name="transferEvent"
                value={transferEventId}
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

            {transferEventId && q.length >= 2 ? (
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
                      <form action={actionTransferEvent}>
                        <input
                          type="hidden"
                          name="event_id"
                          value={transferEventId}
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

      <div>
        <div
          className="mb-6 flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-4"
          style={latoBody}
        >
          {TABS.map((t) => {
            const active = tab === t.id
            const href =
              t.id === 'todos' ? base : `${base}?tab=${encodeURIComponent(t.id)}`
            return (
              <Link
                key={t.id}
                href={href}
                className={`px-3 py-2 text-[10px] tracking-[0.12em] transition-colors ${
                  active
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'bg-[#F4F4F4] text-[#666666] hover:text-[#111111]'
                }`}
                style={jostHeading}
              >
                {t.label}
              </Link>
            )
          })}
        </div>

        <div className="overflow-x-auto border border-solid border-[#EEEEEE]">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-solid border-[#EEEEEE] bg-[#F4F4F4]">
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  IMAGEN
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  TÍTULO
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  CREADOR
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  CAMPO
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  FECHA
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  CUPO
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  DISC.
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  TIPO
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  ESTADO
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  PUB.
                </th>
                <th className="p-3 text-[10px] text-[#666666]" style={jostHeading}>
                  ACCIONES
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="p-8 text-center text-[#666666]"
                    style={latoBody}
                  >
                    No hay eventos en este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const isCanceled = r.status.toLowerCase() === 'cancelado'
                  const transferred = !!r.transferred_to
                  const showTransferBtn = !transferred && hasPlaceholder(r)
                  const transferHref =
                    `${base}${tabQs ? tabQs + '&' : '?'}transferEvent=${encodeURIComponent(r.id)}`

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-solid border-[#EEEEEE] align-middle"
                    >
                      <td className="p-2">
                        <div className="h-12 w-12 overflow-hidden bg-[#111111]">
                          {r.imagen_url?.trim() ? (
                            <img
                              src={r.imagen_url.trim()}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[9px] text-[#AAAAAA]">
                              —
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="max-w-[200px] p-2 align-top">
                        <p
                          className="line-clamp-2 font-semibold text-[#111111]"
                          style={latoBody}
                        >
                          {r.title}
                        </p>
                        {transferred ? (
                          <span
                            className="mt-1 inline-block text-[9px] font-semibold uppercase text-[#FFFFFF]"
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#1B5E20',
                              ...jostHeading,
                            }}
                          >
                            TRANSFERIDO{' '}
                            {r.transferred_at
                              ? formatFechaHora(r.transferred_at)
                              : ''}
                          </span>
                        ) : null}
                        <details className="mt-2">
                          <summary
                            className="cursor-pointer text-[9px] text-[#666666] marker:hidden [&::-webkit-details-marker]:hidden"
                            style={jostHeading}
                          >
                            Dueño placeholder
                          </summary>
                          <form action={actionEventPlaceholder} className="mt-2 space-y-2">
                            <input type="hidden" name="event_id" value={r.id} />
                            <input type="hidden" name="tab" value={tab} />
                            <label className="block text-[10px] text-[#666666]" style={latoBody}>
                              Nombre del dueño real
                              <input
                                type="text"
                                name="placeholder_owner_nombre"
                                defaultValue={r.placeholder_owner_nombre ?? ''}
                                className="mt-1 w-full max-w-[180px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[11px] text-[#111111]"
                                style={{ borderRadius: 2 }}
                              />
                            </label>
                            <label className="block text-[10px] text-[#666666]" style={latoBody}>
                              Contacto (WhatsApp/Instagram)
                              <input
                                type="text"
                                name="placeholder_owner_contacto"
                                defaultValue={r.placeholder_owner_contacto ?? ''}
                                className="mt-1 w-full max-w-[180px] border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[11px] text-[#111111]"
                                style={{ borderRadius: 2 }}
                              />
                            </label>
                            <button
                              type="submit"
                              className="bg-[#111111] px-3 py-1.5 text-[9px] text-[#FFFFFF]"
                              style={{ ...jostHeading, borderRadius: 2 }}
                            >
                              GUARDAR
                            </button>
                          </form>
                        </details>
                      </td>
                      <td className="max-w-[120px] p-2 text-[12px] text-[#666666]" style={latoBody}>
                        {r.creador_label?.trim() || '—'}
                      </td>
                      <td className="max-w-[140px] p-2 text-[13px] text-[#666666]" style={latoBody}>
                        {r.field_nombre?.trim() || '—'}
                        {r.field_ciudad?.trim() ? (
                          <span className="block text-[11px] text-[#AAAAAA]">
                            {r.field_ciudad.trim()}
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap p-2 text-[12px] text-[#666666]" style={latoBody}>
                        {formatFecha(r.fecha)}
                      </td>
                      <td className="p-2 text-[12px] text-[#666666]" style={latoBody}>
                        {r.cupo <= 0 ? '∞' : r.cupo}
                      </td>
                      <td className="p-2 text-[11px] uppercase text-[#666666]" style={jostHeading}>
                        {(r.disciplina ?? 'airsoft').slice(0, 8)}
                      </td>
                      <td className="p-2 text-[11px]" style={jostHeading}>
                        {tipoLabel(r.tipo)}
                      </td>
                      <td className="p-2">{statusBadge(r.status, r.published)}</td>
                      <td className="p-2 text-[12px]" style={latoBody}>
                        {r.published ? 'Sí' : 'No'}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/admin/eventos/${r.id}/editar`}
                            className="inline-block bg-[#EEEEEE] px-2 py-1 text-center text-[9px] text-[#111111] hover:bg-[#DDDDDD]"
                            style={jostHeading}
                          >
                            EDITAR
                          </Link>
                          <form action={listTogglePublished}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="tab" value={tab} />
                            <input
                              type="hidden"
                              name="published"
                              value={r.published ? '0' : '1'}
                            />
                            <button
                              type="submit"
                              disabled={isCanceled}
                              className="w-full bg-[#CC4B37] px-2 py-1 text-[9px] text-[#FFFFFF] disabled:opacity-50"
                              style={jostHeading}
                            >
                              {r.published ? 'DESPUBLICAR' : 'PUBLICAR'}
                            </button>
                          </form>
                          <form action={listCancelEvent}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="tab" value={tab} />
                            <button
                              type="submit"
                              disabled={isCanceled}
                              className="w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-1 text-[9px] text-[#666666] disabled:opacity-50"
                              style={jostHeading}
                            >
                              CANCELAR
                            </button>
                          </form>
                          {showTransferBtn ? (
                            <Link
                              href={transferHref}
                              className="inline-block text-center text-[9px] text-[#111111] underline"
                              style={jostHeading}
                            >
                              TRANSFERIR
                            </Link>
                          ) : null}
                          {askDelete === r.id ? (
                            <form action={listDeleteEvent} className="flex flex-col gap-1">
                              <input type="hidden" name="id" value={r.id} />
                              <input type="hidden" name="tab" value={tab} />
                              <span className="text-[9px] text-[#111111]" style={latoBody}>
                                ¿Eliminar?
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="submit"
                                  className="flex-1 border border-[#CC4B37] px-2 py-1 text-[9px] text-[#CC4B37]"
                                  style={jostHeading}
                                >
                                  SÍ
                                </button>
                                <Link
                                  href={base + tabQs}
                                  className="flex-1 border border-solid border-[#EEEEEE] px-2 py-1 text-center text-[9px] text-[#666666]"
                                  style={jostHeading}
                                >
                                  NO
                                </Link>
                              </div>
                            </form>
                          ) : (
                            <Link
                              href={`${base}${tabQs ? tabQs + '&' : '?'}askDelete=${encodeURIComponent(r.id)}`}
                              className="inline-block border border-[#CC4B37] px-3 py-1.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.15em] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-white"
                            >
                              ELIMINAR
                            </Link>
                          )}
                          {r.published ? (
                            <Link
                              href={`/eventos/${r.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block text-center text-[9px] text-[#CC4B37]"
                              style={jostHeading}
                            >
                              VER PÚBLICO
                            </Link>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
