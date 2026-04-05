import { createAdminClient, createAdminSupabaseServerClient } from "../supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import AssetUploader from "@/components/admin/AssetUploader";

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

const latoBody = { fontFamily: "'Lato', sans-serif" };

const jostBtn = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

export type SiteAssetRow = {
  id: string;
  key: string;
  image_url: string | null;
  value: string | null;
  label: string | null;
  description: string | null;
  updated_at: string;
};

const TEXT_KEYS = new Set([
  "credencial_alias",
  "credencial_rol",
  "credencial_equipo",
  "credencial_ciudad",
  "credencial_numero",
  "stat_jugadores",
  "stat_equipos",
  "stat_campos",
]);

async function updateSiteAssetStatValue(formData: FormData) {
  "use server";
  const id = formData.get("id");
  const valueRaw = formData.get("value");
  if (typeof id !== "string" || !id) return;
  const value = typeof valueRaw === "string" ? valueRaw : "";
  const authClient = createAdminSupabaseServerClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user?.id) return;
  const supabase = createAdminClient();
  const { error } = await supabase.from("site_assets").update({ value }).eq("id", id);
  revalidatePath("/admin/assets");
  if (error) {
    redirect(`/admin/assets?err=${encodeURIComponent(id)}`);
  }
  redirect(`/admin/assets?ok=${encodeURIComponent(id)}`);
}

function formatUpdatedLabel(updatedAt: string): string {
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
}

function TextValueCard({
  row,
  flashOk,
  flashErr,
}: {
  row: SiteAssetRow;
  flashOk: boolean;
  flashErr: boolean;
}) {
  const hasValue = Boolean(row.value?.trim());
  const displayTop = hasValue ? row.value : "Sin valor";
  const topColor = hasValue ? "#111111" : "#AAAAAA";
  const updatedLabel = formatUpdatedLabel(row.updated_at);

  return (
    <article
      className="flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
      style={{
        borderRadius: 0,
        animation: flashOk
          ? "admin-asset-flash-success 2s ease forwards"
          : flashErr
            ? "admin-asset-flash-error 2s ease forwards"
            : undefined,
      }}
    >
      <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-[#F4F4F4] px-4">
        <p
          className="max-w-full break-words text-center text-[1.35rem] leading-tight tracking-[0.06em] sm:text-[1.5rem]"
          style={{ ...jostHeading, color: topColor }}
        >
          {displayTop}
        </p>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3
          className="text-[13px] leading-tight tracking-[0.08em] text-[#111111]"
          style={jostBtn}
        >
          {row.label ?? row.key}
        </h3>
        {row.description ? (
          <p className="text-[12px] leading-snug text-[#666666]" style={latoBody}>
            {row.description}
          </p>
        ) : null}
        <p className="font-mono text-[11px] text-[#999999]" style={latoBody}>
          key: {row.key}
        </p>
        <p className="text-[11px] text-[#999999]" style={latoBody}>
          Actualizado: {updatedLabel}
        </p>

        <form action={updateSiteAssetStatValue} className="mt-2 flex flex-col gap-2">
          <input type="hidden" name="id" value={row.id} />
          <input
            type="text"
            name="value"
            defaultValue={row.value ?? ""}
            className="h-10 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
            style={{ ...latoBody, borderRadius: 2 }}
            autoComplete="off"
            aria-label="Valor"
          />
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center bg-[#CC4B37] text-[0.65rem] tracking-[0.12em] text-[#FFFFFF] transition-opacity hover:opacity-90"
            style={{ ...jostBtn, borderRadius: 2 }}
          >
            GUARDAR
          </button>
        </form>
      </div>
    </article>
  );
}

function CredencialAvatarCard({
  row,
  flashOk,
  flashErr,
}: {
  row: SiteAssetRow;
  flashOk: boolean;
  flashErr: boolean;
}) {
  const updatedLabel = formatUpdatedLabel(row.updated_at);

  return (
    <div
      className="flex flex-col overflow-hidden border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
      style={{
        borderRadius: 0,
        animation: flashOk
          ? "admin-asset-flash-success 2s ease forwards"
          : flashErr
            ? "admin-asset-flash-error 2s ease forwards"
            : undefined,
      }}
    >
      <div className="[&>article]:border-0">
        <AssetUploader
          assetKey={row.key}
          assetId={row.id}
          currentUrl={row.image_url ?? ""}
          label={row.label ?? row.key}
          description={row.description}
          updatedAt={row.updated_at}
        />
      </div>

      <div className="border-t border-solid border-[#EEEEEE] p-4">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#666666]" style={jostBtn}>
          Texto asociado (value)
        </p>
        <form action={updateSiteAssetStatValue} className="flex flex-col gap-2">
          <input type="hidden" name="id" value={row.id} />
          <input
            type="text"
            name="value"
            defaultValue={row.value ?? ""}
            className="h-10 w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
            style={{ ...latoBody, borderRadius: 2 }}
            autoComplete="off"
            aria-label="Valor de texto"
          />
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center bg-[#CC4B37] text-[0.65rem] tracking-[0.12em] text-[#FFFFFF] transition-opacity hover:opacity-90"
            style={{ ...jostBtn, borderRadius: 2 }}
          >
            GUARDAR TEXTO
          </button>
        </form>
        <p className="mt-2 text-[11px] text-[#999999]" style={latoBody}>
          Actualizado (imagen): {updatedLabel}
        </p>
      </div>
    </div>
  );
}

export default async function AdminAssetsPage({
  searchParams,
}: {
  searchParams: { ok?: string; err?: string };
}) {
  const supabase = createAdminClient();

  const { data: assets, error } = await supabase
    .from("site_assets")
    .select("*")
    .order("updated_at", { ascending: false });

  const rows: SiteAssetRow[] =
    !error && assets ? (assets as SiteAssetRow[]) : [];

  const okId = searchParams.ok ?? "";
  const errId = searchParams.err ?? "";

  return (
    <div className="min-w-[375px] p-6">
      <style>{`
        @keyframes admin-asset-flash-success {
          0%, 100% { border-color: #EEEEEE; }
          5%, 40% { border-color: #22c55e; box-shadow: 0 0 0 1px #22c55e; }
        }
        @keyframes admin-asset-flash-error {
          0%, 100% { border-color: #EEEEEE; }
          5%, 40% { border-color: #ef4444; box-shadow: 0 0 0 1px #ef4444; }
        }
      `}</style>

      <div className="mb-8">
        <h1
          className="mb-3 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          ASSETS — IMÁGENES DEL SITIO
        </h1>
        <p
          className="max-w-2xl text-sm leading-relaxed text-[#666666] md:text-base"
          style={latoBody}
        >
          Controla las imágenes que aparecen en la landing y páginas públicas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((row) => {
          const flashOk = okId === row.id;
          const flashErr = errId === row.id;

          if (TEXT_KEYS.has(row.key)) {
            return (
              <TextValueCard key={row.id} row={row} flashOk={flashOk} flashErr={flashErr} />
            );
          }

          if (row.key === "credencial_avatar") {
            return (
              <CredencialAvatarCard key={row.id} row={row} flashOk={flashOk} flashErr={flashErr} />
            );
          }

          return (
            <AssetUploader
              key={row.id}
              assetKey={row.key}
              assetId={row.id}
              currentUrl={row.image_url ?? ""}
              label={row.label ?? row.key}
              description={row.description}
              updatedAt={row.updated_at}
            />
          );
        })}
      </div>
    </div>
  );
}
