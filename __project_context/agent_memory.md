# Agent Memory Service Design for AI Chatbot

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation Plan](#implementation-plan)
- [API Design](#api-design)
- [Database Schema](#database-schema)
- [Integration with Existing Chatbot](#integration-with-existing-chatbot)
- [Configuration](#configuration)
- [Performance Considerations](#performance-considerations)
- [Future Enhancements](#future-enhancements)

---

## Overview

This document outlines the design for adding an intelligent memory layer to the existing AI chatbot application. The memory service will enable the chatbot to:

1. **Remember user preferences and facts** across conversations
2. **Provide personalized responses** based on historical context
3. **Automatically extract and update memories** from conversations
4. **Retrieve relevant memories** using semantic search
5. **Track memory history** for audit and debugging

### Design Principles

- Use **LLM-powered extraction** for intelligent fact identification
- Implement **vector similarity search** for semantic memory retrieval
- Support **automatic deduplication and updates** via LLM reasoning
- Provide **Edge Runtime compatibility** for optimal performance
- Maintain **complete audit trails** for all memory operations

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Interface (React)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Chat API Route (Edge Runtime)                   │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │ Message Handler   │────────▶│  Memory Service             │  │
│  │ - LLM Streaming  │◀────────│  - Extract facts            │  │
│  │ - Context inject │         │  - Store memories           │  │
│  └──────────────────┘         │  - Retrieve context         │  │
│                               └─────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Storage Layer                             │
│  ┌──────────────────┐         ┌─────────────────────────────┐  │
│  │ OpenSearch       │         │  PostgreSQL / SQLite        │  │
│  │ - Vector store   │         │  - History tracking         │  │
│  │ - Semantic search│         │  - User sessions            │  │
│  └──────────────────┘         └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 1. Memory Service Core (`lib/memory/MemoryService.ts`)

**Responsibilities:**
- Coordinate memory extraction and retrieval
- Manage LLM calls for fact extraction and action decisions
- Handle vector embeddings
- Execute memory operations (ADD/UPDATE/DELETE)

**Key Methods:**
```typescript
class MemoryService {
  // Add memories from conversation
  async add(messages: Message[], userId: string): Promise<MemoryResult>

  // Search memories by query
  async search(query: string, userId: string, limit?: number): Promise<Memory[]>

  // Get all memories for a user
  async getAll(userId: string): Promise<Memory[]>

  // Get memory history
  async history(memoryId: string): Promise<HistoryEntry[]>

  // Delete a specific memory
  async delete(memoryId: string): Promise<void>
}
```

#### 2. Vector Store (`lib/memory/stores/VectorStore.ts`)

**Responsibilities:**
- Store and retrieve embeddings
- Perform similarity searches
- Support metadata filtering

**Implementation Options:**
- **OpenSearch** (Primary recommendation)
- **Qdrant** (Lightweight alternative)
- **Pinecone** (Cloud-based)

**Interface:**
```typescript
interface VectorStore {
  // Insert vectors with metadata
  insert(vectors: number[][], ids: string[], payloads: Metadata[]): Promise<void>

  // Search for similar vectors
  search(query: number[], filters: Filter, limit: number): Promise<SearchResult[]>

  // Update existing vector
  update(id: string, vector: number[], payload: Metadata): Promise<void>

  // Delete vector
  delete(id: string): Promise<void>

  // Get vector by ID
  get(id: string): Promise<VectorRecord>
}
```

#### 3. Embedding Generator (`lib/memory/embeddings/EmbeddingGenerator.ts`)

**Responsibilities:**
- Generate vector embeddings from text
- Cache embeddings to reduce API calls
- Support multiple providers (OpenAI, Cohere, local models)

**Interface:**
```typescript
interface EmbeddingGenerator {
  // Generate embedding vector
  embed(text: string, action?: 'add' | 'update' | 'search'): Promise<number[]>

  // Batch embed multiple texts
  embedBatch(texts: string[]): Promise<number[][]>
}
```

#### 4. History Tracker (`lib/memory/stores/HistoryStore.ts`)

**Responsibilities:**
- Track all memory changes
- Provide audit trail
- Support rollback operations

**Schema:**
```sql
CREATE TABLE memory_history (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  prev_value TEXT,
  new_value TEXT,
  event TEXT NOT NULL, -- 'ADD', 'UPDATE', 'DELETE'
  user_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX idx_memory_history_memory_id ON memory_history(memory_id);
CREATE INDEX idx_memory_history_user_id ON memory_history(user_id);
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Goal:** Set up basic memory storage and retrieval

#### Tasks:

1. **Setup OpenSearch**
   - Install OpenSearch locally or configure cloud instance
   - Create vector index with proper mappings
   - Test basic vector operations

2. **Create Database Schema**
   - Design PostgreSQL/SQLite schema for history
   - Create migration scripts
   - Setup connection pooling

3. **Implement Base Classes**
   - `lib/memory/MemoryService.ts` - Core service skeleton
   - `lib/memory/stores/VectorStore.ts` - Vector store interface
   - `lib/memory/embeddings/EmbeddingGenerator.ts` - Embedding interface
   - `lib/memory/types.ts` - TypeScript types

4. **Environment Configuration**
   - Add configuration for OpenSearch
   - Add configuration for embedding provider
   - Update `.env.local` with new variables

**Files to Create:**
```
lib/
├── memory/
│   ├── MemoryService.ts          # Main service
│   ├── types.ts                  # TypeScript interfaces
│   ├── prompts.ts                # LLM prompts for extraction
│   ├── stores/
│   │   ├── VectorStore.ts        # Vector store interface
│   │   ├── OpenSearchStore.ts    # OpenSearch implementation
│   │   └── HistoryStore.ts       # History tracking
│   └── embeddings/
│       └── OpenAIEmbedding.ts    # OpenAI embeddings
```

### Phase 2: Memory Extraction Pipeline (Week 2)

**Goal:** Implement LLM-powered memory extraction

#### Tasks:

1. **Message Parser**
   - Convert chat messages to LLM-friendly format
   - Handle different message roles (user/assistant/system)

2. **Fact Extraction**
   - Create extraction prompts (based on Mem0 templates)
   - Implement LLM call for fact extraction
   - Parse and validate extracted facts

3. **Embedding Generation**
   - Generate embeddings for each fact
   - Implement caching strategy
   - Batch operations for efficiency

4. **Similarity Search**
   - Search for existing similar memories
   - Implement metadata filtering (user_id scoping)
   - Return top-k most similar memories

5. **Memory Action Decision**
   - Create update decision prompts
   - Implement UUID mapping (prevent hallucinations)
   - Parse LLM decisions (ADD/UPDATE/DELETE/NONE)

6. **Action Execution**
   - Implement ADD operation
   - Implement UPDATE operation
   - Implement DELETE operation
   - Track all changes in history

**Implementation Flow:**
```typescript
// Memory extraction flow
async add(messages: Message[], userId: string): Promise<MemoryResult> {
  // 1. Parse messages to text
  const conversationText = parseMessages(messages);

  // 2. Extract facts using LLM
  const facts = await extractFacts(conversationText);

  // 3. Generate embeddings
  const embeddings = await Promise.all(
    facts.map(fact => this.embeddingGenerator.embed(fact))
  );

  // 4. Search for existing memories
  const existingMemories = await this.findSimilarMemories(
    facts, embeddings, userId
  );

  // 5. Decide actions using LLM
  const actions = await this.decideMemoryActions(
    facts, existingMemories
  );

  // 6. Execute actions
  const results = await this.executeActions(
    actions, embeddings, userId
  );

  return results;
}
```

### Phase 3: Memory Retrieval Pipeline (Week 3)

**Goal:** Enable semantic search and context injection

#### Tasks:

1. **Search Implementation**
   - Convert query to embedding
   - Perform vector similarity search
   - Apply filters (user_id, threshold)

2. **Context Formatting**
   - Format memories for LLM context
   - Implement token budget management
   - Prioritize most relevant memories

3. **Chat API Integration**
   - Inject memories into chat context
   - Update system prompt with user context
   - Maintain conversation coherence

4. **Threshold Filtering**
   - Filter by similarity score
   - Configurable relevance threshold

**Implementation Flow:**
```typescript
// Memory retrieval flow
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
  const filtered = results.filter(r => r.score >= this.threshold);

  // 4. Format and return
  return filtered.map(r => ({
    id: r.id,
    memory: r.payload.data,
    score: r.score,
    created_at: r.payload.created_at,
    updated_at: r.payload.updated_at
  }));
}
```

### Phase 4: Chat Integration (Week 4)

**Goal:** Integrate memory service with existing chat API

#### Tasks:

1. **User Session Management**
   - Implement user identification (session ID, user ID)
   - Track conversation threads
   - Handle anonymous users

2. **Memory-Aware Chat Handler**
   - Retrieve relevant memories before LLM call
   - Inject memories into system prompt
   - Extract new memories after user interaction

3. **Context Management**
   - Balance conversation history vs memories
   - Implement token budget allocation
   - Prioritize recent vs relevant information

4. **UI Updates**
   - Display memory indicators
   - Show what the AI remembers
   - Allow manual memory management

**Updated Chat Flow:**
```typescript
// app/api/chat/route.ts - Updated with memory
export async function POST(req: Request) {
  const { messages, userId } = await req.json();

  // 1. Retrieve relevant memories
  const memories = await memoryService.search(
    messages[messages.length - 1].content,
    userId,
    5
  );

  // 2. Build context with memories
  const systemPrompt = buildSystemPromptWithMemories(memories);
  const contextMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  // 3. Get LLM response (streaming)
  const response = await openai.chat.completions.create({
    model,
    stream: true,
    messages: contextMessages,
  });

  // 4. Stream response to user
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = '';
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullResponse += content;
        controller.enqueue(encoder.encode(content));
      }
      controller.close();

      // 5. Extract and store memories (background)
      memoryService.add([
        messages[messages.length - 1],
        { role: 'assistant', content: fullResponse }
      ], userId).catch(console.error);
    }
  });

  return new Response(stream);
}
```

---

## API Design

### REST API Endpoints

#### 1. Memory Operations

**Add Memory (Automatic)**
```typescript
POST /api/memory/add
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "My name is Alice and I love pizza" },
    { "role": "assistant", "content": "Nice to meet you, Alice!" }
  ],
  "userId": "user_123"
}

Response:
{
  "results": [
    {
      "id": "mem_001",
      "memory": "Name is Alice",
      "event": "ADD"
    },
    {
      "id": "mem_002",
      "memory": "Loves pizza",
      "event": "ADD"
    }
  ]
}
```

**Search Memories**
```typescript
GET /api/memory/search?query=What's my name?&userId=user_123&limit=5

Response:
{
  "results": [
    {
      "id": "mem_001",
      "memory": "Name is Alice",
      "score": 0.92,
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Get All Memories**
```typescript
GET /api/memory?userId=user_123

Response:
{
  "results": [
    {
      "id": "mem_001",
      "memory": "Name is Alice",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "mem_002",
      "memory": "Loves pizza",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

**Delete Memory**
```typescript
DELETE /api/memory/:id

Response:
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

**Get Memory History**
```typescript
GET /api/memory/:id/history

Response:
{
  "history": [
    {
      "id": "hist_1",
      "memory_id": "mem_001",
      "prev_value": null,
      "new_value": "Name is Alice",
      "event": "ADD",
      "timestamp": "2025-01-15T10:30:00Z"
    },
    {
      "id": "hist_2",
      "memory_id": "mem_001",
      "prev_value": "Name is Alice",
      "new_value": "Name is Alice Smith",
      "event": "UPDATE",
      "timestamp": "2025-01-16T14:20:00Z"
    }
  ]
}
```

#### 2. Enhanced Chat API

**Updated Chat Endpoint**
```typescript
POST /api/chat
Content-Type: application/json

{
  "messages": [...],
  "userId": "user_123",
  "memoryOptions": {
    "enabled": true,           // Enable memory features
    "retrieve": true,          // Retrieve memories before response
    "store": true,             // Store new memories after response
    "limit": 5,                // Max memories to retrieve
    "threshold": 0.7           // Similarity threshold
  }
}

Response: (Streaming)
text/plain stream...

Headers:
X-Memories-Retrieved: 3
X-Memories-Created: 1
```

---

## Database Schema

### OpenSearch Index Mapping

```json
{
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
  },
  "settings": {
    "index": {
      "knn": true,
      "knn.algo_param.ef_search": 100
    }
  }
}
```

### PostgreSQL Schema

```sql
-- Users table (optional - for future user management)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Memory history
CREATE TABLE memory_history (
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

CREATE INDEX idx_memory_history_memory_id ON memory_history(memory_id);
CREATE INDEX idx_memory_history_user_id ON memory_history(user_id);
CREATE INDEX idx_memory_history_created_at ON memory_history(created_at DESC);

-- Session tracking (optional)
CREATE TABLE chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  metadata JSONB
);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
```

---

## Integration with Existing Chatbot

### Step-by-Step Integration

#### 1. User Identification

Add user ID generation to the frontend:

```typescript
// app/page.tsx
const [userId, setUserId] = useState<string>('');

useEffect(() => {
  // Get or create user ID
  let id = localStorage.getItem('userId');
  if (!id) {
    id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', id);
  }
  setUserId(id);
}, []);
```

#### 2. Memory Context in System Prompt

```typescript
// lib/memory/context.ts
export function buildSystemPromptWithMemories(memories: Memory[]): string {
  if (memories.length === 0) {
    return `You are a helpful AI assistant. Be friendly and informative.`;
  }

  const memoryContext = memories
    .map(m => `- ${m.memory}`)
    .join('\n');

  return `You are a helpful AI assistant. Be friendly and informative.

You have the following information about the user from previous conversations:
${memoryContext}

Use this information to provide personalized responses, but don't explicitly mention that you're recalling memories unless relevant.`;
}
```

#### 3. Updated Chat Route

```typescript
// app/api/chat/route.ts
import { MemoryService } from '@/lib/memory/MemoryService';
import { buildSystemPromptWithMemories } from '@/lib/memory/context';

const memoryService = new MemoryService();

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    // Get the last user message for memory retrieval
    const lastUserMessage = messages[messages.length - 1].content;

    // Retrieve relevant memories
    const memories = await memoryService.search(
      lastUserMessage,
      userId,
      5 // Retrieve top 5 memories
    );

    // Build system prompt with memories
    const systemPrompt = buildSystemPromptWithMemories(memories);

    // Prepare messages with memory context
    const contextMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Get LLM response
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
          if (userId && messages.length > 0) {
            const conversationForMemory = [
              messages[messages.length - 1], // Last user message
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
        'X-Memories-Retrieved': memories.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'An error occurred during the chat request'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### 4. UI Enhancements

Add memory indicators to the UI:

```typescript
// app/page.tsx - Add memory display
const [memoriesRetrieved, setMemoriesRetrieved] = useState(0);

// In sendMessage function, after fetch:
const memoriesHeader = response.headers.get('X-Memories-Retrieved');
if (memoriesHeader) {
  setMemoriesRetrieved(parseInt(memoriesHeader));
}

// In render:
{memoriesRetrieved > 0 && (
  <div className="text-xs text-gray-500 mb-2">
    💡 Using {memoriesRetrieved} memories from previous conversations
  </div>
)}
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```env
# Existing OpenAI config
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-3.5-turbo

# Memory Service Configuration
MEMORY_ENABLED=true

# OpenSearch Configuration
OPENSEARCH_NODE=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=admin
OPENSEARCH_INDEX=chatbot_memories

# Embedding Configuration
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Memory Behavior
MEMORY_SIMILARITY_THRESHOLD=0.7
MEMORY_RETRIEVAL_LIMIT=5
MEMORY_EXTRACTION_ENABLED=true

# Database Configuration (for history)
DATABASE_URL=postgresql://user:password@localhost:5432/chatbot
# Or for SQLite:
# DATABASE_URL=file:./data/chatbot.db

# Performance
MEMORY_CACHE_TTL=3600
MEMORY_BATCH_SIZE=10
```

### TypeScript Configuration

Create configuration loader:

```typescript
// lib/memory/config.ts
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

export function loadMemoryConfig(): MemoryConfig {
  return {
    enabled: process.env.MEMORY_ENABLED === 'true',
    openSearch: {
      node: process.env.OPENSEARCH_NODE || 'https://localhost:9200',
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
      url: process.env.DATABASE_URL || 'file:./data/chatbot.db',
    },
    performance: {
      cacheTtl: parseInt(process.env.MEMORY_CACHE_TTL || '3600'),
      batchSize: parseInt(process.env.MEMORY_BATCH_SIZE || '10'),
    },
  };
}
```

---

## Performance Considerations

### 1. Edge Runtime Compatibility

**Challenges:**
- OpenSearch client may not be Edge compatible
- Database operations need to be async-friendly
- Large dependencies bloat Edge function size

**Solutions:**
- Use fetch-based OpenSearch client instead of official SDK
- Implement connection pooling for database
- Extract heavy operations to separate API routes (Node runtime)

### 2. Caching Strategy

**Embedding Cache:**
```typescript
// lib/memory/cache.ts
import { LRUCache } from 'lru-cache';

const embeddingCache = new LRUCache<string, number[]>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
});

export async function getCachedEmbedding(
  text: string,
  generator: () => Promise<number[]>
): Promise<number[]> {
  const cached = embeddingCache.get(text);
  if (cached) return cached;

  const embedding = await generator();
  embeddingCache.set(text, embedding);
  return embedding;
}
```

**Memory Search Cache:**
- Cache frequent queries (e.g., "What's my name?")
- Invalidate on memory updates
- Use Redis for distributed caching

### 3. Parallel Execution

Optimize memory operations with concurrent execution:

```typescript
// Parallel fact processing
async add(messages: Message[], userId: string): Promise<MemoryResult> {
  const facts = await this.extractFacts(messages);

  // Process all facts in parallel
  const results = await Promise.all(
    facts.map(async (fact) => {
      const embedding = await this.embeddingGenerator.embed(fact);
      const similar = await this.vectorStore.search(
        embedding,
        { user_id: userId },
        5
      );
      return { fact, embedding, similar };
    })
  );

  // Decide actions for all facts at once
  const actions = await this.decideActions(results);

  // Execute actions in parallel
  await Promise.all(
    actions.map(action => this.executeAction(action))
  );
}
```

### 4. Token Budget Management

Balance conversation history and memory context:

```typescript
// lib/memory/tokenBudget.ts
export function allocateTokenBudget(
  totalBudget: number,
  conversationTokens: number,
  memories: Memory[]
): Memory[] {
  const memoryBudget = totalBudget - conversationTokens - 500; // Reserve 500 for response

  if (memoryBudget <= 0) return [];

  // Estimate ~4 characters per token
  const memoryCharBudget = memoryBudget * 4;

  let currentLength = 0;
  const selected: Memory[] = [];

  for (const memory of memories) {
    const memoryLength = memory.memory.length;
    if (currentLength + memoryLength > memoryCharBudget) break;

    selected.push(memory);
    currentLength += memoryLength;
  }

  return selected;
}
```

### 5. Background Processing

Offload heavy operations:

```typescript
// app/api/memory/background/route.ts
export const runtime = 'nodejs'; // Not edge

export async function POST(req: Request) {
  const { operation, data } = await req.json();

  switch (operation) {
    case 'extract':
      // Heavy LLM-based extraction
      await memoryService.add(data.messages, data.userId);
      break;
    case 'reindex':
      // Bulk reindexing operations
      await vectorStore.reindex();
      break;
  }

  return new Response(JSON.stringify({ success: true }));
}
```

---

## Future Enhancements

### Phase 5: Advanced Features (Future)

1. **Multi-Modal Memory**
   - Store image descriptions
   - Remember voice preferences
   - Link documents to conversations

2. **Memory Organization**
   - Hierarchical memory structures
   - Topic-based clustering
   - Temporal decay (memories fade over time)

3. **Collaborative Memory**
   - Share memories across users (with permissions)
   - Team/organization-level memories
   - Federated learning from multiple users

4. **Memory Analytics**
   - Dashboard showing memory growth
   - Most accessed memories
   - Memory quality metrics

5. **Advanced Retrieval**
   - Hybrid search (vector + keyword)
   - Temporal filters (recent vs historical)
   - Contextual reranking
   - Multi-query retrieval

6. **Memory Compression**
   - Summarize related memories
   - Merge redundant information
   - Archive old memories

7. **Privacy & Security**
   - Encrypted memories
   - Automatic PII detection and masking
   - GDPR compliance (right to be forgotten)
   - User-controlled memory deletion

8. **Memory Sharing**
   - Export memories as JSON
   - Import memories from other systems
   - Share specific memories with other users

---

## TypeScript Type Definitions

```typescript
// lib/memory/types.ts

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
```

---

## Summary

This design provides a comprehensive blueprint for adding intelligent memory capabilities to the AI chatbot. Key features include:

### ✅ Core Capabilities
- **Intelligent extraction** using LLM-powered fact identification
- **Semantic search** with vector similarity
- **Automatic deduplication** and updates
- **Complete audit trails** for all memory operations
- **Edge Runtime compatible** design

### ✅ Architecture Highlights
- **Modular design** with clear separation of concerns
- **TypeScript type safety** throughout
- **Flexible storage** supporting OpenSearch, PostgreSQL, SQLite
- **Parallel execution** for performance
- **Background processing** for heavy operations

### ✅ Integration Points
- Seamless integration with existing Next.js chatbot
- Non-breaking changes to current functionality
- Progressive enhancement approach
- User session management

### ✅ Production Ready
- Environment-based configuration
- Error handling and fallbacks
- Performance optimization strategies
- Scalability considerations

The implementation can be done in phases, starting with core infrastructure and gradually adding advanced features. Each phase builds upon the previous one, allowing for iterative development and testing.
