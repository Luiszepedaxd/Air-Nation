/**
 * `fields.horarios_json` tal como lo guarda la ficha del campo:
 * `{ "sabado": { "abierto": true, "apertura": "09:00", "cierre": "18:00" }, ... }`
 * Mismo formato y mismas llaves que `frontend/lib/field-schedule.ts` y que
 * `arena_day_hours` en la BD.
 */

const FIELD_DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
// Índice 0 = domingo, igual que EXTRACT(DOW) en Postgres.
const DOW_KEYS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

const HHMM = /^(\d{1,2}):(\d{2})$/;

/** "9:30" → 570 minutos. null si no es una hora válida. */
function minutesOfClock(value) {
  const m = HHMM.exec(String(value || "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** "2026-10-24" → llave de día ("sabado"). null si la fecha no es válida. */
function dayKeyOfDate(fecha) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(fecha || "").trim());
  if (!m) return null;
  const ts = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(ts);
  if (Number.isNaN(ts) || d.getUTCMonth() + 1 !== Number(m[2]) || d.getUTCDate() !== Number(m[3])) {
    return null;
  }
  return DOW_KEYS[d.getUTCDay()];
}

/**
 * Horario de una fecha según el JSON del campo, con las mismas reglas que
 * `arena_day_hours`: el día tiene que estar abierto, con HH:MM válidos y
 * cierre posterior a la apertura. No conoce los días bloqueados.
 * @returns {{ apertura: string, cierre: string } | null}
 */
function dayHours(horariosJson, fecha) {
  const key = dayKeyOfDate(fecha);
  if (!key || !horariosJson || typeof horariosJson !== "object" || Array.isArray(horariosJson)) {
    return null;
  }
  const day = horariosJson[key];
  if (!day || typeof day !== "object" || Array.isArray(day) || day.abierto !== true) return null;
  const abre = minutesOfClock(day.apertura);
  const cierra = minutesOfClock(day.cierre);
  if (abre === null || cierra === null || cierra <= abre) return null;
  return { apertura: String(day.apertura).trim(), cierre: String(day.cierre).trim() };
}

/**
 * Valida y normaliza el horario que manda el dueño antes de guardarlo.
 * Un día cerrado se guarda como `{ abierto: false }`.
 * @returns {{ json: object } | { error: string }}
 */
function parseHorarioJson(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { error: "El horario debe ser un objeto con los días de la semana." };
  }
  for (const key of Object.keys(raw)) {
    if (!FIELD_DAYS.includes(key)) {
      return { error: `"${key}" no es un día válido.` };
    }
  }
  const json = {};
  for (const key of FIELD_DAYS) {
    const day = raw[key];
    if (!day || typeof day !== "object" || Array.isArray(day) || day.abierto !== true) {
      json[key] = { abierto: false };
      continue;
    }
    const abre = minutesOfClock(day.apertura);
    const cierra = minutesOfClock(day.cierre);
    if (abre === null || cierra === null) {
      return { error: `El horario del ${key} necesita apertura y cierre en formato HH:MM.` };
    }
    if (cierra <= abre) {
      return { error: `El cierre del ${key} tiene que ser después de la apertura.` };
    }
    json[key] = { abierto: true, apertura: day.apertura.trim(), cierre: day.cierre.trim() };
  }
  return { json };
}

module.exports = { FIELD_DAYS, DOW_KEYS, minutesOfClock, dayKeyOfDate, dayHours, parseHorarioJson };
