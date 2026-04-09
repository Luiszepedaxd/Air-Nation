import { getSiteAssets } from "@/lib/site-assets";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const revalidate = 0;

export default async function ForgotPasswordPage() {
  const assets = await getSiteAssets();
  const loginFotoUrl = assets["login_foto"] ?? "/images/login_foto.jpg";

  return <ForgotPasswordClient loginFotoUrl={loginFotoUrl} />;
}
