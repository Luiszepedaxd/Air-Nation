import { createAdminClient, createAdminSupabaseServerClient } from "../supabase-server";
import { revalidatePath } from "next/cache";
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
  await supabase.from("site_assets").update({ value }).eq("id", id);
  revalidatePath("/admin/assets");
}

function StatValueCard({ row }: { row: SiteAssetRow }) {
  const displayValue = row.value?.trim() ? row.value : "—";

  const updatedLabel = (() => {
    try {
      const d = new Date(row.updated_at);
      if (Number.isNaN(d.getTime())) return row.updated_at;
      return d.toLocaleString("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return row.updated_at;
    }
  })();

  return (
    <article
      className="flex flex-col border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
      style={{ borderRadius: 0 }}
    >
      <div className="relative flex h-48 w-full items-center justify-center overflow-hidden bg-[#F4F4F4] px-4">
        <p
          className="max-w-full break-words text-center text-[1.35rem] leading-tight tracking-[0.06em] text-[#111111] sm:text-[1.5rem]"
          style={jostHeading}
        >
          {displayValue}
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

export default async function AdminAssetsPage() {
  const supabase = createAdminClient();

  const { data: assets, error } = await supabase
    .from("site_assets")
    .select("*")
    .order("updated_at", { ascending: false });

  const rows: SiteAssetRow[] =
    !error && assets ? (assets as SiteAssetRow[]) : [];

  return (
    <div className="min-w-[375px] p-6">
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
        {rows.map((row) =>
          row.key.startsWith("stat_") ? (
            <StatValueCard key={row.id} row={row} />
          ) : (
            <AssetUploader
              key={row.id}
              assetKey={row.key}
              assetId={row.id}
              currentUrl={row.image_url ?? ""}
              label={row.label ?? row.key}
              description={row.description}
              updatedAt={row.updated_at}
            />
          )
        )}
      </div>
    </div>
  );
}
