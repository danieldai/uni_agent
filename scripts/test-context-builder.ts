import {
  buildSystemPromptWithMemories,
  formatMemoriesForDisplay,
  buildMemorySummary,
  categorizeMemories,
  buildCategorizedSystemPrompt,
} from '../lib/memory/utils/contextBuilder';
import { Memory } from '../lib/memory/types';

async function testContextBuilder() {
  console.log('=== Context Builder Test ===\n');

  // Test data
  const testMemories: Memory[] = [
    {
      id: 'mem_1',
      memory: 'Name is Alice',
      user_id: 'user_test',
      score: 0.95,
      created_at: '2025-01-15T10:00:00Z',
      hash: 'hash1',
    },
    {
      id: 'mem_2',
      memory: 'Works as a software engineer at TechCorp',
      user_id: 'user_test',
      score: 0.88,
      created_at: '2025-01-16T11:00:00Z',
      hash: 'hash2',
    },
    {
      id: 'mem_3',
      memory: 'Loves hiking and photography',
      user_id: 'user_test',
      score: 0.82,
      created_at: '2025-01-17T12:00:00Z',
      hash: 'hash3',
    },
    {
      id: 'mem_4',
      memory: 'Lives in San Francisco',
      user_id: 'user_test',
      created_at: '2025-01-18T13:00:00Z',
      hash: 'hash4',
    },
    {
      id: 'mem_5',
      memory: 'Prefers dark roast coffee',
      user_id: 'user_test',
      score: 0.76,
      created_at: '2025-01-19T14:00:00Z',
      hash: 'hash5',
    },
  ];

  // Test 1: Empty memories
  console.log('1. Testing with empty memories:');
  console.log(buildSystemPromptWithMemories([]));
  console.log('\n---\n');

  // Test 2: Basic system prompt
  console.log('2. Testing basic system prompt:');
  console.log(buildSystemPromptWithMemories(testMemories));
  console.log('\n---\n');

  // Test 3: Display formatting
  console.log('3. Testing display formatting:');
  console.log(formatMemoriesForDisplay(testMemories));
  console.log('\n---\n');

  // Test 4: Memory summary
  console.log('4. Testing memory summary:');
  console.log(buildMemorySummary(testMemories));
  console.log('\n---\n');

  // Test 5: Categorization
  console.log('5. Testing memory categorization:');
  const categorized = categorizeMemories(testMemories);
  console.log('Personal:', categorized.personal.length, 'memories');
  console.log('Preferences:', categorized.preferences.length, 'memories');
  console.log('Professional:', categorized.professional.length, 'memories');
  console.log('Other:', categorized.other.length, 'memories');
  console.log('\n---\n');

  // Test 6: Categorized system prompt
  console.log('6. Testing categorized system prompt:');
  console.log(buildCategorizedSystemPrompt(testMemories));
  console.log('\n---\n');

  // Test 7: Single memory
  console.log('7. Testing with single memory:');
  console.log(buildSystemPromptWithMemories([testMemories[0]]));
  console.log('\n---\n');

  // Test 8: Display formatting with no scores
  console.log('8. Testing display with no scores:');
  const noScoreMemories = testMemories.map(m => ({ ...m, score: undefined }));
  console.log(formatMemoriesForDisplay(noScoreMemories));
  console.log('\n---\n');

  console.log('✓ All context builder tests completed successfully!');
}

testContextBuilder().catch(console.error);
