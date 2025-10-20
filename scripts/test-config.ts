#!/usr/bin/env tsx

/**
 * Test script to verify memory service configuration
 * Loads configuration and prints summary
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually BEFORE importing config
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('✓ Loaded .env.local\n');
} catch (error) {
  console.warn('Could not load .env.local:', error);
}

// Dynamic import after env vars are set
(async () => {
  const { memoryConfig, printConfigSummary, getOpenAIConfig, getOpenAIModel } = await import('../lib/memory/config.js');

  console.log('Testing Memory Service Configuration');
  console.log('=====================================\n');

  try {
  // Print configuration summary
  printConfigSummary();

  console.log('\nOpenAI Configuration:');
  const openaiConfig = getOpenAIConfig();
  console.log('  Base URL:', openaiConfig.baseURL);
  console.log('  API Key:', openaiConfig.apiKey ? `${openaiConfig.apiKey.substring(0, 10)}...` : 'NOT SET');
  console.log('  Model:', getOpenAIModel());

  console.log('\n=====================================');
  console.log('✅ Configuration loaded successfully!');
  console.log('=====================================\n');

  // Validate critical settings
  if (!memoryConfig.enabled) {
    console.warn('⚠️  WARNING: Memory service is DISABLED (MEMORY_ENABLED=false)');
  }

  if (!openaiConfig.apiKey) {
    console.warn('⚠️  WARNING: OPENAI_API_KEY is not set');
  }

  if (memoryConfig.embedding.dimensions !== 1536 && memoryConfig.embedding.model === 'text-embedding-3-small') {
    console.warn('⚠️  WARNING: text-embedding-3-small uses 1536 dimensions, but configured for', memoryConfig.embedding.dimensions);
  }

  if (memoryConfig.behavior.similarityThreshold < 0.5) {
    console.warn('⚠️  WARNING: Low similarity threshold may return irrelevant memories');
  }

  if (memoryConfig.behavior.similarityThreshold > 0.9) {
    console.warn('⚠️  WARNING: High similarity threshold may miss relevant memories');
  }

  console.log('\nConfiguration test complete!\n');

  } catch (error) {
    console.error('❌ Configuration Error:', error);
    process.exit(1);
  }
})();
