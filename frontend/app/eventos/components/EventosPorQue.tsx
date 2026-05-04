import Link from 'next/link'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function CalendarIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x={3}
        y={5}
        width={18}
        height={16}
        rx={1}
        stroke="#CC4B37"
        strokeWidth={1.6}
      />
      <path
        d="M3 9h18"
        stroke="#CC4B37"
        strokeWidth={1.6}
      />
      <path
        d="M8 3v4M16 3v4"
        stroke="#CC4B37"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <path
        d="M7 13h3M7 17h6"
        stroke="#CC4B37"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </svg>
  )
}

function CheckCircleIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx={12} cy={12} r={9} stroke="#CC4B37" strokeWidth={1.6} />
      <path
        d="M8 12.5l3 3 5-6"
        stroke="#CC4B37"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 8.5C3 7.4 3.9 6.5 5 6.5h2.2l1.3-2h7l1.3 2H19c1.1 0 2 .9 2 2V18c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V8.5Z"
        stroke="#CC4B37"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={13} r={3.5} stroke="#CC4B37" strokeWidth={1.6} />
    </svg>
  )
}

const CARDS = [
  {
    icon: <CalendarIcon />,
    title: 'CALENDARIO ACTUALIZADO',
    desc: 'Eventos confirmados con fechas, sedes y links a boletos oficiales.',
  },
  {
    icon: <CheckCircleIcon />,
    title: 'CONFIRMA TU ASISTENCIA',
    desc: 'Marca a qué partidas vas y conecta con jugadores que también van.',
  },
  {
    icon: <CameraIcon />,
    title: 'ANTES, DURANTE Y DESPUÉS',
    desc: 'Comparte fotos, videos y comentarios en cada evento con tu equipo.',
  },
]

export function EventosPorQue() {
  return (
    <section className="border-t border-solid border-[#EEEEEE] bg-[#F4F4F4]">
      <div className="mx-auto max-w-[1200px] px-4 py-12 md:px-6 md:py-16">
        <div className="mb-8 md:mb-12">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#CC4B37]"
            style={{ ...jost, fontWeight: 800 }}
          >
            POR QUÉ AIRNATION
          </p>
          <h2
            className="mt-3 text-2xl font-extrabold uppercase leading-tight text-[#111111] md:text-3xl"
            style={{ ...jost, fontWeight: 800 }}
          >
            La plataforma central
            <br />
            del airsoft mexicano
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
          {CARDS.map((card) => (
            <article
              key={card.title}
              className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-6"
              style={{ borderRadius: 0 }}
            >
              <div className="mb-4">{card.icon}</div>
              <h3
                className="mb-2 text-[13px] font-extrabold uppercase tracking-[0.08em] text-[#111111]"
                style={{ ...jost, fontWeight: 800 }}
              >
                {card.title}
              </h3>
              <p
                className="text-[14px] leading-relaxed text-[#666666]"
                style={lato}
              >
                {card.desc}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-10 max-w-3xl md:mt-14">
          <p
            className="text-[14px] leading-relaxed text-[#444444] md:text-[15px]"
            style={lato}
          >
            AirNation es donde vive el airsoft mexicano. Encuentra los próximos eventos del país, descubre dónde se juega cerca de ti, y arma tu equipo con jugadores que ya están operando. Crear cuenta es gratis y te abre la puerta a credencial digital, registro de réplicas, marketplace y tienda oficial. Todo en un solo lugar.
          </p>
        </div>
      </div>
    </section>
  )
}

export function EventosCTASecundario({ hasSession }: { hasSession: boolean }) {
  if (hasSession) {
    return (
      <section className="bg-[#111111]">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6 md:py-14">
          <div className="max-w-2xl">
            <p
              className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#CC4B37]"
              style={{ ...jost, fontWeight: 800 }}
            >
              ORGANIZA TU PARTIDA
            </p>
            <h3
              className="mt-2 text-xl font-extrabold uppercase leading-tight text-white md:text-2xl"
              style={{ ...jost, fontWeight: 800 }}
            >
              ¿Vas a organizar un evento?
              <br />
              Publícalo gratis.
            </h3>
            <p
              className="mt-3 text-[13px] leading-relaxed text-white/70 md:text-[14px]"
              style={lato}
            >
              Tu evento aparece en el calendario público, conectas con jugadores y armas tu comunidad desde el día uno.
            </p>
          </div>
          <Link
            href="/eventos/nuevo"
            className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#CC4B37] px-7 py-4 text-[12px] font-extrabold uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-90"
            style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
          >
            CREAR EVENTO
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    )
  }
  return (
    <section className="bg-[#CC4B37]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-start gap-6 px-4 py-12 md:flex-row md:items-center md:justify-between md:px-6 md:py-14">
        <div className="max-w-2xl">
          <p
            className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-white/80"
            style={{ ...jost, fontWeight: 800 }}
          >
            ÚNETE A LA COMUNIDAD
          </p>
          <h3
            className="mt-2 text-xl font-extrabold uppercase leading-tight text-white md:text-2xl"
            style={{ ...jost, fontWeight: 800 }}
          >
            Crea tu cuenta gratis
            <br />
            y vive el airsoft mexicano
          </h3>
          <p
            className="mt-3 text-[13px] leading-relaxed text-white/85 md:text-[14px]"
            style={lato}
          >
            Credencial digital, registro de réplicas, marketplace y tienda oficial. Todo gratis para empezar.
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex shrink-0 items-center justify-center gap-2 bg-white px-7 py-4 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#111111] transition-opacity hover:opacity-90"
          style={{ ...jost, fontWeight: 800, borderRadius: 2 }}
        >
          CREAR CUENTA GRATIS
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}
