import type { CapacitorConfig } from '@capacitor/cli';

const prodUrl = 'https://e-mart-sand-pi.vercel.app';
const devUrl = process.env.CAP_SERVER_URL;

const config: CapacitorConfig = {
  appId: 'com.emart.app',
  appName: 'E-Mart',
  webDir: 'web',
  backgroundColor: '#ffffff',
  server: {
    url: devUrl || prodUrl,
    cleartext: !!devUrl && devUrl.startsWith('http://'),
    androidScheme: 'https',
    // Shown instead of the raw WebView "net::ERR_INTERNET_DISCONNECTED" page.
    errorPath: 'offline.html',
  },
  android: {
    // The storefront only talks to HTTPS origins (Supabase, Vercel, Stripe).
    allowMixedContent: false,
  },
};

export default config;
