import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.danieldai.aiagent',
  appName: 'AI Agent',
  webDir: 'out',  // Points to Next.js static export output directory
  server: {
    androidScheme: 'http',  // Changed to http for development to allow cleartext API calls
  },
  plugins: {
    Electron: {
      appId: 'com.danieldai.aiagent',
      appName: 'AI Agent',
      description: 'AI Chatbot with OpenAI-Compatible API',
      version: '0.1.0',
      author: 'Daniel Dai',
      buildVersion: '1',
    },
  },
};

export default config;
