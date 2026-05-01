import type { Metadata } from "next";
import EliminarCuentaClient from "./EliminarCuentaClient";

export const metadata: Metadata = {
  title: "Eliminar cuenta — AirNation",
  description:
    "Solicita la eliminación de tu cuenta AirNation y todos los datos asociados.",
  robots: { index: false, follow: false },
  alternates: {
    canonical: "https://www.airnation.online/eliminar-cuenta",
  },
};

export default function EliminarCuentaPage() {
  return <EliminarCuentaClient />;
}
