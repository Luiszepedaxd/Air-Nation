import Link from 'next/link'
import { createDashboardSupabaseServerClient } from './supabase-server'

const jost = { fontFamily: "'Jost', sans-serif" } as const

type FieldRow = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  foto_portada_url: string | null
  disciplinas: unknown
}

function disciplinasToList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()]
  return []
}

export function CamposSkeleton() {
  return (
    <section className="space-y-3">
      <div className="h-4 w-48 animate-pulse bg-[#F4F4F4]" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-[#EEEEEE] md:border-b-0 pb-4 md:pb-0">
            <div className="aspect-video w-full animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-4 w-3/4 animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 h-3 w-1/2 animate-pulse bg-[#F4F4F4]" />
            <div className="mt-2 flex gap-1">
              <div className="h-5 w-14 animate-pulse bg-[#F4F4F4]" />
              <div className="h-5 w-14 animate-pulse bg-[#F4F4F4]" />
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
    .select('id, nombre, slug, ciudad, foto_portada_url, disciplinas')
    .eq('status', 'approved')
    .eq('destacado', true)
    .order('orden_destacado', { ascending: true })
    .limit(3)

  if (error || !data?.length) return null

  const fields = data as FieldRow[]

  return (
    <section className="space-y-3">
      <h2
        style={jost}
        className="text-[14px] uppercase tracking-widest font-extrabold text-[#666666]"
      >
        Campos destacados
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-4">
        {fields.map((field, idx) => {
          const tags = disciplinasToList(field.disciplinas)
          return (
            <Link
              key={field.id}
              href={`/campos/${field.slug}`}
              className={`block border-b border-[#EEEEEE] p-3 last:border-b-0 md:border-r md:border-[#EEEEEE] md:border-b-0 ${
                idx === fields.length - 1 ? 'md:border-r-0' : ''
              }`}
            >
              <article>
                <div className="aspect-video w-full overflow-hidden bg-[#F4F4F4]">
                  {field.foto_portada_url ? (
                    <img
                      src={field.foto_portada_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <h3
                  style={jost}
                  className="mt-2 font-extrabold text-sm uppercase text-[#111111] leading-snug"
                >
                  {field.nombre}
                </h3>
                {field.ciudad ? (
                  <p className="mt-1 text-[12px] text-[#666666]">{field.ciudad}</p>
                ) : null}
                {tags.length > 0 ? (
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <li
                        key={tag}
                        className="bg-[#F4F4F4] p-[7px] text-[10px] text-[#666666] leading-tight"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
