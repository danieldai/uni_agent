-- Memory Service Database Schema (SQLite)
-- Migration 001: Create memory tables

-- Users table (optional - for future user management)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT -- JSON string for SQLite
);

-- Memory history
-- Tracks all changes to memories (ADD, UPDATE, DELETE)
CREATE TABLE IF NOT EXISTS memory_history (
  id TEXT PRIMARY KEY,
  memory_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  prev_value TEXT,
  new_value TEXT,
  event TEXT NOT NULL CHECK (event IN ('ADD', 'UPDATE', 'DELETE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  metadata TEXT, -- JSON string for SQLite
  is_deleted INTEGER DEFAULT 0
);

-- Indexes for memory_history
CREATE INDEX IF NOT EXISTS idx_memory_history_memory_id
  ON memory_history(memory_id);

CREATE INDEX IF NOT EXISTS idx_memory_history_user_id
  ON memory_history(user_id);

CREATE INDEX IF NOT EXISTS idx_memory_history_created_at
  ON memory_history(created_at DESC);

-- Session tracking (optional)
-- Tracks chat sessions for analytics
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  metadata TEXT -- JSON string for SQLite
);

-- Index for chat_sessions
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
  ON chat_sessions(user_id);

-- Version tracking table
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Insert version record
INSERT INTO schema_version (version, description)
VALUES (1, 'Initial schema: memory_history, users, chat_sessions');
