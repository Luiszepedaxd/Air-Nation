const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  REF_MAX_BYTES,
  REF_MAX_COUNT,
  validateFotoInput,
  toInputReferences,
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
    assert.match(
      mapUpstreamError(400, '{"error":{"message":"input_references is not supported"}}').error,
      /no acepta imágenes de referencia/
    );
  });

  it("arma input_references y rechaza formato, tope y cantidad", () => {
    const ok = validateFotoInput("ponlo en el mockup", "google/gemini-2.5-flash-image", [
      { b64: PNG },
    ]);
    assert.equal(ok.references.length, 1);
    assert.equal(ok.references[0].mediaType, "image/png");
    assert.deepEqual(toInputReferences(ok.references), [
      { type: "image_url", image_url: { url: `data:image/png;base64,${PNG}` } },
    ]);

    const gif = Buffer.from("GIF89a").toString("base64");
    assert.match(validateFotoInput("x", "a/b", [{ b64: gif }]).error, /JPG, PNG o WebP/);

    const over = Buffer.alloc(REF_MAX_BYTES + 1, 0xff).toString("base64");
    assert.match(validateFotoInput("x", "a/b", [{ b64: over }]).error, /8 MB/);

    const many = Array.from({ length: REF_MAX_COUNT + 1 }, () => ({ b64: PNG }));
    assert.match(validateFotoInput("x", "a/b", many).error, /6 imágenes/);
    assert.deepEqual(validateFotoInput("x", "a/b").references, []);
  });
});
