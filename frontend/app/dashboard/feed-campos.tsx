import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'
import { Carrusel } from './components/Carrusel'
import { SectionHeader } from './components/SectionHeader'

const jost = { fontFamily: "'Jost', sans-serif" } as const

type FieldRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  foto_portada_url: string | null
  disciplinas: unknown
  destacado: boolean
  orden_destacado: number | null
}

function disciplinasToList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

function PinMapaIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5Z"
        stroke="#AAAAAA"
        strokeWidth="1.4"
      />
      <path
        d="M12 21s7-4.35 7-10a7 7 0 10-14 0c0 5.65 7 10 7 10Z"
        stroke="#AAAAAA"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function CamposSkeleton() {
  return (
    <section>
      <div className="w-full border-t border-[#EEEEEE]">
        <div className="flex items-center justify-between gap-3 px-4 py-3 md:mx-auto md:max-w-[1200px] md:px-6">
          <div className="h-4 w-52 animate-pulse bg-[#F4F4F4]" />
          <div className="h-3 w-24 animate-pulse bg-[#F4F4F4]" />
        </div>
      </div>
      <div className="flex gap-3 overflow-hidden px-4 pt-1 md:px-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-[220px] shrink-0 border border-[#EEEEEE] md:w-[260px]"
          >
            <div className="aspect-[4/3] w-full animate-pulse bg-[#F4F4F4]" />
            <div className="space-y-2 p-2.5">
              <div className="h-3 w-[80%] animate-pulse bg-[#F4F4F4]" />
              <div className="h-2.5 w-1/2 animate-pulse bg-[#F4F4F4]" />
              <div className="flex gap-1">
                <div className="h-4 w-12 animate-pulse bg-[#F4F4F4]" />
                <div className="h-4 w-10 animate-pulse bg-[#F4F4F4]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export async function CamposSection() {
  const supabase = createDashboardSupabaseServerClient()
  const { data, error } = await supabase
    .from('fields')
    .select(
      'id, nombre, slug, ciudad, foto_portada_url, disciplinas, destacado, orden_destacado'
    )
    .eq('status', 'aprobado')
    .order('destacado', { ascending: false })
    .order('orden_destacado', { ascending: true, nullsFirst: false })
    .order('nombre', { ascending: true })

  if (error || !data?.length) return null

  const fields = data as FieldRow[]

  return (
    <section>
      <SectionHeader title="CAMPOS DESTACADOS" href="/campos" />
      <Carrusel>
        {fields.map((field) => {
          const tags = disciplinasToList(field.disciplinas)
          return (
            <Link
              key={field.id}
              href={`/campos/${field.slug}`}
              className="w-[220px] shrink-0 snap-start border border-[#EEEEEE] bg-[#FFFFFF] md:w-[260px]"
            >
              <article>
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F4F4F4]">
                  {field.foto_portada_url ? (
                    <img
                      src={field.foto_portada_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <PinMapaIcon />
                    </div>
                  )}
                </div>
                <div className="p-[10px]">
                  <h3
                    style={jost}
                    className="line-clamp-1 text-[12px] font-extrabold uppercase leading-snug text-[#111111]"
                  >
                    {field.nombre}
                  </h3>
                  {field.ciudad ? (
                    <p className="mt-1 text-[11px] text-[#666666]">{field.ciudad}</p>
                  ) : null}
                  {tags.length > 0 ? (
                    <ul className="mt-1 flex flex-wrap gap-[4px]">
                      {tags.map((tag) => (
                        <li
                          key={tag}
                          className="border border-[#EEEEEE] bg-[#F4F4F4] px-[6px] py-[2px] text-[9px] text-[#666666] leading-tight"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            </Link>
          )
        })}
      </Carrusel>
    </section>
  )
}
