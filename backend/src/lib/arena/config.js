/**
 * Interruptores de ARENA. Sin `ARENA_PAYMENT_PROVIDER` el módulo existe pero
 * no acepta reservas (el botón RESERVAR no se muestra y POST /bookings
 * responde `arena_inactivo`).
 */

const PROVEEDORES = ["mock"];

function arenaProvider() {
  const raw = String(process.env.ARENA_PAYMENT_PROVIDER || "").trim().toLowerCase();
  return PROVEEDORES.includes(raw) ? raw : null;
}

function arenaPublicUrl() {
  const raw = String(process.env.ARENA_PUBLIC_URL || "https://www.airnation.online").trim();
  return raw.replace(/\/+$/, "");
}

/** El proveedor de prueba nunca debe cobrar en producción. */
function assertArenaConfig() {
  if (arenaProvider() === "mock" && process.env.NODE_ENV === "production") {
    console.error(
      "[arena] ARENA_PAYMENT_PROVIDER=mock no puede correr con NODE_ENV=production. " +
        "Deja la variable vacía o conecta el proveedor real."
    );
    process.exit(1);
  }
}

module.exports = { PROVEEDORES, arenaProvider, arenaPublicUrl, assertArenaConfig };
