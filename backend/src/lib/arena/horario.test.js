const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { dayHours, dayKeyOfDate, parseHorarioJson } = require("./horario");

const HORARIO = {
  lunes: { abierto: false },
  sabado: { abierto: true, apertura: "09:00", cierre: "18:00" },
  domingo: { abierto: true, apertura: "9:30", cierre: "15:00" },
  viernes: { abierto: true, apertura: "18:00", cierre: "09:00" },
};

describe("dayKeyOfDate", () => {
  it("usa el mismo índice de día que EXTRACT(DOW) en Postgres", () => {
    assert.equal(dayKeyOfDate("2026-10-24"), "sabado");
    assert.equal(dayKeyOfDate("2026-10-25"), "domingo");
    assert.equal(dayKeyOfDate("2026-10-26"), "lunes");
  });
  it("rechaza fechas inexistentes o mal formadas", () => {
    assert.equal(dayKeyOfDate("2026-02-30"), null);
    assert.equal(dayKeyOfDate("24/10/2026"), null);
    assert.equal(dayKeyOfDate(null), null);
  });
});

describe("dayHours", () => {
  it("devuelve apertura y cierre del día abierto", () => {
    assert.deepEqual(dayHours(HORARIO, "2026-10-24"), { apertura: "09:00", cierre: "18:00" });
    assert.deepEqual(dayHours(HORARIO, "2026-10-25"), { apertura: "9:30", cierre: "15:00" });
  });
  it("devuelve null si el día está cerrado, falta o el horario está al revés", () => {
    assert.equal(dayHours(HORARIO, "2026-10-26"), null); // lunes cerrado
    assert.equal(dayHours(HORARIO, "2026-10-27"), null); // martes ausente
    assert.equal(dayHours(HORARIO, "2026-10-23"), null); // viernes con cierre <= apertura
    assert.equal(dayHours(null, "2026-10-24"), null);
  });
});

describe("parseHorarioJson", () => {
  it("normaliza los siete días y marca los cerrados", () => {
    const r = parseHorarioJson({ sabado: { abierto: true, apertura: "09:00", cierre: "18:00" } });
    assert.ok(!("error" in r));
    assert.equal(Object.keys(r.json).length, 7);
    assert.deepEqual(r.json.sabado, { abierto: true, apertura: "09:00", cierre: "18:00" });
    assert.deepEqual(r.json.lunes, { abierto: false });
  });
  it("rechaza llaves desconocidas, horas inválidas y cierres al revés", () => {
    assert.match(parseHorarioJson({ saturday: { abierto: true } }).error, /no es un día válido/);
    assert.match(
      parseHorarioJson({ sabado: { abierto: true, apertura: "9", cierre: "18:00" } }).error,
      /HH:MM/
    );
    assert.match(
      parseHorarioJson({ sabado: { abierto: true, apertura: "18:00", cierre: "18:00" } }).error,
      /después de la apertura/
    );
    assert.ok(parseHorarioJson([]).error);
  });
});
