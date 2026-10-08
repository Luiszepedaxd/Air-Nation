// Horas, días y fechas dichas en voz, siempre en hora de Ciudad de México,
// más el horario semanal de un campo tal como lo guarda su ficha.

function dayKey(now) {
  try {
    return new Date(now).toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  } catch {
    return new Date(now).toISOString().slice(0, 10);
  }
}

const FIELD_DAYS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];

const DAY_NAME = {
  lunes: "lunes",
  martes: "martes",
  miercoles: "miércoles",
  jueves: "jueves",
  viernes: "viernes",
  sabado: "sábado",
  domingo: "domingo",
};

function parseClock(value) {
  const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function spokenClock(hour, minute) {
  const h12 = hour % 12 || 12;
  let part = "de la mañana";
  if (hour === 12) part = "del día";
  else if (hour === 0) part = "de la noche";
  else if (hour >= 19) part = "de la noche";
  else if (hour >= 13) part = "de la tarde";
  const mins = minute === 0 ? "" : minute === 15 ? " y cuarto" : minute === 30 ? " y media" : ` y ${minute}`;
  return `a las ${h12}${mins} ${part}`;
}

function spokenSpan(open, close) {
  const from = spokenClock(open.hour, open.minute).replace(/^a las /, "");
  const to = spokenClock(close.hour, close.minute).replace(/^a las /, "");
  return `de ${from} a ${to}`;
}

function dayPhrase(days) {
  if (days.length === 7) return "todos los días";
  if (days.length === 1) {
    const day = days[0];
    return day === "sabado" || day === "domingo" ? `los ${day === "sabado" ? "sábados" : "domingos"}` : `el ${DAY_NAME[day]}`;
  }
  const index = days.map((day) => FIELD_DAYS.indexOf(day));
  const run = index.every((n, i) => i === 0 || n === index[i - 1] + 1);
  if (run && days.length >= 3) return `de ${DAY_NAME[days[0]]} a ${DAY_NAME[days[days.length - 1]]}`;
  const names = days.map((day) => (day === "sabado" || day === "domingo" ? (day === "sabado" ? "sábados" : "domingos") : DAY_NAME[day]));
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

// Misma tabla que la ficha del campo: días abiertos y apertura/cierre locales, en voz.
// Un día sin HH:MM no se inventa. Si ninguno abre, no hay horario.
function hoursOf(json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) return "";
  const open = [];
  for (const day of FIELD_DAYS) {
    const slot = json[day];
    if (!slot || typeof slot !== "object" || slot.abierto === false) continue;
    const apertura = parseClock(slot.apertura);
    const cierre = parseClock(slot.cierre);
    if (!apertura || !cierre) continue;
    // Un cierre que no es posterior a la apertura es un dato roto en la tabla:
    // antes de decir un horario al revés, ese día no tiene horario publicado.
    if (cierre.hour * 60 + cierre.minute <= apertura.hour * 60 + apertura.minute) continue;
    open.push({ day, span: spokenSpan(apertura, cierre) });
  }
  if (!open.length) return "";
  const groups = [];
  for (const slot of open) {
    const prev = groups[groups.length - 1];
    const prevIndex = prev ? FIELD_DAYS.indexOf(prev.days[prev.days.length - 1]) : -2;
    if (prev && prev.span === slot.span && FIELD_DAYS.indexOf(slot.day) === prevIndex + 1) prev.days.push(slot.day);
    else groups.push({ span: slot.span, days: [slot.day] });
  }
  return groups.map((group) => `${dayPhrase(group.days)} ${group.span}`).join(", y ");
}

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const WEEKDAY_ES = {
  Sun: "domingo",
  Mon: "lunes",
  Tue: "martes",
  Wed: "miércoles",
  Thu: "jueves",
  Fri: "viernes",
  Sat: "sábado",
};

const MONTH_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function mexicoParts(instant) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag = {};
  for (const part of fmt.formatToParts(new Date(instant))) bag[part.type] = part.value;
  return { date: `${bag.year}-${bag.month}-${bag.day}`, weekday: bag.weekday, hour: Number(bag.hour), minute: bag.minute };
}

// ponytail: Ciudad de México no cambia de horario desde 2022, así que 24 h
// caen en el día local correcto. Si vuelve el horario de verano, este salto falla.
function shiftMexicoDate(instant, days) {
  return mexicoParts(new Date(instant).getTime() + days * 86400000).date;
}

function spokenDate(date) {
  const [year, month, day] = date.split("-");
  return `${Number(day)} de ${MONTH_ES[Number(month) - 1]} de ${year}`;
}

function weekendWindow(now) {
  const today = mexicoParts(now);
  const index = WEEKDAY_INDEX[today.weekday];
  const untilSat = index === 0 ? -1 : (6 - index) % 7;
  return {
    today,
    tomorrow: shiftMexicoDate(now, 1),
    friday: shiftMexicoDate(now, untilSat - 1),
    saturday: shiftMexicoDate(now, untilSat),
    sunday: shiftMexicoDate(now, untilSat + 1),
  };
}

module.exports = {
  WEEKDAY_ES,
  dayKey,
  hoursOf,
  mexicoParts,
  spokenClock,
  spokenDate,
  weekendWindow,
};
