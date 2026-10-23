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

/**
 * El mock en producción solo con permiso explícito (ARENA_MOCK_EN_PRODUCCION=true),
 * para probar el flujo completo antes de conectar el proveedor real.
 */
function mockBloqueado() {
  return (
    process.env.NODE_ENV === "production" &&
    String(process.env.ARENA_MOCK_EN_PRODUCCION || "").trim().toLowerCase() !== "true"
  );
}

function assertArenaConfig() {
  if (arenaProvider() === "mock" && mockBloqueado()) {
    console.error(
      "[arena] ARENA_PAYMENT_PROVIDER=mock no puede correr con NODE_ENV=production. " +
        "Deja la variable vacía, conecta el proveedor real o pon ARENA_MOCK_EN_PRODUCCION=true."
    );
    process.exit(1);
  }
}

module.exports = { PROVEEDORES, arenaProvider, mockBloqueado, arenaPublicUrl, assertArenaConfig };
