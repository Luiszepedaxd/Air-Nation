const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  validateFotoInput,
  imageFromOpenRouter,
  mapUpstreamError,
} = require("./openrouterImage");

const PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("generar foto", () => {
  it("exige prompt y modelo, sin tope de caracteres en el prompt", () => {
    assert.equal(validateFotoInput("", "google/gemini-2.5-flash-image").status, 400);
    assert.equal(validateFotoInput("   ", "google/gemini-2.5-flash-image").status, 400);
    assert.equal(validateFotoInput("un casco", "").status, 400);
    assert.equal(validateFotoInput("un casco", "modelo con espacios").status, 400);

    const largo = "a".repeat(100_000);
    const ok = validateFotoInput(`  ${largo}  `, "google/gemini-2.5-flash-image");
    assert.equal(ok.prompt, largo);
    assert.equal(ok.model, "google/gemini-2.5-flash-image");
  });

  it("lee b64_json y media_type de la Image API", () => {
    const png = imageFromOpenRouter({
      data: [{ b64_json: PNG, media_type: "image/png" }],
    });
    assert.equal(png.mediaType, "image/png");
    assert.equal(png.ext, "png");
    assert.equal(png.b64, PNG);

    const jpg = imageFromOpenRouter({
      data: [{ b64_json: Buffer.from([0xff, 0xd8, 0xff, 0xd9]).toString("base64"), media_type: "image/jpeg" }],
    });
    assert.equal(jpg.ext, "jpg");

    const sniffed = imageFromOpenRouter({
      data: [{ b64_json: `data:image/png;base64,${PNG}` }],
    });
    assert.equal(sniffed.mediaType, "image/png");
    assert.equal(sniffed.b64, PNG);

    assert.equal(imageFromOpenRouter({ data: [] }), null);
    assert.equal(imageFromOpenRouter({ data: [{ b64_json: "no-es-base64" }] }), null);
  });

  it("traduce crédito, modelo inválido y no filtra la clave", () => {
    assert.match(mapUpstreamError(402, '{"error":{"message":"Insufficient credits"}}').error, /Sin crédito/);
    assert.match(
      mapUpstreamError(404, '{"error":{"message":"No endpoints found for foo/bar"}}').error,
      /Modelo inválido/
    );
    const leaked = mapUpstreamError(500, "falló sk-or-v1-supersecrettoken");
    assert.equal(/sk-or-/i.test(leaked.error), false);
  });
});
