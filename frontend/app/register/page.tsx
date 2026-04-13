import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";
import { getSiteAssets } from "@/lib/site-assets";

export const revalidate = 0;

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RegisterPage() {
  const assets = await getSiteAssets();
  const registerFotoUrl =
    assets["register_foto"] ?? "/images/register_foto.jpg";

  return <RegisterClient registerImageSrc={registerFotoUrl} />;
}
