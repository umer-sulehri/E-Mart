import type { CapacitorConfig } from '@capacitor/cli';

const prodUrl = 'https://e-mart-sand-pi.vercel.app';
const devUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.emart.app',
  appName: 'E-Mart',
  webDir: 'web',
  server: {
    url: devUrl || prodUrl,
    cleartext: !!devUrl && devUrl.startsWith('http://'),
  },
};

export default config;
