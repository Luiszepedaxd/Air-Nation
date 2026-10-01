const { MEXICO_CITY_TZ, startOfZonedDay } = require("./mexicoCityDay");

const RECENT_LIMIT = 8;
const CITY_LIMIT = 8;
const DEFAULT_PAGE_SIZE = 1000;
const SIN_ESTADO = "Sin estado";
const SIN_CIUDAD = "Sin ciudad";

function placeLabel(value, fallback) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function byCountThenLabel(labelOf) {
  return (a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return labelOf(a).localeCompare(labelOf(b), "es");
  };
}

function summarizePlaces(rows) {
  const estados = new Map();
  const ciudades = new Map();

  for (const row of rows) {
    const estado = placeLabel(row.estado, SIN_ESTADO);
    const ciudad = placeLabel(row.ciudad, SIN_CIUDAD);
    estados.set(estado, (estados.get(estado) || 0) + 1);
    const key = `${ciudad}\0${estado}`;
    const prev = ciudades.get(key);
    ciudades.set(key, {
      ciudad,
      estado,
      count: (prev?.count || 0) + 1,
    });
  }

  const byEstado = [...estados.entries()]
    .map(([estado, count]) => ({ estado, count }))
    .sort(byCountThenLabel((row) => row.estado));

  const cityList = [...ciudades.values()].sort(
    byCountThenLabel((row) => `${row.ciudad}, ${row.estado}`)
  );
  const byCiudad = cityList.slice(0, CITY_LIMIT);
  const otrasCiudades = cityList
    .slice(CITY_LIMIT)
    .reduce((sum, row) => sum + row.count, 0);

  return { byEstado, byCiudad, otrasCiudades };
}

function summarizeTransfers(rows) {
  const counts = new Map();
  for (const row of rows) {
    const status = placeLabel(row.status, "sin_estado");
    counts.set(status, (counts.get(status) || 0) + 1);
  }
  const byStatus = [...counts.entries()]
    .map(([status, count]) => ({ status, count }))
    .sort(byCountThenLabel((row) => row.status));
  return {
    pendiente: counts.get("pendiente") || 0,
    byStatus,
  };
}

function shapeRecent(rows) {
  return (rows || []).map((row) => ({
    id: row.id == null ? "" : String(row.id),
    nombre:
      typeof row.nombre === "string" && row.nombre.trim()
        ? row.nombre.trim()
        : "Sin nombre",
    sistema: row.sistema ? String(row.sistema) : null,
    ciudad: row.ciudad ? String(row.ciudad) : null,
    estado: row.estado ? String(row.estado) : null,
    verificada: row.verificada === true,
    en_venta: row.en_venta === true,
    created_at: row.created_at ? String(row.created_at) : null,
  }));
}

async function countArsenal(supabase, apply) {
  let query = supabase.from("arsenal").select("id", { count: "exact", head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function fetchAll(supabase, table, columns, pageSize) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) return rows;
  }
}

/**
 * Métricas de réplicas registradas (tabla `arsenal`).
 * `estado` es la entidad federativa, no un status de la réplica.
 * No existe columna de reporte por robo; las transferencias viven en `arsenal_transfers`.
 */
async function loadReplicaAdminStats(supabase, now = new Date(), options = {}) {
  const pageSize = options.pageSize || DEFAULT_PAGE_SIZE;
  const dayStart = startOfZonedDay(now, MEXICO_CITY_TZ);
  const dayStartIso = dayStart.toISOString();

  const [total, registeredToday, verificadas, enVenta, recentRes] = await Promise.all([
    countArsenal(supabase),
    countArsenal(supabase, (query) => query.gte("created_at", dayStartIso)),
    countArsenal(supabase, (query) => query.eq("verificada", true)),
    countArsenal(supabase, (query) => query.eq("en_venta", true)),
    supabase
      .from("arsenal")
      .select("id, nombre, sistema, ciudad, estado, verificada, en_venta, created_at")
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
  ]);

  if (recentRes.error) throw recentRes.error;

  let places = { byEstado: [], byCiudad: [], otrasCiudades: 0 };
  let placesUnavailable = false;
  try {
    const placeRows = await fetchAll(supabase, "arsenal", "id, ciudad, estado", pageSize);
    places = summarizePlaces(placeRows);
  } catch (err) {
    placesUnavailable = true;
    console.error("[admin/replicas/stats] places", err);
  }

  let transfers = null;
  let transfersUnavailable = false;
  try {
    const transferRows = await fetchAll(
      supabase,
      "arsenal_transfers",
      "id, status",
      pageSize
    );
    transfers = summarizeTransfers(transferRows);
  } catch (err) {
    transfersUnavailable = true;
    console.error("[admin/replicas/stats] transfers", err);
  }

  return {
    timezone: MEXICO_CITY_TZ,
    dayStart: dayStartIso,
    total,
    registeredToday,
    verificadas,
    enVenta,
    byEstado: places.byEstado,
    byCiudad: places.byCiudad,
    otrasCiudades: places.otrasCiudades,
    transfers,
    transfersUnavailable,
    placesUnavailable,
    recent: shapeRecent(recentRes.data),
  };
}

module.exports = {
  CITY_LIMIT,
  RECENT_LIMIT,
  SIN_CIUDAD,
  SIN_ESTADO,
  loadReplicaAdminStats,
  shapeRecent,
  summarizePlaces,
  summarizeTransfers,
};
