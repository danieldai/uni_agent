#!/usr/bin/env tsx

/**
 * Test script for Fact Extractor
 * Tests fact extraction from various conversation types
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
  const { FactExtractor } = await import('../lib/memory/extractors/FactExtractor.js');
  const { Message } = await import('../lib/memory/types.js');
  const { EXAMPLE_CONVERSATIONS } = await import('../lib/memory/prompts.js');

  console.log('Fact Extractor Test Suite');
  console.log('=========================\n');

  const extractor = new FactExtractor();

  // Test conversations
  const testConversations = {
    basic: [
      { id: '1', role: 'user' as const, content: 'My name is Alice and I work as a software engineer in San Francisco.', timestamp: 1000 },
      { id: '2', role: 'assistant' as const, content: 'Nice to meet you, Alice! What kind of software engineering do you do?', timestamp: 2000 },
      { id: '3', role: 'user' as const, content: 'I mainly work on backend systems using TypeScript and Node.js.', timestamp: 3000 },
    ],

    hobbies: [
      { id: '1', role: 'user' as const, content: 'I love hiking and photography.', timestamp: 1000 },
      { id: '2', role: 'assistant' as const, content: 'That sounds wonderful! Do you combine those hobbies?', timestamp: 2000 },
      { id: '3', role: 'user' as const, content: 'Yes! I especially enjoy landscape photography during sunrise hikes.', timestamp: 3000 },
      { id: '4', role: 'assistant' as const, content: 'Beautiful! What\'s your favorite hiking spot?', timestamp: 4000 },
      { id: '5', role: 'user' as const, content: 'I really like the trails in Marin Headlands.', timestamp: 5000 },
    ],

    preferences: [
      { id: '1', role: 'user' as const, content: 'I prefer tea over coffee.', timestamp: 1000 },
      { id: '2', role: 'assistant' as const, content: 'What kind of tea do you like?', timestamp: 2000 },
      { id: '3', role: 'user' as const, content: 'Green tea and jasmine tea are my favorites.', timestamp: 3000 },
      { id: '4', role: 'user' as const, content: 'I usually have tea in the morning.', timestamp: 4000 },
    ],

    mixed: [
      { id: '1', role: 'user' as const, content: 'I just moved to Seattle from Boston.', timestamp: 1000 },
      { id: '2', role: 'assistant' as const, content: 'Wow, that\'s a big change! How are you liking it?', timestamp: 2000 },
      { id: '3', role: 'user' as const, content: 'It\'s great! I work remotely as a data scientist now.', timestamp: 3000 },
      { id: '4', role: 'assistant' as const, content: 'Nice! What kind of data science work do you do?', timestamp: 4000 },
      { id: '5', role: 'user' as const, content: 'Machine learning, mostly in Python and TensorFlow.', timestamp: 5000 },
    ],
  };

  try {
    // Test 1: Extract from basic conversation
    console.log('Test 1: Extracting facts from basic conversation...');
    const basicFacts = await extractor.extract(testConversations.basic);
    console.log(`✓ Extracted ${basicFacts.facts.length} facts:`);
    basicFacts.facts.forEach((fact, i) => {
      console.log(`  ${i + 1}. ${fact}`);
    });
    console.log();

    // Test 2: Extract from hobbies conversation
    console.log('Test 2: Extracting facts from hobbies conversation...');
    const hobbiesFacts = await extractor.extract(testConversations.hobbies);
    console.log(`✓ Extracted ${hobbiesFacts.facts.length} facts:`);
    hobbiesFacts.facts.forEach((fact, i) => {
      console.log(`  ${i + 1}. ${fact}`);
    });
    console.log();

    // Test 3: Extract from preferences conversation
    console.log('Test 3: Extracting facts from preferences conversation...');
    const prefFacts = await extractor.extract(testConversations.preferences);
    console.log(`✓ Extracted ${prefFacts.facts.length} facts:`);
    prefFacts.facts.forEach((fact, i) => {
      console.log(`  ${i + 1}. ${fact}`);
    });
    console.log();

    // Test 4: Extract from mixed conversation
    console.log('Test 4: Extracting facts from mixed conversation...');
    const mixedFacts = await extractor.extract(testConversations.mixed);
    console.log(`✓ Extracted ${mixedFacts.facts.length} facts:`);
    mixedFacts.facts.forEach((fact, i) => {
      console.log(`  ${i + 1}. ${fact}`);
    });
    console.log();

    // Test 5: Extract from text (using example conversation)
    console.log('Test 5: Extracting from formatted text...');
    const textFacts = await extractor.extractFromText(EXAMPLE_CONVERSATIONS.basic);
    console.log(`✓ Extracted ${textFacts.facts.length} facts from text:`);
    textFacts.facts.forEach((fact, i) => {
      console.log(`  ${i + 1}. ${fact}`);
    });
    console.log();

    // Test 6: Batch extraction
    console.log('Test 6: Batch extraction from multiple conversations...');
    const batchResults = await extractor.extractBatch([
      testConversations.basic,
      testConversations.hobbies,
    ]);
    console.log(`✓ Batch processed ${batchResults.length} conversations:`);
    batchResults.forEach((result, i) => {
      console.log(`  Conversation ${i + 1}: ${result.facts.length} facts`);
    });
    console.log();

    // Test 7: Estimate tokens
    console.log('Test 7: Estimating token usage...');
    const tokenEstimate = extractor.estimateTokens(testConversations.basic);
    console.log(`✓ Estimated tokens for basic conversation: ~${tokenEstimate}\n`);

    // Test 8: Empty conversation
    console.log('Test 8: Handling empty conversation...');
    const emptyFacts = await extractor.extract([]);
    console.log(`✓ Empty conversation returned ${emptyFacts.facts.length} facts (expected: 0)\n`);

    // Test 9: Very short messages
    console.log('Test 9: Handling very short messages...');
    const shortMessages = [
      { id: '1', role: 'user' as const, content: 'Hi', timestamp: 1000 },
      { id: '2', role: 'assistant' as const, content: 'Hello!', timestamp: 2000 },
      { id: '3', role: 'user' as const, content: 'How are you?', timestamp: 3000 },
    ];
    const shortFacts = await extractor.extract(shortMessages);
    console.log(`✓ Short messages returned ${shortFacts.facts.length} facts\n`);

    // Summary
    console.log('=========================');
    console.log('Test Summary:');
    console.log('=========================');
    console.log(`Total facts extracted across all tests: ${
      basicFacts.facts.length +
      hobbiesFacts.facts.length +
      prefFacts.facts.length +
      mixedFacts.facts.length +
      textFacts.facts.length
    }`);
    console.log();
    console.log('✅ All tests completed successfully!');
    console.log('=========================\n');

    console.log('Note: This test requires a valid OpenAI API key.');
    console.log('If tests fail, check your OPENAI_API_KEY in .env.local\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
