/** @type {import('next').NextConfig} */
const nextConfig = {
  // API base URL — cambia en producción con variable de entorno
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
  },
};

module.exports = nextConfig;
