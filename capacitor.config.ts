import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danieldai.aiagent',
  appName: 'AI Agent',
  webDir: 'out',  // Points to Next.js static export output directory
  server: {
    androidScheme: 'https',
  },
};

export default config;
