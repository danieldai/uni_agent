#!/bin/bash

echo "Setting up SQLite database for memory service"
echo "=============================================="

# Create data directory if it doesn't exist
mkdir -p data

# Database file path
DB_PATH="data/chatbot.db"

echo ""
echo "Database path: $DB_PATH"
echo ""

# Check if database already exists
if [ -f "$DB_PATH" ]; then
  echo "⚠️  Database file already exists!"
  read -p "Do you want to recreate it? This will DELETE all data! (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Removing existing database..."
    rm "$DB_PATH"
  else
    echo "Keeping existing database. Skipping migration."
    exit 0
  fi
fi

# Run migration
echo "Running migration: 001_create_memory_tables.sql"
sqlite3 "$DB_PATH" < db/migrations/001_create_memory_tables.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
else
  echo "❌ Migration failed!"
  exit 1
fi

echo ""
echo "Verifying schema..."
echo ""

# Show tables
echo "Tables created:"
sqlite3 "$DB_PATH" ".tables"

echo ""
echo "Schema version:"
sqlite3 "$DB_PATH" "SELECT * FROM schema_version;"

echo ""
echo "Memory history table schema:"
sqlite3 "$DB_PATH" ".schema memory_history"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Database location: $DB_PATH"
echo "To connect: sqlite3 $DB_PATH"
