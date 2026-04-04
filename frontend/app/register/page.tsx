import RegisterClient from "./RegisterClient";
import { getSiteAssets } from "@/lib/site-assets";

export default async function RegisterPage() {
  const assets = await getSiteAssets();
  const registerImageSrc =
    assets["register_foto"] || "/images/register_foto.jpg";

  return <RegisterClient registerImageSrc={registerImageSrc} />;
}
