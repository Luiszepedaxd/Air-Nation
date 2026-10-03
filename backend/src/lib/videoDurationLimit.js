/** Tope del feed y del resto de POST /upload/video. */
const VIDEO_MAX_DURATION_SEC = 60;

/** Tope solo para cápsulas de /virus3, y solo si el caller es admin. */
const CAPSULAS_VIDEO_MAX_DURATION_SEC = 180;

/** Campo multipart `context`. Cualquier otro valor se queda en 60 s. */
const CAPSULAS_VIDEO_CONTEXT = "virus3_capsulas";

/**
 * @param {unknown} context
 * @param {boolean} isAdmin
 * @returns {{ maxSec: number, forbidden?: boolean }}
 */
function resolveVideoDurationLimit(context, isAdmin) {
  if (context !== CAPSULAS_VIDEO_CONTEXT) {
    return { maxSec: VIDEO_MAX_DURATION_SEC };
  }
  if (isAdmin !== true) {
    return { maxSec: VIDEO_MAX_DURATION_SEC, forbidden: true };
  }
  return { maxSec: CAPSULAS_VIDEO_MAX_DURATION_SEC };
}

function durationLimitMessage(maxSec) {
  const etiqueta = maxSec >= CAPSULAS_VIDEO_MAX_DURATION_SEC ? "3 minutos" : "1 minuto";
  return `El video no puede durar más de ${maxSec} segundos (${etiqueta}).`;
}

module.exports = {
  VIDEO_MAX_DURATION_SEC,
  CAPSULAS_VIDEO_MAX_DURATION_SEC,
  CAPSULAS_VIDEO_CONTEXT,
  resolveVideoDurationLimit,
  durationLimitMessage,
};
