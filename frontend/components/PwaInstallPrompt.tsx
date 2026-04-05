"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "an_pwa_session";

type BeforeInstallPromptLike = {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

let deferredPromptSingleton: BeforeInstallPromptLike | null = null;
const deferredListeners = new Set<() => void>();

function setDeferredPromptSingleton(e: BeforeInstallPromptLike | null) {
  deferredPromptSingleton = e;
  deferredListeners.forEach((fn) => fn());
}

export function getDeferredPromptSingleton(): BeforeInstallPromptLike | null {
  return deferredPromptSingleton;
}

function subscribeDeferredPrompt(callback: () => void) {
  deferredListeners.add(callback);
  return () => {
    deferredListeners.delete(callback);
  };
}

let openInstallOverlayHandler: (() => void) | null = null;

function registerPwaInstallOverlay(handler: () => void) {
  openInstallOverlayHandler = handler;
  return () => {
    if (openInstallOverlayHandler === handler) openInstallOverlayHandler = null;
  };
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return false;
  if (window.innerWidth < 768) return true;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isIOSPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches;
}

export function usePwaInstall() {
  const ios = typeof window !== "undefined" && isIOSPlatform();

  const canInstall = true;

  const triggerInstall = useCallback(async () => {
    const d = getDeferredPromptSingleton();
    if (d?.prompt) {
      try {
        await d.prompt();
        await d.userChoice;
      } catch {
        /* ignore */
      }
      setDeferredPromptSingleton(null);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
    } else if (isIOSPlatform()) {
      openInstallOverlayHandler?.();
    } else if (isStandalone()) {
      openInstallOverlayHandler?.();
    }
  }, []);

  return {
    canInstall,
    triggerInstall,
    isIOS: ios,
  };
}

function LogoAirNation() {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="#CC4B37" />
        <path d="M12 5L16.5 7.75V14.25L12 17L7.5 14.25V7.75L12 5Z" fill="#FFFFFF" />
      </svg>
      <p
        className="text-center font-black tracking-[0.18em] text-[#111111]"
        style={{ fontFamily: "'Jost', sans-serif", fontSize: "1.1rem" }}
      >
        AIR<span className="text-[#CC4B37]">NATION</span>
      </p>
    </div>
  );
}

function IconShareIOS() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v10M8 7l4-4 4 4M5 21h14a1 1 0 001-1v-4"
        stroke="#111111"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconAddSquare() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="#111111" strokeWidth="1.6" />
      <path d="M12 8v8M8 12h8" stroke="#111111" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 13l4 4L19 7" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMoreOptions() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="6" cy="12" r="2" fill="#111111" />
      <circle cx="12" cy="12" r="2" fill="#111111" />
      <circle cx="18" cy="12" r="2" fill="#111111" />
    </svg>
  );
}

const SHOW_DELAY_MS = 4000;

export default function PwaInstallPrompt() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<"ios" | "android" | null>(null);
  const timerRef = useRef<number | null>(null);

  const dismissPermanent = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  const dismissSoft = useCallback(() => {
    setOpen(false);
  }, []);

  useEffect(() => {
    return registerPwaInstallOverlay(() => {
      setVariant("ios");
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    if (!pathname?.startsWith("/dashboard")) {
      clearTimer();
      setOpen(false);
      return;
    }

    let cancelled = false;

    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      /* ignore */
    }

    if (isStandalone()) return;
    if (!isMobileViewport()) return;

    if (isIOSPlatform()) {
      timerRef.current = window.setTimeout(() => {
        if (!cancelled) {
          setVariant("ios");
          setOpen(true);
        }
      }, SHOW_DELAY_MS);
      return () => {
        cancelled = true;
        clearTimer();
      };
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPromptSingleton(e as unknown as BeforeInstallPromptLike);
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        if (!cancelled) {
          setVariant("android");
          setOpen(true);
        }
      }, SHOW_DELAY_MS);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => {
      cancelled = true;
      clearTimer();
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
    };
  }, [pathname]);

  const onInstallAndroid = async () => {
    const ev = getDeferredPromptSingleton();
    if (!ev?.prompt) {
      dismissPermanent();
      return;
    }
    try {
      await ev.prompt();
      await ev.userChoice;
    } catch {
      /* ignore */
    }
    setDeferredPromptSingleton(null);
    dismissPermanent();
  };

  if (!pathname?.startsWith("/dashboard")) return null;

  if (!open || !variant) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      onClick={dismissSoft}
    >
      <div
        className="mx-4 max-w-sm border border-solid border-[#EEEEEE] bg-white px-8 py-8"
        style={{ borderRadius: 2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <LogoAirNation />

        <p className="mt-6 text-center font-body text-[0.65rem] font-bold uppercase tracking-[0.28em] text-[#CC4B37]">
          ESTAMOS EN TEAM DEATHMATCH
        </p>

        <h2
          id="pwa-install-title"
          className="mt-3 text-center font-black uppercase leading-tight text-[#111111]"
          style={{ fontFamily: "'Jost', sans-serif", fontSize: "clamp(1.25rem, 4vw, 1.5rem)" }}
        >
          ACCESO ANTES
          <br />
          DEL LANZAMIENTO.
        </h2>

        <p className="mt-4 font-body text-sm leading-relaxed text-[#444444]">
          Estás dentro antes que nadie. Mientras AirNation llega a App Store y Google Play, ya puedes tenerla en tu
          pantalla de inicio — sin esperar permiso de nadie.
        </p>

        <div className="my-6 border-t border-[#EEEEEE]" />

        {variant === "android" ? (
          <>
            <button
              type="button"
              onClick={onInstallAndroid}
              className="flex w-full items-center justify-center bg-[#111111] py-3.5 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
              style={{ borderRadius: 2 }}
            >
              INSTALAR AIRNATION →
            </button>
            <button
              type="button"
              onClick={dismissSoft}
              className="mt-4 w-full text-center font-body text-sm font-bold text-[#444444] underline underline-offset-2"
            >
              Ahora no
            </button>
          </>
        ) : null}

        {variant === "ios" ? (
          <>
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#CC4B37] font-body text-xs font-bold text-white"
                  aria-hidden
                >
                  1
                </span>
                <IconShareIOS />
                <p className="min-w-0 flex-1 font-body text-sm text-[#444444]">
                  Toca el botón Compartir <span aria-hidden>↑</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#CC4B37] font-body text-xs font-bold text-white"
                  aria-hidden
                >
                  2
                </span>
                <IconMoreOptions />
                <p className="min-w-0 flex-1 font-body text-sm text-[#444444]">
                  Desliza y toca &quot;Más opciones&quot; <span aria-hidden>···</span>
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#CC4B37] font-body text-xs font-bold text-white"
                  aria-hidden
                >
                  3
                </span>
                <IconAddSquare />
                <p className="min-w-0 flex-1 font-body text-sm text-[#444444]">
                  Selecciona &quot;Agregar a pantalla de inicio&quot;
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#CC4B37] font-body text-xs font-bold text-white"
                  aria-hidden
                >
                  4
                </span>
                <IconCheck />
                <p className="min-w-0 flex-1 font-body text-sm text-[#444444]">Confirma tocando &quot;Agregar&quot;</p>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissPermanent}
              className="mt-8 flex w-full items-center justify-center bg-[#111111] py-3.5 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-white transition-opacity hover:opacity-90"
              style={{ borderRadius: 2 }}
            >
              ENTENDIDO →
            </button>
            <button
              type="button"
              onClick={dismissSoft}
              className="mt-4 w-full text-center font-body text-sm font-bold text-[#444444] underline underline-offset-2"
            >
              Ahora no
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
