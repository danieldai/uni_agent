#!/usr/bin/env tsx

/**
 * Test script for Action Decider
 * Tests ADD/UPDATE/DELETE/NONE decision making
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
  const { ActionDecider } = await import('../lib/memory/extractors/ActionDecider.js');
  const { SearchResult } = await import('../lib/memory/types.js');

  console.log('Action Decider Test Suite');
  console.log('=========================\n');

  const decider = new ActionDecider();

  try {
    // Test 1: ADD scenario - new facts with no existing memories
    console.log('Test 1: ADD scenario (new facts, no existing memories)...');
    const newFacts = [
      'User name is Alice',
      'Alice lives in San Francisco',
      'Alice works as a software engineer',
    ];
    const decision1 = await decider.decide(newFacts, []);
    console.log(`✓ Decision for ${newFacts.length} new facts:`);
    decision1.memory.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.event}: ${item.text}`);
      console.log(`     ID: ${item.id}`);
    });
    console.log();

    // Test 2: UPDATE scenario - similar existing memory
    console.log('Test 2: UPDATE scenario (job promotion)...');
    const updateFacts = [
      'Alice got promoted to senior software engineer',
    ];
    const existingMemories: any[] = [
      {
        id: 'mem_001',
        score: 0.85,
        payload: {
          data: 'Alice works as a software engineer',
          user_id: 'alice',
          created_at: '2025-01-01',
        },
      },
    ];
    const decision2 = await decider.decide(updateFacts, existingMemories);
    console.log('✓ Decision:');
    decision2.memory.forEach((item) => {
      console.log(`  Event: ${item.event}`);
      console.log(`  New: ${item.text}`);
      if (item.old_memory) {
        console.log(`  Old: ${item.old_memory}`);
      }
      console.log(`  ID: ${item.id}`);
    });
    console.log();

    // Test 3: DELETE scenario - contradictory information
    console.log('Test 3: DELETE scenario (moved cities)...');
    const deleteFacts = [
      'Alice moved to Seattle',
    ];
    const cityMemories: any[] = [
      {
        id: 'mem_002',
        score: 0.90,
        payload: {
          data: 'Alice lives in San Francisco',
          user_id: 'alice',
          created_at: '2025-01-01',
        },
      },
    ];
    const decision3 = await decider.decide(deleteFacts, cityMemories);
    console.log('✓ Decision:');
    decision3.memory.forEach((item) => {
      console.log(`  Event: ${item.event}`);
      console.log(`  Text: ${item.text}`);
      if (item.old_memory) {
        console.log(`  Replaces: ${item.old_memory}`);
      }
    });
    console.log();

    // Test 4: NONE scenario - redundant information
    console.log('Test 4: NONE scenario (redundant fact)...');
    const redundantFacts = [
      'Alice is a software engineer',
    ];
    const exactMemories: any[] = [
      {
        id: 'mem_003',
        score: 0.95,
        payload: {
          data: 'Alice works as a software engineer',
          user_id: 'alice',
          created_at: '2025-01-01',
        },
      },
    ];
    const decision4 = await decider.decide(redundantFacts, exactMemories);
    console.log('✓ Decision:');
    decision4.memory.forEach((item) => {
      console.log(`  Event: ${item.event}`);
      console.log(`  Text: ${item.text}`);
    });
    console.log();

    // Test 5: Mixed scenario - multiple facts with varied actions
    console.log('Test 5: Mixed scenario (multiple facts, varied decisions)...');
    const mixedFacts = [
      'Alice now leads the backend team',
      'Alice enjoys hiking',
      'Alice works with TypeScript',
    ];
    const mixedMemories: any[] = [
      {
        id: 'mem_004',
        score: 0.80,
        payload: {
          data: 'Alice works as a software engineer',
          user_id: 'alice',
          created_at: '2025-01-01',
        },
      },
      {
        id: 'mem_005',
        score: 0.75,
        payload: {
          data: 'Alice uses TypeScript and Node.js',
          user_id: 'alice',
          created_at: '2025-01-01',
        },
      },
    ];
    const decision5 = await decider.decide(mixedFacts, mixedMemories);
    console.log(`✓ Decisions for ${mixedFacts.length} facts:`);
    decision5.memory.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.event}: ${item.text}`);
    });
    console.log();

    // Test 6: Analyze decisions
    console.log('Test 6: Analyzing decisions...');
    const analysis = decider.analyzeDecisions(decision5);
    console.log('✓ Decision summary:');
    console.log(`  Total: ${analysis.total}`);
    console.log(`  ADD: ${analysis.add}`);
    console.log(`  UPDATE: ${analysis.update}`);
    console.log(`  DELETE: ${analysis.delete}`);
    console.log(`  NONE: ${analysis.none}`);
    console.log();

    // Test 7: Filter by event type
    console.log('Test 7: Filtering decisions by event type...');
    const addOnly = decider.filterByEvent(decision5, 'ADD');
    console.log(`✓ ADD decisions only: ${addOnly.memory.length}`);
    addOnly.memory.forEach((item) => {
      console.log(`  - ${item.text}`);
    });
    console.log();

    // Test 8: Get actionable decisions (exclude NONE)
    console.log('Test 8: Getting actionable decisions...');
    const actionable = decider.getActionable(decision5);
    console.log(`✓ Actionable decisions: ${actionable.memory.length} (excluding NONE)`);
    actionable.memory.forEach((item) => {
      console.log(`  - ${item.event}: ${item.text}`);
    });
    console.log();

    // Test 9: Single fact decision
    console.log('Test 9: Deciding for single fact...');
    const singleFact = 'Alice speaks Spanish fluently';
    const singleDecision = await decider.decideSingle(singleFact, []);
    console.log(`✓ Single fact decision:`);
    singleDecision.memory.forEach((item) => {
      console.log(`  Event: ${item.event}`);
      console.log(`  Text: ${item.text}`);
    });
    console.log();

    // Test 10: Empty facts
    console.log('Test 10: Handling empty facts array...');
    const emptyDecision = await decider.decide([], []);
    console.log(`✓ Empty facts returned ${emptyDecision.memory.length} decisions\n`);

    // Test 11: Low similarity threshold
    console.log('Test 11: Testing with low similarity threshold...');
    const lowThresholdDecision = await decider.decide(
      ['Alice likes coffee'],
      mixedMemories,
      { similarityThreshold: 0.5 }
    );
    console.log(`✓ Decision with 0.5 threshold:`);
    lowThresholdDecision.memory.forEach((item) => {
      console.log(`  ${item.event}: ${item.text}`);
    });
    console.log();

    console.log('=========================');
    console.log('✅ All tests completed successfully!');
    console.log('=========================\n');

    console.log('Note: This test requires a valid OpenAI API key.');
    console.log('If tests fail, check your OPENAI_API_KEY in .env.local\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
})();
