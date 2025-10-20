/**
 * OpenSearch Vector Store Implementation
 *
 * Provides vector storage and k-NN search using OpenSearch.
 */

import { Client } from '@opensearch-project/opensearch';
import { VectorStore, SearchResult, Filter } from '../types';
import { memoryConfig } from '../config';

export class OpenSearchStore implements VectorStore {
  private client: Client;
  private index: string;

  constructor() {
    this.index = memoryConfig.openSearch.index;
    this.client = new Client({
      node: memoryConfig.openSearch.node,
      auth: {
        username: memoryConfig.openSearch.username,
        password: memoryConfig.openSearch.password,
      },
      ssl: {
        rejectUnauthorized: false, // For local development
      },
    });
  }

  /**
   * Insert vectors with IDs and payloads into OpenSearch
   * @param vectors Array of embedding vectors
   * @param ids Array of unique IDs for each vector
   * @param payloads Array of metadata/payload objects
   */
  async insert(vectors: number[][], ids: string[], payloads: any[]): Promise<void> {
    if (vectors.length !== ids.length || vectors.length !== payloads.length) {
      throw new Error('Vectors, IDs, and payloads must have the same length');
    }

    if (vectors.length === 0) {
      return; // Nothing to insert
    }

    const body = [];

    for (let i = 0; i < vectors.length; i++) {
      // Bulk API format: action line + document line
      body.push({ index: { _index: this.index, _id: ids[i] } });
      body.push({
        memory_vector: vectors[i],
        ...payloads[i],
      });
    }

    try {
      const response = await this.client.bulk({ body, refresh: true });

      if (response.body.errors) {
        const errors = response.body.items
          .filter((item: any) => item.index?.error)
          .map((item: any) => item.index.error);
        throw new Error(`Bulk insert failed: ${JSON.stringify(errors)}`);
      }
    } catch (error) {
      console.error('OpenSearch insert error:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors using k-NN
   * @param query Query vector
   * @param filters Filter criteria (e.g., user_id)
   * @param limit Maximum number of results
   * @returns Array of search results with scores
   */
  async search(
    query: number[],
    filters: Filter,
    limit: number
  ): Promise<SearchResult[]> {
    const mustClauses: any[] = [];

    // Add filters to the query
    if (filters.user_id) {
      mustClauses.push({
        term: { user_id: filters.user_id },
      });
    }

    if (filters.created_at) {
      mustClauses.push({
        range: { created_at: filters.created_at },
      });
    }

    try {
      const response = await this.client.search({
        index: this.index,
        body: {
          size: limit,
          query: {
            bool: {
              must: mustClauses.length > 0 ? mustClauses : undefined,
              filter: {
                knn: {
                  memory_vector: {
                    vector: query,
                    k: limit,
                  },
                },
              },
            },
          },
        },
      });

      return response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        payload: hit._source,
      }));
    } catch (error) {
      console.error('OpenSearch search error:', error);
      throw error;
    }
  }

  /**
   * Update a vector and its payload
   * @param id Document ID
   * @param vector New vector
   * @param payload New payload (will be merged with existing)
   */
  async update(id: string, vector: number[], payload: any): Promise<void> {
    try {
      await this.client.update({
        index: this.index,
        id,
        body: {
          doc: {
            memory_vector: vector,
            ...payload,
            updated_at: new Date().toISOString(),
          },
        },
        refresh: true,
      });
    } catch (error) {
      console.error('OpenSearch update error:', error);
      throw error;
    }
  }

  /**
   * Delete a document by ID
   * @param id Document ID to delete
   */
  async delete(id: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.index,
        id,
        refresh: true,
      });
    } catch (error) {
      console.error('OpenSearch delete error:', error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   * @param id Document ID
   * @returns Document with ID and source
   */
  async get(id: string): Promise<any> {
    try {
      const response = await this.client.get({
        index: this.index,
        id,
      });

      return {
        id: response.body._id,
        ...response.body._source,
      };
    } catch (error) {
      console.error('OpenSearch get error:', error);
      throw error;
    }
  }

  /**
   * Get all documents for a user
   * @param userId User ID to filter by
   * @param limit Maximum number of results
   * @returns Array of search results
   */
  async getAllByUserId(userId: string, limit = 100): Promise<SearchResult[]> {
    try {
      const response = await this.client.search({
        index: this.index,
        body: {
          size: limit,
          query: {
            term: { user_id: userId },
          },
          sort: [
            { created_at: { order: 'desc' } },
          ],
        },
      });

      return response.body.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: 1.0, // No scoring for direct retrieval
        payload: hit._source,
      }));
    } catch (error) {
      console.error('OpenSearch getAllByUserId error:', error);
      throw error;
    }
  }

  /**
   * Check if the index exists
   * @returns True if index exists
   */
  async indexExists(): Promise<boolean> {
    try {
      const response = await this.client.indices.exists({
        index: this.index,
      });
      return response.body === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Close the OpenSearch client connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }
}
