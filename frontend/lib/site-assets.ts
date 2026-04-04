import { cache } from "react";
import { createPublicSupabaseClient } from "@/app/u/supabase-public";

export const getSiteAssets = cache(async function getSiteAssets(): Promise<
  Record<string, string>
> {
  const supabase = createPublicSupabaseClient();
  const { data } = await supabase.from("site_assets").select("key, image_url");
  if (!data) return {};
  return Object.fromEntries(
    data
      .filter(
        (a): a is { key: string; image_url: string } =>
          typeof a.key === "string" &&
          typeof a.image_url === "string" &&
          a.key.length > 0
      )
      .map((a) => [a.key, a.image_url])
  );
});
