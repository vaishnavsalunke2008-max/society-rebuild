import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vaishnav.societyhub',
  appName: 'SocietyHub',
  webDir: 'out',
  plugins: {
    Keyboard: {
      resize: 'none',
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#0f172a",
    },
    StatusBar: {
      overlaysWebView: true,
      style: 'DARK'
    }
  }
};

export default config;
