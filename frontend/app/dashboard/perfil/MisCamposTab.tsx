import Link from 'next/link'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type MisCampoItem = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  tipo: string | null
  foto_portada_url: string | null
  status: string
  destacado: boolean
}

function initialFromNombre(nombre: string) {
  const t = nombre.trim()
  return (t[0] || '?').toUpperCase()
}

function statusBadgeClass(status: string) {
  const s = status.toLowerCase()
  if (s === 'aprobado') return 'bg-[#111111] text-[#FFFFFF]'
  if (s === 'rejected' || s === 'rechazado') return 'bg-[#CC4B37] text-[#FFFFFF]'
  return 'bg-[#F4F4F4] text-[#666666]'
}

function statusLabel(status: string) {
  const s = status.toLowerCase()
  if (s === 'aprobado') return 'APROBADO'
  if (s === 'rejected' || s === 'rechazado') return 'RECHAZADO'
  if (s === 'pending' || s === 'pendiente') return 'PENDIENTE'
  return status.toUpperCase()
}

function tipoLabel(tipo: string | null) {
  const t = (tipo || '').toLowerCase()
  if (t === 'privado') return 'PRIVADO'
  return 'PÚBLICO'
}

export function MisCamposTab({ items }: { items: MisCampoItem[] }) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 px-2 py-12 text-center">
        <p className="text-[13px] text-[#666666]" style={lato}>
          No tienes campos registrados
        </p>
        <Link
          href="/campos/nuevo"
          style={jost}
          className="inline-flex min-h-[44px] min-w-[200px] items-center justify-center bg-[#CC4B37] px-6 text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
        >
          REGISTRAR CAMPO
        </Link>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-4 pb-10">
      {items.map((f) => {
        const approved = f.status.toLowerCase() === 'aprobado'
        const slugEnc = encodeURIComponent(f.slug)
        return (
          <li
            key={f.id}
            className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {f.foto_portada_url ? (
                  <img
                    src={f.foto_portada_url}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-[14px] text-[#CC4B37]"
                    style={{ ...jost, fontWeight: 700 }}
                  >
                    {initialFromNombre(f.nombre)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-[14px] text-[#111111]"
                  style={{ ...jost, fontWeight: 700, textTransform: 'none' }}
                >
                  {f.nombre}
                </p>
                {f.ciudad?.trim() ? (
                  <p
                    className="mt-0.5 text-[12px] text-[#666666]"
                    style={lato}
                  >
                    {f.ciudad.trim()}
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    style={jost}
                    className={`inline-block px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${statusBadgeClass(f.status)}`}
                  >
                    {statusLabel(f.status)}
                  </span>
                  <span
                    className="text-[11px] uppercase tracking-wide text-[#999999]"
                    style={lato}
                  >
                    {tipoLabel(f.tipo)}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {approved ? (
                <Link
                  href={`/campos/${slugEnc}`}
                  style={jost}
                  className="flex min-h-[40px] flex-1 items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 text-[11px] font-extrabold uppercase text-[#111111] sm:flex-none"
                >
                  VER
                </Link>
              ) : null}
              {approved ? (
                <Link
                  href={`/mi-campo/${encodeURIComponent(f.id)}`}
                  style={jost}
                  className="flex min-h-[40px] flex-1 items-center justify-center bg-[#111111] px-4 text-[11px] font-extrabold uppercase text-[#FFFFFF] sm:flex-none"
                >
                  ADMINISTRAR
                </Link>
              ) : null}
              <Link
                href={`/campos/${slugEnc}/editar`}
                style={jost}
                className="flex min-h-[40px] flex-1 items-center justify-center bg-[#CC4B37] px-4 text-[11px] font-extrabold uppercase text-[#FFFFFF] sm:flex-none"
              >
                EDITAR
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
