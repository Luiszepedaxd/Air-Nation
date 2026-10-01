import { api, type ReplicaAdminStats } from '@/lib/api'
import Link from 'next/link'
import { createAdminSupabaseServerClient } from './supabase-server'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

const MX_TZ = 'America/Mexico_City'

const TRANSFER_LABELS: Record<string, string> = {
  pendiente: 'Pendientes',
  aceptada: 'Aceptadas',
  aceptado: 'Aceptadas',
  rechazada: 'Rechazadas',
  rechazado: 'Rechazadas',
  completada: 'Completadas',
  completado: 'Completadas',
  sin_estado: 'Sin estado',
}

function formatDay(iso: string) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MX_TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatWhen(iso: string) {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MX_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function transferLabel(status: string) {
  return TRANSFER_LABELS[status] ?? status
}

function placeLine(ciudad: string | null, estado: string | null) {
  const parts = [ciudad?.trim(), estado?.trim()].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : 'Sin ubicación'
}

function MetricCard({
  value,
  label,
  highlight = false,
}: {
  value: number | string
  label: string
  highlight?: boolean
}) {
  return (
    <div
      className={`border border-solid p-4 md:p-5 ${
        highlight
          ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.08)]'
          : 'border-[#EEEEEE] bg-[#F4F4F4]'
      }`}
    >
      <p
        className={`text-3xl tabular-nums md:text-4xl ${
          highlight ? 'text-[#CC4B37]' : 'text-[#111111]'
        }`}
        style={jostHeading}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-[#666666]" style={latoBody}>
        {label}
      </p>
    </div>
  )
}

function BreakdownList({
  title,
  rows,
  empty,
}: {
  title: string
  rows: { key: string; label: string; count: number }[]
  empty: string
}) {
  const max = rows.reduce((n, row) => Math.max(n, row.count), 0)
  return (
    <div className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4">
      <h3
        className="mb-3 text-[0.7rem] tracking-[0.16em] text-[#666666]"
        style={jostHeading}
      >
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs text-[#666666]" style={latoBody}>
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-sm text-[#111111]" style={latoBody}>
                  {row.label}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-[#111111]" style={jostHeading}>
                  {row.count}
                </span>
              </div>
              <div className="mt-1 h-1 bg-[#EEEEEE]">
                <div
                  className="h-1 bg-[#CC4B37]"
                  style={{ width: max > 0 ? `${Math.max(4, Math.round((row.count / max) * 100))}%` : '0%' }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ReplicasRegistradasSkeleton() {
  return (
    <div className="mt-10 border-t border-solid border-[#EEEEEE] pt-8">
      <div className="mb-2 h-4 w-48 animate-pulse bg-[#EEEEEE]" />
      <div className="mb-4 h-3 w-72 max-w-full animate-pulse bg-[#EEEEEE]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4">
            <div className="mb-2 h-9 w-16 animate-pulse bg-[#EEEEEE]" />
            <div className="h-3 w-24 animate-pulse bg-[#EEEEEE]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ReplicasError({ message }: { message: string }) {
  return (
    <section className="mt-10 border-t border-solid border-[#EEEEEE] pt-8" style={latoBody}>
      <h2
        className="mb-2 text-[0.7rem] tracking-[0.18em] text-[#666666]"
        style={jostHeading}
      >
        Réplicas registradas
      </h2>
      <p className="border border-solid border-[#CC4B37] bg-[rgba(204,75,55,0.08)] px-4 py-3 text-sm text-[#111111]">
        {message}
      </p>
    </section>
  )
}

function ReplicasRegistradasView({ stats }: { stats: ReplicaAdminStats }) {
  const dayLabel = formatDay(stats.dayStart)
  const estadoRows = stats.byEstado.map((row) => ({
    key: row.estado,
    label: row.estado,
    count: row.count,
  }))
  const ciudadRows = stats.byCiudad.map((row) => ({
    key: `${row.ciudad}-${row.estado}`,
    label: `${row.ciudad}, ${row.estado}`,
    count: row.count,
  }))
  if (stats.otrasCiudades > 0) {
    ciudadRows.push({
      key: 'otras',
      label: 'Otras ciudades',
      count: stats.otrasCiudades,
    })
  }

  const otherTransfers =
    stats.transfers?.byStatus.filter((row) => row.status !== 'pendiente') ?? []

  return (
    <section
      id="replicas-registradas"
      className="mt-10 border-t border-solid border-[#EEEEEE] pt-8"
      style={latoBody}
    >
      <h2
        className="text-[0.7rem] tracking-[0.18em] text-[#666666]"
        style={jostHeading}
      >
        Réplicas registradas
      </h2>
      <p className="mb-4 mt-1 text-xs text-[#666666]">
        Hoy cuenta desde la medianoche del {dayLabel}, hora de Ciudad de México.
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5 md:gap-4">
        <MetricCard value={stats.total} label="Total registradas" />
        <MetricCard value={stats.registeredToday} label="Registradas hoy" />
        <MetricCard value={stats.verificadas} label="Verificadas" />
        <MetricCard value={stats.enVenta} label="En venta" />
        <MetricCard
          value={
            stats.transfersUnavailable ? '—' : (stats.transfers?.pendiente ?? 0)
          }
          label="Transferencias pendientes"
          highlight={!stats.transfersUnavailable && (stats.transfers?.pendiente ?? 0) > 0}
        />
      </div>

      {stats.transfersUnavailable && (
        <p className="mt-3 text-xs text-[#CC4B37]">
          No se pudieron leer las transferencias.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {stats.placesUnavailable ? (
          <p className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4 text-xs text-[#666666] md:col-span-2">
            No se pudo armar el desglose por estado y ciudad.
          </p>
        ) : (
          <>
            <BreakdownList
              title="Por estado"
              rows={estadoRows}
              empty="Sin réplicas para agrupar."
            />
            <BreakdownList
              title="Por ciudad"
              rows={ciudadRows}
              empty="Sin réplicas para agrupar."
            />
          </>
        )}
      </div>

      {otherTransfers.length > 0 && (
        <div className="mt-4">
          <BreakdownList
            title="Transferencias"
            rows={stats.transfers!.byStatus.map((row) => ({
              key: row.status,
              label: transferLabel(row.status),
              count: row.count,
            }))}
            empty="Sin transferencias."
          />
        </div>
      )}

      <div className="mt-4 border border-solid border-[#EEEEEE] bg-[#FFFFFF]">
        <h3
          className="border-b border-solid border-[#EEEEEE] px-4 py-3 text-[0.7rem] tracking-[0.16em] text-[#666666]"
          style={jostHeading}
        >
          Últimas registradas
        </h3>
        {stats.recent.length === 0 ? (
          <p className="px-4 py-4 text-xs text-[#666666]">Aún no hay réplicas registradas.</p>
        ) : (
          <ul>
            {stats.recent.map((replica) => (
              <li
                key={replica.id}
                className="flex flex-col gap-1 border-b border-solid border-[#EEEEEE] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/replicas/${replica.id}`}
                    className="block truncate text-sm text-[#111111] hover:text-[#CC4B37]"
                    style={jostHeading}
                  >
                    {replica.nombre}
                  </Link>
                  <p className="mt-0.5 truncate text-xs text-[#666666]">
                    {[replica.sistema, placeLine(replica.ciudad, replica.estado)]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {replica.verificada && (
                    <span className="bg-[#111111] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white">
                      Verificada
                    </span>
                  )}
                  {replica.en_venta && (
                    <span className="bg-[#CC4B37] px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-white">
                      En venta
                    </span>
                  )}
                  {replica.created_at && (
                    <time className="text-[11px] text-[#666666]" dateTime={replica.created_at}>
                      {formatWhen(replica.created_at)}
                    </time>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export async function ReplicasRegistradasSection() {
  const supabase = createAdminSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return (
      <ReplicasError message="No hay sesión para consultar las réplicas registradas." />
    )
  }

  try {
    const stats = await api.admin.replicaStats(session.access_token)
    return <ReplicasRegistradasView stats={stats} />
  } catch (err) {
    const message =
      err instanceof Error && err.message
        ? err.message
        : 'No se pudieron cargar las réplicas registradas.'
    return <ReplicasError message={message} />
  }
}
