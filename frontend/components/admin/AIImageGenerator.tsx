"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

const MAX_PROMPT = 500;

const jostBtn = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

const latoBody = { fontFamily: "'Lato', sans-serif" };

type ImageModel = {
  id: string;
  label: string;
  provider: string;
  quality: string;
};

function SparkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AIImageGenerator({
  assetId,
  assetKey,
  onGenerated,
}: {
  assetId: string;
  assetKey: string;
  onGenerated: (url: string) => void | Promise<void>;
}) {
  const [models, setModels] = useState<ImageModel[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelId, setModelId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"idle" | "generating" | "preview">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useError, setUseError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) setModelsError("Sesión expirada. Recarga la página.");
          return;
        }
        const res = await fetch(`${API_BASE}/image-models`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            typeof body.error === "string" ? body.error : "No se pudieron cargar los modelos"
          );
        }
        const list = (body as { models?: ImageModel[] }).models ?? [];
        if (!cancelled) {
          setModels(list);
          if (list[0]?.id) setModelId(list[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setModelsError(e instanceof Error ? e.message : "Error al cargar modelos");
        }
      } finally {
        if (!cancelled) setModelsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

  const onGenerate = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || !modelId) return;
    setErrorMsg(null);
    setPhase("generating");
    try {
      const token = await getToken();
      if (!token) {
        setPhase("idle");
        setErrorMsg("Sesión expirada. Recarga la página.");
        return;
      }
      const res = await fetch(`${API_BASE}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: trimmed,
          model: modelId,
          assetKey,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Error al generar la imagen"
        );
      }
      const url = (body as { url?: string }).url;
      if (!url || typeof url !== "string") {
        throw new Error("Respuesta inválida del servidor");
      }
      setPreviewUrl(url);
      setPhase("preview");
    } catch (e) {
      setPhase("idle");
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  const onUseImage = async () => {
    if (!previewUrl) return;
    setUseError(null);
    try {
      await onGenerated(previewUrl);
      setPreviewUrl(null);
      setPhase("idle");
      setPrompt("");
    } catch (e) {
      setUseError(e instanceof Error ? e.message : "Error al guardar");
    }
  };

  const onGenerateAnother = () => {
    setPreviewUrl(null);
    setPhase("idle");
    setUseError(null);
  };

  const optionLabel = (m: ImageModel) =>
    `${m.label} · ${m.provider} · ${m.quality}`;

  if (phase === "generating") {
    return (
      <div
        data-asset-id={assetId}
        className="flex flex-col items-center justify-center gap-3 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-8"
        style={{ borderRadius: 0 }}
      >
        <svg
          className="h-8 w-8 animate-spin text-[#CC4B37]"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p
          className="text-center text-[13px] text-[#666666]"
          style={latoBody}
        >
          GENERANDO...
        </p>
        <p
          className="text-center text-[11px] text-[#999999]"
          style={latoBody}
        >
          Generando imagen con IA (puede tardar 15-30s)
        </p>
      </div>
    );
  }

  if (phase === "preview" && previewUrl) {
    return (
      <div
        data-asset-id={assetId}
        className="flex flex-col gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
        style={{ borderRadius: 0 }}
      >
        <p
          className="text-[13px] leading-tight tracking-[0.08em] text-[#111111]"
          style={{ ...jostBtn }}
        >
          GENERAR CON IA
        </p>
        <div className="relative w-full overflow-hidden bg-[#F4F4F4]">
          <img
            src={previewUrl}
            alt=""
            className="max-h-64 w-full object-contain"
          />
        </div>
        {useError ? (
          <p className="text-[12px] text-[#CC4B37]" style={latoBody}>
            {useError}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void onUseImage()}
          className="flex h-11 w-full items-center justify-center bg-[#CC4B37] text-[0.65rem] tracking-[0.12em] text-[#FFFFFF]"
          style={{ ...jostBtn, borderRadius: 2 }}
        >
          USAR ESTA IMAGEN
        </button>
        <button
          type="button"
          onClick={onGenerateAnother}
          className="flex h-11 w-full items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={{ ...jostBtn, borderRadius: 2 }}
        >
          GENERAR OTRA
        </button>
      </div>
    );
  }

  return (
    <div
      data-asset-id={assetId}
      className="flex flex-col gap-3 border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
      style={{ borderRadius: 0 }}
    >
      <p
        className="text-[13px] leading-tight tracking-[0.08em] text-[#111111]"
        style={{ ...jostBtn }}
      >
        GENERAR CON IA
      </p>

      {modelsLoading ? (
        <p className="text-[12px] text-[#666666]" style={latoBody}>
          Cargando modelos...
        </p>
      ) : modelsError ? (
        <p className="text-[12px] text-[#CC4B37]" style={latoBody}>
          {modelsError}
        </p>
      ) : (
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 text-[13px] text-[#111111] outline-none focus:border-[#CCCCCC]"
          style={{
            ...latoBody,
            height: 44,
            borderRadius: 2,
            maxWidth: "100%",
          }}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {optionLabel(m)}
            </option>
          ))}
        </select>
      )}

      <div className="flex flex-col gap-1">
        <textarea
          value={prompt}
          maxLength={MAX_PROMPT}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (errorMsg) setErrorMsg(null);
          }}
          placeholder="Ej: Jugadores de airsoft en campo abierto al atardecer, equipados con tácticos, acción dinámica"
          className="min-h-[80px] w-full resize-y border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-3 text-[13px] text-[#111111] outline-none focus:border-[#CCCCCC]"
          style={{ ...latoBody, borderRadius: 2 }}
        />
        <p
          className="text-right text-[11px] text-[#999999]"
          style={latoBody}
        >
          {prompt.length}/{MAX_PROMPT}
        </p>
      </div>

      <p className="text-[11px] leading-snug text-[#666666]" style={latoBody}>
        Nota: AirNation context se agrega automáticamente a tu prompt.
      </p>

      {errorMsg ? (
        <p className="text-[12px] text-[#CC4B37]" style={latoBody}>
          {errorMsg}
        </p>
      ) : null}

      <button
        type="button"
        disabled={
          modelsLoading ||
          !!modelsError ||
          !modelId ||
          !prompt.trim() ||
          models.length === 0
        }
        onClick={() => void onGenerate()}
        className="flex h-11 w-full items-center justify-center gap-2 bg-[#CC4B37] text-[0.65rem] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-60"
        style={{ ...jostBtn, borderRadius: 2 }}
      >
        <SparkIcon />
        GENERAR IMAGEN
      </button>
    </div>
  );
}
