const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { limiteCancelacion, enPlazoDeCancelacion, mexicoInstant } = require("./horario");

const HORARIO = {
  sabado: { abierto: true, apertura: "09:00", cierre: "18:00" },
  domingo: { abierto: true, apertura: "7:30", cierre: "15:00" },
  lunes: { abierto: false },
};

describe("mexicoInstant", () => {
  it("convierte hora de pared de Ciudad de México a UTC (UTC-6, sin horario de verano)", () => {
    assert.equal(
      new Date(mexicoInstant("2026-10-24", "09:00")).toISOString(),
      "2026-10-24T15:00:00.000Z"
    );
    // En junio tampoco hay cambio de horario desde 2022.
    assert.equal(
      new Date(mexicoInstant("2026-06-13", "09:00")).toISOString(),
      "2026-06-13T15:00:00.000Z"
    );
    assert.equal(
      new Date(mexicoInstant("2026-10-24", "00:00")).toISOString(),
      "2026-10-24T06:00:00.000Z"
    );
  });
});

describe("limiteCancelacion", () => {
  it("el ejemplo del doc: abre sábado 9:00 con 24 h → viernes 9:00", () => {
    const limite = limiteCancelacion({
      fecha: "2026-10-24",
      horariosJson: HORARIO,
      cancelacionHorasLimite: 24,
    });
    assert.equal(limite.toISOString(), "2026-10-23T15:00:00.000Z"); // viernes 09:00 CDMX
  });

  it("respeta la apertura de cada día y las horas de una cifra", () => {
    const limite = limiteCancelacion({
      fecha: "2026-10-25", // domingo, abre 7:30
      horariosJson: HORARIO,
      cancelacionHorasLimite: 12,
    });
    // domingo 07:30 CDMX = 13:30Z; 12 h antes = sábado 19:30 CDMX
    assert.equal(limite.toISOString(), "2026-10-25T01:30:00.000Z");
  });

  it("si ese día ya no tiene horario usa 00:00 del día reservado", () => {
    const limite = limiteCancelacion({
      fecha: "2026-10-26", // lunes cerrado
      horariosJson: HORARIO,
      cancelacionHorasLimite: 24,
    });
    assert.equal(limite.toISOString(), "2026-10-25T06:00:00.000Z"); // domingo 00:00 CDMX
    assert.equal(
      limiteCancelacion({
        fecha: "2026-10-24",
        horariosJson: null,
        cancelacionHorasLimite: 0,
      }).toISOString(),
      "2026-10-24T06:00:00.000Z"
    );
  });

  it("con 0 horas el límite es la propia apertura", () => {
    assert.equal(
      limiteCancelacion({
        fecha: "2026-10-24",
        horariosJson: HORARIO,
        cancelacionHorasLimite: 0,
      }).toISOString(),
      "2026-10-24T15:00:00.000Z"
    );
  });
});

describe("enPlazoDeCancelacion", () => {
  const reserva = { fecha: "2026-10-24", horariosJson: HORARIO, cancelacionHorasLimite: 24 };
  it("acepta justo en el límite y rechaza un milisegundo después", () => {
    const limite = Date.parse("2026-10-23T15:00:00.000Z");
    assert.equal(enPlazoDeCancelacion(reserva, limite - 1), true);
    assert.equal(enPlazoDeCancelacion(reserva, limite), true);
    assert.equal(enPlazoDeCancelacion(reserva, limite + 1), false);
  });
});
