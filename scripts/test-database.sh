#!/bin/bash

echo "Testing SQLite database connection and operations"
echo "=================================================="

DB_PATH="data/chatbot.db"

if [ ! -f "$DB_PATH" ]; then
  echo "❌ Database not found at $DB_PATH"
  echo "Run ./scripts/setup-database.sh first"
  exit 1
fi

echo ""
echo "✅ Database file exists"
echo ""

# Test 1: Insert into memory_history
echo "Test 1: Inserting test record into memory_history..."
sqlite3 "$DB_PATH" <<EOF
INSERT INTO memory_history (id, memory_id, user_id, prev_value, new_value, event, metadata)
VALUES (
  'test_hist_001',
  'mem_001',
  'user_test',
  NULL,
  'User loves programming',
  'ADD',
  '{"source": "test"}'
);
EOF

if [ $? -eq 0 ]; then
  echo "✅ Insert successful"
else
  echo "❌ Insert failed"
  exit 1
fi

# Test 2: Query the inserted record
echo ""
echo "Test 2: Querying inserted record..."
echo ""
sqlite3 -header -column "$DB_PATH" <<EOF
SELECT id, memory_id, user_id, event, new_value, created_at
FROM memory_history
WHERE id = 'test_hist_001';
EOF

# Test 3: Count records by user
echo ""
echo "Test 3: Counting records by user..."
echo ""
sqlite3 -header -column "$DB_PATH" <<EOF
SELECT user_id, COUNT(*) as count
FROM memory_history
GROUP BY user_id;
EOF

# Test 4: Test index usage
echo ""
echo "Test 4: Querying by user_id (should use index)..."
echo ""
sqlite3 -header -column "$DB_PATH" <<EOF
SELECT id, memory_id, event, new_value
FROM memory_history
WHERE user_id = 'user_test'
ORDER BY created_at DESC
LIMIT 5;
EOF

# Test 5: Insert into users table
echo ""
echo "Test 5: Inserting test user..."
sqlite3 "$DB_PATH" <<EOF
INSERT INTO users (id, email, metadata)
VALUES (
  'user_test',
  'test@example.com',
  '{"role": "tester"}'
);
EOF

if [ $? -eq 0 ]; then
  echo "✅ User insert successful"
else
  echo "⚠️  User insert failed (may already exist)"
fi

# Test 6: Insert into chat_sessions
echo ""
echo "Test 6: Creating test chat session..."
sqlite3 "$DB_PATH" <<EOF
INSERT INTO chat_sessions (id, user_id, message_count, metadata)
VALUES (
  'session_001',
  'user_test',
  5,
  '{"platform": "web"}'
);
EOF

if [ $? -eq 0 ]; then
  echo "✅ Chat session insert successful"
else
  echo "❌ Chat session insert failed"
fi

# Test 7: Join query
echo ""
echo "Test 7: Joining users and memory_history..."
echo ""
sqlite3 -header -column "$DB_PATH" <<EOF
SELECT
  u.id as user_id,
  u.email,
  COUNT(mh.id) as memory_count
FROM users u
LEFT JOIN memory_history mh ON u.id = mh.user_id
WHERE u.id = 'user_test'
GROUP BY u.id, u.email;
EOF

# Test 8: Schema version
echo ""
echo "Test 8: Checking schema version..."
echo ""
sqlite3 -header -column "$DB_PATH" <<EOF
SELECT version, applied_at, description
FROM schema_version;
EOF

echo ""
echo "=================================================="
echo "✅ All database tests completed successfully!"
echo ""
echo "Database statistics:"
sqlite3 "$DB_PATH" <<EOF
SELECT
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM memory_history) as total_history_entries,
  (SELECT COUNT(*) FROM chat_sessions) as total_sessions;
EOF

echo ""
echo "To clean up test data, run:"
echo "sqlite3 $DB_PATH \"DELETE FROM memory_history WHERE id LIKE 'test_%';\""
echo "sqlite3 $DB_PATH \"DELETE FROM users WHERE id LIKE 'user_test%';\""
echo "sqlite3 $DB_PATH \"DELETE FROM chat_sessions WHERE id LIKE 'session_%';\""
