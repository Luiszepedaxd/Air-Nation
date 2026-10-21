const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const {
  VIDEO_MAX_DURATION_SEC,
  CAPSULAS_VIDEO_MAX_DURATION_SEC,
  CAPSULAS_VIDEO_CONTEXT,
  resolveVideoDurationLimit,
  durationLimitMessage,
} = require("./videoDurationLimit");

describe("resolveVideoDurationLimit", () => {
  it("el feed y cualquier otro contexto llegan a 180 s (3 minutos)", () => {
    assert.equal(VIDEO_MAX_DURATION_SEC, 180);
    assert.deepEqual(resolveVideoDurationLimit(undefined, false), { maxSec: 180 });
    assert.deepEqual(resolveVideoDurationLimit("", true), { maxSec: 180 });
    assert.deepEqual(resolveVideoDurationLimit("admin", true), { maxSec: 180 });
    assert.deepEqual(resolveVideoDurationLimit("true", true), { maxSec: 180 });
  });

  it("subir cápsulas sigue siendo solo de admin", () => {
    const r = resolveVideoDurationLimit(CAPSULAS_VIDEO_CONTEXT, false);
    assert.equal(r.forbidden, true);
  });

  it("un admin con el contexto de cápsulas usa el mismo tope", () => {
    assert.equal(CAPSULAS_VIDEO_MAX_DURATION_SEC, 180);
    assert.deepEqual(resolveVideoDurationLimit(CAPSULAS_VIDEO_CONTEXT, true), {
      maxSec: 180,
    });
  });

  it("el mensaje de error no dice 1 minuto cuando el tope es 3", () => {
    assert.match(durationLimitMessage(60), /60 segundos \(1 minuto\)/);
    assert.match(durationLimitMessage(180), /180 segundos \(3 minutos\)/);
  });
});
