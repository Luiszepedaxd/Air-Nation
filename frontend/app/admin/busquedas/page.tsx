import { createAdminClient } from '../supabase-server'
import { requireAppAdminUserId } from '../require-app-admin'
import { redirect } from 'next/navigation'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

export const metadata = { title: 'Búsquedas | AirNation Admin' }

export default async function BusquedasPage() {
  const ok = await requireAppAdminUserId()
  if (!ok) redirect('/login')

  const supabase = createAdminClient()

  // Top 20 búsquedas más frecuentes
  const { data: topQueries } = await supabase
    .from('search_logs')
    .select('query, results_count')
    .order('created_at', { ascending: false })
    .limit(500)

  // Búsquedas sin resultados
  const { data: sinResultados } = await supabase
    .from('search_logs')
    .select('query, created_at')
    .eq('results_count', 0)
    .order('created_at', { ascending: false })
    .limit(100)

  // Total de búsquedas
  const { count: totalBusquedas } = await supabase
    .from('search_logs')
    .select('*', { count: 'exact', head: true })

  // Búsquedas últimas 24h
  const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: busquedas24h } = await supabase
    .from('search_logs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', hace24h)

  // Agrupar top queries en el servidor
  const queryMap: Record<string, { count: number; conResultados: number }> = {}
  for (const row of topQueries ?? []) {
    const q = row.query.toLowerCase().trim()
    if (!queryMap[q]) queryMap[q] = { count: 0, conResultados: 0 }
    queryMap[q].count++
    if (row.results_count > 0) queryMap[q].conResultados++
  }
  const topSorted = Object.entries(queryMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)

  // Agrupar sin resultados
  const sinResultadosMap: Record<string, number> = {}
  for (const row of sinResultados ?? []) {
    const q = row.query.toLowerCase().trim()
    sinResultadosMap[q] = (sinResultadosMap[q] ?? 0) + 1
  }
  const sinResultadosSorted = Object.entries(sinResultadosMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)

  return (
    <div className="max-w-[900px] space-y-8">

      {/* Header */}
      <div>
        <h1 style={jost} className="text-[1.1rem] tracking-[0.12em] text-[#111111]">
          Búsquedas
        </h1>
        <p style={lato} className="mt-1 text-[13px] text-[#666666]">
          Qué están buscando los operadores en la plataforma.
        </p>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
        <div className="border border-[#EEEEEE] p-4">
          <p style={jost} className="text-[9px] tracking-widest text-[#999999]">
            Total búsquedas
          </p>
          <p style={jost} className="mt-1 text-[28px] text-[#111111]">
            {(totalBusquedas ?? 0).toLocaleString('es-MX')}
          </p>
        </div>
        <div className="border border-[#EEEEEE] p-4">
          <p style={jost} className="text-[9px] tracking-widest text-[#999999]">
            Últimas 24h
          </p>
          <p style={jost} className="mt-1 text-[28px] text-[#111111]">
            {(busquedas24h ?? 0).toLocaleString('es-MX')}
          </p>
        </div>
      </div>

      {/* Top búsquedas */}
      <div>
        <h2 style={jost} className="mb-3 text-[11px] tracking-[0.12em] text-[#111111]">
          Top 20 — más buscado
        </h2>
        {topSorted.length === 0 ? (
          <p style={lato} className="text-[13px] text-[#999999]">Sin datos aún.</p>
        ) : (
          <div className="border border-[#EEEEEE]">
            <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2">
              <span style={jost} className="col-span-1 text-[9px] tracking-widest text-[#999999]">#</span>
              <span style={jost} className="col-span-6 text-[9px] tracking-widest text-[#999999]">Término</span>
              <span style={jost} className="col-span-2 text-right text-[9px] tracking-widest text-[#999999]">Búsquedas</span>
              <span style={jost} className="col-span-3 text-right text-[9px] tracking-widest text-[#999999]">Con resultados</span>
            </div>
            {topSorted.map(([query, data], i) => (
              <div
                key={query}
                className="grid grid-cols-12 items-center border-b border-[#F4F4F4] px-4 py-3 last:border-0 hover:bg-[#FAFAFA]"
              >
                <span style={lato} className="col-span-1 text-[12px] text-[#999999]">{i + 1}</span>
                <span style={lato} className="col-span-6 text-[13px] font-semibold text-[#111111]">
                  {query}
                </span>
                <span style={lato} className="col-span-2 text-right text-[13px] text-[#111111]">
                  {data.count}
                </span>
                <span style={lato} className="col-span-3 text-right text-[12px] text-[#666666]">
                  {data.conResultados} / {data.count}
                  {data.count > 0 && (
                    <span className={`ml-1 text-[11px] ${
                      data.conResultados / data.count >= 0.5
                        ? 'text-green-600'
                        : 'text-[#CC4B37]'
                    }`}>
                      ({Math.round((data.conResultados / data.count) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Búsquedas sin resultados */}
      <div>
        <h2 style={jost} className="mb-1 text-[11px] tracking-[0.12em] text-[#111111]">
          Sin resultados — oportunidades de contenido
        </h2>
        <p style={lato} className="mb-3 text-[12px] text-[#999999]">
          Lo que buscan los usuarios y no encuentran. Úsalo para crear equipos,
          campos, listings o blog posts que cubran esa demanda.
        </p>
        {sinResultadosSorted.length === 0 ? (
          <p style={lato} className="text-[13px] text-[#999999]">Sin búsquedas vacías aún.</p>
        ) : (
          <div className="border border-[#EEEEEE]">
            <div className="grid grid-cols-12 border-b border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2">
              <span style={jost} className="col-span-1 text-[9px] tracking-widest text-[#999999]">#</span>
              <span style={jost} className="col-span-9 text-[9px] tracking-widest text-[#999999]">Término</span>
              <span style={jost} className="col-span-2 text-right text-[9px] tracking-widest text-[#999999]">Veces</span>
            </div>
            {sinResultadosSorted.map(([query, count], i) => (
              <div
                key={query}
                className="grid grid-cols-12 items-center border-b border-[#F4F4F4] px-4 py-3 last:border-0 hover:bg-[#FAFAFA]"
              >
                <span style={lato} className="col-span-1 text-[12px] text-[#999999]">{i + 1}</span>
                <span style={lato} className="col-span-9 text-[13px] text-[#111111]">{query}</span>
                <span style={lato} className="col-span-2 text-right text-[13px] font-semibold text-[#CC4B37]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
