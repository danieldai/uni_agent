import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danieldai.aiagent',
  appName: 'AI Agent',
  webDir: '../out',  // Points to Next.js static export output directory in parent folder
  server: {
    androidScheme: 'http',  // Changed to http for development to allow cleartext API calls
  },
};

export default config;
