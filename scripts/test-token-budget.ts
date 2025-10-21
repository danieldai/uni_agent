/**
 * Test script for token budget functionality
 *
 * Tests:
 * 1. Token estimation
 * 2. Token budget allocation with conversation tokens
 * 3. Token budget allocation with memories only
 * 4. Integration with MemoryService search
 */

import { MemoryService } from '../lib/memory/MemoryService';
import { estimateTokens, allocateTokenBudget, getMemoriesWithinBudget } from '../lib/memory/utils/tokenBudget';
import { Memory } from '../lib/memory/types';

async function testTokenEstimation() {
  console.log('=== Test 1: Token Estimation ===\n');

  const testTexts = [
    'Hello',
    'My name is Alice',
    'I love programming in TypeScript and building web applications',
    'The quick brown fox jumps over the lazy dog. This is a longer sentence to test token estimation with more complex content.',
  ];

  for (const text of testTexts) {
    const tokens = estimateTokens(text);
    console.log(`Text: "${text}"`);
    console.log(`Characters: ${text.length}`);
    console.log(`Estimated tokens: ${tokens}\n`);
  }
}

async function testTokenAllocation() {
  console.log('=== Test 2: Token Budget Allocation ===\n');

  const mockMemories: Memory[] = [
    {
      id: 'mem_1',
      memory: 'User name is Alice',
      user_id: 'test_user',
      hash: 'hash1',
      created_at: '2025-01-01T00:00:00Z',
      score: 0.95,
    },
    {
      id: 'mem_2',
      memory: 'Works as a software engineer',
      user_id: 'test_user',
      hash: 'hash2',
      created_at: '2025-01-02T00:00:00Z',
      score: 0.90,
    },
    {
      id: 'mem_3',
      memory: 'Lives in San Francisco',
      user_id: 'test_user',
      hash: 'hash3',
      created_at: '2025-01-03T00:00:00Z',
      score: 0.85,
    },
    {
      id: 'mem_4',
      memory: 'Loves hiking on weekends',
      user_id: 'test_user',
      hash: 'hash4',
      created_at: '2025-01-04T00:00:00Z',
      score: 0.80,
    },
    {
      id: 'mem_5',
      memory: 'Enjoys photography, especially landscape and nature photography during sunrise',
      user_id: 'test_user',
      hash: 'hash5',
      created_at: '2025-01-05T00:00:00Z',
      score: 0.75,
    },
  ];

  console.log('Mock memories:');
  mockMemories.forEach((mem, i) => {
    console.log(`${i + 1}. "${mem.memory}" (${estimateTokens(mem.memory)} tokens)`);
  });
  console.log();

  // Test with different budgets
  const totalBudget = 100;
  const conversationTokens = 30;
  const responseReserve = 20;

  console.log(`Total budget: ${totalBudget} tokens`);
  console.log(`Conversation tokens: ${conversationTokens} tokens`);
  console.log(`Response reserve: ${responseReserve} tokens`);
  console.log(`Memory budget: ${totalBudget - conversationTokens - responseReserve} tokens\n`);

  const selected = allocateTokenBudget(totalBudget, conversationTokens, mockMemories, responseReserve);

  console.log(`Selected ${selected.length} memories:`);
  let totalTokens = 0;
  selected.forEach((mem, i) => {
    const tokens = estimateTokens(mem.memory);
    totalTokens += tokens;
    console.log(`${i + 1}. "${mem.memory}" (${tokens} tokens)`);
  });
  console.log(`\nTotal tokens used: ${totalTokens}`);
  console.log();
}

async function testGetMemoriesWithinBudget() {
  console.log('=== Test 3: Get Memories Within Budget ===\n');

  const mockMemories: Memory[] = [
    {
      id: 'mem_1',
      memory: 'Short memory',
      user_id: 'test_user',
      hash: 'hash1',
      created_at: '2025-01-01T00:00:00Z',
      score: 0.95,
    },
    {
      id: 'mem_2',
      memory: 'This is a medium length memory about something interesting',
      user_id: 'test_user',
      hash: 'hash2',
      created_at: '2025-01-02T00:00:00Z',
      score: 0.90,
    },
    {
      id: 'mem_3',
      memory: 'This is a very long memory that contains a lot of information about various topics and details that would take up many tokens in the context window',
      user_id: 'test_user',
      hash: 'hash3',
      created_at: '2025-01-03T00:00:00Z',
      score: 0.85,
    },
  ];

  console.log('All memories:');
  mockMemories.forEach((mem, i) => {
    console.log(`${i + 1}. "${mem.memory}" (${estimateTokens(mem.memory)} tokens)`);
  });
  console.log();

  const budget = 20;
  console.log(`Budget: ${budget} tokens\n`);

  const selected = getMemoriesWithinBudget(mockMemories, budget);

  console.log(`Selected ${selected.length} memories:`);
  let totalTokens = 0;
  selected.forEach((mem, i) => {
    const tokens = estimateTokens(mem.memory);
    totalTokens += tokens;
    console.log(`${i + 1}. "${mem.memory}" (${tokens} tokens)`);
  });
  console.log(`\nTotal tokens used: ${totalTokens}`);
  console.log();
}

async function testMemoryServiceIntegration() {
  console.log('=== Test 4: MemoryService Integration ===\n');

  const service = new MemoryService();
  const userId = `test_token_${Date.now()}`;

  try {
    // Add some test memories
    console.log('Adding test memories...');
    await service.add([
      {
        id: '1',
        role: 'user' as const,
        content: 'My name is Bob and I work as a data scientist in New York',
        timestamp: Date.now(),
      },
    ], userId);

    await service.add([
      {
        id: '2',
        role: 'user' as const,
        content: 'I love machine learning and AI research',
        timestamp: Date.now(),
      },
    ], userId);

    await service.add([
      {
        id: '3',
        role: 'user' as const,
        content: 'I enjoy reading research papers and attending AI conferences',
        timestamp: Date.now(),
      },
    ], userId);

    // Wait for indexing
    console.log('Waiting for indexing...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Search without token budget
    console.log('\nSearching without token budget...');
    const resultsUnlimited = await service.search("What do you know about me?", userId);
    console.log(`Found ${resultsUnlimited.length} memories:`);
    let totalTokensUnlimited = 0;
    resultsUnlimited.forEach((mem, i) => {
      const tokens = estimateTokens(mem.memory);
      totalTokensUnlimited += tokens;
      console.log(`${i + 1}. "${mem.memory}" (${tokens} tokens, score: ${mem.score?.toFixed(3)})`);
    });
    console.log(`Total tokens: ${totalTokensUnlimited}\n`);

    // Search with token budget
    const tokenBudget = 30;
    console.log(`Searching with token budget: ${tokenBudget} tokens...`);
    const resultsLimited = await service.search("What do you know about me?", userId, undefined, tokenBudget);
    console.log(`Found ${resultsLimited.length} memories:`);
    let totalTokensLimited = 0;
    resultsLimited.forEach((mem, i) => {
      const tokens = estimateTokens(mem.memory);
      totalTokensLimited += tokens;
      console.log(`${i + 1}. "${mem.memory}" (${tokens} tokens, score: ${mem.score?.toFixed(3)})`);
    });
    console.log(`Total tokens: ${totalTokensLimited}\n`);

    // Verify token budget was applied
    if (totalTokensLimited <= tokenBudget) {
      console.log(`✓ Token budget successfully applied (${totalTokensLimited} <= ${tokenBudget})`);
    } else {
      console.log(`✗ Token budget exceeded (${totalTokensLimited} > ${tokenBudget})`);
    }

    await service.close();

  } catch (error) {
    console.error('Error during MemoryService integration test:', error);
    await service.close();
  }
}

async function runAllTests() {
  try {
    await testTokenEstimation();
    console.log('---\n');

    await testTokenAllocation();
    console.log('---\n');

    await testGetMemoriesWithinBudget();
    console.log('---\n');

    await testMemoryServiceIntegration();

    console.log('\n=== All Token Budget Tests Complete ===');
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

runAllTests();
