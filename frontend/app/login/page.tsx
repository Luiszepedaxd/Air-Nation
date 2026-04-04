import { Suspense } from "react";
import { getSiteAssets } from "@/lib/site-assets";
import LoginClient from "./LoginClient";

export const revalidate = 0;

export default async function LoginPage() {
  const assets = await getSiteAssets();
  const loginFotoUrl = assets["login_foto"] ?? "/images/login_foto.jpg";

  return (
    <Suspense fallback={null}>
      <LoginClient loginFotoUrl={loginFotoUrl} />
    </Suspense>
  );
}
