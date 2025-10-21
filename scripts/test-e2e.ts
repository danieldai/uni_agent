import { MemoryService } from '../lib/memory/MemoryService';

async function e2eTest() {
  const service = new MemoryService();
  const userId = `test_${Date.now()}`;

  console.log('=== End-to-End Memory Test ===\n');
  console.log(`Test User ID: ${userId}\n`);

  try {
    // 1. Initial conversation
    console.log('1. Adding initial conversation...');
    const conv1 = await service.add([
      {
        id: '1',
        role: 'user' as const,
        content: 'Hi! My name is David and I work as a product manager',
        timestamp: Date.now(),
      },
      {
        id: '2',
        role: 'assistant' as const,
        content: 'Nice to meet you, David!',
        timestamp: Date.now(),
      },
    ], userId);
    console.log('✓ Result:', JSON.stringify(conv1, null, 2));

    // Wait for indexing
    console.log('\n⏳ Waiting for OpenSearch indexing (2 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Search for name
    console.log('\n2. Searching for name...');
    const nameResults = await service.search("What's my name?", userId);
    console.log('✓ Found', nameResults.length, 'results:');
    nameResults.forEach(r => console.log(`  - ${r.memory} (score: ${r.score?.toFixed(3)})`));

    // 3. Add more info
    console.log('\n3. Adding more information (hobbies)...');
    const conv2 = await service.add([
      {
        id: '3',
        role: 'user' as const,
        content: 'I love hiking and photography, especially landscape photography during sunrise',
        timestamp: Date.now(),
      },
      {
        id: '4',
        role: 'assistant' as const,
        content: 'That sounds wonderful! Sunrise photography must be beautiful.',
        timestamp: Date.now(),
      },
    ], userId);
    console.log('✓ Result:', JSON.stringify(conv2, null, 2));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Get all memories
    console.log('\n4. Getting all memories...');
    const allMemories = await service.getAll(userId);
    console.log('✓ Total memories:', allMemories.length);
    allMemories.forEach((m, i) => console.log(`  ${i + 1}. ${m.memory}`));

    // 5. Search for hobbies
    console.log('\n5. Searching for hobbies...');
    const hobbyResults = await service.search("What are my hobbies?", userId);
    console.log('✓ Found', hobbyResults.length, 'results:');
    hobbyResults.forEach(r => console.log(`  - ${r.memory} (score: ${r.score?.toFixed(3)})`));

    // 6. Update information (promotion)
    console.log('\n6. Updating job information (promotion)...');
    const conv3 = await service.add([
      {
        id: '5',
        role: 'user' as const,
        content: 'I got promoted! I am now a senior product manager',
        timestamp: Date.now(),
      },
      {
        id: '6',
        role: 'assistant' as const,
        content: 'Congratulations on your promotion, David!',
        timestamp: Date.now(),
      },
    ], userId);
    console.log('✓ Result:', JSON.stringify(conv3, null, 2));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 7. Verify update by searching for job
    console.log('\n7. Verifying job update...');
    const jobResults = await service.search("What's my job?", userId);
    console.log('✓ Found', jobResults.length, 'results:');
    jobResults.forEach(r => console.log(`  - ${r.memory} (score: ${r.score?.toFixed(3)})`));

    // 8. Check history for updated memories
    if (conv3.results.length > 0 && conv3.results[0].event === 'UPDATE') {
      console.log('\n8. Checking update history...');
      const memoryId = conv3.results[0].id;
      const history = await service.history(memoryId);
      console.log('✓ History entries:', history.length);
      history.forEach((h, i) => {
        console.log(`  ${i + 1}. ${h.event}: "${h.prev_value}" → "${h.new_value}"`);
        console.log(`     Timestamp: ${h.timestamp}`);
      });
    }

    // 9. Test contradiction (moving to different city)
    console.log('\n9. Testing memory deletion (contradiction)...');
    const conv4 = await service.add([
      {
        id: '7',
        role: 'user' as const,
        content: 'Actually, I just moved to New York City',
        timestamp: Date.now(),
      },
    ], userId);
    console.log('✓ Result:', JSON.stringify(conv4, null, 2));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 10. Final memory count
    console.log('\n10. Final memory count...');
    const finalMemories = await service.getAll(userId);
    console.log('✓ Total memories:', finalMemories.length);
    console.log('\nFinal Memory State:');
    finalMemories.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.memory}`);
      console.log(`     Created: ${new Date(m.created_at).toLocaleString()}`);
      if (m.updated_at) {
        console.log(`     Updated: ${new Date(m.updated_at).toLocaleString()}`);
      }
    });

    // 11. Test manual delete
    if (finalMemories.length > 0) {
      console.log('\n11. Testing manual memory deletion...');
      const memoryToDelete = finalMemories[0];
      console.log(`   Deleting: "${memoryToDelete.memory}"`);
      await service.delete(memoryToDelete.id);
      console.log('✓ Memory deleted successfully');

      await new Promise(resolve => setTimeout(resolve, 1000));

      const afterDelete = await service.getAll(userId);
      console.log(`✓ Memories remaining: ${afterDelete.length} (was ${finalMemories.length})`);
    }

    console.log('\n=== ✅ Test Complete - All operations successful! ===');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  e2eTest()
    .then(() => {
      console.log('\n✅ E2E test passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ E2E test failed:', error);
      process.exit(1);
    });
}

export { e2eTest };
