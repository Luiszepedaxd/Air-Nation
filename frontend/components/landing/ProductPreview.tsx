import Link from "next/link";

/** 5×5 pseudo-QR: true = cuadro #111 */
const QR_PATTERN: boolean[][] = [
  [true, true, true, false, true],
  [true, false, true, false, true],
  [true, true, true, false, false],
  [false, false, true, true, true],
  [true, false, false, true, true],
];

function QrPlaceholder() {
  const cell = 8;
  const gap = 2;
  const pad = 1;
  return (
    <svg viewBox="0 0 50 50" className="h-14 w-14 shrink-0" aria-hidden>
      {QR_PATTERN.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={pad + c * (cell + gap)}
              y={pad + r * (cell + gap)}
              width={cell}
              height={cell}
              fill="#111111"
            />
          ) : null
        )
      )}
    </svg>
  );
}

export default function ProductPreview() {
  return (
    <section id="preview" className="bg-white px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        {/* ── Izquierda ── */}
        <div>
          <div className="mb-5 flex items-center gap-4">
            <span className="block h-[2px] w-7 bg-an-accent" />
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-an-accent">
              Vista previa
            </p>
          </div>
          <h2
            className="font-display font-black uppercase leading-[0.9] text-an-text"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)" }}
          >
            ASÍ SE VE
            <br />
            TU PERFIL.
          </h2>
          <p className="font-body mt-6 max-w-md text-base leading-[1.7] text-an-text-dim">
            Sin registrarte, sin esperar. Esto es lo que te espera cuando entres.
          </p>
          <Link
            href="/signup"
            className="font-body mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-an-accent hover:underline hover:underline-offset-4"
          >
            Crear mi perfil
            <span aria-hidden>→</span>
          </Link>
        </div>

        {/* ── Derecha: UI estático ── */}
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-none border border-[#EEEEEE] bg-white shadow-sm">
            {/* Header card */}
            <div className="bg-[#CC4B37] px-5 py-3">
              <p className="font-display text-sm font-black uppercase tracking-[0.2em] text-white">
                AIRNATION
              </p>
              <p className="font-body mt-1 text-xs font-normal uppercase tracking-wider text-white/70">
                CREDENCIAL DE JUGADOR
              </p>
            </div>

            {/* Body */}
            <div className="bg-white px-5 py-4">
              <div className="flex gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-[#EEEEEE] bg-[#F4F4F4]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0"
                      stroke="#CCCCCC"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-lg font-black text-[#111111]">GHOST_MX</p>
                  <p className="font-body mt-1 text-xs font-bold uppercase tracking-wide text-[#CC4B37]">
                    FRANCOTIRADOR
                  </p>
                  <p className="font-body mt-2 text-xs font-normal text-[#444444]">
                    EQUIPO SOMBRA · CDMX
                  </p>
                </div>
              </div>

              <div className="my-4 border-t border-[#EEEEEE]" />

              <div>
                <p className="font-body text-[10px] font-normal uppercase tracking-wider text-[#767676]">
                  RÉPLICA REGISTRADA
                </p>
                <p className="font-body mt-1 text-xs font-bold text-[#111111]">
                  SSG-10 · #MX-2024-00847
                </p>
              </div>

              <div className="mt-4">
                <p className="font-body text-[10px] font-normal uppercase tracking-wider text-[#767676]">
                  DOCUMENTOS
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="border border-[#EEEEEE] bg-[#F4F4F4] px-2 py-1 font-body text-xs text-[#111111]">
                    GN ✓
                  </span>
                  <span className="border border-[#EEEEEE] bg-[#F4F4F4] px-2 py-1 font-body text-xs text-[#111111]">
                    SSP ✓
                  </span>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <QrPlaceholder />
              </div>
            </div>

            {/* Footer card */}
            <div className="bg-[#F4F4F4] px-5 py-2.5">
              <p className="font-body text-xs font-normal text-[#767676]">airnation.online</p>
            </div>
          </div>

          {/* Mini réplicas */}
          <div className="flex gap-3">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#65B32E]"
              aria-hidden
            />
            <div className="min-w-0 flex-1 border border-[#EEEEEE] bg-white px-4 py-3">
              <p className="font-body text-xs font-bold text-[#111111]">HK416 · #MX-2024-00312</p>
              <p className="font-body mt-1 text-[10px] font-normal uppercase tracking-wide text-[#767676]">
                ACTIVA · PROPIETARIO VERIFICADO
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]"
              aria-hidden
            />
            <div className="min-w-0 flex-1 border border-[#EEEEEE] bg-white px-4 py-3">
              <p className="font-body text-xs font-bold text-[#111111]">SSP18 · #MX-2024-00456</p>
              <p className="font-body mt-1 text-[10px] font-normal uppercase tracking-wide text-[#767676]">
                TRANSFERIDA · 2 PROPIETARIOS
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
