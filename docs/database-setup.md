# Database Setup Documentation

## Overview

This document describes the SQLite database setup for the memory service history tracking system. The database stores the audit trail of all memory operations (ADD, UPDATE, DELETE) and optional user/session information.

## Database Choice: SQLite

For this implementation, we're using SQLite because:
- Zero configuration required
- Single file database (easy to backup/restore)
- Perfect for development and small to medium deployments
- Can be easily upgraded to PostgreSQL later if needed

## Database Location

```
data/chatbot.db
```

**Important:** This file is excluded from git via `.gitignore` to prevent committing local data.

## Schema Overview

### Tables

1. **memory_history** - Audit trail of all memory operations
2. **users** - Optional user management
3. **chat_sessions** - Optional session tracking for analytics
4. **schema_version** - Tracks database migrations

## Installation

### Prerequisites

- SQLite3 installed (comes pre-installed on macOS/Linux)

### Setup Steps

1. Run the database setup script:

```bash
./scripts/setup-database.sh
```

This will:
- Create the `data` directory
- Create `data/chatbot.db`
- Run the migration script
- Verify all tables and indexes

2. Verify the setup:

```bash
./scripts/test-database.sh
```

## Schema Details

### memory_history Table

Stores the complete audit trail of memory operations.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique history entry ID (UUID) |
| memory_id | TEXT | ID of the memory being tracked |
| user_id | TEXT | User who owns this memory |
| prev_value | TEXT | Previous value (NULL for ADD) |
| new_value | TEXT | New value (NULL for DELETE) |
| event | TEXT | Operation type: ADD, UPDATE, or DELETE |
| created_at | TIMESTAMP | When this history entry was created |
| updated_at | TIMESTAMP | When this entry was last updated |
| metadata | TEXT | JSON string for additional metadata |
| is_deleted | INTEGER | Soft delete flag (0 or 1) |

**Indexes:**
- `idx_memory_history_memory_id` - Fast lookups by memory ID
- `idx_memory_history_user_id` - Fast lookups by user
- `idx_memory_history_created_at` - Fast chronological queries

**Example Record:**

```sql
INSERT INTO memory_history (
  id, memory_id, user_id, prev_value, new_value, event, metadata
) VALUES (
  'hist_abc123',
  'mem_xyz789',
  'user_001',
  'User likes pizza',
  'User loves pizza and pasta',
  'UPDATE',
  '{"source": "chatbot", "confidence": 0.95}'
);
```

### users Table (Optional)

For future user management features.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique user ID |
| email | TEXT (UNIQUE) | User email |
| created_at | TIMESTAMP | Account creation time |
| metadata | TEXT | JSON string for user settings |

### chat_sessions Table (Optional)

For tracking conversation sessions.

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT (PK) | Unique session ID |
| user_id | TEXT | User who owns this session |
| started_at | TIMESTAMP | Session start time |
| ended_at | TIMESTAMP | Session end time (NULL if active) |
| message_count | INTEGER | Number of messages in session |
| metadata | TEXT | JSON string for session data |

### schema_version Table

Tracks applied migrations.

| Column | Type | Description |
|--------|------|-------------|
| version | INTEGER (PK) | Migration version number |
| applied_at | TIMESTAMP | When migration was applied |
| description | TEXT | Migration description |

## Common Operations

### Insert History Entry

```sql
INSERT INTO memory_history (
  id, memory_id, user_id, prev_value, new_value, event, metadata
) VALUES (?, ?, ?, ?, ?, ?, ?);
```

### Get History for a Memory

```sql
SELECT * FROM memory_history
WHERE memory_id = ?
ORDER BY created_at DESC;
```

### Get User's Recent History

```sql
SELECT * FROM memory_history
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT 100;
```

### Get All Memories for a User

```sql
SELECT memory_id, new_value as current_value, event, created_at
FROM memory_history
WHERE user_id = ?
  AND event IN ('ADD', 'UPDATE')
  AND is_deleted = 0
ORDER BY created_at DESC;
```

## Testing

### Run All Tests

```bash
./scripts/test-database.sh
```

This script tests:
- Database connectivity
- Insert operations
- Query operations
- Index usage
- Join queries
- Data integrity

### Manual Testing

Connect to the database:

```bash
sqlite3 data/chatbot.db
```

Useful SQLite commands:

```sql
-- List all tables
.tables

-- Show schema for a table
.schema memory_history

-- Show indexes
SELECT name, sql FROM sqlite_master WHERE type = 'index';

-- Count records
SELECT COUNT(*) FROM memory_history;

-- View recent history
SELECT * FROM memory_history ORDER BY created_at DESC LIMIT 10;

-- Exit
.quit
```

## Maintenance

### Backup Database

```bash
# Create a backup
cp data/chatbot.db data/chatbot.db.backup

# Or use SQLite backup
sqlite3 data/chatbot.db ".backup data/chatbot.db.backup"
```

### Restore Database

```bash
cp data/chatbot.db.backup data/chatbot.db
```

### Clean Test Data

```bash
sqlite3 data/chatbot.db "DELETE FROM memory_history WHERE id LIKE 'test_%';"
sqlite3 data/chatbot.db "DELETE FROM users WHERE id LIKE 'user_test%';"
sqlite3 data/chatbot.db "DELETE FROM chat_sessions WHERE id LIKE 'session_%';"
```

### Vacuum Database

Reclaim space after deletes:

```bash
sqlite3 data/chatbot.db "VACUUM;"
```

### View Database Size

```bash
ls -lh data/chatbot.db
```

## Performance Tuning

### Analyze Query Performance

```sql
EXPLAIN QUERY PLAN
SELECT * FROM memory_history WHERE user_id = 'user_001';
```

This should show that it's using the index:
```
SEARCH memory_history USING INDEX idx_memory_history_user_id (user_id=?)
```

### Optimize Database

```bash
sqlite3 data/chatbot.db "ANALYZE;"
```

### Add Indexes

If you need additional indexes:

```sql
CREATE INDEX idx_name ON table_name(column_name);
```

## Migration Strategy

### Future Migrations

To create a new migration:

1. Create `db/migrations/002_description.sql`
2. Update `schema_version` table
3. Update setup script to run new migrations

### Upgrading to PostgreSQL

If you need to migrate to PostgreSQL later:

1. Export data:
   ```bash
   sqlite3 data/chatbot.db .dump > dump.sql
   ```

2. Modify dump.sql for PostgreSQL compatibility:
   - Change `TEXT` to `VARCHAR` or `JSONB`
   - Change `INTEGER` to `INT`
   - Update syntax differences

3. Import to PostgreSQL:
   ```bash
   psql chatbot_memory < modified_dump.sql
   ```

## Troubleshooting

### Database Locked Error

If you get "database is locked":
- Close all connections to the database
- Check for stale lock files
- Use WAL mode for better concurrency:
  ```bash
  sqlite3 data/chatbot.db "PRAGMA journal_mode=WAL;"
  ```

### Corruption

If database is corrupted:
- Try `.recover` in sqlite3
- Restore from backup
- Use `sqlite3 data/chatbot.db ".dump" | sqlite3 new.db`

### Performance Issues

- Run `ANALYZE` to update query planner statistics
- Add indexes for frequently queried columns
- Use `EXPLAIN QUERY PLAN` to optimize queries
- Consider switching to PostgreSQL for high-load scenarios

## Environment Variables

Add to `.env.local`:

```env
# SQLite Database
DATABASE_URL=file:./data/chatbot.db

# Or for PostgreSQL (future):
# DATABASE_URL=postgresql://localhost/chatbot_memory
```

## Security Considerations

1. **File Permissions**: Ensure `data/chatbot.db` has appropriate permissions
   ```bash
   chmod 600 data/chatbot.db
   ```

2. **Backup**: Regular backups to prevent data loss

3. **Soft Deletes**: Use `is_deleted` flag instead of hard deletes for audit trail

4. **Input Validation**: Always use parameterized queries to prevent SQL injection

## Integration with Memory Service

The database will be accessed via the `HistoryStore` class (to be implemented in Task 1.6):

```typescript
import { HistoryStore } from './lib/memory/stores/HistoryStore';

const store = new HistoryStore();

// Add history entry
await store.add({
  memory_id: 'mem_001',
  user_id: 'user_123',
  prev_value: null,
  new_value: 'User loves programming',
  event: 'ADD'
});

// Get history
const history = await store.getByMemoryId('mem_001');
```

## Next Steps

After database setup:

1. Install project dependencies (Task 1.3)
2. Create configuration system (Task 1.4)
3. Implement HistoryStore class (Task 1.6)

## Resources

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQLite Performance Guide](https://www.sqlite.org/performance.html)
- [SQLite FTS (Full-Text Search)](https://www.sqlite.org/fts5.html)

---

**Created:** 2025-01-20
**Last Updated:** 2025-01-20
**Status:** ✅ Complete
