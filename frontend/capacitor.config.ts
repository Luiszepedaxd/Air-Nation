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
  android: {
    appendUserAgent: 'AirNationApp',
    backgroundColor: '#FFFFFF',
  },
  ios: {
    appendUserAgent: 'AirNationApp',
    backgroundColor: '#FFFFFF',
  },

  plugins: {
    SplashScreen: {
      // Tiempo máximo del splash en milisegundos. Si la web carga antes,
      // el splash se oculta antes (controlado desde JS).
      launchShowDuration: 2000,
      // No esperar a que JS llame manualmente a hide() — auto-hide al cargar.
      launchAutoHide: true,
      // Fondo blanco alineado con design system AirNation.
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      // Sin spinner — el splash es una pausa, no una pantalla de carga.
      showSpinner: false,
      // No transición fade — corte limpio a la app.
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      // Barra superior alineada con fondo blanco de la app.
      // 'DARK' = texto oscuro sobre fondo claro (correcto para fondo blanco).
      style: 'DARK',
      backgroundColor: '#FFFFFF',
      overlaysWebView: false,
    },
  },
};

export default config;
