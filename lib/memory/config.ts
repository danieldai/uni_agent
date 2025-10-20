/**
 * Memory Service Configuration
 *
 * Loads and validates configuration from environment variables.
 */

import { MemoryConfig } from './types';

/**
 * Load memory service configuration from environment variables
 * @returns Complete memory configuration object
 */
export function loadMemoryConfig(): MemoryConfig {
  return {
    enabled: process.env.MEMORY_ENABLED === 'true',

    openSearch: {
      node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
      username: process.env.OPENSEARCH_USERNAME || 'admin',
      password: process.env.OPENSEARCH_PASSWORD || 'admin',
      index: process.env.OPENSEARCH_INDEX || 'chatbot_memories',
    },

    embedding: {
      provider: (process.env.EMBEDDING_PROVIDER as 'openai' | 'cohere' | 'local') || 'openai',
      model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
      dimensions: parseInt(process.env.EMBEDDING_DIMENSIONS || '1536'),
    },

    behavior: {
      similarityThreshold: parseFloat(
        process.env.MEMORY_SIMILARITY_THRESHOLD || '0.7'
      ),
      retrievalLimit: parseInt(process.env.MEMORY_RETRIEVAL_LIMIT || '5'),
      extractionEnabled: process.env.MEMORY_EXTRACTION_ENABLED !== 'false',
    },

    database: {
      url: process.env.DATABASE_URL || 'file:./data/chatbot.db',
    },

    performance: {
      cacheTtl: parseInt(process.env.MEMORY_CACHE_TTL || '3600'),
      batchSize: parseInt(process.env.MEMORY_BATCH_SIZE || '10'),
    },
  };
}

/**
 * Validate memory configuration
 * @param config Memory configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateMemoryConfig(config: MemoryConfig): void {
  // Validate OpenSearch configuration
  if (!config.openSearch.node) {
    throw new Error('OPENSEARCH_NODE is required');
  }

  if (!config.openSearch.index) {
    throw new Error('OPENSEARCH_INDEX is required');
  }

  // Validate embedding configuration
  if (config.embedding.dimensions <= 0) {
    throw new Error('EMBEDDING_DIMENSIONS must be positive');
  }

  if (!['openai', 'cohere', 'local'].includes(config.embedding.provider)) {
    throw new Error('EMBEDDING_PROVIDER must be openai, cohere, or local');
  }

  // Validate behavior configuration
  if (config.behavior.similarityThreshold < 0 || config.behavior.similarityThreshold > 1) {
    throw new Error('MEMORY_SIMILARITY_THRESHOLD must be between 0 and 1');
  }

  if (config.behavior.retrievalLimit <= 0) {
    throw new Error('MEMORY_RETRIEVAL_LIMIT must be positive');
  }

  // Validate database configuration
  if (!config.database.url) {
    throw new Error('DATABASE_URL is required');
  }

  // Validate performance configuration
  if (config.performance.cacheTtl < 0) {
    throw new Error('MEMORY_CACHE_TTL must be non-negative');
  }

  if (config.performance.batchSize <= 0) {
    throw new Error('MEMORY_BATCH_SIZE must be positive');
  }
}

/**
 * Get environment-specific configuration with validation
 * @returns Validated memory configuration
 */
export function getMemoryConfig(): MemoryConfig {
  const config = loadMemoryConfig();

  // Only validate if memory service is enabled
  if (config.enabled) {
    validateMemoryConfig(config);
  }

  return config;
}

/**
 * Singleton instance of memory configuration
 * Loaded once at startup
 */
export const memoryConfig = getMemoryConfig();

/**
 * Check if memory service is enabled
 * @returns true if memory service is enabled
 */
export function isMemoryEnabled(): boolean {
  return memoryConfig.enabled;
}

/**
 * Get OpenAI configuration for embedding generation
 * @returns Object with apiKey and baseURL
 */
export function getOpenAIConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  };
}

/**
 * Get OpenAI model for LLM operations (fact extraction, action decisions)
 * @returns OpenAI model name
 */
export function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
}

/**
 * Print configuration summary (for debugging)
 * Masks sensitive information
 */
export function printConfigSummary(): void {
  console.log('Memory Service Configuration:');
  console.log('  Enabled:', memoryConfig.enabled);
  console.log('  OpenSearch Node:', memoryConfig.openSearch.node);
  console.log('  OpenSearch Index:', memoryConfig.openSearch.index);
  console.log('  Embedding Provider:', memoryConfig.embedding.provider);
  console.log('  Embedding Model:', memoryConfig.embedding.model);
  console.log('  Embedding Dimensions:', memoryConfig.embedding.dimensions);
  console.log('  Similarity Threshold:', memoryConfig.behavior.similarityThreshold);
  console.log('  Retrieval Limit:', memoryConfig.behavior.retrievalLimit);
  console.log('  Extraction Enabled:', memoryConfig.behavior.extractionEnabled);
  console.log('  Database URL:', memoryConfig.database.url.replace(/:.+@/, ':***@')); // Mask password
  console.log('  Cache TTL:', memoryConfig.performance.cacheTtl, 'seconds');
  console.log('  Batch Size:', memoryConfig.performance.batchSize);
}
