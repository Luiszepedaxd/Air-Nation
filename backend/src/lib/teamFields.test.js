const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const { teamFieldError } = require("./teamFields");

describe("teamFieldError", () => {
  it("acepta filas reales de ciudad y estado", () => {
    assert.equal(
      teamFieldError({ nombre: "Nogales Airsoft", ciudad: "Heroica Nogales", estado: "Sonora" }),
      null
    );
    assert.equal(
      teamFieldError({ nombre: "Torreón Team", ciudad: "Torreón", estado: "Coahuila de Zaragoza" }),
      null
    );
    assert.equal(
      teamFieldError({
        nombre: "Capital",
        ciudad: "Ciudad de México",
        estado: "Ciudad de México",
      }),
      null
    );
    assert.equal(
      teamFieldError({ nombre: "Puerto", ciudad: "Veracruz", estado: "Veracruz" }),
      null
    );
    assert.equal(
      teamFieldError({
        nombre: "Puerto",
        ciudad: "Veracruz",
        estado: "Veracruz de Ignacio de la Llave",
      }),
      null
    );
    assert.equal(
      teamFieldError({ nombre: "Morelia", ciudad: "Morelia", estado: "Michoacán" }),
      null
    );
    assert.equal(
      teamFieldError({ nombre: "Morelia", ciudad: "Morelia", estado: "Michoacán de Ocampo" }),
      null
    );
    assert.equal(
      teamFieldError({ nombre: "Toluca", ciudad: "Toluca", estado: "Estado de México" }),
      null
    );
    assert.equal(
      teamFieldError({ nombre: "Toluca", ciudad: "Toluca", estado: "México" }),
      null
    );
  });

  it("rechaza PROBE-City sin estado, Otra y nombres con etiquetas", () => {
    assert.ok(teamFieldError({ nombre: "PROBE-XSS-Team-A", ciudad: "PROBE-City", estado: null }));
    assert.ok(teamFieldError({ nombre: "Equipo", ciudad: "Otra", estado: "Sonora" }));
    assert.ok(teamFieldError({ nombre: "<script>", ciudad: "Torreón", estado: "Coahuila" }));
    assert.ok(teamFieldError({ nombre: "Equipo", ciudad: "Torre<script>", estado: "Sonora" }));
  });

  it("acepta una ciudad que es solo el estado si el estado es válido", () => {
    assert.equal(
      teamFieldError({ nombre: "Solo estado", ciudad: "Sonora", estado: "Sonora" }),
      null
    );
    assert.ok(teamFieldError({ nombre: "Solo estado", ciudad: "Sonora", estado: null }));
    assert.ok(teamFieldError({ nombre: "Solo estado", ciudad: "Sonora", estado: "Texas" }));
  });
});
