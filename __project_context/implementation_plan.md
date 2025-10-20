# Memory Service Implementation Plan

## Project Overview

This implementation plan details the step-by-step process for building an intelligent memory layer for the AI chatbot, based on the comprehensive design in [agent_memory.md](./agent_memory.md).

**Estimated Timeline:** 4 weeks (can be adjusted based on team size and complexity)

**Tech Stack:**
- Next.js 15 + TypeScript
- OpenSearch for vector storage
- PostgreSQL/SQLite for history tracking
- OpenAI API for embeddings and LLM operations

---

## Phase 1: Foundation & Infrastructure (Week 1)

### Goal
Set up all foundational components, data stores, and basic scaffolding for the memory service.

### Prerequisites Checklist

- [ ] Node.js 20+ installed
- [ ] Docker installed (for OpenSearch)
- [ ] PostgreSQL installed OR SQLite configured
- [ ] OpenAI API key with embedding access
- [ ] Git repository set up

---

### Task 1.1: OpenSearch Setup (Day 1)

**Objective:** Install and configure OpenSearch with k-NN plugin enabled

#### Steps:

1. **Start OpenSearch with Docker**
   ```bash
   docker pull opensearchproject/opensearch:latest

   docker run -d \
     -p 9200:9200 \
     -p 9600:9600 \
     -e "discovery.type=single-node" \
     -e "OPENSEARCH_INITIAL_ADMIN_PASSWORD=YourStrongPassword123!" \
     -e "plugins.security.disabled=true" \
     --name opensearch-memory \
     opensearchproject/opensearch:latest
   ```

2. **Verify OpenSearch is running**
   ```bash
   curl -X GET "localhost:9200/_cluster/health?pretty"
   ```

3. **Create vector index with k-NN mappings**

   Create a script: `scripts/create-opensearch-index.sh`
   ```bash
   #!/bin/bash

   curl -X PUT "localhost:9200/chatbot_memories" \
     -H 'Content-Type: application/json' \
     -d '{
       "settings": {
         "index": {
           "knn": true,
           "knn.algo_param.ef_search": 100,
           "number_of_shards": 1,
           "number_of_replicas": 0
         }
       },
       "mappings": {
         "properties": {
           "memory_vector": {
             "type": "knn_vector",
             "dimension": 1536,
             "method": {
               "name": "hnsw",
               "space_type": "cosinesimil",
               "engine": "nmslib",
               "parameters": {
                 "ef_construction": 128,
                 "m": 16
               }
             }
           },
           "user_id": {
             "type": "keyword"
           },
           "data": {
             "type": "text",
             "analyzer": "standard"
           },
           "hash": {
             "type": "keyword"
           },
           "created_at": {
             "type": "date"
           },
           "updated_at": {
             "type": "date"
           },
           "metadata": {
             "type": "object",
             "enabled": true
           }
         }
       }
     }'
   ```

4. **Test vector insertion**
   ```bash
   curl -X POST "localhost:9200/chatbot_memories/_doc/test1" \
     -H 'Content-Type: application/json' \
     -d '{
       "memory_vector": [0.1, 0.2, ..., 0.5],
       "user_id": "test_user",
       "data": "Test memory",
       "hash": "abc123",
       "created_at": "2025-01-20T00:00:00Z"
     }'
   ```

**Deliverables:**
- [ ] OpenSearch running on localhost:9200
- [ ] `chatbot_memories` index created with k-NN enabled
- [ ] Script `scripts/create-opensearch-index.sh` committed
- [ ] Documentation in `docs/opensearch-setup.md`

---

### Task 1.2: Database Setup (Day 1)

**Objective:** Create database schema for history tracking

#### Option A: PostgreSQL

1. **Create database**
   ```bash
   createdb chatbot_memory
   ```

2. **Create schema migration**

   Create file: `db/migrations/001_create_memory_tables.sql`
   ```sql
   -- Users table (optional - for future user management)
   CREATE TABLE IF NOT EXISTS users (
     id TEXT PRIMARY KEY,
     email TEXT UNIQUE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     metadata JSONB
   );

   -- Memory history
   CREATE TABLE IF NOT EXISTS memory_history (
     id TEXT PRIMARY KEY,
     memory_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     prev_value TEXT,
     new_value TEXT,
     event TEXT NOT NULL CHECK (event IN ('ADD', 'UPDATE', 'DELETE')),
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updated_at TIMESTAMP,
     metadata JSONB,
     is_deleted INTEGER DEFAULT 0
   );

   CREATE INDEX IF NOT EXISTS idx_memory_history_memory_id
     ON memory_history(memory_id);
   CREATE INDEX IF NOT EXISTS idx_memory_history_user_id
     ON memory_history(user_id);
   CREATE INDEX IF NOT EXISTS idx_memory_history_created_at
     ON memory_history(created_at DESC);

   -- Session tracking (optional)
   CREATE TABLE IF NOT EXISTS chat_sessions (
     id TEXT PRIMARY KEY,
     user_id TEXT NOT NULL,
     started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     ended_at TIMESTAMP,
     message_count INTEGER DEFAULT 0,
     metadata JSONB
   );

   CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
     ON chat_sessions(user_id);
   ```

3. **Run migration**
   ```bash
   psql chatbot_memory < db/migrations/001_create_memory_tables.sql
   ```

#### Option B: SQLite

1. **Create schema script**

   Create file: `db/migrations/001_create_memory_tables.sql` (same as above but without JSONB)
   ```sql
   -- Same as PostgreSQL but replace JSONB with TEXT
   ```

2. **Create database file**
   ```bash
   mkdir -p data
   sqlite3 data/chatbot.db < db/migrations/001_create_memory_tables.sql
   ```

**Deliverables:**
- [ ] Database created and accessible
- [ ] Migration script in `db/migrations/`
- [ ] All tables and indexes created
- [ ] Test connection successful

---

### Task 1.3: Project Structure & Dependencies (Day 2)

**Objective:** Set up TypeScript project structure and install dependencies

#### Steps:

1. **Install dependencies**
   ```bash
   npm install --save \
     @opensearch-project/opensearch \
     pg \
     uuid \
     crypto-js

   npm install --save-dev \
     @types/pg \
     @types/uuid \
     @types/crypto-js
   ```

2. **Create directory structure**
   ```bash
   mkdir -p lib/memory/{stores,embeddings,utils}
   mkdir -p app/api/memory/{add,search,history}
   mkdir -p db/migrations
   mkdir -p scripts
   mkdir -p docs
   ```

3. **Create base type definitions**

   Create file: `lib/memory/types.ts`
   ```typescript
   export interface Message {
     id: string;
     role: 'user' | 'assistant' | 'system';
     content: string;
     timestamp: number;
   }

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

   export interface MemoryResult {
     results: MemoryAction[];
   }

   export interface MemoryAction {
     id: string;
     memory: string;
     event: 'ADD' | 'UPDATE' | 'DELETE' | 'NONE';
     old_memory?: string;
   }

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

   export interface Filter {
     user_id?: string;
     created_at?: {
       gte?: string;
       lte?: string;
     };
     [key: string]: any;
   }

   export interface ExtractedFacts {
     facts: string[];
   }

   export interface MemoryDecision {
     memory: Array<{
       id: string;
       text: string;
       event: 'ADD' | 'UPDATE' | 'DELETE' | 'NONE';
       old_memory?: string;
     }>;
   }

   export interface VectorStore {
     insert(vectors: number[][], ids: string[], payloads: any[]): Promise<void>;
     search(query: number[], filters: Filter, limit: number): Promise<SearchResult[]>;
     update(id: string, vector: number[], payload: any): Promise<void>;
     delete(id: string): Promise<void>;
     get(id: string): Promise<any>;
   }

   export interface EmbeddingGenerator {
     embed(text: string, action?: 'add' | 'update' | 'search'): Promise<number[]>;
     embedBatch(texts: string[]): Promise<number[][]>;
   }

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
   ```

**Deliverables:**
- [ ] All npm dependencies installed
- [ ] Directory structure created
- [ ] `lib/memory/types.ts` created
- [ ] TypeScript compiles without errors

---

### Task 1.4: Configuration System (Day 2)

**Objective:** Create configuration loader and environment setup

#### Steps:

1. **Create configuration loader**

   Create file: `lib/memory/config.ts`
   ```typescript
   import { MemoryConfig } from './types';

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
         provider: (process.env.EMBEDDING_PROVIDER as any) || 'openai',
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
         url: process.env.DATABASE_URL || 'postgresql://localhost/chatbot_memory',
       },
       performance: {
         cacheTtl: parseInt(process.env.MEMORY_CACHE_TTL || '3600'),
         batchSize: parseInt(process.env.MEMORY_BATCH_SIZE || '10'),
       },
     };
   }

   export const memoryConfig = loadMemoryConfig();
   ```

2. **Update .env.local**
   ```env
   # Existing OpenAI config
   OPENAI_BASE_URL=https://api.openai.com/v1
   OPENAI_API_KEY=sk-your-key
   OPENAI_MODEL=gpt-3.5-turbo

   # Memory Service Configuration
   MEMORY_ENABLED=true

   # OpenSearch Configuration
   OPENSEARCH_NODE=http://localhost:9200
   OPENSEARCH_USERNAME=admin
   OPENSEARCH_PASSWORD=YourStrongPassword123!
   OPENSEARCH_INDEX=chatbot_memories

   # Embedding Configuration
   EMBEDDING_PROVIDER=openai
   EMBEDDING_MODEL=text-embedding-3-small
   EMBEDDING_DIMENSIONS=1536

   # Memory Behavior
   MEMORY_SIMILARITY_THRESHOLD=0.7
   MEMORY_RETRIEVAL_LIMIT=5
   MEMORY_EXTRACTION_ENABLED=true

   # Database Configuration
   DATABASE_URL=postgresql://localhost/chatbot_memory
   # Or for SQLite:
   # DATABASE_URL=file:./data/chatbot.db

   # Performance
   MEMORY_CACHE_TTL=3600
   MEMORY_BATCH_SIZE=10
   ```

3. **Create .env.example**
   ```bash
   cp .env.local .env.example
   # Replace actual values with placeholders
   ```

**Deliverables:**
- [ ] `lib/memory/config.ts` created
- [ ] `.env.local` updated with all variables
- [ ] `.env.example` created for documentation
- [ ] Configuration loads without errors

---

### Task 1.5: OpenSearch Vector Store Implementation (Day 3)

**Objective:** Implement OpenSearch vector store interface

#### Steps:

1. **Create OpenSearch store**

   Create file: `lib/memory/stores/OpenSearchStore.ts`
   ```typescript
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

     async insert(vectors: number[][], ids: string[], payloads: any[]): Promise<void> {
       const body = [];

       for (let i = 0; i < vectors.length; i++) {
         body.push({ index: { _index: this.index, _id: ids[i] } });
         body.push({
           memory_vector: vectors[i],
           ...payloads[i],
         });
       }

       await this.client.bulk({ body });
     }

     async search(
       query: number[],
       filters: Filter,
       limit: number
     ): Promise<SearchResult[]> {
       const mustClauses: any[] = [];

       // Add filters
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

       const response = await this.client.search({
         index: this.index,
         body: {
           size: limit,
           query: {
             bool: {
               must: mustClauses,
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
     }

     async update(id: string, vector: number[], payload: any): Promise<void> {
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
       });
     }

     async delete(id: string): Promise<void> {
       await this.client.delete({
         index: this.index,
         id,
       });
     }

     async get(id: string): Promise<any> {
       const response = await this.client.get({
         index: this.index,
         id,
       });

       return {
         id: response.body._id,
         ...response.body._source,
       };
     }
   }
   ```

2. **Create test script**

   Create file: `scripts/test-opensearch.ts`
   ```typescript
   import { OpenSearchStore } from '../lib/memory/stores/OpenSearchStore';

   async function testOpenSearch() {
     const store = new OpenSearchStore();

     // Test insert
     console.log('Testing insert...');
     const testVector = Array(1536).fill(0.1);
     await store.insert(
       [testVector],
       ['test_memory_1'],
       [{
         user_id: 'test_user',
         data: 'This is a test memory',
         hash: 'abc123',
         created_at: new Date().toISOString(),
       }]
     );
     console.log('✓ Insert successful');

     // Test search
     console.log('Testing search...');
     const results = await store.search(
       testVector,
       { user_id: 'test_user' },
       5
     );
     console.log('✓ Search successful:', results);

     // Test get
     console.log('Testing get...');
     const memory = await store.get('test_memory_1');
     console.log('✓ Get successful:', memory);

     // Test delete
     console.log('Testing delete...');
     await store.delete('test_memory_1');
     console.log('✓ Delete successful');
   }

   testOpenSearch().catch(console.error);
   ```

3. **Run tests**
   ```bash
   npx tsx scripts/test-opensearch.ts
   ```

**Deliverables:**
- [ ] `lib/memory/stores/OpenSearchStore.ts` implemented
- [ ] All CRUD operations working
- [ ] Vector search returning results
- [ ] Tests passing

---

### Task 1.6: History Store Implementation (Day 3)

**Objective:** Implement PostgreSQL/SQLite history tracking

#### Steps:

1. **Create history store**

   Create file: `lib/memory/stores/HistoryStore.ts`
   ```typescript
   import { Pool } from 'pg';
   import { v4 as uuidv4 } from 'uuid';
   import { HistoryEntry } from '../types';
   import { memoryConfig } from '../config';

   export class HistoryStore {
     private pool: Pool;

     constructor() {
       this.pool = new Pool({
         connectionString: memoryConfig.database.url,
       });
     }

     async add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<string> {
       const id = uuidv4();
       const query = `
         INSERT INTO memory_history
         (id, memory_id, user_id, prev_value, new_value, event, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id
       `;

       const result = await this.pool.query(query, [
         id,
         entry.memory_id,
         entry.user_id,
         entry.prev_value,
         entry.new_value,
         entry.event,
         JSON.stringify(entry.metadata || {}),
       ]);

       return result.rows[0].id;
     }

     async getByMemoryId(memoryId: string): Promise<HistoryEntry[]> {
       const query = `
         SELECT
           id, memory_id, user_id, prev_value, new_value,
           event, created_at as timestamp, metadata
         FROM memory_history
         WHERE memory_id = $1
         ORDER BY created_at DESC
       `;

       const result = await this.pool.query(query, [memoryId]);

       return result.rows.map(row => ({
         ...row,
         metadata: typeof row.metadata === 'string'
           ? JSON.parse(row.metadata)
           : row.metadata,
       }));
     }

     async getByUserId(userId: string, limit = 100): Promise<HistoryEntry[]> {
       const query = `
         SELECT
           id, memory_id, user_id, prev_value, new_value,
           event, created_at as timestamp, metadata
         FROM memory_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2
       `;

       const result = await this.pool.query(query, [userId, limit]);

       return result.rows.map(row => ({
         ...row,
         metadata: typeof row.metadata === 'string'
           ? JSON.parse(row.metadata)
           : row.metadata,
       }));
     }

     async close(): Promise<void> {
       await this.pool.end();
     }
   }
   ```

2. **Create test script**

   Create file: `scripts/test-history-store.ts`
   ```typescript
   import { HistoryStore } from '../lib/memory/stores/HistoryStore';

   async function testHistoryStore() {
     const store = new HistoryStore();

     // Test add
     console.log('Testing add...');
     const id = await store.add({
       memory_id: 'mem_123',
       user_id: 'user_test',
       prev_value: null,
       new_value: 'Test memory',
       event: 'ADD',
       metadata: { source: 'test' },
     });
     console.log('✓ Add successful, ID:', id);

     // Test getByMemoryId
     console.log('Testing getByMemoryId...');
     const history = await store.getByMemoryId('mem_123');
     console.log('✓ Get by memory ID successful:', history);

     // Test getByUserId
     console.log('Testing getByUserId...');
     const userHistory = await store.getByUserId('user_test');
     console.log('✓ Get by user ID successful:', userHistory);

     await store.close();
   }

   testHistoryStore().catch(console.error);
   ```

3. **Run tests**
   ```bash
   npx tsx scripts/test-history-store.ts
   ```

**Deliverables:**
- [ ] `lib/memory/stores/HistoryStore.ts` implemented
- [ ] All database operations working
- [ ] Tests passing
- [ ] Connection pooling configured

---

### Task 1.7: Embedding Generator Implementation (Day 4)

**Objective:** Implement OpenAI embedding generator with caching

#### Steps:

1. **Create embedding generator**

   Create file: `lib/memory/embeddings/OpenAIEmbedding.ts`
   ```typescript
   import OpenAI from 'openai';
   import { EmbeddingGenerator } from '../types';
   import { memoryConfig } from '../config';

   export class OpenAIEmbeddingGenerator implements EmbeddingGenerator {
     private client: OpenAI;
     private model: string;
     private cache: Map<string, number[]>;
     private cacheTtl: number;
     private cacheTimestamps: Map<string, number>;

     constructor() {
       this.client = new OpenAI({
         apiKey: process.env.OPENAI_API_KEY,
         baseURL: process.env.OPENAI_BASE_URL,
       });
       this.model = memoryConfig.embedding.model;
       this.cache = new Map();
       this.cacheTimestamps = new Map();
       this.cacheTtl = memoryConfig.performance.cacheTtl * 1000; // Convert to ms
     }

     async embed(text: string, action?: 'add' | 'update' | 'search'): Promise<number[]> {
       // Check cache
       const cached = this.getFromCache(text);
       if (cached) {
         return cached;
       }

       // Generate embedding
       const response = await this.client.embeddings.create({
         model: this.model,
         input: text,
       });

       const embedding = response.data[0].embedding;

       // Store in cache
       this.setCache(text, embedding);

       return embedding;
     }

     async embedBatch(texts: string[]): Promise<number[][]> {
       const uncachedTexts: string[] = [];
       const uncachedIndices: number[] = [];
       const results: number[][] = new Array(texts.length);

       // Check cache for each text
       texts.forEach((text, index) => {
         const cached = this.getFromCache(text);
         if (cached) {
           results[index] = cached;
         } else {
           uncachedTexts.push(text);
           uncachedIndices.push(index);
         }
       });

       // Generate embeddings for uncached texts
       if (uncachedTexts.length > 0) {
         const response = await this.client.embeddings.create({
           model: this.model,
           input: uncachedTexts,
         });

         response.data.forEach((item, i) => {
           const embedding = item.embedding;
           const originalIndex = uncachedIndices[i];
           results[originalIndex] = embedding;
           this.setCache(uncachedTexts[i], embedding);
         });
       }

       return results;
     }

     private getFromCache(text: string): number[] | null {
       const cached = this.cache.get(text);
       if (!cached) return null;

       const timestamp = this.cacheTimestamps.get(text);
       if (!timestamp) return null;

       // Check if cache is expired
       if (Date.now() - timestamp > this.cacheTtl) {
         this.cache.delete(text);
         this.cacheTimestamps.delete(text);
         return null;
       }

       return cached;
     }

     private setCache(text: string, embedding: number[]): void {
       this.cache.set(text, embedding);
       this.cacheTimestamps.set(text, Date.now());

       // Limit cache size (LRU-like behavior)
       if (this.cache.size > 1000) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
         this.cacheTimestamps.delete(firstKey);
       }
     }

     clearCache(): void {
       this.cache.clear();
       this.cacheTimestamps.clear();
     }
   }
   ```

2. **Create test script**

   Create file: `scripts/test-embeddings.ts`
   ```typescript
   import { OpenAIEmbeddingGenerator } from '../lib/memory/embeddings/OpenAIEmbedding';

   async function testEmbeddings() {
     const generator = new OpenAIEmbeddingGenerator();

     // Test single embedding
     console.log('Testing single embedding...');
     const embedding1 = await generator.embed('Hello world');
     console.log('✓ Embedding generated, dimensions:', embedding1.length);

     // Test cache
     console.log('Testing cache...');
     const start = Date.now();
     const embedding2 = await generator.embed('Hello world');
     const duration = Date.now() - start;
     console.log('✓ Cache working (took', duration, 'ms)');

     // Test batch
     console.log('Testing batch embeddings...');
     const texts = [
       'My name is Alice',
       'I love pizza',
       'I work as a developer',
     ];
     const embeddings = await generator.embedBatch(texts);
     console.log('✓ Batch embeddings generated:', embeddings.length);

     generator.clearCache();
     console.log('✓ Cache cleared');
   }

   testEmbeddings().catch(console.error);
   ```

3. **Run tests**
   ```bash
   npx tsx scripts/test-embeddings.ts
   ```

**Deliverables:**
- [ ] `lib/memory/embeddings/OpenAIEmbedding.ts` implemented
- [ ] Single embedding working
- [ ] Batch embedding working
- [ ] Caching functional
- [ ] Tests passing

---

### Phase 1 Completion Checklist

At the end of Week 1, verify:

- [ ] OpenSearch running and accessible
- [ ] Database schema created
- [ ] All base TypeScript types defined
- [ ] Configuration system working
- [ ] OpenSearchStore implemented and tested
- [ ] HistoryStore implemented and tested
- [ ] EmbeddingGenerator implemented and tested
- [ ] All dependencies installed
- [ ] Environment variables configured
- [ ] Documentation updated

**Deliverables Document:** Create `docs/phase1-completion.md` summarizing what was built and how to test it.

---

## Phase 2: Memory Extraction Pipeline (Week 2)

### Goal
Implement LLM-powered memory extraction with fact identification and action decisions.

---

### Task 2.1: Prompt Templates (Day 5)

**Objective:** Create LLM prompts for fact extraction and memory decisions

#### Steps:

1. **Create prompts file**

   Create file: `lib/memory/prompts.ts`
   ```typescript
   export const MEMORY_EXTRACTION_PROMPT = `You are a memory extraction system. Your task is to extract important facts about the user from the conversation.

Extract key facts such as:
- User's name, location, job, hobbies
- Preferences (food, music, activities, etc.)
- Important life events or dates
- Relationships and connections
- Goals and aspirations
- Technical skills or expertise

Rules:
1. Extract only factual information explicitly stated by the user
2. Each fact should be concise (1-2 sentences max)
3. Do NOT infer or assume information not directly stated
4. Focus on information that would be useful for personalizing future conversations
5. Return facts as a JSON array

Conversation:
{conversation}

Extract facts as JSON:
{
  "facts": [
    "fact 1",
    "fact 2",
    ...
  ]
}`;

   export const MEMORY_UPDATE_PROMPT = `You are a memory update system. Your task is to decide what action to take for each new fact given existing similar memories.

Actions:
- ADD: Create a new memory (fact is unique)
- UPDATE: Update an existing memory (fact provides newer/better information)
- DELETE: Remove an existing memory (fact contradicts it)
- NONE: Do nothing (fact is already captured)

Rules:
1. Prefer UPDATE over ADD when information is related
2. Use DELETE only when there's a clear contradiction
3. Use NONE for redundant information
4. Each memory should have a unique ID

New Facts:
{facts}

Existing Similar Memories (with IDs):
{existing_memories}

For each fact, decide an action and return as JSON:
{
  "memory": [
    {
      "id": "existing-id-or-new-uuid",
      "text": "the memory text",
      "event": "ADD|UPDATE|DELETE|NONE",
      "old_memory": "text of old memory (only for UPDATE)"
    }
  ]
}`;

   export function buildExtractionPrompt(conversation: string): string {
     return MEMORY_EXTRACTION_PROMPT.replace('{conversation}', conversation);
   }

   export function buildUpdatePrompt(
     facts: string[],
     existingMemories: Array<{ id: string; text: string; score: number }>
   ): string {
     const factsText = facts.map((f, i) => `${i + 1}. ${f}`).join('\n');
     const memoriesText = existingMemories.length > 0
       ? existingMemories.map(m => `- [ID: ${m.id}] ${m.text} (similarity: ${m.score.toFixed(2)})`).join('\n')
       : 'No existing memories found';

     return MEMORY_UPDATE_PROMPT
       .replace('{facts}', factsText)
       .replace('{existing_memories}', memoriesText);
   }
   ```

2. **Test prompts manually**
   - Use OpenAI Playground to test prompts
   - Refine based on output quality
   - Document examples in `docs/prompt-examples.md`

**Deliverables:**
- [ ] `lib/memory/prompts.ts` created
- [ ] Extraction prompt tested and refined
- [ ] Update prompt tested and refined
- [ ] Example outputs documented

---

### Task 2.2: Message Parser (Day 5)

**Objective:** Convert chat messages to LLM-friendly format

#### Steps:

1. **Create parser utility**

   Create file: `lib/memory/utils/messageParser.ts`
   ```typescript
   import { Message } from '../types';

   export function parseMessagesToText(messages: Message[]): string {
     return messages
       .map(msg => {
         const role = msg.role === 'user' ? 'User' : 'Assistant';
         return `${role}: ${msg.content}`;
       })
       .join('\n\n');
   }

   export function extractUserMessages(messages: Message[]): Message[] {
     return messages.filter(msg => msg.role === 'user');
   }

   export function getLastNMessages(messages: Message[], n: number): Message[] {
     return messages.slice(-n);
   }

   export function filterRelevantMessages(messages: Message[]): Message[] {
     // Filter out system messages and focus on user-assistant exchanges
     return messages.filter(msg =>
       msg.role === 'user' || msg.role === 'assistant'
     );
   }
   ```

2. **Create test**

   Create file: `scripts/test-message-parser.ts`
   ```typescript
   import { parseMessagesToText } from '../lib/memory/utils/messageParser';

   const testMessages = [
     {
       id: '1',
       role: 'user' as const,
       content: 'My name is Alice',
       timestamp: Date.now(),
     },
     {
       id: '2',
       role: 'assistant' as const,
       content: 'Nice to meet you, Alice!',
       timestamp: Date.now(),
     },
   ];

   console.log(parseMessagesToText(testMessages));
   ```

**Deliverables:**
- [ ] `lib/memory/utils/messageParser.ts` created
- [ ] Parser functions tested
- [ ] Edge cases handled

---

### Task 2.3: Fact Extraction Implementation (Day 6)

**Objective:** Implement LLM-based fact extraction

#### Steps:

1. **Create extractor**

   Create file: `lib/memory/extractors/FactExtractor.ts`
   ```typescript
   import OpenAI from 'openai';
   import { Message, ExtractedFacts } from '../types';
   import { parseMessagesToText } from '../utils/messageParser';
   import { buildExtractionPrompt } from '../prompts';

   export class FactExtractor {
     private client: OpenAI;
     private model: string;

     constructor() {
       this.client = new OpenAI({
         apiKey: process.env.OPENAI_API_KEY,
         baseURL: process.env.OPENAI_BASE_URL,
       });
       this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
     }

     async extract(messages: Message[]): Promise<string[]> {
       const conversation = parseMessagesToText(messages);
       const prompt = buildExtractionPrompt(conversation);

       const response = await this.client.chat.completions.create({
         model: this.model,
         messages: [
           {
             role: 'system',
             content: 'You are a memory extraction system. Always respond with valid JSON.',
           },
           {
             role: 'user',
             content: prompt,
           },
         ],
         temperature: 0.3,
         response_format: { type: 'json_object' },
       });

       const content = response.choices[0].message.content;
       if (!content) {
         return [];
       }

       try {
         const parsed: ExtractedFacts = JSON.parse(content);
         return parsed.facts || [];
       } catch (error) {
         console.error('Failed to parse extraction response:', error);
         return [];
       }
     }
   }
   ```

2. **Create test**

   Create file: `scripts/test-fact-extraction.ts`
   ```typescript
   import { FactExtractor } from '../lib/memory/extractors/FactExtractor';

   async function test() {
     const extractor = new FactExtractor();

     const messages = [
       {
         id: '1',
         role: 'user' as const,
         content: 'My name is Alice and I work as a software engineer in San Francisco. I love hiking and photography.',
         timestamp: Date.now(),
       },
       {
         id: '2',
         role: 'assistant' as const,
         content: 'That sounds wonderful, Alice! What kind of photography do you enjoy?',
         timestamp: Date.now(),
       },
       {
         id: '3',
         role: 'user' as const,
         content: 'I mainly do landscape photography, especially during sunrise.',
         timestamp: Date.now(),
       },
     ];

     const facts = await extractor.extract(messages);
     console.log('Extracted facts:', facts);
   }

   test().catch(console.error);
   ```

3. **Run tests and refine**
   ```bash
   npx tsx scripts/test-fact-extraction.ts
   ```

**Deliverables:**
- [ ] `lib/memory/extractors/FactExtractor.ts` created
- [ ] Fact extraction working
- [ ] JSON parsing robust
- [ ] Tests passing with real examples

---

### Task 2.4: Memory Action Decision (Day 6-7)

**Objective:** Implement LLM-based action decision system

#### Steps:

1. **Create decision maker**

   Create file: `lib/memory/extractors/ActionDecider.ts`
   ```typescript
   import OpenAI from 'openai';
   import { v4 as uuidv4 } from 'uuid';
   import { MemoryDecision, SearchResult } from '../types';
   import { buildUpdatePrompt } from '../prompts';

   export class ActionDecider {
     private client: OpenAI;
     private model: string;

     constructor() {
       this.client = new OpenAI({
         apiKey: process.env.OPENAI_API_KEY,
         baseURL: process.env.OPENAI_BASE_URL,
       });
       this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
     }

     async decide(
       facts: string[],
       similarMemories: Map<string, SearchResult[]>
     ): Promise<MemoryDecision> {
       if (facts.length === 0) {
         return { memory: [] };
       }

       // Build list of existing memories for each fact
       const existingMemoriesList: Array<{ id: string; text: string; score: number }> = [];

       for (const [fact, results] of similarMemories.entries()) {
         results.forEach(result => {
           existingMemoriesList.push({
             id: result.id,
             text: result.payload.data,
             score: result.score,
           });
         });
       }

       // Remove duplicates
       const uniqueMemories = Array.from(
         new Map(existingMemoriesList.map(m => [m.id, m])).values()
       );

       const prompt = buildUpdatePrompt(facts, uniqueMemories);

       const response = await this.client.chat.completions.create({
         model: this.model,
         messages: [
           {
             role: 'system',
             content: 'You are a memory management system. Always respond with valid JSON.',
           },
           {
             role: 'user',
             content: prompt,
           },
         ],
         temperature: 0.3,
         response_format: { type: 'json_object' },
       });

       const content = response.choices[0].message.content;
       if (!content) {
         return { memory: [] };
       }

       try {
         const parsed: MemoryDecision = JSON.parse(content);

         // Add UUIDs for new memories
         parsed.memory = parsed.memory.map(item => {
           if (item.event === 'ADD' && (!item.id || item.id === 'new')) {
             return { ...item, id: uuidv4() };
           }
           return item;
         });

         return parsed;
       } catch (error) {
         console.error('Failed to parse decision response:', error);
         return { memory: [] };
       }
     }
   }
   ```

2. **Create test**

   Create file: `scripts/test-action-decider.ts`
   ```typescript
   import { ActionDecider } from '../lib/memory/extractors/ActionDecider';

   async function test() {
     const decider = new ActionDecider();

     const facts = [
       'Name is Alice',
       'Works as a software engineer',
       'Lives in San Francisco',
     ];

     const similarMemories = new Map([
       ['Name is Alice', [
         {
           id: 'mem_001',
           score: 0.92,
           payload: {
             data: 'Name is Alice Smith',
             user_id: 'user_123',
             created_at: '2025-01-15T00:00:00Z',
             hash: 'abc',
           },
         },
       ]],
     ]);

     const decision = await decider.decide(facts, similarMemories);
     console.log('Decision:', JSON.stringify(decision, null, 2));
   }

   test().catch(console.error);
   ```

**Deliverables:**
- [ ] `lib/memory/extractors/ActionDecider.ts` created
- [ ] Decision logic working
- [ ] UUID generation for new memories
- [ ] Tests passing

---

### Task 2.5: Hash Generator (Day 7)

**Objective:** Create hash function for deduplication

#### Steps:

1. **Create hash utility**

   Create file: `lib/memory/utils/hash.ts`
   ```typescript
   import crypto from 'crypto';

   export function generateMemoryHash(text: string, userId: string): string {
     const normalized = text.toLowerCase().trim();
     const input = `${userId}:${normalized}`;
     return crypto.createHash('sha256').update(input).digest('hex');
   }

   export function isSimilarHash(hash1: string, hash2: string): boolean {
     return hash1 === hash2;
   }
   ```

**Deliverables:**
- [ ] `lib/memory/utils/hash.ts` created
- [ ] Hash generation working
- [ ] Deterministic hashing

---

### Task 2.6: Core Memory Service - Add Method (Day 7-8)

**Objective:** Implement the main `add()` method for memory extraction

#### Steps:

1. **Create Memory Service skeleton**

   Create file: `lib/memory/MemoryService.ts`
   ```typescript
   import { v4 as uuidv4 } from 'uuid';
   import {
     Message,
     Memory,
     MemoryResult,
     MemoryAction,
     SearchResult
   } from './types';
   import { OpenSearchStore } from './stores/OpenSearchStore';
   import { HistoryStore } from './stores/HistoryStore';
   import { OpenAIEmbeddingGenerator } from './embeddings/OpenAIEmbedding';
   import { FactExtractor } from './extractors/FactExtractor';
   import { ActionDecider } from './extractors/ActionDecider';
   import { generateMemoryHash } from './utils/hash';
   import { memoryConfig } from './config';

   export class MemoryService {
     private vectorStore: OpenSearchStore;
     private historyStore: HistoryStore;
     private embeddingGenerator: OpenAIEmbeddingGenerator;
     private factExtractor: FactExtractor;
     private actionDecider: ActionDecider;

     constructor() {
       this.vectorStore = new OpenSearchStore();
       this.historyStore = new HistoryStore();
       this.embeddingGenerator = new OpenAIEmbeddingGenerator();
       this.factExtractor = new FactExtractor();
       this.actionDecider = new ActionDecider();
     }

     async add(messages: Message[], userId: string): Promise<MemoryResult> {
       // 1. Extract facts from conversation
       const facts = await this.factExtractor.extract(messages);

       if (facts.length === 0) {
         return { results: [] };
       }

       // 2. Generate embeddings for each fact
       const embeddings = await this.embeddingGenerator.embedBatch(facts);

       // 3. Search for similar memories
       const similarMemories = new Map<string, SearchResult[]>();

       for (let i = 0; i < facts.length; i++) {
         const similar = await this.vectorStore.search(
           embeddings[i],
           { user_id: userId },
           5
         );
         similarMemories.set(facts[i], similar);
       }

       // 4. Decide actions using LLM
       const decision = await this.actionDecider.decide(facts, similarMemories);

       // 5. Execute actions
       const results: MemoryAction[] = [];

       for (const action of decision.memory) {
         try {
           let result: MemoryAction;

           switch (action.event) {
             case 'ADD':
               result = await this.executeAdd(
                 action.id,
                 action.text,
                 userId,
                 embeddings[facts.indexOf(action.text)] ||
                   await this.embeddingGenerator.embed(action.text)
               );
               break;

             case 'UPDATE':
               result = await this.executeUpdate(
                 action.id,
                 action.text,
                 action.old_memory || '',
                 userId,
                 embeddings[facts.indexOf(action.text)] ||
                   await this.embeddingGenerator.embed(action.text)
               );
               break;

             case 'DELETE':
               result = await this.executeDelete(action.id, action.text, userId);
               break;

             default:
               result = {
                 id: action.id,
                 memory: action.text,
                 event: 'NONE',
               };
           }

           results.push(result);
         } catch (error) {
           console.error(`Failed to execute ${action.event}:`, error);
         }
       }

       return { results };
     }

     private async executeAdd(
       id: string,
       text: string,
       userId: string,
       embedding: number[]
     ): Promise<MemoryAction> {
       const hash = generateMemoryHash(text, userId);
       const now = new Date().toISOString();

       await this.vectorStore.insert(
         [embedding],
         [id],
         [{
           user_id: userId,
           data: text,
           hash,
           created_at: now,
         }]
       );

       await this.historyStore.add({
         memory_id: id,
         user_id: userId,
         prev_value: null,
         new_value: text,
         event: 'ADD',
       });

       return {
         id,
         memory: text,
         event: 'ADD',
       };
     }

     private async executeUpdate(
       id: string,
       newText: string,
       oldText: string,
       userId: string,
       embedding: number[]
     ): Promise<MemoryAction> {
       const hash = generateMemoryHash(newText, userId);

       await this.vectorStore.update(id, embedding, {
         user_id: userId,
         data: newText,
         hash,
       });

       await this.historyStore.add({
         memory_id: id,
         user_id: userId,
         prev_value: oldText,
         new_value: newText,
         event: 'UPDATE',
       });

       return {
         id,
         memory: newText,
         event: 'UPDATE',
         old_memory: oldText,
       };
     }

     private async executeDelete(
       id: string,
       text: string,
       userId: string
     ): Promise<MemoryAction> {
       await this.vectorStore.delete(id);

       await this.historyStore.add({
         memory_id: id,
         user_id: userId,
         prev_value: text,
         new_value: null,
         event: 'DELETE',
       });

       return {
         id,
         memory: text,
         event: 'DELETE',
       };
     }

     // Placeholder methods (will implement in Phase 3)
     async search(query: string, userId: string, limit = 5): Promise<Memory[]> {
       throw new Error('Not implemented yet');
     }

     async getAll(userId: string): Promise<Memory[]> {
       throw new Error('Not implemented yet');
     }

     async history(memoryId: string): Promise<any[]> {
       throw new Error('Not implemented yet');
     }

     async delete(memoryId: string): Promise<void> {
       throw new Error('Not implemented yet');
     }
   }
   ```

2. **Create integration test**

   Create file: `scripts/test-memory-service.ts`
   ```typescript
   import { MemoryService } from '../lib/memory/MemoryService';

   async function test() {
     const service = new MemoryService();

     const messages = [
       {
         id: '1',
         role: 'user' as const,
         content: 'My name is Bob and I love playing guitar',
         timestamp: Date.now(),
       },
       {
         id: '2',
         role: 'assistant' as const,
         content: 'Nice to meet you, Bob! How long have you been playing guitar?',
         timestamp: Date.now(),
       },
     ];

     console.log('Testing memory addition...');
     const result = await service.add(messages, 'user_test_123');
     console.log('Result:', JSON.stringify(result, null, 2));
   }

   test().catch(console.error);
   ```

3. **Run end-to-end test**
   ```bash
   npx tsx scripts/test-memory-service.ts
   ```

**Deliverables:**
- [ ] `lib/memory/MemoryService.ts` created
- [ ] `add()` method fully implemented
- [ ] All sub-operations working (ADD/UPDATE/DELETE)
- [ ] End-to-end test passing

---

### Phase 2 Completion Checklist

At the end of Week 2, verify:

- [ ] Fact extraction working with real conversations
- [ ] Action decision logic functional
- [ ] Memory storage (ADD) working
- [ ] Memory updates working
- [ ] Memory deletion working
- [ ] History tracking for all operations
- [ ] Hash-based deduplication
- [ ] End-to-end extraction pipeline tested

**Deliverables Document:** Create `docs/phase2-completion.md` with test examples and results.

---

## Phase 3: Memory Retrieval Pipeline (Week 3)

### Goal
Enable semantic search and context injection for personalized responses.

---

### Task 3.1: Implement Search Method (Day 9)

**Objective:** Complete the `search()` method in MemoryService

#### Steps:

1. **Implement search in MemoryService**

   Update `lib/memory/MemoryService.ts`:
   ```typescript
   async search(query: string, userId: string, limit = 5): Promise<Memory[]> {
     // 1. Generate query embedding
     const queryEmbedding = await this.embeddingGenerator.embed(query, 'search');

     // 2. Search vector store
     const results = await this.vectorStore.search(
       queryEmbedding,
       { user_id: userId },
       limit
     );

     // 3. Filter by threshold
     const threshold = memoryConfig.behavior.similarityThreshold;
     const filtered = results.filter(r => r.score >= threshold);

     // 4. Format and return
     return filtered.map(r => ({
       id: r.id,
       memory: r.payload.data,
       user_id: r.payload.user_id,
       score: r.score,
       created_at: r.payload.created_at,
       updated_at: r.payload.updated_at,
       hash: r.payload.hash,
       metadata: r.payload.metadata,
     }));
   }
   ```

2. **Create test**

   Create file: `scripts/test-memory-search.ts`
   ```typescript
   import { MemoryService } from '../lib/memory/MemoryService';

   async function test() {
     const service = new MemoryService();
     const userId = 'user_search_test';

     // First add some memories
     console.log('Adding test memories...');
     await service.add([
       {
         id: '1',
         role: 'user' as const,
         content: 'My name is Charlie and I love skiing',
         timestamp: Date.now(),
       },
     ], userId);

     // Wait a bit for indexing
     await new Promise(resolve => setTimeout(resolve, 2000));

     // Search
     console.log('Searching for memories...');
     const results = await service.search("What's my name?", userId, 5);
     console.log('Search results:', JSON.stringify(results, null, 2));
   }

   test().catch(console.error);
   ```

**Deliverables:**
- [ ] `search()` method implemented
- [ ] Threshold filtering working
- [ ] Search returns relevant results
- [ ] Tests passing

---

### Task 3.2: Implement GetAll Method (Day 9)

**Objective:** Retrieve all memories for a user

#### Steps:

1. **Add getAllByUserId to VectorStore**

   Update `lib/memory/stores/OpenSearchStore.ts`:
   ```typescript
   async getAllByUserId(userId: string, limit = 100): Promise<SearchResult[]> {
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
   }
   ```

2. **Implement getAll in MemoryService**

   Update `lib/memory/MemoryService.ts`:
   ```typescript
   async getAll(userId: string): Promise<Memory[]> {
     const results = await this.vectorStore.getAllByUserId(userId);

     return results.map(r => ({
       id: r.id,
       memory: r.payload.data,
       user_id: r.payload.user_id,
       created_at: r.payload.created_at,
       updated_at: r.payload.updated_at,
       hash: r.payload.hash,
       metadata: r.payload.metadata,
     }));
   }
   ```

**Deliverables:**
- [ ] `getAll()` method implemented
- [ ] Returns all user memories
- [ ] Sorted by creation date

---

### Task 3.3: Implement History Method (Day 10)

**Objective:** Retrieve history for a specific memory

#### Steps:

1. **Implement history in MemoryService**

   Update `lib/memory/MemoryService.ts`:
   ```typescript
   async history(memoryId: string): Promise<HistoryEntry[]> {
     return await this.historyStore.getByMemoryId(memoryId);
   }
   ```

**Deliverables:**
- [ ] `history()` method implemented
- [ ] Returns complete audit trail

---

### Task 3.4: Context Builder (Day 10)

**Objective:** Create utility to format memories for LLM context

#### Steps:

1. **Create context builder**

   Create file: `lib/memory/utils/contextBuilder.ts`
   ```typescript
   import { Memory } from '../types';

   export function buildSystemPromptWithMemories(memories: Memory[]): string {
     if (memories.length === 0) {
       return 'You are a helpful AI assistant. Be friendly and informative.';
     }

     const memoryContext = memories
       .map(m => `- ${m.memory}`)
       .join('\n');

     return `You are a helpful AI assistant. Be friendly and informative.

You have the following information about the user from previous conversations:
${memoryContext}

Use this information to provide personalized responses, but don't explicitly mention that you're recalling memories unless relevant.`;
   }

   export function formatMemoriesForDisplay(memories: Memory[]): string {
     if (memories.length === 0) {
       return 'No memories found.';
     }

     return memories
       .map((m, i) => `${i + 1}. ${m.memory} (${new Date(m.created_at).toLocaleDateString()})`)
       .join('\n');
   }
   ```

**Deliverables:**
- [ ] Context builder created
- [ ] System prompt formatting working
- [ ] Display formatting functional

---

### Task 3.5: Token Budget Management (Day 11)

**Objective:** Implement token budget allocation

#### Steps:

1. **Create token budget utility**

   Create file: `lib/memory/utils/tokenBudget.ts`
   ```typescript
   import { Memory } from '../types';

   export function estimateTokens(text: string): number {
     // Rough estimate: ~4 characters per token
     return Math.ceil(text.length / 4);
   }

   export function allocateTokenBudget(
     totalBudget: number,
     conversationTokens: number,
     memories: Memory[],
     responseReserve = 500
   ): Memory[] {
     const memoryBudget = totalBudget - conversationTokens - responseReserve;

     if (memoryBudget <= 0) {
       return [];
     }

     let currentTokens = 0;
     const selected: Memory[] = [];

     for (const memory of memories) {
       const memoryTokens = estimateTokens(memory.memory);

       if (currentTokens + memoryTokens > memoryBudget) {
         break;
       }

       selected.push(memory);
       currentTokens += memoryTokens;
     }

     return selected;
   }

   export function getMemoriesWithinBudget(
     memories: Memory[],
     maxTokens: number
   ): Memory[] {
     return allocateTokenBudget(maxTokens, 0, memories, 0);
   }
   ```

2. **Integrate with search**

   Update `lib/memory/MemoryService.ts`:
   ```typescript
   import { allocateTokenBudget, estimateTokens } from './utils/tokenBudget';

   async search(
     query: string,
     userId: string,
     limit = 5,
     maxTokens?: number
   ): Promise<Memory[]> {
     // ... existing search code ...

     let results = filtered.map(r => ({
       id: r.id,
       memory: r.payload.data,
       user_id: r.payload.user_id,
       score: r.score,
       created_at: r.payload.created_at,
       updated_at: r.payload.updated_at,
       hash: r.payload.hash,
       metadata: r.payload.metadata,
     }));

     // Apply token budget if specified
     if (maxTokens) {
       results = allocateTokenBudget(maxTokens, 0, results, 0);
     }

     return results;
   }
   ```

**Deliverables:**
- [ ] Token estimation working
- [ ] Budget allocation implemented
- [ ] Integration with search complete

---

### Phase 3 Completion Checklist

At the end of Week 3, verify:

- [ ] Search method fully functional
- [ ] GetAll method working
- [ ] History retrieval working
- [ ] Context builder formatting correctly
- [ ] Token budget management implemented
- [ ] All retrieval methods tested

**Deliverables Document:** Create `docs/phase3-completion.md` with search examples.

---

## Phase 4: Chat Integration (Week 4)

### Goal
Integrate memory service with existing chatbot and create API endpoints.

---

### Task 4.1: User Session Management (Day 12)

**Objective:** Add user identification to frontend

#### Steps:

1. **Update frontend with userId**

   Update `app/page.tsx`:
   ```typescript
   'use client';

   import { useState, useRef, useEffect } from 'react';
   import { Message } from './types/chat';

   export default function Home() {
     const [messages, setMessages] = useState<Message[]>([]);
     const [input, setInput] = useState('');
     const [isLoading, setIsLoading] = useState(false);
     const [userId, setUserId] = useState<string>('');
     const [memoriesRetrieved, setMemoriesRetrieved] = useState(0);
     const messagesEndRef = useRef<HTMLDivElement>(null);

     // Initialize user ID
     useEffect(() => {
       let id = localStorage.getItem('userId');
       if (!id) {
         id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
         localStorage.setItem('userId', id);
       }
       setUserId(id);
     }, []);

     // ... rest of component
   ```

2. **Update sendMessage to include userId**
   ```typescript
   const sendMessage = async (e: React.FormEvent) => {
     e.preventDefault();

     if (!input.trim() || isLoading || !userId) return;

     // ... existing message creation ...

     try {
       const response = await fetch('/api/chat', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
         },
         body: JSON.stringify({
           messages: [...messages, userMessage].map(({ role, content }) => ({
             role,
             content,
           })),
           userId, // Add userId
         }),
       });

       // ... rest of sendMessage
     }
   ```

**Deliverables:**
- [ ] User ID generation working
- [ ] User ID persisted in localStorage
- [ ] User ID sent with chat requests

---

### Task 4.2: Update Chat API Route (Day 12-13)

**Objective:** Integrate memory service into chat endpoint

#### Steps:

1. **Update chat route**

   Update `app/api/chat/route.ts`:
   ```typescript
   import OpenAI from 'openai';
   import { MemoryService } from '@/lib/memory/MemoryService';
   import { buildSystemPromptWithMemories } from '@/lib/memory/utils/contextBuilder';
   import { memoryConfig } from '@/lib/memory/config';

   const openai = new OpenAI({
     apiKey: process.env.OPENAI_API_KEY || '',
     baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
   });

   const memoryService = new MemoryService();

   export const runtime = 'edge';

   export async function POST(req: Request) {
     try {
       const { messages, userId } = await req.json();

       // Validate
       if (!messages || !Array.isArray(messages)) {
         return new Response('Invalid request: messages array is required', {
           status: 400
         });
       }

       if (!userId) {
         return new Response('Invalid request: userId is required', {
           status: 400
         });
       }

       let memories: any[] = [];
       let memoriesRetrieved = 0;

       // Retrieve memories if enabled
       if (memoryConfig.enabled) {
         try {
           const lastUserMessage = messages[messages.length - 1]?.content || '';
           memories = await memoryService.search(lastUserMessage, userId, 5);
           memoriesRetrieved = memories.length;
         } catch (error) {
           console.error('Memory retrieval error:', error);
           // Continue without memories
         }
       }

       // Build system prompt with memories
       const systemPrompt = buildSystemPromptWithMemories(memories);

       // Prepare messages with memory context
       const contextMessages = [
         { role: 'system', content: systemPrompt },
         ...messages
       ];

       const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

       const response = await openai.chat.completions.create({
         model,
         stream: true,
         messages: contextMessages,
         temperature: 0.7,
         max_tokens: 1000,
       });

       // Stream response and collect full text
       const encoder = new TextEncoder();
       let fullResponse = '';

       const stream = new ReadableStream({
         async start(controller) {
           try {
             for await (const chunk of response) {
               const content = chunk.choices[0]?.delta?.content || '';
               if (content) {
                 fullResponse += content;
                 controller.enqueue(encoder.encode(content));
               }
             }
             controller.close();

             // Extract and store memories in background (non-blocking)
             if (memoryConfig.enabled && userId && messages.length > 0) {
               const conversationForMemory = [
                 messages[messages.length - 1],
                 { role: 'assistant', content: fullResponse }
               ];

               memoryService.add(conversationForMemory, userId)
                 .catch(err => console.error('Memory extraction error:', err));
             }
           } catch (error) {
             controller.error(error);
           }
         },
       });

       return new Response(stream, {
         headers: {
           'Content-Type': 'text/plain; charset=utf-8',
           'Transfer-Encoding': 'chunked',
           'X-Memories-Retrieved': memoriesRetrieved.toString(),
         },
       });
     } catch (error: any) {
       console.error('Chat API Error:', error);

       return new Response(
         JSON.stringify({
           error: error?.message || 'An error occurred during the chat request'
         }),
         {
           status: 500,
           headers: { 'Content-Type': 'application/json' }
         }
       );
     }
   }
   ```

**Note:** The Edge Runtime may have compatibility issues with some dependencies (PostgreSQL client, OpenSearch SDK). If you encounter issues:

**Solution 1:** Use Node.js runtime for chat route
```typescript
export const runtime = 'nodejs'; // Instead of 'edge'
```

**Solution 2:** Extract memory operations to separate API routes with Node runtime

**Deliverables:**
- [ ] Chat API updated with memory integration
- [ ] Memory retrieval before LLM call
- [ ] Memory extraction after response
- [ ] Runtime compatibility verified

---

### Task 4.3: Memory API Endpoints (Day 13-14)

**Objective:** Create REST API endpoints for memory operations

#### Steps:

1. **Create search endpoint**

   Create file: `app/api/memory/search/route.ts`
   ```typescript
   import { NextRequest } from 'next/server';
   import { MemoryService } from '@/lib/memory/MemoryService';

   export const runtime = 'nodejs';

   const memoryService = new MemoryService();

   export async function GET(req: NextRequest) {
     try {
       const searchParams = req.nextUrl.searchParams;
       const query = searchParams.get('query');
       const userId = searchParams.get('userId');
       const limit = parseInt(searchParams.get('limit') || '5');

       if (!query || !userId) {
         return Response.json(
           { error: 'query and userId are required' },
           { status: 400 }
         );
       }

       const results = await memoryService.search(query, userId, limit);

       return Response.json({ results });
     } catch (error: any) {
       console.error('Search error:', error);
       return Response.json(
         { error: error.message },
         { status: 500 }
       );
     }
   }
   ```

2. **Create get all endpoint**

   Create file: `app/api/memory/route.ts`
   ```typescript
   import { NextRequest } from 'next/server';
   import { MemoryService } from '@/lib/memory/MemoryService';

   export const runtime = 'nodejs';

   const memoryService = new MemoryService();

   export async function GET(req: NextRequest) {
     try {
       const userId = req.nextUrl.searchParams.get('userId');

       if (!userId) {
         return Response.json(
           { error: 'userId is required' },
           { status: 400 }
         );
       }

       const results = await memoryService.getAll(userId);

       return Response.json({ results });
     } catch (error: any) {
       console.error('Get all error:', error);
       return Response.json(
         { error: error.message },
         { status: 500 }
       );
     }
   }

   export async function DELETE(req: NextRequest) {
     try {
       const { memoryId } = await req.json();

       if (!memoryId) {
         return Response.json(
           { error: 'memoryId is required' },
           { status: 400 }
         );
       }

       await memoryService.delete(memoryId);

       return Response.json({
         success: true,
         message: 'Memory deleted successfully'
       });
     } catch (error: any) {
       console.error('Delete error:', error);
       return Response.json(
         { error: error.message },
         { status: 500 }
       );
     }
   }
   ```

3. **Create history endpoint**

   Create file: `app/api/memory/[id]/history/route.ts`
   ```typescript
   import { NextRequest } from 'next/server';
   import { MemoryService } from '@/lib/memory/MemoryService';

   export const runtime = 'nodejs';

   const memoryService = new MemoryService();

   export async function GET(
     req: NextRequest,
     { params }: { params: { id: string } }
   ) {
     try {
       const memoryId = params.id;

       if (!memoryId) {
         return Response.json(
           { error: 'memoryId is required' },
           { status: 400 }
         );
       }

       const history = await memoryService.history(memoryId);

       return Response.json({ history });
     } catch (error: any) {
       console.error('History error:', error);
       return Response.json(
         { error: error.message },
         { status: 500 }
       );
     }
   }
   ```

4. **Create manual add endpoint**

   Create file: `app/api/memory/add/route.ts`
   ```typescript
   import { NextRequest } from 'next/server';
   import { MemoryService } from '@/lib/memory/MemoryService';

   export const runtime = 'nodejs';

   const memoryService = new MemoryService();

   export async function POST(req: NextRequest) {
     try {
       const { messages, userId } = await req.json();

       if (!messages || !userId) {
         return Response.json(
           { error: 'messages and userId are required' },
           { status: 400 }
         );
       }

       const result = await memoryService.add(messages, userId);

       return Response.json(result);
     } catch (error: any) {
       console.error('Add error:', error);
       return Response.json(
         { error: error.message },
         { status: 500 }
       );
     }
   }
   ```

**Deliverables:**
- [ ] All API endpoints created
- [ ] Error handling implemented
- [ ] Endpoints tested with curl/Postman

---

### Task 4.4: UI Enhancements (Day 14)

**Objective:** Add memory indicators and management UI

#### Steps:

1. **Add memory indicator**

   Update `app/page.tsx`:
   ```typescript
   // In sendMessage function, after fetch:
   const memoriesHeader = response.headers.get('X-Memories-Retrieved');
   if (memoriesHeader) {
     setMemoriesRetrieved(parseInt(memoriesHeader));
   }

   // In render (before messages):
   {memoriesRetrieved > 0 && (
     <div className="text-center mb-4">
       <div className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg text-sm">
         💡 Using {memoriesRetrieved} {memoriesRetrieved === 1 ? 'memory' : 'memories'} from previous conversations
       </div>
     </div>
   )}
   ```

2. **Optional: Add memory viewer**

   Create file: `app/components/MemoryViewer.tsx`
   ```typescript
   'use client';

   import { useState, useEffect } from 'react';

   interface Memory {
     id: string;
     memory: string;
     created_at: string;
   }

   export function MemoryViewer({ userId }: { userId: string }) {
     const [memories, setMemories] = useState<Memory[]>([]);
     const [isOpen, setIsOpen] = useState(false);

     const loadMemories = async () => {
       try {
         const response = await fetch(`/api/memory?userId=${userId}`);
         const data = await response.json();
         setMemories(data.results || []);
       } catch (error) {
         console.error('Failed to load memories:', error);
       }
     };

     useEffect(() => {
       if (isOpen && userId) {
         loadMemories();
       }
     }, [isOpen, userId]);

     if (!userId) return null;

     return (
       <div className="fixed bottom-20 right-4">
         <button
           onClick={() => setIsOpen(!isOpen)}
           className="bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700"
         >
           {isOpen ? 'Close' : 'View'} Memories
         </button>

         {isOpen && (
           <div className="absolute bottom-12 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-h-96 overflow-y-auto">
             <h3 className="font-bold mb-2">Your Memories</h3>
             {memories.length === 0 ? (
               <p className="text-gray-500 text-sm">No memories yet</p>
             ) : (
               <ul className="space-y-2">
                 {memories.map(m => (
                   <li key={m.id} className="text-sm border-b pb-2">
                     <p>{m.memory}</p>
                     <p className="text-xs text-gray-500 mt-1">
                       {new Date(m.created_at).toLocaleDateString()}
                     </p>
                   </li>
                 ))}
               </ul>
             )}
           </div>
         )}
       </div>
     );
   }
   ```

**Deliverables:**
- [ ] Memory count indicator displayed
- [ ] Optional memory viewer component
- [ ] UI polished and user-friendly

---

### Task 4.5: Testing & Documentation (Day 15)

**Objective:** Comprehensive testing and documentation

#### Steps:

1. **Create end-to-end test**

   Create file: `scripts/test-e2e.ts`
   ```typescript
   import { MemoryService } from '../lib/memory/MemoryService';

   async function e2eTest() {
     const service = new MemoryService();
     const userId = `test_${Date.now()}`;

     console.log('=== End-to-End Memory Test ===\n');

     // 1. Initial conversation
     console.log('1. Adding initial conversation...');
     const conv1 = await service.add([
       {
         id: '1',
         role: 'user' as const,
         content: 'Hi! My name is David and I work as a product manager',
         timestamp: Date.now(),
       },
       {
         id: '2',
         role: 'assistant' as const,
         content: 'Nice to meet you, David!',
         timestamp: Date.now(),
       },
     ], userId);
     console.log('Result:', conv1);

     // Wait for indexing
     await new Promise(resolve => setTimeout(resolve, 2000));

     // 2. Search for name
     console.log('\n2. Searching for name...');
     const nameResults = await service.search("What's my name?", userId);
     console.log('Results:', nameResults);

     // 3. Add more info
     console.log('\n3. Adding more information...');
     const conv2 = await service.add([
       {
         id: '3',
         role: 'user' as const,
         content: 'I love hiking and photography',
         timestamp: Date.now(),
       },
     ], userId);
     console.log('Result:', conv2);

     await new Promise(resolve => setTimeout(resolve, 2000));

     // 4. Get all memories
     console.log('\n4. Getting all memories...');
     const allMemories = await service.getAll(userId);
     console.log('All memories:', allMemories);

     // 5. Update information
     console.log('\n5. Updating job information...');
     const conv3 = await service.add([
       {
         id: '4',
         role: 'user' as const,
         content: 'I got promoted! I am now a senior product manager',
         timestamp: Date.now(),
       },
     ], userId);
     console.log('Result:', conv3);

     await new Promise(resolve => setTimeout(resolve, 2000));

     // 6. Check history
     if (conv3.results.length > 0) {
       console.log('\n6. Checking history...');
       const history = await service.history(conv3.results[0].id);
       console.log('History:', history);
     }

     console.log('\n=== Test Complete ===');
   }

   e2eTest().catch(console.error);
   ```

2. **Run all tests**
   ```bash
   npx tsx scripts/test-e2e.ts
   ```

3. **Create user documentation**

   Create file: `docs/user-guide.md`
   ```markdown
   # Memory Service User Guide

   ## Overview
   The memory service enables the chatbot to remember information about you across conversations.

   ## How It Works
   1. As you chat, the AI automatically extracts and stores key facts
   2. In future conversations, these facts are retrieved and used for context
   3. You can view, search, and manage your memories

   ## API Usage

   ### Search Memories
   ```bash
   curl "http://localhost:3000/api/memory/search?query=my+name&userId=user_123"
   ```

   ### Get All Memories
   ```bash
   curl "http://localhost:3000/api/memory?userId=user_123"
   ```

   ### View Memory History
   ```bash
   curl "http://localhost:3000/api/memory/mem_123/history"
   ```

   ### Delete Memory
   ```bash
   curl -X DELETE "http://localhost:3000/api/memory" \
     -H "Content-Type: application/json" \
     -d '{"memoryId": "mem_123"}'
   ```

   ## Privacy
   - Memories are scoped to your user ID
   - You can delete memories at any time
   - All memory operations are logged for audit
   ```

4. **Create developer documentation**

   Create file: `docs/developer-guide.md`
   ```markdown
   # Memory Service Developer Guide

   ## Architecture
   [Include architecture diagram and component descriptions]

   ## Setup
   [Include setup instructions]

   ## API Reference
   [Include detailed API docs]

   ## Testing
   [Include testing instructions]

   ## Troubleshooting
   [Include common issues and solutions]
   ```

**Deliverables:**
- [ ] E2E tests passing
- [ ] User guide created
- [ ] Developer guide created
- [ ] API documentation complete

---

### Phase 4 Completion Checklist

At the end of Week 4, verify:

- [ ] User session management working
- [ ] Chat API fully integrated with memory
- [ ] All memory API endpoints functional
- [ ] UI enhancements complete
- [ ] E2E tests passing
- [ ] Documentation complete
- [ ] System ready for production

**Deliverables Document:** Create `docs/phase4-completion.md` and `docs/deployment-guide.md`.

---

## Post-Implementation Tasks

### Security & Privacy

1. **Add rate limiting**
   - Prevent abuse of memory API
   - Implement per-user quotas

2. **Add authentication** (if needed)
   - Integrate with auth provider
   - Secure API endpoints

3. **PII detection**
   - Scan memories for sensitive data
   - Allow opt-out of memory storage

### Performance Optimization

1. **Add caching layer**
   - Redis for frequently accessed memories
   - Cache embeddings

2. **Batch operations**
   - Process multiple facts in parallel
   - Optimize database queries

3. **Monitoring**
   - Add logging for all memory operations
   - Track performance metrics
   - Set up alerts

### Production Deployment

1. **Environment setup**
   - Production OpenSearch cluster
   - Production database
   - Environment variables

2. **CI/CD**
   - Automated testing
   - Deployment pipeline
   - Database migrations

3. **Monitoring & Observability**
   - Error tracking (Sentry, etc.)
   - Performance monitoring
   - Usage analytics

---

## Success Criteria

The implementation is complete when:

✅ **Core Functionality**
- [ ] Memory extraction from conversations working
- [ ] Semantic search returning relevant memories
- [ ] Memory updates and deduplication functional
- [ ] History tracking complete

✅ **Integration**
- [ ] Chat API uses memories for context
- [ ] All API endpoints working
- [ ] Frontend displays memory indicators

✅ **Quality**
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Error handling robust
- [ ] Performance acceptable

✅ **Production Ready**
- [ ] Security measures in place
- [ ] Monitoring configured
- [ ] Deployment documented
- [ ] Backup strategy defined

---

## Troubleshooting Guide

### Common Issues

**Issue: OpenSearch connection refused**
- Check Docker container is running
- Verify port 9200 is not blocked
- Check credentials in `.env.local`

**Issue: Embedding API errors**
- Verify OpenAI API key is valid
- Check API quota/credits
- Review rate limits

**Issue: Memory not being retrieved**
- Check similarity threshold (may be too high)
- Verify user ID consistency
- Check OpenSearch indexing delay

**Issue: Edge Runtime compatibility errors**
- Switch to Node.js runtime
- Extract problematic operations to separate routes
- Use fetch-based clients instead of SDKs

**Issue: Database connection errors**
- Verify DATABASE_URL is correct
- Check database is running
- Review connection pool settings

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | Week 1 | Infrastructure setup, base classes |
| Phase 2 | Week 2 | Memory extraction pipeline |
| Phase 3 | Week 3 | Memory retrieval pipeline |
| Phase 4 | Week 4 | Chat integration, API endpoints |
| **Total** | **4 weeks** | **Production-ready memory service** |

---

## Next Steps

After completing the core implementation:

1. **Test with real users** - Gather feedback on memory accuracy
2. **Iterate on prompts** - Refine extraction and decision prompts
3. **Add advanced features** - Multi-modal, analytics, compression
4. **Scale infrastructure** - Optimize for production load

---

## Resources

- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Mem0 GitHub](https://github.com/mem0ai/mem0)

---

*This implementation plan is a living document. Update it as you progress and encounter new learnings.*
