const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

function yearFromCreated(iso: string) {
  try {
    return String(new Date(iso).getFullYear())
  } catch {
    return '—'
  }
}

export function TeamStats({
  memberCount,
  createdAt,
}: {
  memberCount: number
  createdAt: string
}) {
  return (
    <section
      className="w-full border-y border-[#EEEEEE] bg-[#F4F4F4] py-6"
      aria-label="Estadísticas del equipo"
    >
      <div className="mx-auto flex max-w-[960px] flex-wrap justify-center gap-10 px-4 md:gap-24">
        <div className="min-w-[120px] text-center">
          <p
            style={jost}
            className="text-[24px] font-extrabold text-[#111111]"
          >
            {memberCount}
          </p>
          <p
            style={lato}
            className="mt-1 text-[12px] font-normal uppercase tracking-wide text-[#666666]"
          >
            Integrantes
          </p>
        </div>
        <div className="min-w-[120px] text-center">
          <p
            style={jost}
            className="text-[24px] font-extrabold text-[#111111]"
          >
            {yearFromCreated(createdAt)}
          </p>
          <p
            style={lato}
            className="mt-1 text-[12px] font-normal uppercase tracking-wide text-[#666666]"
          >
            Desde
          </p>
        </div>
      </div>
    </section>
  )
}
