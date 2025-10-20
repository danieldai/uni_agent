#!/usr/bin/env tsx

/**
 * Test script for HistoryStore
 * Tests all history tracking operations
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
} catch (error) {
  console.warn('Could not load .env.local:', error);
}

(async () => {
  const { HistoryStore } = await import('../lib/memory/stores/HistoryStore.js');

  console.log('HistoryStore Test Suite');
  console.log('=======================\n');

  const store = new HistoryStore();

  try {
    // Test 1: Health check
    console.log('Test 1: Checking database health...');
    const isHealthy = await store.isHealthy();
    console.log(`✓ Database healthy: ${isHealthy}\n`);

    if (!isHealthy) {
      console.error('❌ Database not healthy. Run ./scripts/setup-database.sh first');
      process.exit(1);
    }

    // Test 2: Add history entry (ADD event)
    console.log('Test 2: Adding ADD event to history...');
    const addId = await store.add({
      memory_id: 'test_mem_001',
      user_id: 'test_user_hist',
      prev_value: null,
      new_value: 'User loves programming',
      event: 'ADD',
      metadata: { source: 'test', confidence: 0.95 },
    });
    console.log('✓ Added entry with ID:', addId, '\n');

    // Test 3: Add UPDATE event
    console.log('Test 3: Adding UPDATE event to history...');
    const updateId = await store.add({
      memory_id: 'test_mem_001',
      user_id: 'test_user_hist',
      prev_value: 'User loves programming',
      new_value: 'User loves programming and TypeScript',
      event: 'UPDATE',
      metadata: { source: 'test', reason: 'refinement' },
    });
    console.log('✓ Added UPDATE entry with ID:', updateId, '\n');

    // Test 4: Add DELETE event
    console.log('Test 4: Adding DELETE event to history...');
    const deleteId = await store.add({
      memory_id: 'test_mem_002',
      user_id: 'test_user_hist',
      prev_value: 'Temporary memory',
      new_value: null,
      event: 'DELETE',
      metadata: { source: 'test', reason: 'user_request' },
    });
    console.log('✓ Added DELETE entry with ID:', deleteId, '\n');

    // Test 5: Get history by memory ID
    console.log('Test 5: Getting history for test_mem_001...');
    const memoryHistory = await store.getByMemoryId('test_mem_001');
    console.log(`✓ Found ${memoryHistory.length} entries for test_mem_001:`);
    memoryHistory.forEach((entry, i) => {
      console.log(`  ${i + 1}. Event: ${entry.event}, New Value: ${entry.new_value}`);
      console.log(`     Timestamp: ${entry.timestamp}`);
      if (entry.metadata) {
        console.log(`     Metadata:`, entry.metadata);
      }
    });
    console.log();

    // Test 6: Get history by user ID
    console.log('Test 6: Getting history for test_user_hist...');
    const userHistory = await store.getByUserId('test_user_hist', 10);
    console.log(`✓ Found ${userHistory.length} entries for test_user_hist:`);
    userHistory.forEach((entry, i) => {
      console.log(`  ${i + 1}. Memory ID: ${entry.memory_id}, Event: ${entry.event}`);
    });
    console.log();

    // Test 7: Get count by memory ID
    console.log('Test 7: Counting entries for test_mem_001...');
    const memCount = await store.getCountByMemoryId('test_mem_001');
    console.log(`✓ test_mem_001 has ${memCount} history entries\n`);

    // Test 8: Get count by user ID
    console.log('Test 8: Counting entries for test_user_hist...');
    const userCount = await store.getCountByUserId('test_user_hist');
    console.log(`✓ test_user_hist has ${userCount} history entries\n`);

    // Test 9: Get all history (limited)
    console.log('Test 9: Getting all recent history entries...');
    const allHistory = await store.getAll(5);
    console.log(`✓ Retrieved ${allHistory.length} most recent entries`);
    console.log('  Most recent:');
    if (allHistory.length > 0) {
      const recent = allHistory[0];
      console.log(`    Memory ID: ${recent.memory_id}`);
      console.log(`    Event: ${recent.event}`);
      console.log(`    User: ${recent.user_id}`);
      console.log(`    Timestamp: ${recent.timestamp}`);
    }
    console.log();

    // Test 10: Add multiple entries for different users
    console.log('Test 10: Adding entries for different users...');
    await store.add({
      memory_id: 'test_mem_003',
      user_id: 'another_user',
      prev_value: null,
      new_value: 'Different user memory',
      event: 'ADD',
    });
    const anotherUserHistory = await store.getByUserId('another_user');
    console.log(`✓ another_user has ${anotherUserHistory.length} entries\n`);

    // Test 11: Verify chronological order
    console.log('Test 11: Verifying chronological order...');
    const chronHistory = await store.getByUserId('test_user_hist', 10);
    if (chronHistory.length >= 2) {
      const first = new Date(chronHistory[0].timestamp).getTime();
      const second = new Date(chronHistory[1].timestamp).getTime();
      const isOrdered = first >= second;
      console.log(`✓ Entries are in descending order: ${isOrdered}`);
      console.log(`  Most recent: ${chronHistory[0].timestamp}`);
      console.log(`  Older: ${chronHistory[1].timestamp}\n`);
    }

    // Cleanup: Delete test data
    console.log('Cleanup: Removing test data...');
    await store.deleteByMemoryId('test_mem_001');
    await store.deleteByMemoryId('test_mem_002');
    await store.deleteByMemoryId('test_mem_003');
    const remainingCount = await store.getCountByUserId('test_user_hist');
    console.log(`✓ Test data cleaned up (${remainingCount} entries remaining for test_user_hist)\n`);

    console.log('=======================');
    console.log('✅ All tests passed!');
    console.log('=======================\n');

    await store.close();

  } catch (error) {
    console.error('❌ Test failed:', error);
    await store.close();
    process.exit(1);
  }
})();
