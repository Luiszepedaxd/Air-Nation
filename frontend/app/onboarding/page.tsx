"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CIUDADES } from "@/lib/ciudades";
import { notifyTeamJoinRequest } from "@/lib/notify-team-join-request";
import { generateTeamSlug } from "@/lib/team-slug";

const STORAGE_KEY = "airnation_onboarding";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"
).replace(/\/$/, "");

type OnboardingState = {
  paso: 1 | 2 | 3 | 4;
  nombre: string;
  alias: string;
  ciudad: string;
  rol:
    | "rifleman"
    | "sniper"
    | "support"
    | "medic"
    | "scout"
    | "team_leader"
    | "rookie"
    | "";
  team_id: string | null;
  team_nombre: string;
  avatar_url: string;
  bio: string;
  /** true si eligió un equipo existente (búsqueda); solicitud join, sin users.team_id */
  team_join_via_request: boolean;
};

const DEFAULT_STATE: OnboardingState = {
  paso: 1,
  nombre: "",
  alias: "",
  ciudad: "",
  rol: "",
  team_id: null,
  team_nombre: "",
  avatar_url: "",
  bio: "",
  team_join_via_request: false,
};

const VALID_ROLES = new Set<string>([
  "rifleman",
  "sniper",
  "support",
  "medic",
  "scout",
  "team_leader",
  "rookie",
]);

const ROLES_CONFIG: {
  id: NonNullable<Exclude<OnboardingState["rol"], "">>;
  label: string;
}[] = [
  { id: "rifleman", label: "Rifleman / Asalto" },
  { id: "sniper", label: "Sniper" },
  { id: "support", label: "Support / Apoyo" },
  { id: "medic", label: "Medic" },
  { id: "scout", label: "Scout / Explorador" },
  { id: "team_leader", label: "Team Leader" },
  { id: "rookie", label: "Rookie / Novato" },
];

type TeamRow = { id: string; nombre: string; ciudad: string };

function parseStoredState(raw: string): OnboardingState | null {
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (typeof p !== "object" || p === null) return null;
    const paso =
      p.paso === 1 || p.paso === 2 || p.paso === 3 || p.paso === 4
        ? p.paso
        : 1;
    const rol =
      typeof p.rol === "string" && VALID_ROLES.has(p.rol)
        ? (p.rol as OnboardingState["rol"])
        : "";
    return {
      paso,
      nombre: typeof p.nombre === "string" ? p.nombre : "",
      alias: typeof p.alias === "string" ? p.alias : "",
      ciudad: typeof p.ciudad === "string" ? p.ciudad : "",
      rol,
      team_id:
        p.team_id === null
          ? null
          : typeof p.team_id === "string"
            ? p.team_id
            : null,
      team_nombre: typeof p.team_nombre === "string" ? p.team_nombre : "",
      avatar_url: typeof p.avatar_url === "string" ? p.avatar_url : "",
      bio: typeof p.bio === "string" ? p.bio : "",
      team_join_via_request:
        p.team_join_via_request === true ? true : false,
    };
  } catch {
    return null;
  }
}

/**
 * Icono de rol — SVG 20×20; color vía currentColor en el contenedor (text-[#111111] / text-[#CC4B37]).
 */
function RoleIcon({
  role,
}: {
  role: NonNullable<Exclude<OnboardingState["rol"], "">>;
}) {
  const svgProps = {
    viewBox: "0 0 20 20" as const,
    fill: "none" as const,
    width: 20,
    height: 20,
    "aria-hidden": true as const,
  };

  switch (role) {
    case "rifleman":
      return (
        <svg {...svgProps}>
          <path
            d="M10 18c-3.3 0-6-2.7-6-6 0-2 1-3.5 2-4.5 0 1.5 1 2.5 1 2.5 0-3 2-6 4-7.5-.5 2 .5 3.5 1.5 4.5.5-1 .5-2 .5-2 1.5 1.5 3 3.5 3 7 0 3.3-2.7 6-6 6z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "sniper":
      return (
        <svg {...svgProps}>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={1.5} />
          <path
            d="M10 3v4M10 13v4M3 10h4M13 10h4"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      );
    case "support":
      return (
        <svg {...svgProps}>
          <path
            d="M10 17s-7-4-7-9a4 4 0 0 1 7-2.65A4 4 0 0 1 17 8c0 5-7 9-7 9z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "medic":
      return (
        <svg {...svgProps}>
          <rect
            x="8"
            y="3"
            width="4"
            height="14"
            rx="1"
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <rect
            x="3"
            y="8"
            width="14"
            height="4"
            rx="1"
            stroke="currentColor"
            strokeWidth={1.5}
          />
        </svg>
      );
    case "scout":
      return (
        <svg {...svgProps}>
          <circle cx="5.5" cy="12" r="3.5" stroke="currentColor" strokeWidth={1.5} />
          <circle cx="14.5" cy="12" r="3.5" stroke="currentColor" strokeWidth={1.5} />
          <path
            d="M9 12h2"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      );
    case "team_leader":
      return (
        <svg {...svgProps}>
          <path
            d="M10 2l2.4 5 5.6.8-4 3.9.9 5.5L10 14.5l-4.9 2.7.9-5.5L2 7.8l5.6-.8L10 2z"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "rookie":
      return (
        <svg {...svgProps}>
          <circle cx="10" cy="6" r="3" stroke="currentColor" strokeWidth={1.5} />
          <path
            d="M4 18c0-3.3 2.7-6 6-6s6 2.7 6 6"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </svg>
      );
    default:
      return null;
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [storageReady, setStorageReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [teamSearchInput, setTeamSearchInput] = useState("");
  const [debouncedTeamQuery, setDebouncedTeamQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTeams, setSearchTeams] = useState<TeamRow[]>([]);
  const [allowCreate, setAllowCreate] = useState(true);
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const skipNextPersist = useRef(false);
  /**
   * Tras submit exitoso: evita re-hidratar / re-persistir desde localStorage vacío
   * antes de que termine la navegación a /dashboard (misma sesión de React).
   */
  const redirectingRef = useRef(false);

  /**
   * Hidrata sesión y, si hay borrador en localStorage, restaura el paso del formulario.
   * Si `redirectingRef` es true, no toca localStorage ni el estado del wizard (submit ya limpió storage).
   */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      if (redirectingRef.current) {
        setStorageReady(true);
        setAuthChecked(true);
        return;
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = parseStoredState(raw);
          if (parsed) {
            skipNextPersist.current = true;
            setState(parsed);
          }
        }
      } catch {
        /* ignore */
      }
      setStorageReady(true);
      setAuthChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  /**
   * Persiste el borrador del onboarding en localStorage.
   * No escribe si estamos redirigiendo tras submit exitoso (evita condiciones de carrera con storage vacío).
   */
  useEffect(() => {
    if (!storageReady) return;
    if (redirectingRef.current) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, storageReady]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedTeamQuery(teamSearchInput), 400);
    return () => window.clearTimeout(t);
  }, [teamSearchInput]);

  useEffect(() => {
    if (state.paso !== 4 || state.team_id !== null) {
      setSearchTeams([]);
      setSearchLoading(false);
      return;
    }
    if (debouncedTeamQuery.length < 2) {
      setSearchTeams([]);
      setAllowCreate(true);
      setSearchLoading(false);
      return;
    }

    const q = debouncedTeamQuery;
    const ciudad = state.ciudad;
    let cancelled = false;
    setSearchLoading(true);

    (async () => {
      try {
        const url = `${API_URL}/teams/search?q=${encodeURIComponent(q)}&ciudad=${encodeURIComponent(ciudad)}`;
        const res = await fetch(url);
        const data = (await res.json()) as {
          teams?: TeamRow[];
          allow_create?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setSearchTeams([]);
          setAllowCreate(false);
          return;
        }
        setSearchTeams(Array.isArray(data.teams) ? data.teams : []);
        setAllowCreate(data.allow_create !== false);
      } catch {
        if (!cancelled) {
          setSearchTeams([]);
          setAllowCreate(false);
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedTeamQuery, state.paso, state.ciudad, state.team_id]);

  const aliasValid = useMemo(() => {
    const t = state.alias.trim();
    return t.length >= 2 && t.length <= 30;
  }, [state.alias]);

  const step1Ok =
    state.nombre.trim().length > 0 && aliasValid;
  const step2Ok = state.ciudad !== "" && state.rol !== "";
  const step3Ok = true;
  const step4Ok = true;

  const canContinue =
    state.paso === 1
      ? step1Ok
      : state.paso === 2
        ? step2Ok
        : state.paso === 3
          ? step3Ok
          : step4Ok;

  const update = useCallback((patch: Partial<OnboardingState>) => {
    setState((s) => ({ ...s, ...patch }));
  }, []);

  const goNext = useCallback(() => {
    setSubmitError("");
    setState((s) => {
      if (s.paso >= 4) return s;
      return { ...s, paso: (s.paso + 1) as 1 | 2 | 3 | 4 };
    });
  }, []);

  const goBack = useCallback(() => {
    setSubmitError("");
    setState((s) => {
      if (s.paso <= 1) return s;
      return { ...s, paso: (s.paso - 1) as 1 | 2 | 3 | 4 };
    });
  }, []);

  const handleFinish = useCallback(async () => {
    if (!userId || !canContinue || state.paso !== 4) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      if (state.team_id && state.team_join_via_request) {
        const { error: joinErr } = await supabase
          .from("team_join_requests")
          .insert({
            team_id: state.team_id,
            user_id: userId,
            mensaje: "Solicitud desde onboarding",
            status: "pendiente",
          });
        if (joinErr && (joinErr as { code?: string }).code !== "23505") {
          console.warn("[onboarding] team_join_requests insert:", joinErr);
        }
        await notifyTeamJoinRequest(state.team_id, {
          solicitante_nombre: state.nombre.trim(),
          solicitante_alias: state.alias.trim() || null,
          team_nombre: state.team_nombre.trim() || "Equipo",
        });
      }

      const patchTeamId =
        state.team_join_via_request ? null : state.team_id;

      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: state.nombre.trim(),
          alias: state.alias.trim(),
          ciudad: state.ciudad,
          rol: state.rol,
          team_id: patchTeamId,
          avatar_url: state.avatar_url || null,
          bio: state.bio.trim() || null,
        }),
      });
      if (!res.ok) {
        setSubmitError("Algo salió mal. Intenta de nuevo.");
        return;
      }
      redirectingRef.current = true;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      // Dar tiempo a que el PATCH sea visible en lecturas server-side del dashboard
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/dashboard?from=onboarding");
    } catch {
      setSubmitError("Algo salió mal. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }, [userId, canContinue, state, router]);

  const selectTeam = useCallback(
    (t: TeamRow, joinViaRequest: boolean) => {
      update({
        team_id: t.id,
        team_nombre: t.nombre,
        team_join_via_request: joinViaRequest,
      });
      setTeamSearchInput("");
      setDebouncedTeamQuery("");
      setSearchTeams([]);
    },
    [update]
  );

  const clearTeam = useCallback(() => {
    update({ team_id: null, team_nombre: "", team_join_via_request: false });
    setTeamSearchInput("");
    setDebouncedTeamQuery("");
  }, [update]);

  const createTeamFromQuery = useCallback(async () => {
    const query = debouncedTeamQuery.trim();
    if (!userId || query.length < 2 || !state.ciudad) return;
    setCreatingTeam(true);
    setSubmitError("");
    try {
      const res = await fetch(`${API_URL}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: query,
          ciudad: state.ciudad,
          created_by: userId,
          slug: generateTeamSlug(undefined, query),
        }),
      });
      const data = (await res.json()) as { team?: TeamRow; error?: string };
      if (!res.ok || !data.team?.id) {
        setSubmitError("Algo salió mal. Intenta de nuevo.");
        return;
      }
      selectTeam(
        {
          id: data.team.id,
          nombre: data.team.nombre ?? query,
          ciudad: state.ciudad,
        },
        false
      );
    } catch {
      setSubmitError("Algo salió mal. Intenta de nuevo.");
    } finally {
      setCreatingTeam(false);
    }
  }, [userId, debouncedTeamQuery, state.ciudad, selectTeam]);

  const onAliasChange = (v: string) => {
    if (v.length > 30) return;
    update({ alias: v });
  };

  const onAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      setAvatarError("");
      const MIME_OK = new Set(["image/jpeg", "image/png", "image/webp"]);
      if (!MIME_OK.has(file.type)) {
        setAvatarError("Usa JPEG, PNG o WebP.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setAvatarError("Máximo 10 MB.");
        return;
      }
      setAvatarUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const up = await fetch(`${API_URL}/upload`, {
          method: "POST",
          body: fd,
        });
        if (!up.ok) {
          setAvatarError("No se pudo subir.");
          return;
        }
        const json = (await up.json()) as { url?: string };
        if (!json?.url) {
          setAvatarError("Error del servidor.");
          return;
        }
        update({ avatar_url: json.url });
      } catch {
        setAvatarError("Error al subir la imagen.");
      } finally {
        setAvatarUploading(false);
      }
    },
    [update]
  );

  const handlePrimary = () => {
    if (state.paso === 4) void handleFinish();
    else goNext();
  };

  if (!authChecked) {
    return (
      <main
        className="min-h-screen min-w-[375px] bg-white flex items-center justify-center"
        style={{ fontFamily: "'Lato', sans-serif" }}
      >
        <p className="text-sm text-[#666]">Cargando…</p>
      </main>
    );
  }

  const btnPrimaryClass =
    "w-full py-4 px-4 bg-[#CC4B37] text-white font-bold text-xs uppercase tracking-[0.12em] rounded-[2px] disabled:opacity-45 disabled:cursor-not-allowed hover:opacity-95 transition-opacity";
  const btnPrimaryStyle = { fontFamily: "'Jost', sans-serif" } as const;

  const inputShell =
    "w-full px-3 py-3 border border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] text-sm rounded-[2px] placeholder:text-[#AAAAAA] focus:outline-none focus:border-[#CC4B37] transition-colors";
  const labelClass =
    "block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999] mb-2";
  const labelStyle = { fontFamily: "'Jost', sans-serif" } as const;

  const showTeamSearch = state.team_id === null;

  return (
    <main
      className="min-h-screen min-w-[375px] bg-white text-[#111111] pb-28 md:pb-10"
      style={{ fontFamily: "'Lato', sans-serif" }}
    >
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-[#EEEEEE]">
        <div className="relative flex h-14 items-center justify-center px-4">
          {state.paso > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-xs text-[#999] bg-transparent border-0 cursor-pointer p-1"
            >
              ← Atrás
            </button>
          )}
          <div
            className="font-bold text-sm tracking-[0.2em] text-[#111111] uppercase"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            AIR<span className="text-[#CC4B37]">NATION</span>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-3">
          {([1, 2, 3, 4] as const).map((s) => (
            <div
              key={s}
              className={`h-[3px] flex-1 ${
                s <= state.paso ? "bg-[#CC4B37]" : "bg-[#EEEEEE]"
              }`}
            />
          ))}
        </div>
      </header>

      <div
        className="px-6 w-full max-w-[480px] mx-auto"
        style={{ paddingTop: "calc(56px + 12px + 3px + 16px)" }}
      >
        <p className="text-center font-mono text-[11px] text-[#999] mb-6">
          PASO {state.paso} DE 4
        </p>

        {state.paso === 1 && (
          <section className="space-y-6">
            <div>
              <h1
                className="text-[32px] font-bold uppercase leading-tight text-[#111111]"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                TU IDENTIDAD
              </h1>
              <p className="text-sm text-[#666] mt-2">
                Cómo te vas a presentar en la plataforma.
              </p>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Nombre completo
              </label>
              <input
                type="text"
                className={inputShell}
                placeholder="Como aparecerá en tu perfil"
                value={state.nombre}
                onChange={(e) => update({ nombre: e.target.value })}
                autoComplete="name"
              />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Alias / Callsign
              </label>
              <input
                type="text"
                className={inputShell}
                placeholder="¿Cómo te conocen en el campo?"
                value={state.alias}
                maxLength={30}
                onChange={(e) => onAliasChange(e.target.value)}
                autoComplete="nickname"
              />
              <div className="flex justify-end mt-1">
                <span className="text-[11px] text-[#999]">
                  {state.alias.length}/30
                </span>
              </div>
            </div>
          </section>
        )}

        {state.paso === 2 && (
          <section className="space-y-6">
            <div>
              <h1
                className="text-[32px] font-bold uppercase leading-tight text-[#111111]"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                TU PERFIL
              </h1>
              <p className="text-sm text-[#666] mt-2">Cuéntanos cómo juegas.</p>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Ciudad
              </label>
              <div className="relative">
                <select
                  className={`${inputShell} appearance-none pr-10 cursor-pointer`}
                  value={state.ciudad}
                  onChange={(e) => update({ ciudad: e.target.value })}
                >
                  {CIUDADES.map((c) => (
                    <option key={c.value || "empty"} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#111111]"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M4 6 L8 10 L12 6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>
                Tu rol en el campo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES_CONFIG.map(({ id, label }) => {
                  const selected = state.rol === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => update({ rol: id })}
                      className={`text-left p-3 border bg-white transition-colors rounded-none ${
                        selected
                          ? "border-[#CC4B37] bg-[#FFF5F4]"
                          : "border-[#EEEEEE]"
                      }`}
                    >
                      <div
                        className={`mb-2 flex items-center justify-center ${
                          selected ? "text-[#CC4B37]" : "text-[#111111]"
                        }`}
                      >
                        <RoleIcon role={id} />
                      </div>
                      <span className="text-xs font-medium text-[#111111] leading-snug block">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {state.paso === 3 && (
          <section className="space-y-6">
            <div>
              <h1
                className="text-[32px] font-bold uppercase leading-tight text-[#111111]"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                TU FOTO Y BIO
              </h1>
              <p className="text-sm text-[#666] mt-2">
                Puedes saltarte esto y completarlo después desde tu perfil.
              </p>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>
                Foto de perfil
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 border border-[#EEEEEE] bg-[#F4F4F4] flex items-center justify-center overflow-hidden shrink-0">
                  {state.avatar_url ? (
                    <img
                      src={state.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                    >
                      <circle
                        cx="12"
                        cy="8"
                        r="4"
                        stroke="#AAAAAA"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
                        stroke="#AAAAAA"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={onAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="px-4 py-2 border border-[#EEEEEE] bg-[#F4F4F4] text-sm text-[#111111] disabled:opacity-50"
                    style={{ borderRadius: 2 }}
                  >
                    {avatarUploading ? "Subiendo…" : "Elegir foto"}
                  </button>
                  {avatarError && (
                    <p className="text-xs text-[#CC4B37]">{avatarError}</p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>
                Bio{" "}
                <span className="text-[#AAAAAA] normal-case tracking-normal font-normal">
                  (opcional)
                </span>
              </label>
              <textarea
                value={state.bio}
                onChange={(e) => update({ bio: e.target.value.slice(0, 100) })}
                rows={3}
                maxLength={100}
                placeholder="¿Qué estilo de juego tienes? ¿Cuánto llevas jugando?"
                className={`${inputShell} resize-none`}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[11px] text-[#999]">
                  {state.bio.length}/100
                </span>
              </div>
            </div>
          </section>
        )}

        {state.paso === 4 && (
          <section className="space-y-8">
            <div>
              <h1
                className="text-[32px] font-bold uppercase leading-tight text-[#111111]"
                style={{ fontFamily: "'Jost', sans-serif" }}
              >
                TU EQUIPO
              </h1>
              <p className="text-sm text-[#666] mt-2">
                El airsoft se juega en equipo. Busca el tuyo o créalo ahora — tú serás el fundador y
                podrás invitar al resto desde tu perfil.
              </p>
            </div>

            <div>
              <label className={labelClass} style={labelStyle}>
                Equipo
              </label>

              {showTeamSearch ? (
                <>
                  <input
                    type="text"
                    className={inputShell}
                    placeholder="Escribe el nombre de tu equipo..."
                    value={teamSearchInput}
                    onChange={(e) => setTeamSearchInput(e.target.value)}
                  />
                  {teamSearchInput === '' && (
                    <p
                      className="text-xs text-[#999] mt-2"
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      ¿Eres capitán? Escribe el nombre de tu equipo y créalo en segundos.
                    </p>
                  )}
                  {searchLoading && (
                    <p className="text-[11px] text-[#999] mt-2">Buscando…</p>
                  )}
                  {!searchLoading && debouncedTeamQuery.length >= 2 && (
                    <>
                      {searchTeams.length > 0 && (
                        <ul className="mt-2 border border-[#EEEEEE] bg-white list-none m-0 p-0">
                          {searchTeams.map((t) => (
                            <li
                              key={t.id}
                              className="border-b border-[#EEEEEE] last:border-b-0"
                            >
                              <button
                                type="button"
                                className="w-full text-left px-2.5 py-2.5 text-sm cursor-pointer hover:bg-[#F4F4F4] bg-transparent border-0"
                                onClick={() => selectTeam(t, true)}
                              >
                                {t.nombre}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {searchTeams.length === 0 && allowCreate && (
                        <button
                          type="button"
                          disabled={creatingTeam}
                          onClick={() => void createTeamFromQuery()}
                          className="mt-3 w-full py-3 px-3 bg-[#CC4B37] text-white font-bold text-sm rounded-[2px] disabled:opacity-50"
                        >
                          + Crear equipo &apos;{debouncedTeamQuery.trim()}&apos;
                        </button>
                      )}
                      {searchTeams.length === 0 && !allowCreate && (
                        <p className="text-xs text-[#666] mt-3 leading-relaxed">
                          ¿No encuentras tu equipo? Puede que esté registrado con
                          otro nombre. Escríbenos en Instagram @airnation.online
                        </p>
                      )}
                    </>
                  )}
                  <button
                    type="button"
                    className="mt-4 text-xs text-[#999] bg-transparent border-0 p-0 cursor-pointer underline-offset-2 hover:underline text-left"
                    onClick={() => {
                      update({
                        team_id: null,
                        team_nombre: "",
                        team_join_via_request: false,
                      });
                      setTeamSearchInput("");
                    }}
                  >
                    Prefiero unirme a un equipo después →
                  </button>
                </>
              ) : (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 border border-[#EEEEEE] bg-[#E8F5E9] text-sm text-[#1B5E20]"
                  style={{ borderRadius: 0 }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M5 10 L9 14 L15 6"
                      stroke="#2E7D32"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="flex-1 font-medium">{state.team_nombre}</span>
                  <button
                    type="button"
                    aria-label="Quitar equipo"
                    className="text-[#666] hover:text-[#111] text-lg leading-none px-1 bg-transparent border-0 cursor-pointer"
                    onClick={clearTeam}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="hidden md:block mt-10 max-w-[400px] mx-auto w-full space-y-2">
          <button
            type="button"
            style={btnPrimaryStyle}
            className={btnPrimaryClass}
            disabled={!canContinue || submitting}
            onClick={handlePrimary}
          >
            {state.paso === 4 && submitting ? "Guardando…" : "Continuar"}
          </button>
          {submitError && (
            <p className="text-sm text-center text-[#CC4B37]">{submitError}</p>
          )}
        </div>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white p-4 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          style={btnPrimaryStyle}
          className={btnPrimaryClass}
          disabled={!canContinue || submitting}
          onClick={handlePrimary}
        >
          {state.paso === 4 && submitting ? "Guardando…" : "Continuar"}
        </button>
        {submitError && (
          <p className="text-sm text-center text-[#CC4B37]">{submitError}</p>
        )}
      </div>
    </main>
  );
}
