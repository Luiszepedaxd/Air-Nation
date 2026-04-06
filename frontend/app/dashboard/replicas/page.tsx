"use client"

export default function ReplicasPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Badge próximamente */}
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-[#CC4B37] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white" aria-hidden>
              <path
                d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 5v6l4 2"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span
            className="text-[#CC4B37] text-[0.6rem] font-black uppercase tracking-[0.18em]"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            PRÓXIMAMENTE
          </span>
        </div>

        {/* Título */}
        <h1
          className="text-[#111111] text-2xl font-black uppercase leading-tight mb-3"
          style={{ fontFamily: "'Jost', sans-serif" }}
        >
          REGISTRO DE RÉPLICAS
        </h1>

        {/* Descripción */}
        <p
          className="text-[#666666] text-sm leading-relaxed mb-6"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          Estamos construyendo el registro de réplicas con la comunidad.
          Podrás registrar tus réplicas, ver su historial, transferirlas
          y conocer su valor en el mercado mexicano.
        </p>

        {/* Lista de features */}
        <div className="space-y-3">
          {[
            "Ficha técnica completa de cada réplica",
            "Historial de mantenimiento y upgrades",
            "Valuación con IA — precio real mercado MX",
            "Marketplace de compra y venta",
            "Transferencia verificada entre jugadores",
          ].map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#CC4B37] mt-1.5 shrink-0" />
              <p
                className="text-[#444444] text-sm"
                style={{ fontFamily: "'Lato', sans-serif" }}
              >
                {feature}
              </p>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}
