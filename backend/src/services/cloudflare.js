async function uploadToCloudflare(fileBuffer, filename, mimeType) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new Error("Faltan CLOUDFLARE_ACCOUNT_ID o CLOUDFLARE_API_TOKEN");
  }

  const form = new FormData();
  const blob = new Blob([fileBuffer], { type: mimeType });
  form.append("file", blob, filename);

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: form,
  });

  const result = await res.json();
  if (result.success === true) {
    return result.result.variants[0];
  }
  const message = result.errors?.[0]?.message || "Error al subir imagen a Cloudflare";
  throw new Error(message);
}

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadVideoToR2(fileBuffer, filename, mimeType) {
  const bucket = process.env.R2_BUCKET;
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (!bucket || !publicUrl) {
    throw new Error("Faltan R2_BUCKET o R2_PUBLIC_URL");
  }
  const key = `videos/${Date.now()}-${filename}`;
  await r2Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    })
  );
  return `${publicUrl}/${key}`;
}

module.exports = { uploadToCloudflare, uploadVideoToR2 };
