import { redirect } from 'next/navigation'
import type { FieldReviewPublic } from '@/app/campos/types'
import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import type { MiCampoEventRow } from './components/EventosTab'
import { MiCampoOwnerClient, type FieldRequestOwnerRow } from './MiCampoOwnerClient'

function mapFieldRequests(
  rows: {
    id: string
    field_id: string
    solicitante_id: string
    team_id: string | null
    fecha_deseada: string | null
    numero_jugadores: number | null
    mensaje: string | null
    created_at: string
    users: unknown
    teams: unknown
  }[]
): FieldRequestOwnerRow[] {
  return rows.map((r) => {
    const u = (Array.isArray(r.users) ? r.users[0] : r.users) as {
      nombre?: string | null
      alias?: string | null
      avatar_url?: string | null
      ciudad?: string | null
      email?: string | null
    } | null
    const t = (Array.isArray(r.teams) ? r.teams[0] : r.teams) as {
      nombre?: string | null
    } | null
    return {
      id: r.id,
      field_id: r.field_id,
      solicitante_id: r.solicitante_id,
      team_id: r.team_id,
      fecha_deseada: r.fecha_deseada,
      numero_jugadores: r.numero_jugadores,
      mensaje: r.mensaje,
      created_at: r.created_at,
      nombre: u?.nombre ?? null,
      alias: u?.alias ?? null,
      avatar_url: u?.avatar_url ?? null,
      ciudad: u?.ciudad ?? null,
      team_nombre: t?.nombre ?? null,
      solicitante_email: u?.email ?? null,
    }
  })
}

export default async function MiCampoPage({
  params,
}: {
  params: { id: string }
}) {
  const id = params.id?.trim()
  if (!id) redirect('/dashboard/perfil')

  const supabase = createDashboardSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(`/mi-campo/${id}`)}`)
  }

  const { data: field, error } = await supabase
    .from('fields')
    .select('id, nombre, slug, ciudad, tipo, status, descripcion, created_by')
    .eq('id', id)
    .maybeSingle()

  if (error || !field) {
    redirect('/dashboard/perfil')
  }

  const ownerId = field.created_by as string | null | undefined
  if (!ownerId || ownerId !== user.id) {
    redirect('/dashboard/perfil')
  }

  const { data: meRow } = await supabase
    .from('users')
    .select('app_role')
    .eq('id', user.id)
    .maybeSingle()

  const appRole = meRow?.app_role as string | undefined
  const canCreateEvento =
    appRole === 'admin' || appRole === 'field_owner'

  let initialEvents: MiCampoEventRow[] = []
  const { data: evRaw, error: evErr } = await supabase
    .from('events')
    .select('id, title, fecha, cupo, tipo, status, published, imagen_url')
    .eq('field_id', id)
    .order('fecha', { ascending: false })

  if (!evErr && evRaw?.length) {
    const evIds = evRaw.map((e) => e.id as string)
    const countMap = new Map<string, number>()
    const { data: rsvpRows } = await supabase
      .from('event_rsvps')
      .select('event_id')
      .in('event_id', evIds)

    if (Array.isArray(rsvpRows)) {
      for (const r of rsvpRows as { event_id: string }[]) {
        const eid = r.event_id
        countMap.set(eid, (countMap.get(eid) ?? 0) + 1)
      }
    }

    initialEvents = evRaw.map((e) => {
      const eid = e.id as string
      return {
        id: eid,
        title: String(e.title ?? ''),
        fecha: String(e.fecha ?? ''),
        cupo: Number(e.cupo ?? 0),
        tipo: (e.tipo as string | null) ?? null,
        status: String(e.status ?? ''),
        published: Boolean(e.published),
        imagen_url: (e.imagen_url as string | null) ?? null,
        rsvp_count: countMap.get(eid) ?? 0,
      }
    })
  }

  const { data: reviewsRaw, error: revErr } = await supabase
    .from('field_reviews')
    .select(
      `
      user_id,
      rating,
      comentario,
      created_at,
      users ( nombre, alias, avatar_url )
    `
    )
    .eq('field_id', id)
    .order('created_at', { ascending: false })

  const initialReviews: FieldReviewPublic[] =
    revErr || !reviewsRaw
      ? []
      : (reviewsRaw as unknown as FieldReviewPublic[])

  let initialRequests: FieldRequestOwnerRow[] = []
  const tipo = (field.tipo as string | null)?.toLowerCase() ?? ''
  if (tipo === 'privado') {
    const { data: reqRaw, error: reqErr } = await supabase
      .from('field_requests')
      .select(
        `
        id,
        field_id,
        solicitante_id,
        team_id,
        fecha_deseada,
        numero_jugadores,
        mensaje,
        created_at,
        users ( nombre, alias, avatar_url, ciudad, email ),
        teams ( nombre )
      `
      )
      .eq('field_id', id)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: false })

    if (!reqErr && reqRaw) {
      initialRequests = mapFieldRequests(
        reqRaw as {
          id: string
          field_id: string
          solicitante_id: string
          team_id: string | null
          fecha_deseada: string | null
          numero_jugadores: number | null
          mensaje: string | null
          created_at: string
          users: unknown
          teams: unknown
        }[]
      )
    }
  }

  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <MiCampoOwnerClient
        field={{
          id: field.id as string,
          nombre: field.nombre as string,
          slug: field.slug as string,
          ciudad: (field.ciudad as string | null) ?? null,
          tipo: (field.tipo as string | null) ?? null,
          status: String(field.status ?? ''),
          descripcion: (field.descripcion as string | null) ?? null,
        }}
        initialReviews={initialReviews}
        initialEvents={initialEvents}
        initialRequests={initialRequests}
        canCreateEvento={canCreateEvento}
      />
    </div>
  )
}
