"use client";

import { useEffect } from "react";
import { isNativeApp } from "@/lib/platform";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (isNativeApp()) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed", err);
      });
  }, []);

  return null;
}
