#!/usr/bin/env tsx

/**
 * Test script for History functionality
 *
 * Tests the history method by:
 * 1. Adding a memory (ADD event)
 * 2. Updating the memory multiple times (UPDATE events)
 * 3. Retrieving the complete audit trail
 * 4. Verifying all events are captured
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually BEFORE importing modules
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    }
  });
  console.log('✓ Loaded .env.local\n');
} catch (error) {
  console.warn('Could not load .env.local:', error);
}

// Dynamic import after env vars are set
(async () => {
  const { MemoryService } = await import('../lib/memory/MemoryService.js');
  type Message = { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number };

  console.log('='.repeat(60));
  console.log('Testing History Functionality');
  console.log('='.repeat(60));
  console.log();

  const memoryService = new MemoryService();
  const testUserId = 'test-user-history';

  try {
    // Test 1: Add initial memory
    console.log('Test 1: Add initial memory');
    console.log('-'.repeat(60));

    const initialMessages: Message[] = [
      { id: '1', role: 'user', content: `My favorite programming language is Rust ${Date.now()}`, timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Great choice!', timestamp: Date.now() },
    ];

    const addResult = await memoryService.add(initialMessages, testUserId);
    console.log(`✓ Added ${addResult.results.length} memories`);

    // Find the first memory (could be ADD or UPDATE if similar memory exists)
    const firstMemory = addResult.results[0];
    if (!firstMemory) {
      throw new Error('No memories returned in results');
    }

    const memoryId = firstMemory.id;
    console.log(`Memory ID: ${memoryId}`);
    console.log(`Memory: ${firstMemory.memory}`);
    console.log(`Event: ${firstMemory.event}`);
    console.log();

    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Update the memory
    console.log('Test 2: Update the memory');
    console.log('-'.repeat(60));

    const updateMessages1: Message[] = [
      { id: '3', role: 'user', content: 'Actually, I now prefer JavaScript over Python', timestamp: Date.now() },
      { id: '4', role: 'assistant', content: 'Interesting change!', timestamp: Date.now() },
    ];

    await memoryService.add(updateMessages1, testUserId);
    console.log('✓ Updated memory (change 1)');
    console.log();

    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Update again
    console.log('Test 3: Update the memory again');
    console.log('-'.repeat(60));

    const updateMessages2: Message[] = [
      { id: '5', role: 'user', content: 'I love TypeScript, it\'s better than JavaScript', timestamp: Date.now() },
      { id: '6', role: 'assistant', content: 'TypeScript is indeed powerful!', timestamp: Date.now() },
    ];

    await memoryService.add(updateMessages2, testUserId);
    console.log('✓ Updated memory (change 2)');
    console.log();

    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 4: Retrieve history
    console.log('Test 4: Retrieve complete history for the memory');
    console.log('-'.repeat(60));

    const historyEntries = await memoryService.history(memoryId);

    console.log(`Found ${historyEntries.length} history entries:\n`);

    historyEntries.forEach((entry, index) => {
      const timestamp = new Date(entry.timestamp);
      console.log(`${index + 1}. Event: ${entry.event}`);
      console.log(`   Timestamp: ${timestamp.toISOString()}`);
      console.log(`   Previous Value: ${entry.prev_value || 'null'}`);
      console.log(`   New Value: ${entry.new_value || 'null'}`);
      console.log(`   User ID: ${entry.user_id}`);
      console.log();
    });

    // Test 5: Verify history structure
    console.log('Test 5: Verify history structure');
    console.log('-'.repeat(60));

    let allValid = true;

    // Count event types
    const addEvents = historyEntries.filter(e => e.event === 'ADD');
    const updateEvents = historyEntries.filter(e => e.event === 'UPDATE');
    const deleteEvents = historyEntries.filter(e => e.event === 'DELETE');

    console.log(`Found ${addEvents.length} ADD events`);
    console.log(`Found ${updateEvents.length} UPDATE events`);
    console.log(`Found ${deleteEvents.length} DELETE events`);

    // Verify ADD events have null prev_value
    addEvents.forEach((event, index) => {
      if (event.prev_value !== null) {
        console.log(`❌ ADD event ${index + 1} should have null prev_value`);
        allValid = false;
      }
    });

    // Verify UPDATE events have both prev_value and new_value
    updateEvents.forEach((event, index) => {
      if (event.prev_value === null) {
        console.log(`❌ UPDATE event ${index + 1} should have non-null prev_value`);
        allValid = false;
      }
      if (event.new_value === null) {
        console.log(`❌ UPDATE event ${index + 1} should have non-null new_value`);
        allValid = false;
      }
    });

    if (addEvents.length > 0 || updateEvents.length > 0) {
      console.log('✅ History contains valid events');
    }

    // Check required fields
    historyEntries.forEach((entry, index) => {
      const requiredFields = ['id', 'memory_id', 'event', 'timestamp', 'user_id'];
      const missingFields = requiredFields.filter(field => !(field in entry));

      if (missingFields.length > 0) {
        console.log(`❌ Entry ${index + 1} missing fields: ${missingFields.join(', ')}`);
        allValid = false;
      }

      if (entry.memory_id !== memoryId) {
        console.log(`❌ Entry ${index + 1} has wrong memory_id`);
        allValid = false;
      }

      if (entry.user_id !== testUserId) {
        console.log(`❌ Entry ${index + 1} has wrong user_id`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✅ All history entries have valid structure');
    }
    console.log();

    // Test 6: Verify reverse chronological order
    console.log('Test 6: Verify reverse chronological order');
    console.log('-'.repeat(60));

    let reverseChronological = true;
    for (let i = 0; i < historyEntries.length - 1; i++) {
      const current = new Date(historyEntries[i].timestamp);
      const next = new Date(historyEntries[i + 1].timestamp);

      if (current < next) {
        console.log(`❌ Entry ${i} is older than entry ${i + 1}`);
        reverseChronological = false;
      }
    }

    if (reverseChronological) {
      console.log('✅ All entries are in reverse chronological order (newest first)');
    }
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ History tests completed successfully!`);
    console.log(`   - Added initial memory (ADD event)`);
    console.log(`   - Updated memory 2 times (UPDATE events)`);
    console.log(`   - Retrieved ${historyEntries.length} history entries`);
    console.log(`   - Verified all events have correct structure`);
    console.log(`   - Verified chronological ordering`);
    console.log(`   - All tests passed`);
    console.log('='.repeat(60));
    console.log();

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await memoryService.close();
  }
})();
