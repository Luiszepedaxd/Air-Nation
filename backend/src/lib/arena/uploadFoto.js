/**
 * Subida de una foto a Cloudflare Images, igual para el dueño del campo y
 * para el admin de la landing: multer en memoria → `inspectImageUpload`
 * (la firma de los bytes manda, no el MIME que declara el teléfono) →
 * `uploadToCloudflare`. La autorización la pone cada ruta.
 */
const multer = require("multer");
const { inspectImageUpload } = require("../imageUpload");
const { uploadToCloudflare } = require("../../services/cloudflare");

const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const uploadFoto = multer({ storage: multer.memoryStorage(), limits: { fileSize: IMAGE_MAX_BYTES } });

/** Handler de Express: responde `{ url }` o un error ya formateado. */
function subirFoto(contexto) {
  return (req, res) => {
    uploadFoto.single("file")(req, res, async (multerError) => {
      if (multerError) {
        if (multerError instanceof multer.MulterError && multerError.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ error: "La foto pesa más de 10 MB. Elige una más liviana." });
        }
        return res.status(400).json({ error: multerError.message });
      }
      if (!req.file) return res.status(400).json({ error: "No se recibió ninguna foto" });

      const inspected = inspectImageUpload(req.file.buffer, req.file.mimetype, req.file.originalname);
      if (inspected.error) return res.status(400).json({ error: inspected.error });

      try {
        const url = await uploadToCloudflare(inspected.buffer, inspected.filename, inspected.mimetype);
        if (!url || typeof url !== "string") {
          return res.status(502).json({ error: "No se pudo guardar la foto." });
        }
        return res.json({ url });
      } catch (e) {
        console.error(`[${contexto}] upload:`, e.message);
        return res.status(500).json({ error: "No se pudo guardar la foto." });
      }
    });
  };
}

module.exports = { subirFoto, IMAGE_MAX_BYTES };
