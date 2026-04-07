import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forexyemeni.pro',
  appName: 'ForexYemeni Pro',
  webDir: 'out',
  server: {
    url: 'https://forex-yemeni-pro.vercel.app',
    androidScheme: 'https'
  },
  plugins: {
    StatusBar: {
      backgroundColor: '#0a0e17',
      style: 'DARK',
    },
    PushNotifications: {
      presentationOptions: {
        badge: true,
        sound: true,
        alert: true,
      },
    },
  },
};

export default config;
