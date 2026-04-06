import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '../supabase-server'
import { deleteTeam } from './actions'
import { TransferTeamTrigger } from './TransferModal'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

type TeamRow = {
  id: string
  nombre: string
  slug: string | null
  ciudad: string | null
  status: string | null
  created_at: string | null
  created_by: string | null
  placeholder_owner_nombre: string | null
  placeholder_owner_contacto: string | null
  transferred_to: string | null
  transferred_at: string | null
}

type MemberRow = {
  id: string
  team_id: string
  user_id: string
  rol_plataforma: string | null
  nombre: string | null
  alias: string | null
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

function StatusBadge({ status }: { status: string | null }) {
  const s = (status ?? '').toLowerCase()
  const isActivo = s === 'activo'
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: isActivo ? '#111111' : '#EEEEEE',
        color: isActivo ? '#FFFFFF' : '#666666',
        ...jostHeading,
        fontSize: 10,
      }}
    >
      {(status ?? '—').toUpperCase()}
    </span>
  )
}

async function actionUpdateTeamMemberRole(formData: FormData) {
  'use server'
  const memberId = String(formData.get('member_id') ?? '').trim()
  const teamId = String(formData.get('team_id') ?? '').trim()
  const rol = String(formData.get('rol_plataforma') ?? '').trim()
  if (!memberId || !teamId || !rol) return
  const allowed = new Set(['founder', 'admin', 'member'])
  if (!allowed.has(rol)) return
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('team_members')
    .update({ rol_plataforma: rol })
    .eq('id', memberId)
    .eq('team_id', teamId)
  if (error) {
    console.error(error)
    return
  }
  revalidatePath('/admin/equipos')
}

async function actionTeamPlaceholder(formData: FormData) {
  'use server'
  const id = String(formData.get('team_id') ?? '').trim()
  if (!id) return
  const nombre = String(formData.get('placeholder_owner_nombre') ?? '').trim()
  const contacto = String(formData.get('placeholder_owner_contacto') ?? '').trim()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('teams')
    .update({
      placeholder_owner_nombre: nombre || null,
      placeholder_owner_contacto: contacto || null,
    })
    .eq('id', id)
  if (error) {
    console.error(error)
    return
  }
  revalidatePath('/admin/equipos')
}

async function actionDeleteTeamConfirm(formData: FormData) {
  'use server'
  const id = String(formData.get('id') ?? '').trim()
  if (!id) return
  const result = await deleteTeam(id)
  if ('error' in result && result.error) {
    console.error(result.error)
    return
  }
  redirect('/admin/equipos')
}

export default async function AdminEquiposPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const supabase = createAdminClient()

  const askDeleteRaw = searchParams.askDelete
  const askDelete = Array.isArray(askDeleteRaw) ? askDeleteRaw[0] : askDeleteRaw

  const { data, error } = await supabase
    .from('teams')
    .select(
      `
      id,
      nombre,
      slug,
      ciudad,
      status,
      created_at,
      created_by,
      placeholder_owner_nombre,
      placeholder_owner_contacto,
      transferred_to,
      transferred_at
    `
    )
    .order('created_at', { ascending: false })

  const teams: TeamRow[] =
    !error && data ? (data as TeamRow[]) : []

  const teamIds = teams.map((t) => t.id)
  let membersByTeam: Record<string, MemberRow[]> = {}

  if (teamIds.length > 0) {
    const { data: memData, error: memErr } = await supabase
      .from('team_members')
      .select(
        `
        id,
        team_id,
        user_id,
        rol_plataforma,
        users ( nombre, alias )
      `
      )
      .in('team_id', teamIds)
      .eq('status', 'activo')

    if (!memErr && memData) {
      const map: Record<string, MemberRow[]> = {}
      for (const row of memData as {
        id: string
        team_id: string
        user_id: string
        rol_plataforma: string | null
        users: unknown
      }[]) {
        const u = Array.isArray(row.users) ? row.users[0] : row.users
        const uo = u as { nombre?: string | null; alias?: string | null } | null
        const m: MemberRow = {
          id: row.id,
          team_id: row.team_id,
          user_id: row.user_id,
          rol_plataforma: row.rol_plataforma,
          nombre: uo?.nombre ?? null,
          alias: uo?.alias ?? null,
        }
        if (!map[row.team_id]) map[row.team_id] = []
        map[row.team_id].push(m)
      }
      for (const k of Object.keys(map)) {
        map[k].sort((a, b) => {
          const rank = (r: string | null) => {
            const x = (r || '').toLowerCase()
            if (x === 'founder') return 1
            if (x === 'admin') return 2
            return 3
          }
          const dr = rank(a.rol_plataforma) - rank(b.rol_plataforma)
          if (dr !== 0) return dr
          const an = (a.nombre || a.alias || '').toLowerCase()
          const bn = (b.nombre || b.alias || '').toLowerCase()
          return an.localeCompare(bn, 'es')
        })
      }
      membersByTeam = map
    }
  }

  const base = '/admin/equipos'

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          EQUIPOS
        </h1>
        <Link
          href={`${base}/nuevo`}
          className="inline-flex items-center justify-center bg-[#111111] px-4 py-2.5 text-[10px] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          NUEVO EQUIPO
        </Link>
      </div>

      {teams.length === 0 ? (
        <p className="py-16 text-center text-[#666666]" style={latoBody}>
          No hay equipos registrados
        </p>
      ) : (
        <div className="flex flex-col gap-2" style={latoBody}>
          {teams.map((t) => {
            const members = membersByTeam[t.id] ?? []
            const transferred = !!t.transferred_to

            return (
              <details
                key={t.id}
                className="group border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
              >
                <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 px-3 py-3 marker:hidden [&::-webkit-details-marker]:hidden">
                  <span
                    className="min-w-0 flex-1 font-semibold text-[#111111]"
                    style={latoBody}
                  >
                    {t.nombre}
                  </span>
                  <span className="text-[13px] text-[#666666]" style={latoBody}>
                    {t.ciudad ?? '—'}
                  </span>
                  <StatusBadge status={t.status} />
                  {transferred ? (
                    <span
                      className="inline-block text-[10px] font-semibold uppercase text-[#FFFFFF]"
                      style={{
                        padding: '4px 8px',
                        borderRadius: 2,
                        backgroundColor: '#1B5E20',
                        ...jostHeading,
                      }}
                    >
                      TRANSFERIDO {t.transferred_at ? formatFechaHora(t.transferred_at) : ''}
                    </span>
                  ) : null}
                  <span className="text-[11px] text-[#999999]" style={jostHeading}>
                    Ver integrantes
                  </span>
                </summary>

                <div className="space-y-4 border-t border-solid border-[#EEEEEE] px-3 pb-4 pt-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`${base}/${encodeURIComponent(t.id)}/editar`}
                      className="inline-flex items-center justify-center border border-solid border-[#111111] bg-[#FFFFFF] px-3 py-2 text-[10px] text-[#111111]"
                      style={{ ...jostHeading, borderRadius: 2 }}
                    >
                      EDITAR
                    </Link>
                    <TransferTeamTrigger
                      teamId={t.id}
                      resourceName={t.nombre}
                    />
                    {askDelete === t.id ? (
                      <form action={actionDeleteTeamConfirm} className="inline-flex items-center gap-2">
                        <input type="hidden" name="id" value={t.id} />
                        <span className="text-[12px] text-[#111111]" style={latoBody}>
                          ¿Eliminar este equipo?
                        </span>
                        <button
                          type="submit"
                          className="bg-[#CC4B37] px-3 py-1.5 text-[10px] text-[#FFFFFF]"
                          style={{ ...jostHeading, borderRadius: 2 }}
                        >
                          SÍ
                        </button>
                        <Link
                          href={base}
                          className="border border-solid border-[#EEEEEE] px-3 py-1.5 text-[10px] text-[#666666]"
                          style={{ ...jostHeading, borderRadius: 2 }}
                        >
                          NO
                        </Link>
                      </form>
                    ) : (
                      <Link
                        href={`${base}?askDelete=${encodeURIComponent(t.id)}`}
                        className="inline-flex items-center justify-center border border-[#CC4B37] px-3 py-1.5 text-[10px] text-[#CC4B37]"
                        style={{ ...jostHeading, borderRadius: 2 }}
                      >
                        ELIMINAR
                      </Link>
                    )}
                  </div>

                  <details className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-3">
                    <summary
                      className="cursor-pointer text-[11px] text-[#111111] marker:hidden [&::-webkit-details-marker]:hidden"
                      style={jostHeading}
                    >
                      Dueño placeholder (opcional)
                    </summary>
                    <form action={actionTeamPlaceholder} className="mt-3 space-y-2">
                      <input type="hidden" name="team_id" value={t.id} />
                      <label className="block text-[12px] text-[#666666]" style={latoBody}>
                        Nombre del dueño real
                        <input
                          type="text"
                          name="placeholder_owner_nombre"
                          defaultValue={t.placeholder_owner_nombre ?? ''}
                          className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-2 text-sm text-[#111111]"
                          style={{ borderRadius: 2 }}
                        />
                      </label>
                      <label className="block text-[12px] text-[#666666]" style={latoBody}>
                        Contacto (WhatsApp/Instagram)
                        <input
                          type="text"
                          name="placeholder_owner_contacto"
                          defaultValue={t.placeholder_owner_contacto ?? ''}
                          className="mt-1 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-2 text-sm text-[#111111]"
                          style={{ borderRadius: 2 }}
                        />
                      </label>
                      <button
                        type="submit"
                        className="mt-2 bg-[#111111] px-4 py-2 text-[10px] text-[#FFFFFF]"
                        style={{ ...jostHeading, borderRadius: 2 }}
                      >
                        GUARDAR
                      </button>
                    </form>
                  </details>

                  <div>
                    <p className="text-[11px] text-[#666666]" style={jostHeading}>
                      Integrantes ({members.length})
                    </p>
                    <ul className="mt-2 flex flex-col gap-3">
                      {members.length === 0 ? (
                        <li className="text-[13px] text-[#666666]" style={latoBody}>
                          Sin integrantes activos.
                        </li>
                      ) : (
                        members.map((m) => (
                          <li
                            key={m.id}
                            className="flex flex-col gap-2 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-3 sm:flex-row sm:items-end"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] text-[#111111]" style={latoBody}>
                                <span className="font-semibold">
                                  {m.nombre?.trim() || '—'}
                                </span>
                                {m.alias?.trim() ? (
                                  <span className="text-[#666666]"> · @{m.alias.trim()}</span>
                                ) : null}
                              </p>
                              <p className="text-[11px] uppercase text-[#999999]" style={jostHeading}>
                                {(
                                  m.rol_plataforma || ''
                                ).toUpperCase() || '—'}
                              </p>
                            </div>
                            <form
                              action={actionUpdateTeamMemberRole}
                              className="flex flex-wrap items-center gap-2"
                            >
                              <input type="hidden" name="member_id" value={m.id} />
                              <input type="hidden" name="team_id" value={t.id} />
                              <select
                                name="rol_plataforma"
                                defaultValue={
                                  (m.rol_plataforma || 'member').toLowerCase() === 'founder'
                                    ? 'founder'
                                    : (m.rol_plataforma || '').toLowerCase() === 'admin'
                                      ? 'admin'
                                      : 'member'
                                }
                                className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-2 py-2 text-[12px] text-[#111111]"
                                style={latoBody}
                              >
                                <option value="founder">founder</option>
                                <option value="admin">admin</option>
                                <option value="member">member</option>
                              </select>
                              <button
                                type="submit"
                                className="bg-[#111111] px-3 py-2 text-[10px] text-[#FFFFFF]"
                                style={{ ...jostHeading, borderRadius: 2 }}
                              >
                                GUARDAR
                              </button>
                            </form>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <p className="text-[12px] text-[#666666]" style={latoBody}>
                    Alta: {formatFecha(t.created_at)}
                    {t.slug ? (
                      <>
                        {' '}
                        ·{' '}
                        <Link
                          className="text-[#CC4B37] underline"
                          href={`/equipos/${encodeURIComponent(t.slug)}`}
                        >
                          Ver público
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
