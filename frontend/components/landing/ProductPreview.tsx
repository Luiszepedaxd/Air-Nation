export const revalidate = 0;

import Link from "next/link";
import { getSiteAssets } from "@/lib/site-assets";

const PREVIEW_KEYS = [
  "preview_foto_1",
  "preview_foto_2",
  "preview_foto_3",
  "preview_foto_4",
  "preview_foto_5",
  "preview_foto_6",
] as const;

function validImageUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && url.trim().length > 0;
}

export default async function ProductPreview() {
  const assets = await getSiteAssets();

  return (
    <section id="preview" className="bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
        <div>
          <div className="mb-5 flex items-center gap-4">
            <span className="block h-[2px] w-7 bg-an-accent" />
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-an-accent">
              Vista previa
            </p>
          </div>
          <h2
            className="font-display font-black uppercase leading-[0.9] text-an-text"
            style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}
          >
            ASÍ SE VE
            <br />
            LA PLATAFORMA.
          </h2>
          <p className="mt-6 max-w-lg font-body text-base leading-[1.7] text-an-text-dim sm:text-[1.05rem]">
            Perfil, credencial, equipos, campos y eventos — todo en una sola app.
          </p>
          <Link
            href="/register"
            className="font-body mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-an-accent hover:text-an-accent-h transition-colors"
          >
            Crear mi perfil
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-px bg-an-border lg:grid-cols-2">
          {PREVIEW_KEYS.map((key, slotIndex) => {
            const url = assets[key];
            if (!validImageUrl(url)) return null;
            const hideOnMobile = slotIndex >= 4;
            return (
              <div
                key={key}
                className={`relative aspect-[9/16] bg-an-surface2 ${hideOnMobile ? "hidden lg:block" : ""}`}
              >
                <img
                  src={url}
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
