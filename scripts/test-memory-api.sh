#!/bin/bash

# Memory API Endpoints Test Script
# Tests all memory API endpoints to ensure they're working correctly

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL (adjust if needed)
BASE_URL="http://localhost:3000"

# Test user ID
USER_ID="test_user_$(date +%s)"

echo -e "${BLUE}=== Memory API Endpoints Test ===${NC}\n"
echo -e "Test User ID: ${USER_ID}\n"

# Test 1: Add memories
echo -e "${BLUE}Test 1: Adding memories${NC}"
ADD_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/memory/add" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"${USER_ID}\",
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": \"My name is Alice and I work as a software engineer in San Francisco\"
      },
      {
        \"role\": \"assistant\",
        \"content\": \"Nice to meet you, Alice! What kind of software do you work on?\"
      },
      {
        \"role\": \"user\",
        \"content\": \"I love working on backend systems and databases. I also enjoy hiking on weekends.\"
      }
    ]
  }")

echo "${ADD_RESPONSE}" | jq '.'

if echo "${ADD_RESPONSE}" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Add memories test passed${NC}\n"
else
  echo -e "${RED}✗ Add memories test failed${NC}\n"
  exit 1
fi

# Wait for indexing
echo "Waiting 3 seconds for OpenSearch indexing..."
sleep 3

# Test 2: Search memories
echo -e "\n${BLUE}Test 2: Searching for memories${NC}"
SEARCH_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/memory/search?query=What%20is%20my%20name&userId=${USER_ID}&limit=5")

echo "${SEARCH_RESPONSE}" | jq '.'

if echo "${SEARCH_RESPONSE}" | jq -e '.success' > /dev/null; then
  echo -e "${GREEN}✓ Search memories test passed${NC}\n"
else
  echo -e "${RED}✗ Search memories test failed${NC}\n"
  exit 1
fi

# Test 3: Get all memories
echo -e "\n${BLUE}Test 3: Getting all memories${NC}"
GETALL_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/memory?userId=${USER_ID}")

echo "${GETALL_RESPONSE}" | jq '.'

if echo "${GETALL_RESPONSE}" | jq -e '.success' > /dev/null; then
  MEMORY_COUNT=$(echo "${GETALL_RESPONSE}" | jq '.count')
  echo -e "${GREEN}✓ Get all memories test passed (${MEMORY_COUNT} memories)${NC}\n"

  # Extract a memory ID for history and delete tests
  MEMORY_ID=$(echo "${GETALL_RESPONSE}" | jq -r '.results[0].id')
  echo "Using memory ID for next tests: ${MEMORY_ID}"
else
  echo -e "${RED}✗ Get all memories test failed${NC}\n"
  exit 1
fi

# Test 4: Get memory history
if [ ! -z "${MEMORY_ID}" ]; then
  echo -e "\n${BLUE}Test 4: Getting memory history${NC}"
  HISTORY_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/memory/${MEMORY_ID}/history")

  echo "${HISTORY_RESPONSE}" | jq '.'

  if echo "${HISTORY_RESPONSE}" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Memory history test passed${NC}\n"
  else
    echo -e "${RED}✗ Memory history test failed${NC}\n"
    exit 1
  fi
fi

# Test 5: Delete memory
if [ ! -z "${MEMORY_ID}" ]; then
  echo -e "\n${BLUE}Test 5: Deleting a memory${NC}"
  DELETE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/api/memory" \
    -H "Content-Type: application/json" \
    -d "{\"memoryId\": \"${MEMORY_ID}\"}")

  echo "${DELETE_RESPONSE}" | jq '.'

  if echo "${DELETE_RESPONSE}" | jq -e '.success' > /dev/null; then
    echo -e "${GREEN}✓ Delete memory test passed${NC}\n"
  else
    echo -e "${RED}✗ Delete memory test failed${NC}\n"
    exit 1
  fi

  # Verify deletion
  echo -e "\n${BLUE}Test 6: Verifying deletion${NC}"
  sleep 2
  VERIFY_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/memory?userId=${USER_ID}")
  REMAINING_COUNT=$(echo "${VERIFY_RESPONSE}" | jq '.count')

  echo "Remaining memories: ${REMAINING_COUNT}"

  if [ "${REMAINING_COUNT}" -lt "${MEMORY_COUNT}" ]; then
    echo -e "${GREEN}✓ Deletion verified${NC}\n"
  else
    echo -e "${RED}✗ Deletion verification failed${NC}\n"
  fi
fi

echo -e "\n${GREEN}=== All tests completed successfully ===${NC}"
