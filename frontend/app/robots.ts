import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard/',
        '/admin/',
        '/onboarding/',
        '/equipos/*/admin',
        '/equipos/*/editar',
        '/mi-campo/',
        '/eventos/*/editar',
        '/api/',
      ],
    },
    sitemap: 'https://airnation.online/sitemap.xml',
    host: 'https://airnation.online',
  }
}
