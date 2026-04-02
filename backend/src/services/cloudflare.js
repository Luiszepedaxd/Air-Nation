const FormData = require("form-data");

/**
 * Sube un buffer a Cloudflare Images y devuelve la URL de la primera variante.
 * @param {Buffer} fileBuffer
 * @param {string} filename
 * @param {string} mimeType
 * @returns {Promise<string>}
 */
async function uploadToCloudflare(fileBuffer, filename, mimeType) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN");
  }

  const form = new FormData();
  form.append("file", fileBuffer, { filename, contentType: mimeType });

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      ...form.getHeaders(),
    },
    body: form,
  });

  const result = await res.json();
  if (result.success === true) {
    return result.result.variants[0];
  }
  const message =
    result.errors?.[0]?.message || "Error al subir la imagen a Cloudflare";
  throw new Error(message);
}

module.exports = { uploadToCloudflare };
