# OpenSearch Setup Documentation

## Overview

This document describes the OpenSearch setup for the memory service, which uses vector search with k-NN (k-Nearest Neighbors) to store and retrieve conversational memories.

## Installation

### Prerequisites

- Docker installed on your system
- Port 9200 available for OpenSearch
- Port 9600 available for OpenSearch performance analyzer

### Starting OpenSearch

Run the following command to start OpenSearch in a Docker container:

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

**Note:** For production, you should enable security and use proper authentication. The above configuration disables security for local development convenience.

### Verifying Installation

Wait 10-15 seconds for OpenSearch to start, then verify it's running:

```bash
curl -X GET "localhost:9200/_cluster/health?pretty"
```

You should see output with `"status": "green"` indicating a healthy cluster.

## Index Creation

### Running the Setup Script

Execute the index creation script:

```bash
./scripts/create-opensearch-index.sh
```

This script creates the `chatbot_memories` index with the following configuration:

### Index Configuration

**Settings:**
- k-NN enabled: `true`
- ef_search: `100` (controls search accuracy/speed tradeoff)
- Shards: `1` (single-node setup)
- Replicas: `0` (no replication for local dev)

**Mappings:**

| Field | Type | Description |
|-------|------|-------------|
| `memory_vector` | knn_vector (1536 dimensions) | Embedding vector for semantic search |
| `user_id` | keyword | User identifier for filtering |
| `data` | text | The actual memory content |
| `hash` | keyword | Hash for deduplication |
| `created_at` | date | When the memory was created |
| `updated_at` | date | When the memory was last updated |
| `metadata` | object | Additional metadata |

**Vector Configuration:**
- Algorithm: HNSW (Hierarchical Navigable Small World)
- Space type: Cosine similarity
- Engine: nmslib
- ef_construction: `128`
- m (number of connections): `16`

## Testing

### Test Vector Insertion

Run the test script to verify vector insertion:

```bash
./scripts/test-vector-insertion.sh
```

This inserts a test document with a 1536-dimensional vector and verifies it was stored correctly.

### Manual Testing

Insert a test document:

```bash
curl -X POST "localhost:9200/chatbot_memories/_doc/test1" \
  -H 'Content-Type: application/json' \
  -d '{
    "memory_vector": [0.1, 0.2, ...],  # 1536 dimensions
    "user_id": "test_user",
    "data": "Test memory",
    "hash": "abc123",
    "created_at": "2025-01-20T00:00:00Z"
  }'
```

Retrieve the document:

```bash
curl -X GET "localhost:9200/chatbot_memories/_doc/test1?pretty"
```

## Vector Search Example

Perform a k-NN search:

```bash
curl -X GET "localhost:9200/chatbot_memories/_search" \
  -H 'Content-Type: application/json' \
  -d '{
    "size": 5,
    "query": {
      "bool": {
        "must": [
          {"term": {"user_id": "user_123"}}
        ],
        "filter": {
          "knn": {
            "memory_vector": {
              "vector": [0.1, 0.2, ...],
              "k": 5
            }
          }
        }
      }
    }
  }'
```

## Index Management

### View Index Stats

```bash
curl -X GET "localhost:9200/chatbot_memories/_stats?pretty"
```

### View Index Mappings

```bash
curl -X GET "localhost:9200/chatbot_memories/_mapping?pretty"
```

### Delete Index (Warning: Destroys all data)

```bash
curl -X DELETE "localhost:9200/chatbot_memories"
```

### Recreate Index

If you need to recreate the index with different settings:

```bash
curl -X DELETE "localhost:9200/chatbot_memories"
./scripts/create-opensearch-index.sh
```

## Container Management

### Start Container

```bash
docker start opensearch-memory
```

### Stop Container

```bash
docker stop opensearch-memory
```

### View Logs

```bash
docker logs opensearch-memory
```

### Remove Container

```bash
docker stop opensearch-memory
docker rm opensearch-memory
```

## Performance Tuning

### Index Settings

- **ef_search**: Higher values (100-500) = better accuracy but slower search
- **ef_construction**: Higher values (128-512) = better quality index but slower indexing
- **m**: Higher values (16-64) = better recall but more memory usage

### For Production

1. Enable security:
   ```bash
   # Remove -e "plugins.security.disabled=true"
   # Set proper admin password
   ```

2. Configure persistence:
   ```bash
   docker run -d \
     -p 9200:9200 \
     -p 9600:9600 \
     -v opensearch-data:/usr/share/opensearch/data \
     ...
   ```

3. Adjust JVM heap:
   ```bash
   -e "OPENSEARCH_JAVA_OPTS=-Xms2g -Xmx2g"
   ```

4. Use multiple shards for large datasets:
   ```json
   "number_of_shards": 3,
   "number_of_replicas": 1
   ```

## Troubleshooting

### Connection Refused

- Check if container is running: `docker ps`
- Check logs: `docker logs opensearch-memory`
- Verify port is not in use: `lsof -i :9200`

### Out of Memory

- Increase Docker memory allocation
- Adjust JVM heap settings
- Reduce vector dimensions if possible

### Slow Searches

- Reduce `ef_search` value
- Add more specific filters (user_id, date ranges)
- Consider index partitioning by user

### Index Creation Failed

- Delete existing index first
- Check OpenSearch logs for errors
- Verify JSON syntax in mappings

## Environment Variables for Application

Add these to your `.env.local`:

```env
OPENSEARCH_NODE=http://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=YourStrongPassword123!
OPENSEARCH_INDEX=chatbot_memories
```

## Next Steps

1. Set up the database for history tracking (Task 1.2)
2. Install TypeScript dependencies (Task 1.3)
3. Implement the OpenSearchStore class (Task 1.5)

## Resources

- [OpenSearch Documentation](https://opensearch.org/docs/latest/)
- [k-NN Plugin Guide](https://opensearch.org/docs/latest/search-plugins/knn/index/)
- [HNSW Algorithm](https://arxiv.org/abs/1603.09320)

---

**Created:** 2025-01-20
**Last Updated:** 2025-01-20
**Status:** ✅ Complete
