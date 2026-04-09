import { getSiteAssets } from "@/lib/site-assets";
import ResetPasswordClient from "./ResetPasswordClient";

export const revalidate = 0;

export default async function ResetPasswordPage() {
  const assets = await getSiteAssets();
  const loginFotoUrl = assets["login_foto"] ?? "/images/login_foto.jpg";

  return <ResetPasswordClient loginFotoUrl={loginFotoUrl} />;
}
