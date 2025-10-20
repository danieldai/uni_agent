/**
 * OpenAI Embedding Generator
 *
 * Generates embeddings using OpenAI's embedding API.
 */

import OpenAI from 'openai';
import { EmbeddingGenerator } from '../types';
import { getOpenAIConfig, memoryConfig } from '../config';

export class OpenAIEmbedding implements EmbeddingGenerator {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor() {
    const config = getOpenAIConfig();
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.model = memoryConfig.embedding.model;
    this.dimensions = memoryConfig.embedding.dimensions;
  }

  /**
   * Generate embedding for a single text
   * @param text Text to embed
   * @param action Optional action context (not used currently)
   * @returns Embedding vector
   */
  async embed(text: string, action?: 'add' | 'update' | 'search'): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }

      // Validate dimensions
      if (embedding.length !== this.dimensions) {
        console.warn(
          `Expected ${this.dimensions} dimensions, got ${embedding.length}. ` +
          `Check EMBEDDING_DIMENSIONS config.`
        );
      }

      return embedding;
    } catch (error) {
      console.error('Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts
   * @param texts Array of texts to embed
   * @returns Array of embedding vectors
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // OpenAI supports batch embedding
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Batch embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Get the dimensions of embeddings produced by this generator
   * @returns Number of dimensions
   */
  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Get the model name
   * @returns Model name
   */
  getModel(): string {
    return this.model;
  }
}
