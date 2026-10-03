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
  it("deja el feed y cualquier otro contexto en 60 s, aunque el usuario sea admin", () => {
    assert.equal(VIDEO_MAX_DURATION_SEC, 60);
    assert.deepEqual(resolveVideoDurationLimit(undefined, false), { maxSec: 60 });
    assert.deepEqual(resolveVideoDurationLimit("", true), { maxSec: 60 });
    assert.deepEqual(resolveVideoDurationLimit("admin", true), { maxSec: 60 });
    assert.deepEqual(resolveVideoDurationLimit("true", true), { maxSec: 60 });
  });

  it("un usuario normal no puede pedir el tope de cápsulas", () => {
    const r = resolveVideoDurationLimit(CAPSULAS_VIDEO_CONTEXT, false);
    assert.equal(r.forbidden, true);
    assert.equal(r.maxSec, 60);
  });

  it("solo un admin con el contexto de cápsulas llega a 180 s", () => {
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
