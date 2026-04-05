export const revalidate = 0;

import Link from "next/link";
import { getSiteAssets } from "@/lib/site-assets";

const COMUNIDAD_KEYS = [
  "comunidad_foto_1",
  "comunidad_foto_2",
  "comunidad_foto_3",
  "comunidad_foto_4",
  "comunidad_foto_5",
  "comunidad_foto_6",
] as const;

const STATS = [
  { num: "—", label: "Jugadores registrados" },
  { num: "—", label: "Equipos activos", accent: true },
  { num: "—", label: "Campos registrados" },
];

function validImageUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

export default async function CommunitySection() {
  const assets = await getSiteAssets();

  return (
    <section id="comunidad" className="bg-[#F4F4F4] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
        <div>
          <div className="mb-5 flex items-center gap-4">
            <span className="block h-[2px] w-7 bg-an-accent" />
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-an-accent">
              Comunidad
            </p>
          </div>
          <h2
            className="font-display font-black uppercase leading-[0.9] text-an-text"
            style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.8rem)" }}
          >
            CONSTRUIDA
            <br />
            POR LOS
            <br />
            QUE JUEGAN.
          </h2>
          <p className="mt-6 max-w-lg font-body text-base leading-[1.7] text-an-text-dim sm:text-[1.05rem]">
            Cada perfil, equipo y campo registrado suma a la plataforma que todos queríamos. AirNation nació del airsoft
            mexicano — y sigue creciendo desde adentro.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-px bg-an-border">
            {STATS.map(({ num, label, accent }) => (
              <div
                key={label}
                className={`flex flex-col items-center text-center py-5 px-3 ${
                  accent ? "bg-an-accent" : "bg-an-surface2"
                }`}
              >
                <span
                  className={`font-display font-black text-xl sm:text-2xl uppercase leading-none ${
                    accent ? "text-white" : "text-an-text"
                  }`}
                >
                  {num}
                </span>
                <span
                  className={`font-body text-[0.58rem] sm:text-[0.62rem] uppercase tracking-[0.1em] mt-1.5 leading-snug ${
                    accent ? "text-white/80" : "text-an-text-dim"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-[1.1rem] bg-an-accent text-white font-body font-bold text-[0.75rem] uppercase tracking-[0.18em] hover:bg-an-accent-h transition-colors rounded-[2px]"
            >
              Unirme a la comunidad
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path
                  d="M2.5 7h9M8 3.5L11.5 7 8 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px bg-an-border">
          {COMUNIDAD_KEYS.map((key) => {
            const src = assets[key];
            if (!validImageUrl(src)) return null;
            return (
              <div key={key} className="relative aspect-square bg-an-surface2">
                <img
                  src={src}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover border border-an-border"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
