"use client"

export default function SosPage() {
  return (
    <main className="min-h-screen bg-[#F4F4F4] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">

        {/* Badge próximamente */}
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-[#CC4B37] flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
              <path
                d="M12 8v4M12 16h.01"
                stroke="white"
                strokeWidth="2"
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
          BOTÓN DE PÁNICO
        </h1>

        {/* Descripción */}
        <p
          className="text-[#666666] text-sm leading-relaxed mb-6"
          style={{ fontFamily: "'Lato', sans-serif" }}
        >
          Tu herramienta de apoyo cuando más lo necesitas. Si te detienen o te piden
          documentación, esta sección te guía paso a paso para responder con calma y de
          forma correcta.
        </p>

        {/* Lista de features */}
        <div className="space-y-3">
          {[
            "Guía paso a paso si te detiene una autoridad",
            "Muestra tus documentos y permisos al instante",
            "Notifica a tu equipo que necesitas apoyo",
            "Indica a qué evento o campo te diriges",
            "Acceso rápido a contactos de emergencia del operador",
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
