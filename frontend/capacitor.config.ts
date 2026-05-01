import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.atomikapps.airnation',
  appName: 'AirNation',
  webDir: 'out',

  // Modo producción: la app nativa carga el sitio web de producción.
  // Cualquier cambio en Vercel se refleja al instante en la app sin requerir
  // actualización en Play Store. Tradeoff: requiere conexión a internet.
  server: {
    url: 'https://www.airnation.online',
    cleartext: false,
    androidScheme: 'https',
  },

  // Suffix custom en User Agent. El middleware Next.js detecta 'AirNationApp'
  // para redirigir '/' sin sesión a '/welcome' (en lugar de mostrar la landing).
  // Capacitor por default ya añade su firma, pero este suffix lo hace robusto.
  android: {
    appendUserAgent: 'AirNationApp',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    appendUserAgent: 'AirNationApp',
    backgroundColor: '#FFFFFF',
  },
};

export default config;
