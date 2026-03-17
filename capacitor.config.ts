import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.kadromierz.hvln',
  appName: 'Effixy',
  webDir: 'out',
  server: {
    url: 'https://app.effixy.pl',
    cleartext: true
  }
};

export default config;
