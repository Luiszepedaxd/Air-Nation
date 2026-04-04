"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const jostBtn = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

const latoBody = { fontFamily: "'Lato', sans-serif" };

function resolveImageSrc(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return url;
}

type Phase = "idle" | "previewing" | "uploading" | "error";

export default function AssetUploader({
  assetKey,
  assetId,
  currentUrl,
  label,
  description,
  updatedAt,
}: {
  assetKey: string;
  assetId: string;
  currentUrl: string;
  label: string;
  description: string | null;
  updatedAt: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const displaySrc =
    previewUrl || resolveImageSrc(currentUrl) || "/herofoto2.jpg";

  const cleanupPreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setFile(null);
    setPhase("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [previewUrl]);

  const onPickFile = () => {
    setErrorMsg(null);
    inputRef.current?.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setFile(f);
    setPhase("previewing");
    setErrorMsg(null);
  };

  const onConfirmUpload = async () => {
    if (!file) return;
    setErrorMsg(null);
    setPhase("uploading");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(
          typeof err.error === "string" ? err.error : "Error al subir la imagen"
        );
      }

      const { url } = (await uploadRes.json()) as { url?: string };
      if (!url) throw new Error("Respuesta de subida inválida");

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        setPhase("error");
        setErrorMsg("Sesión expirada. Recarga la página.");
        return;
      }

      const patchRes = await fetch(`${API_BASE}/assets/${assetId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image_url: url }),
      });

      if (!patchRes.ok) {
        const err = await patchRes.json().catch(() => ({}));
        throw new Error(
          typeof err.error === "string" ? err.error : "Error al guardar la URL"
        );
      }

      cleanupPreview();
      router.refresh();
    } catch (e) {
      setPhase("error");
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  const updatedLabel = (() => {
    try {
      const d = new Date(updatedAt);
      if (Number.isNaN(d.getTime())) return updatedAt;
      return d.toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return updatedAt;
    }
  })();

  return (
    <article
      className="flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
      style={{ borderRadius: 0 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-hidden
        onChange={onFileChange}
      />

      <div className="relative h-48 w-full overflow-hidden bg-[#F4F4F4]">
        <img
          src={displaySrc}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3
          className="text-[13px] leading-tight tracking-[0.08em] text-[#111111]"
          style={{ ...jostBtn }}
        >
          {label}
        </h3>
        {description ? (
          <p
            className="text-[12px] leading-snug text-[#666666]"
            style={latoBody}
          >
            {description}
          </p>
        ) : null}
        <p
          className="font-mono text-[11px] text-[#999999]"
          style={latoBody}
        >
          key: {assetKey}
        </p>
        <p className="text-[11px] text-[#999999]" style={latoBody}>
          Actualizado: {updatedLabel}
        </p>

        {errorMsg ? (
          <p className="text-[12px] text-[#CC4B37]" style={latoBody}>
            {errorMsg}
          </p>
        ) : null}

        {phase === "previewing" || phase === "uploading" || phase === "error" ? (
          <div className="mt-2 flex flex-col gap-2">
            <button
              type="button"
              disabled={phase === "uploading"}
              onClick={onConfirmUpload}
              className="flex h-10 w-full items-center justify-center bg-[#CC4B37] text-[0.65rem] tracking-[0.12em] text-[#FFFFFF] transition-opacity disabled:opacity-60"
              style={{ ...jostBtn, borderRadius: 2 }}
            >
              {phase === "uploading" ? "SUBIENDO…" : "CONFIRMAR SUBIDA"}
            </button>
            <button
              type="button"
              disabled={phase === "uploading"}
              onClick={cleanupPreview}
              className="flex h-10 w-full items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[0.65rem] tracking-[0.12em] text-[#666666] transition-colors hover:bg-[#F4F4F4] disabled:opacity-60"
              style={{ ...jostBtn, borderRadius: 2 }}
            >
              CANCELAR
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onPickFile}
            className="mt-2 flex h-10 w-full items-center justify-center bg-[#111111] text-[0.65rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:bg-[#333333]"
            style={{ ...jostBtn, borderRadius: 2 }}
          >
            CAMBIAR IMAGEN
          </button>
        )}
      </div>
    </article>
  );
}
