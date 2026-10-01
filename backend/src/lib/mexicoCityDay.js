const MEXICO_CITY_TZ = "America/Mexico_City";

function zonedParts(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const map = {};
  for (const part of dtf.formatToParts(date)) {
    if (part.type !== "literal") map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

/**
 * Medianoche del día civil de `now` en `timeZone`, como instante UTC.
 * El desfase se toma a mediodía de esa fecha para no caer en un cambio de hora.
 */
function startOfZonedDay(now, timeZone) {
  const { year, month, day } = zonedParts(now, timeZone);
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const noon = zonedParts(noonUtc, timeZone);
  const noonWallAsUtc = Date.UTC(
    noon.year,
    noon.month - 1,
    noon.day,
    noon.hour,
    noon.minute,
    noon.second
  );
  const offsetMs = noonWallAsUtc - noonUtc.getTime();
  let midnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMs);

  const check = zonedParts(midnight, timeZone);
  const sameDay =
    check.year === year && check.month === month && check.day === day && check.hour === 0;
  if (!sameDay) {
    const checkWall = Date.UTC(
      check.year,
      check.month - 1,
      check.day,
      check.hour,
      check.minute,
      check.second
    );
    const checkOffset = checkWall - midnight.getTime();
    midnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - checkOffset);
  }

  return midnight;
}

module.exports = {
  MEXICO_CITY_TZ,
  startOfZonedDay,
  zonedParts,
};
