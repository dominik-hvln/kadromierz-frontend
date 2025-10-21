import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'pl.kadromierz.hvln',
  appName: 'Ewidencja Czasu Pracy',
    webDir: 'out',
    server: {
        url: 'https://kadromierz.vercel.app',
        cleartext: true
    }
};

export default config;
