import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.netizen.psxdashboard',
  appName: 'PSX Dashboard',
  webDir: 'out',
  server: {
    url: 'https://psx-dashboard-iota.vercel.app',
    cleartext: true
  }
};

export default config;
