#!/bin/bash

echo "Creating OpenSearch index: chatbot_memories"
echo "=========================================="

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

echo ""
echo ""
echo "Index creation complete!"
echo ""
echo "Verifying index..."
curl -X GET "localhost:9200/chatbot_memories?pretty"
