import { createAdminClient } from "../supabase-server";
import AssetUploader from "@/components/admin/AssetUploader";

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: "uppercase" as const,
};

const latoBody = { fontFamily: "'Lato', sans-serif" };

export type SiteAssetRow = {
  id: string;
  key: string;
  image_url: string;
  label: string | null;
  description: string | null;
  updated_at: string;
};

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
        {rows.map((row) => (
          <AssetUploader
            key={row.id}
            assetKey={row.key}
            assetId={row.id}
            currentUrl={row.image_url ?? ""}
            label={row.label ?? row.key}
            description={row.description}
            updatedAt={row.updated_at}
          />
        ))}
      </div>
    </div>
  );
}
