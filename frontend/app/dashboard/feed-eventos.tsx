import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { Carrusel } from './components/Carrusel'
import { SectionHeader } from './components/SectionHeader'

const jost = { fontFamily: "'Jost', sans-serif" } as const

type EventRow = {
  id: string
  title: string
  fecha: string
  disciplina: string | null
  imagen_url: string | null
  field_id: string | null
}

const WD = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'] as const
const MO = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC',
] as const

function formatEventBannerDate(iso: string) {
  try {
    const d = new Date(iso)
    const w = WD[d.getDay()]
    const day = d.getDate()
    const m = MO[d.getMonth()]
    return `${w} ${day} ${m}`
  } catch {
    return ''
  }
}

function CalendarioIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="1.5"
        stroke="#AAAAAA"
        strokeWidth="1.4"
      />
      <path d="M3 9h18M8 5V3M16 5V3" stroke="#AAAAAA" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M8 13h2M12 13h2M8 16h2M12 16h2"
        stroke="#AAAAAA"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EventosSkeleton() {
  return (
    <section>
      <div className="w-full border-t border-[#EEEEEE]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:mx-auto md:max-w-[1200px] md:px-6">
          <div className="h-4 w-48 animate-pulse bg-[#F4F4F4]" />
          <div className="h-3 w-24 animate-pulse bg-[#F4F4F4]" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 pt-1 md:px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-[200px] shrink-0 border border-[#EEEEEE] md:w-[240px]"
          >
            <div className="aspect-square w-full animate-pulse bg-[#F4F4F4]" />
            <div className="space-y-2 p-2.5">
              <div className="h-2.5 w-16 animate-pulse bg-[#F4F4F4]" />
              <div className="h-3 w-full animate-pulse bg-[#F4F4F4]" />
              <div className="h-2.5 w-20 animate-pulse bg-[#F4F4F4]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export async function EventosSection() {
  const supabase = createDashboardSupabaseServerClient()
  const nowIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('events')
    .select('id, title, fecha, disciplina, imagen_url, field_id')
    .eq('published', true)
    .gt('fecha', nowIso)
    .order('fecha', { ascending: true })
    .limit(3)

  if (error || !data?.length) return null

  const events = data as EventRow[]

  return (
    <section>
      <SectionHeader title="PRÓXIMOS EVENTOS" href="/eventos" />
      <Carrusel>
        {events.map((ev) => (
          <Link
            key={ev.id}
            href={`/eventos/${ev.id}`}
            className="w-[200px] shrink-0 snap-start border border-[#EEEEEE] bg-[#FFFFFF] md:w-[240px]"
          >
            <article>
              <div className="aspect-square w-full overflow-hidden bg-[#F4F4F4]">
                {ev.imagen_url ? (
                  <img
                    src={ev.imagen_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <CalendarioIcon />
                  </div>
                )}
              </div>
              <div className="p-[10px]">
                <p
                  style={jost}
                  className="text-[10px] font-extrabold uppercase text-[#CC4B37]"
                >
                  {formatEventBannerDate(ev.fecha)}
                </p>
                <h3
                  style={jost}
                  className="mt-1 line-clamp-2 text-[12px] font-extrabold uppercase leading-snug text-[#111111]"
                >
                  {ev.title}
                </h3>
                {ev.disciplina ? (
                  <p className="mt-1 text-[11px] text-[#666666]">{ev.disciplina}</p>
                ) : null}
              </div>
            </article>
          </Link>
        ))}
      </Carrusel>
    </section>
  )
}
