"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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

function PreviewGalleryCarousel({ urls }: { urls: string[] }) {
  const [idx, setIdx] = useState(0);
  const n = urls.length;

  const goPrev = useCallback(() => {
    if (n === 0) return;
    setIdx((i) => (i - 1 + n) % n);
  }, [n]);

  const goNext = useCallback(() => {
    if (n === 0) return;
    setIdx((i) => (i + 1) % n);
  }, [n]);

  if (n === 0) {
    return <div className="min-h-[280px] w-full bg-an-surface2 border border-an-border" aria-hidden />;
  }

  const showArrows = n > 1;

  return (
    <div className="relative w-full overflow-hidden border border-an-border bg-an-surface2 aspect-[9/16]">
      {urls.map((src, i) => (
        <img
          key={`${src}-${i}`}
          src={src}
          alt=""
          loading={i === 0 ? "eager" : "lazy"}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out ${
            i === idx ? "z-[1] opacity-100" : "z-0 opacity-0 pointer-events-none"
          }`}
        />
      ))}

      {showArrows ? (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Captura anterior"
            className="absolute left-2 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-an-border bg-white/90 text-an-text transition-colors hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 6l-6 6 6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Captura siguiente"
            className="absolute right-2 top-1/2 z-[2] flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-an-border bg-white/90 text-an-text transition-colors hover:bg-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M9 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : null}
    </div>
  );
}

export default function ProductPreview() {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const imgs = await getSiteAssets();
      if (cancelled) return;
      const list = PREVIEW_KEYS.map((k) => imgs[k]).filter(validImageUrl);
      setUrls(list);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

        <PreviewGalleryCarousel urls={urls} />
      </div>
    </section>
  );
}
