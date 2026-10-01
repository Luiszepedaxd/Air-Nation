const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { MEXICO_CITY_TZ, startOfZonedDay, zonedParts } = require("./mexicoCityDay");

describe("startOfZonedDay America/Mexico_City", () => {
  it("usa UTC-6: la medianoche del 1 oct 2026 es 06:00 UTC", () => {
    const afternoon = new Date("2026-10-01T18:00:00.000Z");
    const start = startOfZonedDay(afternoon, MEXICO_CITY_TZ);
    assert.equal(start.toISOString(), "2026-10-01T06:00:00.000Z");

    const parts = zonedParts(start, MEXICO_CITY_TZ);
    assert.deepEqual(
      { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour },
      { year: 2026, month: 10, day: 1, hour: 0 }
    );
  });

  it("antes de las 06:00 UTC sigue siendo el día anterior en Ciudad de México", () => {
    const stillYesterday = new Date("2026-10-01T05:59:59.999Z");
    const start = startOfZonedDay(stillYesterday, MEXICO_CITY_TZ);
    assert.equal(start.toISOString(), "2026-09-30T06:00:00.000Z");
  });

  it("en el instante exacto de medianoche el día ya cambió", () => {
    const midnight = new Date("2026-10-01T06:00:00.000Z");
    const start = startOfZonedDay(midnight, MEXICO_CITY_TZ);
    assert.equal(start.toISOString(), "2026-10-01T06:00:00.000Z");
  });

  it("en julio 2022 Ciudad de México observaba horario de verano (UTC-5)", () => {
    const summer = new Date("2022-07-15T17:00:00.000Z");
    const start = startOfZonedDay(summer, MEXICO_CITY_TZ);
    assert.equal(start.toISOString(), "2022-07-15T05:00:00.000Z");
  });
});
