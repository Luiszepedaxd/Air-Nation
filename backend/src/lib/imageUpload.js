/**
 * Clasifica el body de POST /upload antes de mandarlo a Cloudflare Images.
 * El MIME que declara el teléfono no es confiable (HEIC suele llegar vacío
 * o como image/jpeg). Los bytes mandan.
 *
 * ponytail: no hay libheif en este proceso, así que HEIC no se convierte aquí.
 * El cliente (WebKit) lo pasa a JPEG. Upgrade: sharp/libheif si Chrome de
 * escritorio tiene que subir HEIC crudo.
 */

const HEIC_BRANDS = new Set([
  "heic",
  "heix",
  "heif",
  "heim",
  "hevc",
  "mif1",
  "msf1",
]);

function sniffImageKind(buffer) {
  if (!buffer || buffer.length < 3) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "webp";
  }
  if (
    buffer.length >= 12 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    const brand = buffer.slice(8, 12).toString("ascii").toLowerCase();
    if (HEIC_BRANDS.has(brand)) return "heic";
  }
  return null;
}

const MIME = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const EXT = { jpeg: "jpg", png: "png", webp: "webp" };

/**
 * @returns {{ buffer: Buffer, mimetype: string, filename: string } | { error: string }}
 */
function inspectImageUpload(buffer, mimetype, filename) {
  if (!buffer || !buffer.length) {
    return { error: "No se recibió ninguna imagen." };
  }
  // mimetype se ignora a propósito: el teléfono miente. La firma manda.
  void mimetype;
  const kind = sniffImageKind(buffer);
  if (kind === "heic") {
    return {
      error:
        "No pudimos usar esta foto HEIC. Vuelve a elegirla (en el iPhone se convierte a JPG) o expórtala como JPG.",
    };
  }
  if (kind !== "jpeg" && kind !== "png" && kind !== "webp") {
    return { error: "Ese formato no se puede usar. Elige JPG, PNG o WebP." };
  }
  const baseName = String(filename || "replica").replace(/\.[^.]+$/, "") || "replica";
  return {
    buffer,
    mimetype: MIME[kind],
    filename: `${baseName}.${EXT[kind]}`,
  };
}

module.exports = {
  inspectImageUpload,
  sniffImageKind,
};
