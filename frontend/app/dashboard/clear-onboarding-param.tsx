"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Tras venir de onboarding, la primera carga usa ?from=onboarding para no
 * redirigir mientras Supabase aún no refleja el alias. Tras un breve margen,
 * limpia la URL para que la siguiente petición ya vea el perfil actualizado.
 */
export function ClearOnboardingParam() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("from") !== "onboarding") return;
    const t = window.setTimeout(() => {
      router.replace("/dashboard");
    }, 700);
    return () => window.clearTimeout(t);
  }, [router, searchParams]);

  return null;
}
