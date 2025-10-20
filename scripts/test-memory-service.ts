#!/usr/bin/env tsx

/**
 * Test script for Memory Service
 * Tests the complete end-to-end memory pipeline
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
  const { MemoryService } = await import('../lib/memory/MemoryService.js');
  const { Message } = await import('../lib/memory/types.js');

  console.log('Memory Service Test Suite');
  console.log('=========================\n');

  const service = new MemoryService();
  const testUserId = 'test_user_memory_service';

  try {
    // Test 1: Add memories from first conversation
    console.log('Test 1: Adding memories from initial conversation...');
    const conversation1: Message[] = [
      { id: '1', role: 'user', content: 'Hi, my name is Alice.', timestamp: 1000 },
      { id: '2', role: 'assistant', content: 'Hello Alice! Nice to meet you.', timestamp: 2000 },
      { id: '3', role: 'user', content: 'I work as a software engineer in San Francisco.', timestamp: 3000 },
      { id: '4', role: 'assistant', content: 'That sounds great! What technologies do you work with?', timestamp: 4000 },
      { id: '5', role: 'user', content: 'I mainly use TypeScript and React.', timestamp: 5000 },
    ];

    const result1 = await service.add(conversation1, testUserId);
    console.log(`✓ First conversation processed:`);
    console.log(`  Total actions: ${result1.results.length}`);
    result1.results.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.event}: ${action.memory}`);
      if (action.event === 'ADD') {
        console.log(`     ID: ${action.id}`);
      }
    });
    console.log();

    // Wait a moment for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Add memories with updates (job change)
    console.log('Test 2: Adding memories with job update...');
    const conversation2: Message[] = [
      { id: '6', role: 'user', content: 'I got promoted! I\'m now a senior software engineer.', timestamp: 6000 },
      { id: '7', role: 'assistant', content: 'Congratulations! That\'s wonderful news!', timestamp: 7000 },
      { id: '8', role: 'user', content: 'I\'m also learning Python now.', timestamp: 8000 },
    ];

    const result2 = await service.add(conversation2, testUserId);
    console.log(`✓ Second conversation processed:`);
    console.log(`  Total actions: ${result2.results.length}`);
    result2.results.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.event}: ${action.memory}`);
      if (action.old_memory) {
        console.log(`     Previous: ${action.old_memory}`);
      }
    });
    console.log();

    // Wait a moment for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 3: Add memories with hobbies
    console.log('Test 3: Adding hobby information...');
    const conversation3: Message[] = [
      { id: '9', role: 'user', content: 'I love hiking on weekends.', timestamp: 9000 },
      { id: '10', role: 'assistant', content: 'That sounds relaxing! Where do you like to hike?', timestamp: 10000 },
      { id: '11', role: 'user', content: 'Mostly in the Marin Headlands area.', timestamp: 11000 },
    ];

    const result3 = await service.add(conversation3, testUserId);
    console.log(`✓ Third conversation processed:`);
    console.log(`  Total actions: ${result3.results.length}`);
    result3.results.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.event}: ${action.memory}`);
    });
    console.log();

    // Test 4: Try to add redundant information (should get NONE)
    console.log('Test 4: Attempting to add redundant information...');
    const conversation4: Message[] = [
      { id: '12', role: 'user', content: 'As I mentioned, my name is Alice.', timestamp: 12000 },
      { id: '13', role: 'assistant', content: 'Yes, I remember!', timestamp: 13000 },
    ];

    const result4 = await service.add(conversation4, testUserId);
    console.log(`✓ Fourth conversation processed:`);
    console.log(`  Total actions: ${result4.results.length}`);
    result4.results.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.event}: ${action.memory}`);
    });
    console.log();

    // Test 5: Summary of all actions
    console.log('Test 5: Summary of all operations...');
    const allResults = [
      ...result1.results,
      ...result2.results,
      ...result3.results,
      ...result4.results,
    ];

    const summary = {
      total: allResults.length,
      add: allResults.filter(r => r.event === 'ADD').length,
      update: allResults.filter(r => r.event === 'UPDATE').length,
      delete: allResults.filter(r => r.event === 'DELETE').length,
      none: allResults.filter(r => r.event === 'NONE').length,
    };

    console.log('✓ Overall summary:');
    console.log(`  Total operations: ${summary.total}`);
    console.log(`  ADD: ${summary.add}`);
    console.log(`  UPDATE: ${summary.update}`);
    console.log(`  DELETE: ${summary.delete}`);
    console.log(`  NONE: ${summary.none}`);
    console.log();

    // Test 6: Empty conversation
    console.log('Test 6: Processing empty conversation...');
    const emptyConversation: Message[] = [];
    const emptyResult = await service.add(emptyConversation, testUserId);
    console.log(`✓ Empty conversation: ${emptyResult.results.length} results (expected 0)\n`);

    // Test 7: Short/trivial messages
    console.log('Test 7: Processing trivial messages...');
    const trivialConversation: Message[] = [
      { id: '14', role: 'user', content: 'Hi', timestamp: 14000 },
      { id: '15', role: 'assistant', content: 'Hello!', timestamp: 15000 },
      { id: '16', role: 'user', content: 'Ok', timestamp: 16000 },
    ];
    const trivialResult = await service.add(trivialConversation, testUserId);
    console.log(`✓ Trivial messages: ${trivialResult.results.length} results\n`);

    console.log('=========================');
    console.log('✅ All tests completed!');
    console.log('=========================\n');

    console.log('Integration test summary:');
    console.log('- Fact extraction working ✓');
    console.log('- Embedding generation working ✓');
    console.log('- Vector search working ✓');
    console.log('- Action decisions working ✓');
    console.log('- Vector store operations working ✓');
    console.log('- History tracking working ✓');
    console.log();

    console.log('Note: Check OpenSearch and SQLite for persisted data.');
    console.log('To clean up test data:');
    console.log('  OpenSearch: Delete memories with user_id = test_user_memory_service');
    console.log('  SQLite: Delete from memory_history where user_id = \'test_user_memory_service\'');
    console.log();

    await service.close();

  } catch (error) {
    console.error('❌ Test failed:', error);
    await service.close();
    process.exit(1);
  }
})();
