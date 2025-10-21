# Memory API Reference

Complete reference for all memory management API endpoints.

## Base URL

```
http://localhost:3000/api/memory
```

---

## Endpoints

### 1. Add Memories

Extract and store memories from conversation messages.

**Endpoint:** `POST /api/memory/add`

**Request Body:**
```json
{
  "userId": "string (required)",
  "messages": [
    {
      "role": "user | assistant | system (required)",
      "content": "string (required)",
      "id": "string (optional)",
      "timestamp": "number (optional)"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "results": [
      {
        "id": "string",
        "memory": "string",
        "event": "ADD | UPDATE | DELETE | NONE",
        "old_memory": "string (only for UPDATE)"
      }
    ]
  },
  "message": "string"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "messages": [
      {
        "role": "user",
        "content": "My name is Alice and I work as a software engineer"
      },
      {
        "role": "assistant",
        "content": "Nice to meet you, Alice!"
      }
    ]
  }'
```

---

### 2. Search Memories

Perform semantic search over user's memories.

**Endpoint:** `GET /api/memory/search`

**Query Parameters:**
- `query` (required): Search query text
- `userId` (required): User ID to filter results
- `limit` (optional, default: 5): Maximum number of results (1-100)
- `maxTokens` (optional): Maximum token budget for returned memories

**Response:**
```json
{
  "success": true,
  "query": "string",
  "results": [
    {
      "id": "string",
      "memory": "string",
      "user_id": "string",
      "hash": "string",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp (optional)",
      "score": "number (0-1, similarity score)"
    }
  ],
  "count": "number"
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/memory/search?query=What%20is%20my%20name&userId=user_123&limit=5"
```

---

### 3. Get All Memories

Retrieve all memories for a user, sorted by creation date.

**Endpoint:** `GET /api/memory`

**Query Parameters:**
- `userId` (required): User ID to retrieve memories for

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "string",
      "memory": "string",
      "user_id": "string",
      "hash": "string",
      "created_at": "ISO 8601 timestamp",
      "updated_at": "ISO 8601 timestamp (optional)",
      "metadata": "object (optional)"
    }
  ],
  "count": "number"
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/memory?userId=user_123"
```

---

### 4. Get Memory History

Retrieve the complete audit trail for a specific memory.

**Endpoint:** `GET /api/memory/{id}/history`

**Path Parameters:**
- `id` (required): Memory ID to retrieve history for

**Response:**
```json
{
  "success": true,
  "memoryId": "string",
  "history": [
    {
      "id": "string",
      "memory_id": "string",
      "user_id": "string",
      "prev_value": "string | null",
      "new_value": "string | null",
      "event": "ADD | UPDATE | DELETE",
      "timestamp": "ISO 8601 timestamp",
      "metadata": "object (optional)"
    }
  ],
  "count": "number"
}
```

**Example:**
```bash
curl -X GET "http://localhost:3000/api/memory/mem_abc123/history"
```

---

### 5. Delete Memory

Remove a specific memory from the system.

**Endpoint:** `DELETE /api/memory`

**Request Body:**
```json
{
  "memoryId": "string (required)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Memory deleted successfully",
  "memoryId": "string"
}
```

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/memory \
  -H "Content-Type: application/json" \
  -d '{"memoryId": "mem_abc123"}'
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "string (error message)"
}
```

**Common HTTP Status Codes:**
- `400 Bad Request`: Invalid parameters or missing required fields
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server-side error

---

## Usage Examples

### Complete Workflow Example

```bash
# 1. Add memories from a conversation
curl -X POST http://localhost:3000/api/memory/add \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_alice",
    "messages": [
      {
        "role": "user",
        "content": "I love hiking and photography, especially in Yosemite"
      }
    ]
  }'

# Wait for indexing (2-3 seconds)
sleep 3

# 2. Search for relevant memories
curl -X GET "http://localhost:3000/api/memory/search?query=hobbies&userId=user_alice&limit=5"

# 3. Get all memories
curl -X GET "http://localhost:3000/api/memory?userId=user_alice"

# 4. Get history for a specific memory (use ID from previous response)
curl -X GET "http://localhost:3000/api/memory/mem_abc123/history"

# 5. Delete a memory
curl -X DELETE http://localhost:3000/api/memory \
  -H "Content-Type: application/json" \
  -d '{"memoryId": "mem_abc123"}'
```

---

## Implementation Notes

### Runtime
All memory API endpoints use Node.js runtime (not Edge) for compatibility with OpenSearch and PostgreSQL clients.

### Indexing Delay
OpenSearch has a refresh interval (typically 1 second) before new documents are searchable. When testing, wait 2-3 seconds after adding memories before searching.

### Similarity Threshold
Search results are filtered by a similarity threshold (default: 0.7) configured in `MEMORY_SIMILARITY_THRESHOLD` environment variable.

### Token Budget
The `maxTokens` parameter in the search endpoint allows limiting returned memories to fit within a specific token budget, useful for LLM context management.

### Authentication
These endpoints currently do not implement authentication. In production, add proper authentication middleware to verify user identity and ensure users can only access their own memories.

---

## Related Documentation

- [Implementation Plan](../implementation_plan.md)
- [Agent Memory Design](../agent_memory.md)
- [User Guide](./user-guide.md)
- [Developer Guide](./developer-guide.md)
