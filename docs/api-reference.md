# Memory Service API Reference

Complete API documentation for the Memory Service endpoints.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Chat API](#chat-api)
3. [Memory Search](#memory-search)
4. [Memory Management](#memory-management)
5. [Memory History](#memory-history)
6. [Error Handling](#error-handling)
7. [Rate Limits](#rate-limits)

---

## Authentication

Currently, the API uses user IDs for isolation. No authentication is required for local development.

**For Production**: Implement authentication middleware before exposing these endpoints.

---

## Chat API

### POST /api/chat

Chat with the AI assistant with memory-enhanced context.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "messages": [
    {
      "role": "user" | "assistant" | "system",
      "content": "string"
    }
  ],
  "userId": "string"
}
```

**Parameters**:
- `messages` (required): Array of conversation messages
  - `role`: Message role (user, assistant, or system)
  - `content`: Message text content
- `userId` (required): Unique user identifier

#### Response

**Status**: 200 OK

**Headers**:
```
Content-Type: text/plain; charset=utf-8
Transfer-Encoding: chunked
X-Memories-Retrieved: number
```

**Body**: Streaming text response from the AI

**Example**:
```
Hello! I remember you mentioned you love hiking...
```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "What do you know about me?"
      }
    ],
    "userId": "user_123"
  }'
```

#### Errors

- **400 Bad Request**: Missing or invalid parameters
- **500 Internal Server Error**: Server error during processing

---

## Memory Search

### GET /api/memory/search

Search for memories using semantic similarity.

#### Request

**Query Parameters**:
- `query` (required): Search query text
- `userId` (required): User ID to filter memories
- `limit` (optional): Maximum number of results (default: 5)

#### Response

**Status**: 200 OK

**Body**:
```json
{
  "results": [
    {
      "id": "string",
      "memory": "string",
      "user_id": "string",
      "score": "number",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp (optional)",
      "hash": "string"
    }
  ]
}
```

**Fields**:
- `id`: Unique memory identifier
- `memory`: Memory text content
- `user_id`: User who owns this memory
- `score`: Similarity score (higher = more relevant)
- `created_at`: When the memory was created
- `updated_at`: When the memory was last updated (if applicable)
- `hash`: Content hash for deduplication

#### Example Request

```bash
curl "http://localhost:3000/api/memory/search?query=my%20hobbies&userId=user_123&limit=5"
```

#### Example Response

```json
{
  "results": [
    {
      "id": "mem_abc123",
      "memory": "User loves hiking and photography",
      "user_id": "user_123",
      "score": 0.92,
      "created_at": "2025-01-20T10:00:00.000Z",
      "hash": "a1b2c3d4e5f6"
    },
    {
      "id": "mem_def456",
      "memory": "User enjoys landscape photography during sunrise",
      "user_id": "user_123",
      "score": 0.87,
      "created_at": "2025-01-20T10:05:00.000Z",
      "hash": "f6e5d4c3b2a1"
    }
  ]
}
```

#### Errors

- **400 Bad Request**: Missing `query` or `userId`
- **500 Internal Server Error**: Search error

---

## Memory Management

### GET /api/memory

Get all memories for a specific user.

#### Request

**Query Parameters**:
- `userId` (required): User ID to retrieve memories for

#### Response

**Status**: 200 OK

**Body**:
```json
{
  "results": [
    {
      "id": "string",
      "memory": "string",
      "user_id": "string",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp (optional)",
      "hash": "string",
      "metadata": "object (optional)"
    }
  ]
}
```

#### Example Request

```bash
curl "http://localhost:3000/api/memory?userId=user_123"
```

#### Example Response

```json
{
  "results": [
    {
      "id": "mem_abc123",
      "memory": "User's name is Alice",
      "user_id": "user_123",
      "created_at": "2025-01-20T10:00:00.000Z",
      "hash": "xyz789"
    },
    {
      "id": "mem_def456",
      "memory": "User works as a software engineer",
      "user_id": "user_123",
      "created_at": "2025-01-20T10:05:00.000Z",
      "updated_at": "2025-01-21T15:30:00.000Z",
      "hash": "abc123"
    }
  ]
}
```

---

### POST /api/memory/add

Manually trigger memory extraction from conversation messages.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "messages": [
    {
      "id": "string",
      "role": "user" | "assistant",
      "content": "string",
      "timestamp": "number"
    }
  ],
  "userId": "string"
}
```

**Parameters**:
- `messages` (required): Array of conversation messages
  - `id`: Message identifier
  - `role`: Message role
  - `content`: Message text
  - `timestamp`: Unix timestamp in milliseconds
- `userId` (required): User ID

#### Response

**Status**: 200 OK

**Body**:
```json
{
  "results": [
    {
      "id": "string",
      "memory": "string",
      "event": "ADD" | "UPDATE" | "DELETE" | "NONE",
      "old_memory": "string (optional)"
    }
  ]
}
```

**Event Types**:
- `ADD`: New memory created
- `UPDATE`: Existing memory updated
- `DELETE`: Memory removed
- `NONE`: No action needed (duplicate or irrelevant)

#### Example Request

```bash
curl -X POST http://localhost:3000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "id": "1",
        "role": "user",
        "content": "I love pizza and pasta",
        "timestamp": 1642684800000
      }
    ],
    "userId": "user_123"
  }'
```

#### Example Response

```json
{
  "results": [
    {
      "id": "mem_new123",
      "memory": "User loves pizza",
      "event": "ADD"
    },
    {
      "id": "mem_new456",
      "memory": "User loves pasta",
      "event": "ADD"
    }
  ]
}
```

---

### DELETE /api/memory

Delete a specific memory.

#### Request

**Headers**:
```
Content-Type: application/json
```

**Body**:
```json
{
  "memoryId": "string"
}
```

**Parameters**:
- `memoryId` (required): ID of the memory to delete

#### Response

**Status**: 200 OK

**Body**:
```json
{
  "success": true,
  "message": "Memory deleted successfully"
}
```

#### Example Request

```bash
curl -X DELETE http://localhost:3000/api/memory \
  -H "Content-Type: application/json" \
  -d '{
    "memoryId": "mem_abc123"
  }'
```

#### Errors

- **400 Bad Request**: Missing `memoryId`
- **404 Not Found**: Memory not found
- **500 Internal Server Error**: Deletion error

---

## Memory History

### GET /api/memory/[id]/history

Get the complete change history for a specific memory.

#### Request

**Path Parameters**:
- `id` (required): Memory ID

#### Response

**Status**: 200 OK

**Body**:
```json
{
  "history": [
    {
      "id": "string",
      "memory_id": "string",
      "user_id": "string",
      "event": "ADD" | "UPDATE" | "DELETE",
      "prev_value": "string | null",
      "new_value": "string | null",
      "timestamp": "ISO8601 timestamp",
      "metadata": "object (optional)"
    }
  ]
}
```

**Fields**:
- `id`: History entry ID
- `memory_id`: ID of the memory this history belongs to
- `user_id`: User who owns this memory
- `event`: Type of change (ADD, UPDATE, or DELETE)
- `prev_value`: Previous memory text (null for ADD)
- `new_value`: New memory text (null for DELETE)
- `timestamp`: When the change occurred
- `metadata`: Additional metadata (optional)

#### Example Request

```bash
curl "http://localhost:3000/api/memory/mem_abc123/history"
```

#### Example Response

```json
{
  "history": [
    {
      "id": "hist_1",
      "memory_id": "mem_abc123",
      "user_id": "user_123",
      "event": "ADD",
      "prev_value": null,
      "new_value": "User works as a product manager",
      "timestamp": "2025-01-20T10:00:00.000Z"
    },
    {
      "id": "hist_2",
      "memory_id": "mem_abc123",
      "user_id": "user_123",
      "event": "UPDATE",
      "prev_value": "User works as a product manager",
      "new_value": "User works as a senior product manager",
      "timestamp": "2025-01-21T15:30:00.000Z"
    }
  ]
}
```

#### Errors

- **400 Bad Request**: Missing memory ID
- **404 Not Found**: Memory not found
- **500 Internal Server Error**: Database error

---

## Error Handling

All endpoints follow a consistent error response format.

### Error Response Format

```json
{
  "error": "Error message description"
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid or missing parameters |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | OpenSearch or database unavailable |

### Common Error Messages

**Invalid Request**:
```json
{
  "error": "query and userId are required"
}
```

**Memory Not Found**:
```json
{
  "error": "Memory not found: mem_abc123"
}
```

**Server Error**:
```json
{
  "error": "An error occurred during the chat request"
}
```

---

## Rate Limits

**Current Status**: No rate limits implemented

**Recommended for Production**:
- 100 requests per minute per user
- 1000 requests per hour per user
- Implement using middleware like `express-rate-limit`

### Rate Limit Headers (Future)

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642684800
```

---

## Data Types

### Message

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}
```

### Memory

```typescript
interface Memory {
  id: string;
  memory: string;
  user_id: string;
  hash: string;
  created_at: string;
  updated_at?: string;
  score?: number;
  metadata?: Record<string, any>;
}
```

### MemoryAction

```typescript
interface MemoryAction {
  id: string;
  memory: string;
  event: 'ADD' | 'UPDATE' | 'DELETE' | 'NONE';
  old_memory?: string;
}
```

### HistoryEntry

```typescript
interface HistoryEntry {
  id: string;
  memory_id: string;
  user_id: string;
  event: 'ADD' | 'UPDATE' | 'DELETE';
  prev_value: string | null;
  new_value: string | null;
  timestamp: string;
  metadata?: Record<string, any>;
}
```

### SearchResult

```typescript
interface SearchResult {
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
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Search memories
async function searchMemories(query: string, userId: string) {
  const response = await fetch(
    `/api/memory/search?query=${encodeURIComponent(query)}&userId=${userId}`
  );
  const data = await response.json();
  return data.results;
}

// Get all memories
async function getAllMemories(userId: string) {
  const response = await fetch(`/api/memory?userId=${userId}`);
  const data = await response.json();
  return data.results;
}

// Delete memory
async function deleteMemory(memoryId: string) {
  const response = await fetch('/api/memory', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ memoryId })
  });
  return response.json();
}

// Chat with memory
async function chat(messages: Message[], userId: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, userId })
  });

  const memoriesRetrieved = response.headers.get('X-Memories-Retrieved');
  console.log(`Using ${memoriesRetrieved} memories`);

  // Handle streaming response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;
    const text = decoder.decode(value);
    console.log(text);
  }
}
```

### Python

```python
import requests

BASE_URL = "http://localhost:3000"

# Search memories
def search_memories(query: str, user_id: str, limit: int = 5):
    response = requests.get(
        f"{BASE_URL}/api/memory/search",
        params={"query": query, "userId": user_id, "limit": limit}
    )
    return response.json()["results"]

# Get all memories
def get_all_memories(user_id: str):
    response = requests.get(
        f"{BASE_URL}/api/memory",
        params={"userId": user_id}
    )
    return response.json()["results"]

# Delete memory
def delete_memory(memory_id: str):
    response = requests.delete(
        f"{BASE_URL}/api/memory",
        json={"memoryId": memory_id}
    )
    return response.json()

# Add memories
def add_memories(messages: list, user_id: str):
    response = requests.post(
        f"{BASE_URL}/api/memory/add",
        json={"messages": messages, "userId": user_id}
    )
    return response.json()["results"]
```

### cURL

```bash
# Search memories
curl "http://localhost:3000/api/memory/search?query=hobbies&userId=user_123"

# Get all memories
curl "http://localhost:3000/api/memory?userId=user_123"

# Delete memory
curl -X DELETE http://localhost:3000/api/memory \
  -H "Content-Type: application/json" \
  -d '{"memoryId":"mem_123"}'

# Add memories
curl -X POST http://localhost:3000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"id":"1","role":"user","content":"I love coding","timestamp":1642684800000}],
    "userId": "user_123"
  }'

# View history
curl "http://localhost:3000/api/memory/mem_123/history"
```

---

## Versioning

**Current Version**: v1 (implicit)

**Future**: API versioning will be added via path prefix (e.g., `/api/v1/memory`)

---

## Changelog

### v1.0.0 (January 2025)

- Initial release
- Memory search endpoint
- Memory CRUD operations
- History tracking
- Chat integration with memory context

---

## Support

For questions or issues:
- **Documentation**: See [User Guide](./user-guide.md) and [Developer Guide](./developer-guide.md)
- **Issues**: Report on GitHub
- **Email**: support@example.com

---

**Last Updated**: January 2025
