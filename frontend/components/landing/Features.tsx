"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const FEATURES = [
  {
    num: "01",
    tag: "Identidad",
    title: "Perfil de Jugador",
    description:
      "Tu alias, foto, ciudad y rol en un solo lugar. Una página que te representa en toda la comunidad — sin repetirte en cada campo.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <circle cx="11" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M3.5 19c0-4 3.36-6 7.5-6s7.5 2 7.5 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    num: "02",
    tag: "ID",
    title: "Credencial Digital",
    description:
      "QR verificable, descárgala una vez y úsala donde quieras. Sin impresiones, sin papel, sin excusas.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="2" y="5" width="18" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5 8h2v2H5V8zm4 0h2v2H9V8zm4 0h2v2h-2V8zM5 12h2v2H5v-2zm8 0h2v2h-2v-2z"
          fill="currentColor"
        />
        <circle cx="8" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: "03",
    tag: "Equipo",
    title: "Registro de Equipos",
    description:
      "Perfil público, roles, álbum y muro. Todo lo que tu equipo necesita para existir en la plataforma.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="15" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 18c0-2.5 2.24-4 5-4s5 1.5 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 18c0-2.5 2.02-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "04",
    tag: "Territorio",
    title: "Campos",
    description:
      "Fichas con ubicación, reglas, contacto y eventos activos. Encuentra o registra tu campo en minutos.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          d="M11 3C8.2 3 6 5.2 6 8c0 4.5 5 11 5 11s5-6.5 5-11c0-2.8-2.2-5-5-5z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="8" r="1.8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    num: "05",
    tag: "Agenda",
    title: "Eventos",
    description:
      "Crea, difunde y gestiona partidas. RSVP integrado para que sepas exactamente quién llega.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <rect x="3" y="4" width="16" height="15" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h16M8 2v4M14 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 13h2M11 13h2M7 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    num: "06",
    tag: "Arsenal",
    title: "Réplicas",
    description:
      "Número de serie, fotos, historial y transferencias. Si te la roban, la marcas — y toda la comunidad lo sabe.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
        <path
          d="M3 13.5V9a1 1 0 0 1 1-1h11l3 3.5-1 4H4a1 1 0 0 1-1-1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M6 8V6.5C6 5.1 7.1 4 8.5 4H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="7.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="15.5" cy="16.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
];

const ITEMS = [...FEATURES, ...FEATURES, ...FEATURES];
const GAP = 16;

function cardWidthPx(): number {
  if (typeof window === "undefined") return 340;
  return window.innerWidth >= 640 ? 380 : 340;
}

function baseTranslate(containerW: number, cardW: number, index: number): number {
  const stride = cardW + GAP;
  return containerW / 2 - index * stride - cardW / 2;
}

function FeaturesCarousel() {
  const n = FEATURES.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(n);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDelta, setDragDelta] = useState(0);
  const [enableTransition, setEnableTransition] = useState(true);
  const [containerW, setContainerW] = useState(0);
  const [cardW, setCardW] = useState(340);

  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const indexRef = useRef(n);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setContainerW(el.offsetWidth);
    setCardW(cardWidthPx());
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  const endDrag = useCallback(
    (clientX: number) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      const delta = clientX - startXRef.current;
      setDragDelta(0);

      const prev = indexRef.current;
      let next = prev;
      if (delta > 80) next = prev - 1;
      else if (delta < -80) next = prev + 1;
      else {
        setEnableTransition(true);
        return;
      }

      if (next >= n * 2 || next <= 0) {
        setEnableTransition(false);
        setCurrentIndex(n);
        indexRef.current = n;
        window.setTimeout(() => setEnableTransition(true), 0);
        return;
      }
      setEnableTransition(true);
      setCurrentIndex(next);
    },
    [n]
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      setDragDelta(e.clientX - startXRef.current);
    };
    const onUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      endDrag(e.clientX);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, endDrag]);

  const translatePx =
    containerW > 0
      ? baseTranslate(containerW, cardW, currentIndex) + (isDragging ? dragDelta : 0)
      : 0;

  const onPointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    setEnableTransition(false);
    startXRef.current = clientX;
    setDragDelta(0);
  };

  const onPointerMove = (clientX: number) => {
    if (!isDraggingRef.current) return;
    setDragDelta(clientX - startXRef.current);
  };

  const activeDot = ((currentIndex % n) + n) % n;

  return (
    <div className="w-full">
      <div
        ref={viewportRef}
        className={`relative w-full cursor-grab overflow-hidden select-none active:cursor-grabbing ${
          isDragging ? "cursor-grabbing" : ""
        }`}
        onMouseDown={(e) => onPointerDown(e.clientX)}
        onMouseMove={(e) => onPointerMove(e.clientX)}
        onMouseLeave={() => isDraggingRef.current && endDrag(startXRef.current)}
        onTouchStart={(e) => onPointerDown(e.touches[0].clientX)}
        onTouchMove={(e) => {
          if (isDraggingRef.current && e.touches[0]) onPointerMove(e.touches[0].clientX);
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          if (t) endDrag(t.clientX);
        }}
        role="region"
        aria-roledescription="carrusel"
        aria-label="Funciones de la plataforma"
      >
        <div
          className={`flex gap-4 ${enableTransition && !isDragging ? "transition-transform duration-300 ease-out" : ""}`}
          style={{ transform: `translateX(${translatePx}px)` }}
        >
          {ITEMS.map((f, i) => (
            <div
              key={`${i}-${f.num}`}
              className="group relative w-[340px] shrink-0 border border-[#EEEEEE] bg-white p-8 transition-all duration-200 hover:border-[#CC4B37] hover:shadow-sm sm:w-[380px] sm:p-10"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="font-display text-[2.8rem] font-black leading-none text-[#CC4B37]/50 transition-colors duration-200 select-none group-hover:text-[#CC4B37]/70">
                  {f.num}
                </span>
                <span className="border border-an-border px-2.5 py-1 font-body text-[0.6rem] font-bold uppercase tracking-[0.22em] text-an-muted">
                  {f.tag}
                </span>
              </div>
              <div className="mb-4 text-an-accent">{f.icon}</div>
              <h3 className="mb-3 font-ui text-[1.05rem] font-semibold leading-snug text-an-text">{f.title}</h3>
              <p className="font-body text-sm leading-[1.75] text-an-text-dim">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {FEATURES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ir a slide ${i + 1}`}
            aria-current={activeDot === i}
            className={`rounded-full transition-all duration-300 ${
              activeDot === i ? "h-1.5 w-4 bg-[#CC4B37]" : "h-1.5 w-1.5 bg-[#DDDDDD]"
            }`}
            onClick={() => {
              setEnableTransition(true);
              const idx = n + i;
              indexRef.current = idx;
              setCurrentIndex(idx);
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function Features() {
  return (
    <section id="funciones" className="bg-[#F4F4F4] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 sm:mb-16">
          <div className="mb-5 flex items-center gap-4">
            <span className="block h-[2px] w-7 bg-an-accent" />
            <p className="font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-an-accent">
              Funciones
            </p>
          </div>
          <h2
            className="font-display font-black uppercase leading-[0.9] text-an-text"
            style={{ fontSize: "clamp(2.6rem, 6vw, 5.2rem)" }}
          >
            TODO LO QUE
            <br />
            EL AIRSOFT
            <br />
            NECESITABA.
          </h2>
          <p className="mt-6 max-w-lg font-body text-base leading-[1.7] text-an-text-dim sm:text-[1.05rem]">
            Seis herramientas construidas desde adentro del juego — no desde una oficina.
          </p>
        </div>

        <FeaturesCarousel />
      </div>
    </section>
  );
}
