/** @type {import('next').NextConfig} */
const nextConfig = {
  // API base URL — cambia en producción con variable de entorno
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'airnation.online' }],
        destination: 'https://www.airnation.online/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
