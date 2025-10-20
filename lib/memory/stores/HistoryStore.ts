/**
 * History Store Implementation
 *
 * Provides audit trail storage for all memory operations using SQLite.
 * Uses better-sqlite3 for synchronous operations.
 */

import { Database } from 'better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import { HistoryEntry } from '../types';
import { memoryConfig } from '../config';

export class HistoryStore {
  private db: Database;

  constructor() {
    // Parse SQLite file path from DATABASE_URL
    const dbUrl = memoryConfig.database.url;
    const dbPath = dbUrl.replace('file:', '');

    this.db = new BetterSqlite3(dbPath);

    // Enable WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
  }

  /**
   * Add a new history entry
   * @param entry History entry (without id and timestamp)
   * @returns ID of the created entry
   */
  async add(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): Promise<string> {
    const id = uuidv4();

    const stmt = this.db.prepare(`
      INSERT INTO memory_history
      (id, memory_id, user_id, prev_value, new_value, event, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entry.memory_id,
      entry.user_id,
      entry.prev_value,
      entry.new_value,
      entry.event,
      entry.metadata ? JSON.stringify(entry.metadata) : null
    );

    return id;
  }

  /**
   * Get all history entries for a specific memory
   * @param memoryId Memory ID to get history for
   * @returns Array of history entries, ordered by creation date (newest first)
   */
  async getByMemoryId(memoryId: string): Promise<HistoryEntry[]> {
    const stmt = this.db.prepare(`
      SELECT
        id, memory_id, user_id, prev_value, new_value,
        event, created_at as timestamp, metadata
      FROM memory_history
      WHERE memory_id = ?
      ORDER BY created_at DESC
    `);

    const rows = stmt.all(memoryId) as any[];

    return rows.map(row => ({
      id: row.id,
      memory_id: row.memory_id,
      user_id: row.user_id,
      prev_value: row.prev_value,
      new_value: row.new_value,
      event: row.event as 'ADD' | 'UPDATE' | 'DELETE',
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Get history entries for a specific user
   * @param userId User ID to get history for
   * @param limit Maximum number of entries to return
   * @returns Array of history entries, ordered by creation date (newest first)
   */
  async getByUserId(userId: string, limit = 100): Promise<HistoryEntry[]> {
    const stmt = this.db.prepare(`
      SELECT
        id, memory_id, user_id, prev_value, new_value,
        event, created_at as timestamp, metadata
      FROM memory_history
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(userId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      memory_id: row.memory_id,
      user_id: row.user_id,
      prev_value: row.prev_value,
      new_value: row.new_value,
      event: row.event as 'ADD' | 'UPDATE' | 'DELETE',
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Get all history entries (for debugging/admin purposes)
   * @param limit Maximum number of entries
   * @returns Array of history entries
   */
  async getAll(limit = 100): Promise<HistoryEntry[]> {
    const stmt = this.db.prepare(`
      SELECT
        id, memory_id, user_id, prev_value, new_value,
        event, created_at as timestamp, metadata
      FROM memory_history
      ORDER BY created_at DESC
      LIMIT ?
    `);

    const rows = stmt.all(limit) as any[];

    return rows.map(row => ({
      id: row.id,
      memory_id: row.memory_id,
      user_id: row.user_id,
      prev_value: row.prev_value,
      new_value: row.new_value,
      event: row.event as 'ADD' | 'UPDATE' | 'DELETE',
      timestamp: row.timestamp,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    }));
  }

  /**
   * Get count of history entries for a user
   * @param userId User ID
   * @returns Number of history entries
   */
  async getCountByUserId(userId: string): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM memory_history
      WHERE user_id = ?
    `);

    const result = stmt.get(userId) as any;
    return result.count;
  }

  /**
   * Get count of history entries for a memory
   * @param memoryId Memory ID
   * @returns Number of history entries
   */
  async getCountByMemoryId(memoryId: string): Promise<number> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM memory_history
      WHERE memory_id = ?
    `);

    const result = stmt.get(memoryId) as any;
    return result.count;
  }

  /**
   * Delete all history entries for a memory (hard delete)
   * Use with caution - this removes audit trail
   * @param memoryId Memory ID
   */
  async deleteByMemoryId(memoryId: string): Promise<void> {
    const stmt = this.db.prepare(`
      DELETE FROM memory_history
      WHERE memory_id = ?
    `);

    stmt.run(memoryId);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    this.db.close();
  }

  /**
   * Check if database is connected and tables exist
   * @returns true if database is accessible
   */
  async isHealthy(): Promise<boolean> {
    try {
      const stmt = this.db.prepare(`
        SELECT name FROM sqlite_master
        WHERE type='table' AND name='memory_history'
      `);
      const result = stmt.get();
      return result !== undefined;
    } catch (error) {
      return false;
    }
  }
}
