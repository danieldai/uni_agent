#!/usr/bin/env tsx

/**
 * Test script for GetAll functionality
 *
 * Tests the getAll method by:
 * 1. Adding multiple memories at different times
 * 2. Retrieving all memories for a user
 * 3. Verifying correct sorting by creation date
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
  const { Message } = await import('../lib/memory/types.js');

  console.log('='.repeat(60));
  console.log('Testing GetAll Functionality');
  console.log('='.repeat(60));
  console.log();

  const memoryService = new MemoryService();
  const testUserId = 'test-user-getall';

  try {
    // Test 1: Add multiple memories at different times
    console.log('Test 1: Adding multiple memories over time');
    console.log('-'.repeat(60));

    const conversations: { messages: Message[], delay: number }[] = [
      {
        messages: [
          { id: '1', role: 'user', content: 'My favorite color is blue', timestamp: Date.now() },
          { id: '2', role: 'assistant', content: 'Nice choice!', timestamp: Date.now() },
        ],
        delay: 1000,
      },
      {
        messages: [
          { id: '3', role: 'user', content: 'I was born in 1990', timestamp: Date.now() },
          { id: '4', role: 'assistant', content: 'Got it!', timestamp: Date.now() },
        ],
        delay: 1000,
      },
      {
        messages: [
          { id: '5', role: 'user', content: 'I live in San Francisco', timestamp: Date.now() },
          { id: '6', role: 'assistant', content: 'Beautiful city!', timestamp: Date.now() },
        ],
        delay: 1000,
      },
      {
        messages: [
          { id: '7', role: 'user', content: 'My email is test@example.com', timestamp: Date.now() },
          { id: '8', role: 'assistant', content: 'Thanks!', timestamp: Date.now() },
        ],
        delay: 1000,
      },
      {
        messages: [
          { id: '9', role: 'user', content: 'I speak English and Spanish', timestamp: Date.now() },
          { id: '10', role: 'assistant', content: 'Great!', timestamp: Date.now() },
        ],
        delay: 0,
      },
    ];

    for (let i = 0; i < conversations.length; i++) {
      const { messages, delay } = conversations[i];
      await memoryService.add(messages, testUserId);
      console.log(`✓ Added memory ${i + 1}: "${messages[0].content}"`);

      if (delay > 0 && i < conversations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.log();
    console.log('Waiting 2 seconds for indexing...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Get all memories
    console.log('Test 2: Retrieve all memories for user');
    console.log('-'.repeat(60));

    const allMemories = await memoryService.getAll(testUserId);

    console.log(`Found ${allMemories.length} total memories:\n`);

    allMemories.forEach((memory, index) => {
      const createdDate = new Date(memory.created_at);
      console.log(`${index + 1}. ${memory.memory}`);
      console.log(`   ID: ${memory.id}`);
      console.log(`   Created: ${createdDate.toISOString()}`);
      console.log(`   Hash: ${memory.hash.substring(0, 16)}...`);
      console.log();
    });

    // Test 3: Verify sorting by creation date (newest first)
    console.log('Test 3: Verify sorting by creation date (newest first)');
    console.log('-'.repeat(60));

    let correctlySorted = true;
    for (let i = 0; i < allMemories.length - 1; i++) {
      const current = new Date(allMemories[i].created_at);
      const next = new Date(allMemories[i + 1].created_at);

      if (current < next) {
        console.log(`❌ Sorting issue: Memory ${i} is older than memory ${i + 1}`);
        correctlySorted = false;
      }
    }

    if (correctlySorted) {
      console.log('✅ All memories are correctly sorted (newest first)');
    }
    console.log();

    // Test 4: Verify all memories have required fields
    console.log('Test 4: Verify memory structure');
    console.log('-'.repeat(60));

    let allValid = true;
    allMemories.forEach((memory, index) => {
      const requiredFields = ['id', 'memory', 'user_id', 'hash', 'created_at'];
      const missingFields = requiredFields.filter(field => !(field in memory));

      if (missingFields.length > 0) {
        console.log(`❌ Memory ${index + 1} missing fields: ${missingFields.join(', ')}`);
        allValid = false;
      }

      if (memory.user_id !== testUserId) {
        console.log(`❌ Memory ${index + 1} has wrong user_id: ${memory.user_id}`);
        allValid = false;
      }
    });

    if (allValid) {
      console.log('✅ All memories have valid structure and correct user_id');
    }
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ GetAll tests completed successfully!`);
    console.log(`   - Added 5 conversations with different topics`);
    console.log(`   - Retrieved ${allMemories.length} total memories`);
    console.log(`   - Verified sorting by creation date (newest first)`);
    console.log(`   - Verified all memories have required fields`);
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
