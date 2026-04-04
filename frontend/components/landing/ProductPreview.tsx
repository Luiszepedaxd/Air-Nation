import Link from "next/link";
import { getSiteAssets } from "@/lib/site-assets";

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
    <svg
      viewBox="0 0 50 50"
      className="h-10 w-10 shrink-0 md:h-14 md:w-14"
      aria-hidden
    >
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

/** Contenido del card de credencial; tipografía más compacta en móvil */
function CredentialCard({ previewUrl }: { previewUrl: string }) {
  return (
    <div className="overflow-hidden rounded-none border border-[#EEEEEE] bg-white shadow-sm">
      <div className="bg-[#CC4B37] px-3 py-2 md:px-5 md:py-3">
        <p className="font-display text-xs font-black uppercase tracking-[0.2em] text-white md:text-sm">
          AIRNATION
        </p>
        <p className="font-body mt-0.5 text-[10px] font-normal uppercase tracking-wider text-white/70 md:mt-1 md:text-xs">
          CREDENCIAL DE JUGADOR
        </p>
      </div>

      <div className="bg-white px-3 py-3 md:px-5 md:py-4">
        <div className="flex gap-3 md:gap-4">
          <img
            src={previewUrl}
            alt="Foto de perfil"
            className="w-16 h-16 object-cover object-center"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-black text-[#111111] md:text-lg">
              GHOST_MX
            </p>
            <p className="font-body mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[#CC4B37] md:mt-1 md:text-xs">
              FRANCOTIRADOR
            </p>
            <p className="font-body mt-1 text-[10px] font-normal text-[#444444] md:mt-2 md:text-xs">
              EQUIPO SOMBRA · CDMX
            </p>
          </div>
        </div>

        <div className="my-3 border-t border-[#EEEEEE] md:my-4" />

        <div>
          <p className="font-body text-[9px] font-normal uppercase tracking-wider text-[#767676] md:text-[10px]">
            RÉPLICA REGISTRADA
          </p>
          <p className="font-body mt-0.5 text-[10px] font-bold text-[#111111] md:mt-1 md:text-xs">
            SSG-10 · #MX-2024-00847
          </p>
        </div>

        <div className="mt-3 md:mt-4">
          <p className="font-body text-[9px] font-normal uppercase tracking-wider text-[#767676] md:text-[10px]">
            DOCUMENTOS
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5 md:mt-2 md:gap-2">
            <span className="border border-[#EEEEEE] bg-[#F4F4F4] px-1.5 py-0.5 font-body text-[10px] text-[#111111] md:px-2 md:py-1 md:text-xs">
              GN ✓
            </span>
            <span className="border border-[#EEEEEE] bg-[#F4F4F4] px-1.5 py-0.5 font-body text-[10px] text-[#111111] md:px-2 md:py-1 md:text-xs">
              SSP ✓
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-end md:mt-4">
          <QrPlaceholder />
        </div>
      </div>

      <div className="bg-[#F4F4F4] px-3 py-2 md:px-5 md:py-2.5">
        <p className="font-body text-[10px] font-normal text-[#767676] md:text-xs">
          airnation.online
        </p>
      </div>
    </div>
  );
}

function ReplicaCards() {
  return (
    <>
      <div className="flex gap-3">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#65B32E]"
          aria-hidden
        />
        <div className="min-w-0 flex-1 border border-[#EEEEEE] bg-white px-4 py-3">
          <p className="font-body text-xs font-bold text-[#111111]">
            HK416 · #MX-2024-00312
          </p>
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
          <p className="font-body text-xs font-bold text-[#111111]">
            SSP18 · #MX-2024-00456
          </p>
          <p className="font-body mt-1 text-[10px] font-normal uppercase tracking-wide text-[#767676]">
            TRANSFERIDA · 2 PROPIETARIOS
          </p>
        </div>
      </div>
    </>
  );
}

/** Credencial + réplicas dentro del área scrollable del dispositivo */
function DeviceScrollContent({
  previewUrl,
}: {
  previewUrl: string;
}) {
  return (
    <>
      <CredentialCard previewUrl={previewUrl} />
      <div className="flex flex-col gap-3 px-3 pb-3 pt-3 md:px-5 md:pb-4 md:pt-4">
        <ReplicaCards />
      </div>
    </>
  );
}

function PhoneMockup({ previewUrl }: { previewUrl: string }) {
  return (
    <div className="mx-auto w-full max-w-[320px] md:hidden">
      <div className="rounded-[2.5rem] border-4 border-[#2A2A2A] bg-[#1A1A1A] p-2.5 shadow-2xl">
        <div className="flex h-7 items-center justify-center rounded-t-[2rem] bg-[#111111]">
          <div className="h-4 w-20 rounded-full bg-[#1A1A1A]" />
        </div>
        <div className="overflow-hidden rounded-b-[2rem] bg-white">
          <div className="max-h-[min(520px,70vh)] overflow-y-auto">
            <DeviceScrollContent previewUrl={previewUrl} />
          </div>
          <div className="flex h-6 shrink-0 items-center justify-center bg-white">
            <div className="h-1 w-16 rounded-full bg-[#EEEEEE]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TabletMockup({ previewUrl }: { previewUrl: string }) {
  return (
    <div className="relative mx-auto hidden w-full max-w-[620px] md:block">
      <div className="relative aspect-[4/3] w-full overflow-visible rounded-[2rem] border-4 border-[#2A2A2A] bg-[#1A1A1A] p-3 shadow-2xl">
        <div
          className="absolute right-[-6px] top-16 z-10 h-10 w-[4px] rounded-full bg-[#2A2A2A]"
          aria-hidden
        />
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex h-6 shrink-0 items-center justify-center rounded-t-[1.2rem] bg-[#111111]">
            <span className="h-2 w-2 rounded-full bg-[#2A2A2A]" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto rounded-b-[1.2rem] bg-white">
            <DeviceScrollContent previewUrl={previewUrl} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function ProductPreview() {
  const assets = await getSiteAssets();
  const previewUrl = assets["credencial_preview"] ?? "/profilepic.jpg";

  return (
    <section id="preview" className="bg-white px-5 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
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
            Tu perfil. Tu credencial. Tus réplicas. Todo en un solo lugar.
          </p>
          <Link
            href="/register"
            className="font-body mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-an-accent hover:underline hover:underline-offset-4"
          >
            Crear mi perfil
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <PhoneMockup previewUrl={previewUrl} />
          <TabletMockup previewUrl={previewUrl} />
        </div>
      </div>
    </section>
  );
}
