import { createPublicSupabaseClient } from "@/app/u/supabase-public";

export async function getSiteAssets(): Promise<Record<string, string>> {
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase.from("site_assets").select("key, image_url");
  if (!data) return {};
  return Object.fromEntries(data.map((a) => [a.key, a.image_url]));
}

/** Valores de texto (p. ej. stats). Vacío si null o solo espacios. */
export async function getSiteAssetValues(): Promise<Record<string, string>> {
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase.from("site_assets").select("key, value");
  if (!data) return {};
  return Object.fromEntries(
    data.map((a) => {
      const raw = a.value;
      const s = raw == null ? "" : String(raw).trim();
      return [a.key, s];
    })
  );
}
