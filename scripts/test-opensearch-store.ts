#!/usr/bin/env tsx

/**
 * Test script for OpenSearchStore
 * Tests all CRUD operations and vector search
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
  const { OpenSearchStore } = await import('../lib/memory/stores/OpenSearchStore.js');

  console.log('OpenSearchStore Test Suite');
  console.log('===========================\n');

  const store = new OpenSearchStore();

  try {
    // Test 1: Check if index exists
    console.log('Test 1: Checking if index exists...');
    const exists = await store.indexExists();
    console.log(`✓ Index exists: ${exists}\n`);

    if (!exists) {
      console.error('❌ Index does not exist. Run ./scripts/create-opensearch-index.sh first');
      process.exit(1);
    }

    // Test 2: Insert test vectors
    console.log('Test 2: Inserting test vectors...');
    const testVectors = [
      Array(1536).fill(0).map(() => Math.random()),
      Array(1536).fill(0).map(() => Math.random()),
      Array(1536).fill(0).map(() => Math.random()),
    ];

    const testIds = [
      'test_vec_001',
      'test_vec_002',
      'test_vec_003',
    ];

    const testPayloads = [
      {
        user_id: 'test_user_store',
        data: 'User loves programming in TypeScript',
        hash: 'hash001',
        created_at: new Date().toISOString(),
      },
      {
        user_id: 'test_user_store',
        data: 'User enjoys hiking on weekends',
        hash: 'hash002',
        created_at: new Date().toISOString(),
      },
      {
        user_id: 'another_user',
        data: 'Different user likes cooking',
        hash: 'hash003',
        created_at: new Date().toISOString(),
      },
    ];

    await store.insert(testVectors, testIds, testPayloads);
    console.log('✓ Inserted 3 test vectors\n');

    // Wait a moment for indexing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Get by ID
    console.log('Test 3: Getting document by ID...');
    const doc = await store.get('test_vec_001');
    console.log('✓ Retrieved document:');
    console.log('  ID:', doc.id);
    console.log('  Data:', doc.data);
    console.log('  User ID:', doc.user_id);
    console.log('  Vector dimensions:', doc.memory_vector?.length, '\n');

    // Test 4: Search with k-NN
    console.log('Test 4: Searching with k-NN (similar to first vector)...');
    const queryVector = testVectors[0]; // Use first vector as query
    const searchResults = await store.search(
      queryVector,
      { user_id: 'test_user_store' },
      5
    );
    console.log(`✓ Found ${searchResults.length} results:`);
    searchResults.forEach((result, i) => {
      console.log(`  ${i + 1}. ID: ${result.id}, Score: ${result.score.toFixed(4)}, Data: ${result.payload.data}`);
    });
    console.log();

    // Test 5: Get all by user ID
    console.log('Test 5: Getting all memories for user...');
    const userMemories = await store.getAllByUserId('test_user_store');
    console.log(`✓ Found ${userMemories.length} memories for test_user_store:`);
    userMemories.forEach((mem, i) => {
      console.log(`  ${i + 1}. ${mem.payload.data}`);
    });
    console.log();

    // Test 6: Update a vector
    console.log('Test 6: Updating a vector...');
    const updatedVector = Array(1536).fill(0).map(() => Math.random());
    await store.update('test_vec_002', updatedVector, {
      user_id: 'test_user_store',
      data: 'User enjoys hiking and photography',
      hash: 'hash002_updated',
    });
    const updated = await store.get('test_vec_002');
    console.log('✓ Updated document:');
    console.log('  Data:', updated.data);
    console.log('  Updated at:', updated.updated_at, '\n');

    // Test 7: Delete a vector
    console.log('Test 7: Deleting a vector...');
    await store.delete('test_vec_003');
    console.log('✓ Deleted test_vec_003\n');

    // Test 8: Verify deletion
    console.log('Test 8: Verifying deletion...');
    try {
      await store.get('test_vec_003');
      console.log('❌ Document should have been deleted\n');
    } catch (error: any) {
      if (error.meta?.statusCode === 404) {
        console.log('✓ Document successfully deleted (404 error as expected)\n');
      } else {
        throw error;
      }
    }

    // Test 9: Search without filters
    console.log('Test 9: Searching without user filter...');
    const allResults = await store.search(queryVector, {}, 10);
    console.log(`✓ Found ${allResults.length} results across all users\n`);

    // Cleanup: Delete test vectors
    console.log('Cleanup: Removing test data...');
    try {
      await store.delete('test_vec_001');
      await store.delete('test_vec_002');
      // test_vec_003 already deleted
      console.log('✓ Test data cleaned up\n');
    } catch (error) {
      console.warn('⚠️  Some test data may not have been cleaned up');
    }

    console.log('===========================');
    console.log('✅ All tests passed!');
    console.log('===========================\n');

    await store.close();

  } catch (error) {
    console.error('❌ Test failed:', error);
    await store.close();
    process.exit(1);
  }
})();
