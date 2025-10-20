#!/bin/bash

echo "Testing vector insertion into OpenSearch"
echo "=========================================="

# Create a test vector with 1536 dimensions (filled with 0.1 for testing)
# In production, this would come from an embedding model
VECTOR=$(python3 -c "import json; print(json.dumps([0.1] * 1536))")

echo "Inserting test document with 1536-dimensional vector..."

curl -X POST "localhost:9200/chatbot_memories/_doc/test1" \
  -H 'Content-Type: application/json' \
  -d "{
    \"memory_vector\": $VECTOR,
    \"user_id\": \"test_user\",
    \"data\": \"Test memory: User loves programming\",
    \"hash\": \"abc123\",
    \"created_at\": \"2025-01-20T00:00:00Z\"
  }"

echo ""
echo ""
echo "Insertion complete!"
echo ""
echo "Retrieving test document..."
curl -X GET "localhost:9200/chatbot_memories/_doc/test1?pretty"
echo ""
echo ""
echo "Searching for documents by user_id..."
curl -X GET "localhost:9200/chatbot_memories/_search?pretty" \
  -H 'Content-Type: application/json' \
  -d '{
    "query": {
      "term": {
        "user_id": "test_user"
      }
    }
  }'
