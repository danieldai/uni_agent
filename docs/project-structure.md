# Project Structure Documentation

## Overview

This document describes the directory structure and organization of the memory service implementation.

## Directory Structure

```
memory_with_opensearch/
├── app/
│   ├── api/
│   │   ├── chat/              # Chat API endpoint
│   │   └── memory/            # Memory service API endpoints
│   │       ├── add/           # Manual memory addition
│   │       ├── search/        # Memory search endpoint
│   │       └── history/       # Memory history endpoint
│   └── page.tsx               # Main chat interface
│
├── lib/
│   └── memory/                # Memory service core
│       ├── stores/            # Data storage implementations
│       ├── embeddings/        # Embedding generators
│       ├── extractors/        # Fact and action extractors
│       ├── utils/             # Utility functions
│       └── types.ts           # TypeScript type definitions
│
├── db/
│   └── migrations/            # Database migration scripts
│       └── 001_create_memory_tables.sql
│
├── scripts/                   # Setup and testing scripts
│   ├── create-opensearch-index.sh
│   ├── setup-database.sh
│   ├── test-database.sh
│   └── test-vector-insertion.sh
│
├── docs/                      # Documentation
│   ├── opensearch-setup.md
│   ├── database-setup.md
│   └── project-structure.md
│
├── data/                      # Local data (gitignored)
│   └── chatbot.db             # SQLite database
│
└── __project_context/         # Project documentation
    ├── agent_memory.md        # Memory system design
    └── implementation_plan.md # Implementation plan
```

## Core Components

### `/lib/memory/`

The heart of the memory service implementation.

#### `types.ts`
Central type definitions for the entire memory system:
- **Message**: Chat message structure
- **Memory**: Memory record structure
- **MemoryAction**: Actions (ADD/UPDATE/DELETE/NONE)
- **HistoryEntry**: Audit trail entries
- **SearchResult**: Vector search results
- **VectorStore**: Interface for vector storage
- **EmbeddingGenerator**: Interface for embedding generation
- **MemoryConfig**: Configuration structure

#### `stores/` (To be implemented)
Data storage implementations:
- **OpenSearchStore.ts**: Vector storage with k-NN search
- **HistoryStore.ts**: SQLite/PostgreSQL history tracking

#### `embeddings/` (To be implemented)
Embedding generation:
- **OpenAIEmbedding.ts**: OpenAI embedding API integration

#### `extractors/` (To be implemented)
LLM-powered extraction:
- **FactExtractor.ts**: Extract facts from conversations
- **ActionDecider.ts**: Decide memory actions (ADD/UPDATE/DELETE)

#### `utils/` (To be implemented)
Helper utilities:
- **messageParser.ts**: Parse chat messages
- **contextBuilder.ts**: Build LLM context with memories
- **tokenBudget.ts**: Manage token allocation
- **hash.ts**: Generate memory hashes for deduplication

### `/app/api/memory/`

RESTful API endpoints for memory operations.

#### `add/route.ts` (To be implemented)
- POST: Manually add memories from messages
- Request: `{ messages: Message[], userId: string }`
- Response: `MemoryResult`

#### `search/route.ts` (To be implemented)
- GET: Search memories by query
- Query params: `query`, `userId`, `limit`
- Response: `{ results: Memory[] }`

#### `history/[id]/route.ts` (To be implemented)
- GET: Get history for a specific memory
- Param: `id` (memory ID)
- Response: `{ history: HistoryEntry[] }`

### `/db/migrations/`

Database schema migrations:
- `001_create_memory_tables.sql`: Initial schema (users, memory_history, chat_sessions)

### `/scripts/`

Automation and testing scripts:
- **create-opensearch-index.sh**: Create vector index
- **setup-database.sh**: Initialize SQLite database
- **test-database.sh**: Test database operations
- **test-vector-insertion.sh**: Test OpenSearch vector storage

### `/docs/`

Documentation:
- **opensearch-setup.md**: OpenSearch installation and configuration
- **database-setup.md**: Database schema and operations
- **project-structure.md**: This file

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @opensearch-project/opensearch | ^3.5.1 | Vector storage with k-NN |
| pg | ^8.16.3 | PostgreSQL client (SQLite alternative) |
| uuid | ^13.0.0 | Generate unique IDs |
| crypto-js | ^4.2.0 | Hash generation for deduplication |
| openai | ^6.5.0 | OpenAI API (embeddings + LLM) |
| next | 15.5.6 | Next.js framework |
| react | 19.1.0 | React library |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @types/pg | ^8.15.5 | TypeScript types for pg |
| @types/uuid | ^10.0.0 | TypeScript types for uuid |
| @types/crypto-js | ^4.2.2 | TypeScript types for crypto-js |
| typescript | ^5 | TypeScript compiler |
| @types/node | ^20 | Node.js type definitions |

## File Naming Conventions

- **TypeScript files**: PascalCase for classes (e.g., `OpenSearchStore.ts`)
- **Utility files**: camelCase (e.g., `messageParser.ts`)
- **Type files**: lowercase (e.g., `types.ts`)
- **Shell scripts**: kebab-case with `.sh` extension (e.g., `setup-database.sh`)
- **SQL migrations**: numbered prefix (e.g., `001_create_memory_tables.sql`)

## Code Organization

### Interfaces First
All major components implement interfaces defined in `types.ts`:
```typescript
export class OpenSearchStore implements VectorStore { ... }
export class OpenAIEmbeddingGenerator implements EmbeddingGenerator { ... }
```

### Dependency Injection
Components receive dependencies via constructor:
```typescript
class MemoryService {
  constructor(
    private vectorStore: VectorStore,
    private historyStore: HistoryStore,
    private embeddingGenerator: EmbeddingGenerator
  ) {}
}
```

### Configuration
All configuration loaded from environment variables via `lib/memory/config.ts`.

## Environment Variables

Required environment variables (to be set in `.env.local`):

```env
# OpenAI API
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=sk-your-key
OPENAI_MODEL=gpt-3.5-turbo

# Memory Service
MEMORY_ENABLED=true

# OpenSearch
OPENSEARCH_NODE=http://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=YourStrongPassword123!
OPENSEARCH_INDEX=chatbot_memories

# Embeddings
EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536

# Memory Behavior
MEMORY_SIMILARITY_THRESHOLD=0.7
MEMORY_RETRIEVAL_LIMIT=5
MEMORY_EXTRACTION_ENABLED=true

# Database
DATABASE_URL=file:./data/chatbot.db

# Performance
MEMORY_CACHE_TTL=3600
MEMORY_BATCH_SIZE=10
```

## Next Steps

### Immediate (Week 1)
1. ✅ Task 1.1: OpenSearch Setup
2. ✅ Task 1.2: Database Setup
3. ✅ Task 1.3: Project Structure & Dependencies
4. Task 1.4: Configuration System
5. Task 1.5: OpenSearch Vector Store Implementation
6. Task 1.6: History Store Implementation
7. Task 1.7: Embedding Generator Implementation

### Week 2 - Memory Extraction Pipeline
- Implement prompt templates
- Create fact extractor
- Implement action decider
- Build core MemoryService.add() method

### Week 3 - Memory Retrieval Pipeline
- Implement search functionality
- Create context builder
- Add token budget management

### Week 4 - Chat Integration
- Integrate with chat API
- Create memory API endpoints
- Add UI components
- Testing and documentation

## Development Workflow

1. **Start Services**
   ```bash
   # Start OpenSearch (if not running)
   docker start opensearch-memory

   # Start development server
   npm run dev
   ```

2. **Run Tests**
   ```bash
   # Test OpenSearch
   ./scripts/test-vector-insertion.sh

   # Test Database
   ./scripts/test-database.sh

   # TypeScript compilation
   npx tsc --noEmit
   ```

3. **Database Operations**
   ```bash
   # Connect to database
   sqlite3 data/chatbot.db

   # View schema
   .schema memory_history
   ```

## Best Practices

1. **Type Safety**: Always use TypeScript types from `types.ts`
2. **Error Handling**: Use try-catch for all external operations
3. **Logging**: Log important operations and errors
4. **Testing**: Test each component independently before integration
5. **Documentation**: Update docs when adding new features

## Resources

- [Implementation Plan](__project_context/implementation_plan.md)
- [Memory System Design](__project_context/agent_memory.md)
- [OpenSearch Setup](docs/opensearch-setup.md)
- [Database Setup](docs/database-setup.md)

---

**Created:** 2025-01-20
**Last Updated:** 2025-01-20
**Status:** ✅ Complete
