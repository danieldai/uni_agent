# Memory Service Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup & Installation](#setup--installation)
3. [Core Components](#core-components)
4. [API Reference](#api-reference)
5. [Testing](#testing)
6. [Configuration](#configuration)
7. [Troubleshooting](#troubleshooting)
8. [Performance Optimization](#performance-optimization)
9. [Deployment](#deployment)

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (Next.js)                      │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │ Chat UI      │────────▶│ Memory UI    │                      │
│  └──────────────┘         └──────────────┘                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (Next.js Routes)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/chat    │  │ /api/memory  │  │ /api/memory/ │          │
│  │              │  │              │  │ search       │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼─────────────────┘
          │                  │                  │
          │                  ▼                  │
          │         ┌────────────────────┐      │
          └────────▶│  MemoryService     │◀─────┘
                    └─────────┬──────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐
│  FactExtractor   │ │  ActionDecider   │ │  Embedding     │
│  (LLM-based)     │ │  (LLM-based)     │ │  Generator     │
└──────────────────┘ └──────────────────┘ └────────────────┘
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌──────────────────┐ ┌──────────────────┐ ┌────────────────┐
│  OpenSearchStore │ │  HistoryStore    │ │  Token Budget  │
│  (Vector DB)     │ │  (PostgreSQL)    │ │  Manager       │
└──────────────────┘ └──────────────────┘ └────────────────┘
```

### Data Flow

#### Memory Extraction Flow

```
User Message
    ↓
1. Extract Facts (LLM)
    ↓
2. Generate Embeddings (OpenAI)
    ↓
3. Search Similar Memories (OpenSearch)
    ↓
4. Decide Actions (LLM: ADD/UPDATE/DELETE/NONE)
    ↓
5. Execute Actions (OpenSearch + PostgreSQL)
    ↓
Memory Updated
```

#### Memory Retrieval Flow

```
User Query
    ↓
1. Generate Query Embedding (OpenAI)
    ↓
2. Vector Search (OpenSearch k-NN)
    ↓
3. Filter by Similarity Threshold
    ↓
4. Apply Token Budget
    ↓
5. Return Ranked Memories
```

---

## Setup & Installation

### Prerequisites

- Node.js 20+
- Docker (for OpenSearch)
- PostgreSQL or SQLite
- OpenAI API key

### Quick Start

1. **Clone and Install**

```bash
git clone <repository>
cd memory_with_opensearch
npm install
```

2. **Start OpenSearch**

```bash
docker run -d \
  -p 9200:9200 \
  -p 9600:9600 \
  -e "discovery.type=single-node" \
  -e "OPENSEARCH_INITIAL_ADMIN_PASSWORD=YourStrongPassword123!" \
  -e "plugins.security.disabled=true" \
  --name opensearch-memory \
  opensearchproject/opensearch:latest
```

3. **Create OpenSearch Index**

```bash
bash scripts/create-opensearch-index.sh
```

4. **Setup Database**

```bash
# For PostgreSQL
createdb chatbot_memory
psql chatbot_memory < db/migrations/001_create_memory_tables.sql

# For SQLite
mkdir -p data
sqlite3 data/chatbot.db < db/migrations/001_create_memory_tables.sql
```

5. **Configure Environment**

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

6. **Run Development Server**

```bash
npm run dev
```

### Environment Variables

See [Configuration](#configuration) section for details.

---

## Core Components

### 1. MemoryService

**Location**: `lib/memory/MemoryService.ts`

The main orchestrator that coordinates all memory operations.

**Key Methods**:

```typescript
class MemoryService {
  // Add memories from conversation
  async add(messages: Message[], userId: string): Promise<MemoryResult>

  // Search for relevant memories
  async search(query: string, userId: string, limit?: number, maxTokens?: number): Promise<Memory[]>

  // Get all memories for a user
  async getAll(userId: string): Promise<Memory[]>

  // Get change history for a memory
  async history(memoryId: string): Promise<HistoryEntry[]>

  // Delete a specific memory
  async delete(memoryId: string): Promise<void>
}
```

**Usage Example**:

```typescript
import { MemoryService } from '@/lib/memory/MemoryService';

const memoryService = new MemoryService();

// Add memories
const result = await memoryService.add([
  { id: '1', role: 'user', content: 'My name is Alice', timestamp: Date.now() }
], 'user_123');

// Search memories
const memories = await memoryService.search("What's my name?", 'user_123');

// Get all memories
const allMemories = await memoryService.getAll('user_123');
```

### 2. FactExtractor

**Location**: `lib/memory/extractors/FactExtractor.ts`

Extracts important facts from conversation using LLM.

**How it works**:
- Takes conversation messages as input
- Uses GPT model with structured JSON output
- Returns array of extracted facts

**Prompt Template**: See `lib/memory/prompts.ts`

### 3. ActionDecider

**Location**: `lib/memory/extractors/ActionDecider.ts`

Decides what action to take for each fact (ADD/UPDATE/DELETE/NONE).

**Decision Logic**:
- Compares new facts with existing similar memories
- Uses LLM to determine semantic relationships
- Returns structured decisions with IDs

### 4. OpenSearchStore

**Location**: `lib/memory/stores/OpenSearchStore.ts`

Vector database interface for semantic search.

**Key Features**:
- k-NN search using HNSW algorithm
- Cosine similarity scoring
- User-based filtering
- Bulk insert support

**Methods**:

```typescript
class OpenSearchStore {
  async insert(vectors: number[][], ids: string[], payloads: any[]): Promise<void>
  async search(query: number[], filters: Filter, limit: number): Promise<SearchResult[]>
  async update(id: string, vector: number[], payload: any): Promise<void>
  async delete(id: string): Promise<void>
  async get(id: string): Promise<any>
  async getAllByUserId(userId: string, limit?: number): Promise<SearchResult[]>
}
```

### 5. HistoryStore

**Location**: `lib/memory/stores/HistoryStore.ts`

PostgreSQL/SQLite interface for audit trail.

**Schema**:

```sql
CREATE TABLE memory_history (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  prev_value TEXT,
  new_value TEXT,
  event TEXT NOT NULL CHECK (event IN ('ADD', 'UPDATE', 'DELETE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
```

### 6. OpenAIEmbedding

**Location**: `lib/memory/embeddings/OpenAIEmbedding.ts`

Generates vector embeddings using OpenAI API.

**Features**:
- Caching with TTL
- Batch embedding support
- LRU eviction for cache

**Usage**:

```typescript
const embedding = new OpenAIEmbedding();

// Single embedding
const vector = await embedding.embed("Hello world");

// Batch embeddings
const vectors = await embedding.embedBatch(["Hello", "World"]);
```

---

## API Reference

### POST /api/chat

Main chat endpoint with memory integration.

**Request**:
```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ],
  "userId": "user_123"
}
```

**Response**: Streaming text response

**Headers**:
- `X-Memories-Retrieved`: Number of memories used for context

### GET /api/memory/search

Search for memories by query.

**Query Parameters**:
- `query` (required): Search query
- `userId` (required): User ID
- `limit` (optional): Max results (default: 5)

**Response**:
```json
{
  "results": [
    {
      "id": "mem_123",
      "memory": "User's name is Alice",
      "score": 0.92,
      "created_at": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### GET /api/memory

Get all memories for a user.

**Query Parameters**:
- `userId` (required): User ID

**Response**:
```json
{
  "results": [
    {
      "id": "mem_123",
      "memory": "User's name is Alice",
      "user_id": "user_123",
      "created_at": "2025-01-20T10:00:00Z",
      "hash": "abc123..."
    }
  ]
}
```

### DELETE /api/memory

Delete a specific memory.

**Request**:
```json
{
  "memoryId": "mem_123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

### GET /api/memory/[id]/history

Get change history for a memory.

**Path Parameters**:
- `id`: Memory ID

**Response**:
```json
{
  "history": [
    {
      "id": "hist_1",
      "memory_id": "mem_123",
      "event": "ADD",
      "prev_value": null,
      "new_value": "User's name is Alice",
      "timestamp": "2025-01-20T10:00:00Z"
    }
  ]
}
```

### POST /api/memory/add

Manually trigger memory extraction.

**Request**:
```json
{
  "messages": [
    {
      "id": "1",
      "role": "user",
      "content": "I love pizza",
      "timestamp": 1642684800000
    }
  ],
  "userId": "user_123"
}
```

**Response**:
```json
{
  "results": [
    {
      "id": "mem_xyz",
      "memory": "User loves pizza",
      "event": "ADD"
    }
  ]
}
```

---

## Testing

### Running Tests

```bash
# End-to-end test
npx tsx scripts/test-e2e.ts

# Individual component tests
npx tsx scripts/test-opensearch.ts
npx tsx scripts/test-history-store.ts
npx tsx scripts/test-embeddings.ts
npx tsx scripts/test-fact-extraction.ts
```

### Test Coverage

The E2E test (`scripts/test-e2e.ts`) covers:

1. ✅ Memory extraction from conversation
2. ✅ Semantic search
3. ✅ Memory updates
4. ✅ Memory deletion
5. ✅ History tracking
6. ✅ GetAll functionality

### Writing Custom Tests

```typescript
import { MemoryService } from '../lib/memory/MemoryService';

async function myTest() {
  const service = new MemoryService();
  const userId = 'test_user';

  // Your test logic here
  const result = await service.add([...], userId);

  console.assert(result.results.length > 0, 'Should extract memories');
}

myTest().catch(console.error);
```

---

## Configuration

### Environment Variables

**Required**:

```env
# OpenAI
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# Memory Service
MEMORY_ENABLED=true

# OpenSearch
OPENSEARCH_NODE=http://localhost:9200
OPENSEARCH_INDEX=chatbot_memories

# Database
DATABASE_URL=postgresql://localhost/chatbot_memory

# Embeddings
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

**Optional**:

```env
# OpenSearch Auth (if security enabled)
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=YourStrongPassword123!

# Memory Behavior
MEMORY_SIMILARITY_THRESHOLD=0.7
MEMORY_RETRIEVAL_LIMIT=5
MEMORY_EXTRACTION_ENABLED=true

# Performance
MEMORY_CACHE_TTL=3600
MEMORY_BATCH_SIZE=10
```

### Configuration File

See `lib/memory/config.ts` for runtime configuration.

**Customizing Prompts**:

Edit `lib/memory/prompts.ts` to modify extraction and decision logic.

---

## Troubleshooting

### Common Issues

#### 1. OpenSearch Connection Errors

**Symptoms**: `ECONNREFUSED`, `connection timeout`

**Solutions**:
- Verify Docker container is running: `docker ps`
- Check port 9200 is accessible: `curl http://localhost:9200`
- Ensure no firewall blocking connections
- Check `OPENSEARCH_NODE` in `.env.local`

#### 2. Embedding API Errors

**Symptoms**: `429 Too Many Requests`, `401 Unauthorized`

**Solutions**:
- Verify `OPENAI_API_KEY` is correct
- Check API quota and billing
- Implement rate limiting
- Use caching to reduce API calls

#### 3. Memory Not Retrieved

**Symptoms**: Chat doesn't use stored memories

**Solutions**:
- Check `MEMORY_ENABLED=true` in `.env.local`
- Lower `MEMORY_SIMILARITY_THRESHOLD` (default: 0.7)
- Wait 1-2 seconds after adding memories (indexing delay)
- Verify user ID matches between requests
- Check OpenSearch index exists

#### 4. Database Connection Issues

**Symptoms**: `connection refused`, `relation does not exist`

**Solutions**:
- Verify database is running
- Check `DATABASE_URL` format is correct
- Run migrations: `psql chatbot_memory < db/migrations/001_create_memory_tables.sql`
- Check connection pool settings

#### 5. Edge Runtime Compatibility

**Symptoms**: `Dynamic Code Evaluation` errors

**Solutions**:
- Change to Node.js runtime: `export const runtime = 'nodejs'`
- Move memory operations to separate API routes
- Use fetch-based clients instead of SDK clients

### Debugging Tips

**Enable Detailed Logging**:

```typescript
// In MemoryService.ts
console.log('Step N: Description...', data);
```

**Check OpenSearch Index**:

```bash
# View index mapping
curl http://localhost:9200/chatbot_memories

# View all documents
curl http://localhost:9200/chatbot_memories/_search?pretty

# Count documents
curl http://localhost:9200/chatbot_memories/_count
```

**Check Database**:

```sql
-- View all history entries
SELECT * FROM memory_history ORDER BY created_at DESC LIMIT 10;

-- Count by event type
SELECT event, COUNT(*) FROM memory_history GROUP BY event;
```

---

## Performance Optimization

### 1. Caching Strategy

**Embedding Cache**:
- In-memory LRU cache
- TTL: 1 hour (configurable)
- Max size: 1000 entries

**Implementation**: See `lib/memory/embeddings/OpenAIEmbedding.ts`

### 2. Batch Operations

**Batch Embedding**:
```typescript
// Instead of multiple single embeds
for (const text of texts) {
  await embedding.embed(text); // BAD
}

// Use batch embed
const vectors = await embedding.embedBatch(texts); // GOOD
```

### 3. Token Budget Management

**Control Context Size**:
```typescript
const memories = await memoryService.search(
  query,
  userId,
  5,
  1000 // max tokens
);
```

### 4. Connection Pooling

**PostgreSQL**: Configured in `HistoryStore.ts`
```typescript
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20, // max connections
  idleTimeoutMillis: 30000,
});
```

### 5. OpenSearch Optimization

**Index Settings**:
```json
{
  "settings": {
    "index.knn": true,
    "index.knn.algo_param.ef_search": 100,
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}
```

**k-NN Parameters**:
- `ef_construction`: 128 (build quality)
- `m`: 16 (connections per node)
- `ef_search`: 100 (search quality)

---

## Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] OpenSearch cluster running
- [ ] Database migrations applied
- [ ] SSL/TLS enabled for connections
- [ ] Rate limiting implemented
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place
- [ ] Error tracking enabled (Sentry, etc.)

### Deployment Options

#### Option 1: Vercel + Managed Services

```bash
# Deploy to Vercel
vercel --prod

# Use managed OpenSearch (AWS OpenSearch, Elastic Cloud)
# Use managed PostgreSQL (Supabase, Neon, etc.)
```

#### Option 2: Docker Compose

```yaml
version: '3.8'
services:
  opensearch:
    image: opensearchproject/opensearch:latest
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
    volumes:
      - opensearch-data:/usr/share/opensearch/data

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=chatbot_memory
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - opensearch
      - postgres
    environment:
      - OPENSEARCH_NODE=http://opensearch:9200
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/chatbot_memory

volumes:
  opensearch-data:
  postgres-data:
```

#### Option 3: Kubernetes

See `k8s/` directory for manifests (create as needed).

### Monitoring

**Metrics to Track**:
- Memory extraction rate
- Search latency
- Embedding API usage
- Database query performance
- Cache hit rate

**Recommended Tools**:
- Prometheus + Grafana
- DataDog
- New Relic
- AWS CloudWatch

### Backup Strategy

**OpenSearch**:
```bash
# Snapshot to S3
curl -X PUT "localhost:9200/_snapshot/my_backup/snapshot_1?wait_for_completion=true"
```

**PostgreSQL**:
```bash
# Regular dumps
pg_dump chatbot_memory > backup_$(date +%Y%m%d).sql
```

---

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing patterns
- Add comments for complex logic
- Write tests for new features

### Pull Request Process

1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit PR with description

---

## License

MIT License - See LICENSE file for details

---

## Support

- **Documentation**: This guide + User Guide
- **Issues**: GitHub Issues
- **Email**: support@example.com

---

**Version**: 1.0
**Last Updated**: January 2025
