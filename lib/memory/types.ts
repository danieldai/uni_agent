/**
 * Memory Service Type Definitions
 */

// Message types for chat conversations
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

// Memory record structure
export interface Memory {
  id: string;
  memory: string;
  user_id: string;
  score?: number;
  created_at: string;
  updated_at?: string;
  hash: string;
  metadata?: Record<string, any>;
}

// Result from memory operations
export interface MemoryResult {
  results: MemoryAction[];
}

// Action taken on a memory
export interface MemoryAction {
  id: string;
  memory: string;
  event: 'ADD' | 'UPDATE' | 'DELETE' | 'NONE';
  old_memory?: string;
}

// History entry for audit trail
export interface HistoryEntry {
  id: string;
  memory_id: string;
  prev_value: string | null;
  new_value: string | null;
  event: 'ADD' | 'UPDATE' | 'DELETE';
  timestamp: string;
  user_id: string;
  metadata?: Record<string, any>;
}

// Search result from vector store
export interface SearchResult {
  id: string;
  score: number;
  payload: {
    data: string;
    user_id: string;
    created_at: string;
    updated_at?: string;
    hash: string;
    [key: string]: any;
  };
}

// Filter options for searching
export interface Filter {
  user_id?: string;
  created_at?: {
    gte?: string;
    lte?: string;
  };
  [key: string]: any;
}

// Extracted facts from conversation
export interface ExtractedFacts {
  facts: string[];
}

// LLM decision on memory actions
export interface MemoryDecision {
  memory: Array<{
    id: string;
    text: string;
    event: 'ADD' | 'UPDATE' | 'DELETE' | 'NONE';
    old_memory?: string;
  }>;
}

// Vector store interface
export interface VectorStore {
  insert(vectors: number[][], ids: string[], payloads: any[]): Promise<void>;
  search(query: number[], filters: Filter, limit: number): Promise<SearchResult[]>;
  update(id: string, vector: number[], payload: any): Promise<void>;
  delete(id: string): Promise<void>;
  get(id: string): Promise<any>;
}

// Embedding generator interface
export interface EmbeddingGenerator {
  embed(text: string, action?: 'add' | 'update' | 'search'): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// Memory service configuration
export interface MemoryConfig {
  enabled: boolean;
  openSearch: {
    node: string;
    username: string;
    password: string;
    index: string;
  };
  embedding: {
    provider: 'openai' | 'cohere' | 'local';
    model: string;
    dimensions: number;
  };
  behavior: {
    similarityThreshold: number;
    retrievalLimit: number;
    extractionEnabled: boolean;
  };
  database: {
    url: string;
  };
  performance: {
    cacheTtl: number;
    batchSize: number;
  };
}
