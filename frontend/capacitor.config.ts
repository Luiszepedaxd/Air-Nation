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
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFFFFF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
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
    Camera: {
      // Strings que Android muestra en el popup de permisos del SO.
      // iOS las tomará del Info.plist cuando se reactive el build iOS.
      androidPermissionRationaleTitle: 'Acceso a la cámara',
      androidPermissionRationaleMessage:
        'AirNation necesita acceso a tu cámara para tomar tu foto de credencial.',
      androidPermissionRationalePositiveButton: 'Permitir',
      androidPermissionRationaleNegativeButton: 'Cancelar',
    },
  },
};

export default config;
