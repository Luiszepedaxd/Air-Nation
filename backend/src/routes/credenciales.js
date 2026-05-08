const express = require("express");
const supabase = require("../lib/supabase");
const { requireAuth } = require("../middleware/requireAuth");
const { validateCredentialPhoto } = require("../services/credentialPhotoValidator");

const router = express.Router();

const MAX_BASE64_SIZE = 8 * 1024 * 1024; // ~6MB binario despues de decode
const VALID_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * POST /api/v1/credencial/validar-foto
 * Body: { image_base64: string (sin prefijo data:), mime_type: string }
 * Returns: { ok: bool, motivo: string, razon_codigo: string }
 */
router.post("/validar-foto", requireAuth, async (req, res) => {
  try {
    const { image_base64, mime_type } = req.body || {};

    if (!image_base64 || typeof image_base64 !== "string") {
      return res.status(400).json({ error: "image_base64 requerido" });
    }
    if (!mime_type || !VALID_MIME.has(mime_type)) {
      return res.status(400).json({ error: "mime_type invalido. Solo jpeg, png o webp" });
    }
    if (image_base64.length > MAX_BASE64_SIZE) {
      return res.status(413).json({ error: "Imagen demasiado grande" });
    }

    const result = await validateCredentialPhoto(image_base64, mime_type);
    return res.json(result);
  } catch (err) {
    console.error("[credencial/validar-foto]", err.message);
    return res.status(500).json({
      error: "No se pudo validar la foto. Intenta de nuevo.",
    });
  }
});

/**
 * DELETE /api/v1/credencial
 * Elimina la credencial del usuario autenticado:
 * - borra archivos del bucket credenciales/{user_id}/...
 * - limpia foto_credencial_url, credencial_nombre_completo, credencial_fecha_nacimiento
 */
router.delete("/", requireAuth, async (req, res) => {
  try {
    const userId = req.authUser.id;

    // 1. Listar archivos del usuario en el bucket
    const { data: files, error: listError } = await supabase
      .storage
      .from("credenciales")
      .list(userId, { limit: 100 });

    if (listError) {
      console.error("[credencial DELETE list]", listError.message);
    }

    // 2. Borrar archivos si existen
    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      const { error: removeError } = await supabase
        .storage
        .from("credenciales")
        .remove(paths);
      if (removeError) {
        console.error("[credencial DELETE remove]", removeError.message);
      }
    }

    // 3. Limpiar campos en users
    const { error: updateError } = await supabase
      .from("users")
      .update({
        foto_credencial_url: null,
        credencial_nombre_completo: null,
        credencial_fecha_nacimiento: null,
      })
      .eq("id", userId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[credencial DELETE]", err.message);
    return res.status(500).json({ error: "No se pudo eliminar la credencial" });
  }
});

module.exports = router;
