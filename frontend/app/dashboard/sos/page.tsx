const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export default function SosPage() {
  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <div className="mx-auto max-w-[640px]">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#CC4B37]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="#FFFFFF" strokeWidth="2" />
              <path
                d="M12 8v4M12 16h.01"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <span
              className="block text-[0.6rem] font-bold uppercase tracking-[0.25em] text-[#CC4B37]"
              style={jost}
            >
              Próximamente
            </span>
            <h1
              className="text-xl font-black uppercase leading-none text-[#111111]"
              style={jost}
            >
              BOTÓN DE PÁNICO
            </h1>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-[#666666]" style={lato}>
          Estamos preparando alertas, guías y documentos para cuando lo necesites. Vuelve pronto.
        </p>
      </div>
    </main>
  )
}
