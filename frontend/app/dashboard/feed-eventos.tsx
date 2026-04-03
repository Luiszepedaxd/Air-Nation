import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'

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

export function EventosSkeleton() {
  return (
    <section className="space-y-3">
      <div className="h-4 w-44 animate-pulse bg-[#F4F4F4]" />
      <ul className="flex flex-col border-t border-[#EEEEEE]">
        {[0, 1, 2].map((i) => (
          <li
            key={i}
            className="flex gap-3 border-b border-[#EEEEEE] py-3 animate-pulse"
          >
            <div className="h-20 w-20 shrink-0 bg-[#F4F4F4]" />
              <div className="flex flex-1 flex-col justify-center gap-2">
              <div className="h-4 max-w-[200px] w-[80%] bg-[#F4F4F4]" />
              <div className="h-3 w-24 bg-[#F4F4F4]" />
              <div className="h-3 w-32 bg-[#F4F4F4]" />
            </div>
          </li>
        ))}
      </ul>
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
    <section className="space-y-3">
      <h2
        style={jost}
        className="text-[14px] uppercase tracking-widest font-extrabold text-[#666666]"
      >
        Próximos eventos
      </h2>
      <ul className="flex flex-col">
        {events.map((ev, idx) => (
          <li
            key={ev.id}
            className={`border-b border-[#EEEEEE] ${idx === 0 ? 'border-t border-[#EEEEEE]' : ''}`}
          >
            <Link
              href={`/eventos/${ev.id}`}
              className="flex gap-3 p-3 hover:bg-[#F4F4F4]/50 transition-colors"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden bg-[#F4F4F4]">
                {ev.imagen_url ? (
                  <img
                    src={ev.imagen_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <h3
                  style={jost}
                  className="font-extrabold text-sm uppercase text-[#111111] leading-snug"
                >
                  {ev.title}
                </h3>
                <p className="text-[12px] font-normal uppercase tracking-wide text-[#CC4B37]">
                  {formatEventBannerDate(ev.fecha)}
                </p>
                {ev.disciplina ? (
                  <p className="text-[12px] text-[#666666]">{ev.disciplina}</p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
