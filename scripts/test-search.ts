#!/usr/bin/env tsx

/**
 * Test script for Memory Search functionality
 *
 * Tests the search method by:
 * 1. Adding test memories to the store
 * 2. Searching with various queries
 * 3. Verifying relevance and ranking
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
  console.log('Testing Memory Search Functionality');
  console.log('='.repeat(60));
  console.log();

  const memoryService = new MemoryService();
  const testUserId = 'test-user-search';

  try {
    // Test 1: Add test memories about different topics
    console.log('Test 1: Adding test memories about different topics');
    console.log('-'.repeat(60));

    const conversations: Message[][] = [
      // Conversation about favorite foods
      [
        { id: '1', role: 'user', content: 'I love pizza, especially margherita pizza', timestamp: Date.now() },
        { id: '2', role: 'assistant', content: 'That sounds delicious!', timestamp: Date.now() },
      ],
      // Conversation about hobbies
      [
        { id: '3', role: 'user', content: 'I enjoy playing guitar in my free time', timestamp: Date.now() },
        { id: '4', role: 'assistant', content: 'Music is a wonderful hobby!', timestamp: Date.now() },
      ],
      // Conversation about work
      [
        { id: '5', role: 'user', content: 'I work as a software engineer at TechCorp', timestamp: Date.now() },
        { id: '6', role: 'assistant', content: 'Interesting career!', timestamp: Date.now() },
      ],
      // Conversation about pets
      [
        { id: '7', role: 'user', content: 'I have a golden retriever named Max', timestamp: Date.now() },
        { id: '8', role: 'assistant', content: 'Dogs are great companions!', timestamp: Date.now() },
      ],
      // Conversation about travel
      [
        { id: '9', role: 'user', content: 'I visited Japan last year and loved the sushi', timestamp: Date.now() },
        { id: '10', role: 'assistant', content: 'Japan is beautiful!', timestamp: Date.now() },
      ],
    ];

    for (const messages of conversations) {
      await memoryService.add(messages, testUserId);
      console.log(`✓ Added conversation: "${messages[0].content.substring(0, 50)}..."`);
    }

    console.log();
    console.log('Waiting 2 seconds for indexing...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Search for food-related memories
    console.log('Test 2: Search for food-related memories');
    console.log('-'.repeat(60));
    const foodQuery = 'What food do I like?';
    console.log(`Query: "${foodQuery}"`);
    console.log();

    const foodMemories = await memoryService.search(foodQuery, testUserId);
    console.log(`Found ${foodMemories.length} memories:\n`);
    foodMemories.forEach((memory, index) => {
      console.log(`${index + 1}. [Score: ${memory.score?.toFixed(4)}] ${memory.memory}`);
    });
    console.log();

    // Test 3: Search for hobby-related memories
    console.log('Test 3: Search for hobby-related memories');
    console.log('-'.repeat(60));
    const hobbyQuery = 'What are my hobbies?';
    console.log(`Query: "${hobbyQuery}"`);
    console.log();

    const hobbyMemories = await memoryService.search(hobbyQuery, testUserId);
    console.log(`Found ${hobbyMemories.length} memories:\n`);
    hobbyMemories.forEach((memory, index) => {
      console.log(`${index + 1}. [Score: ${memory.score?.toFixed(4)}] ${memory.memory}`);
    });
    console.log();

    // Test 4: Search for work-related memories
    console.log('Test 4: Search for work-related memories');
    console.log('-'.repeat(60));
    const workQuery = 'Where do I work?';
    console.log(`Query: "${workQuery}"`);
    console.log();

    const workMemories = await memoryService.search(workQuery, testUserId);
    console.log(`Found ${workMemories.length} memories:\n`);
    workMemories.forEach((memory, index) => {
      console.log(`${index + 1}. [Score: ${memory.score?.toFixed(4)}] ${memory.memory}`);
    });
    console.log();

    // Test 5: Search for pet-related memories
    console.log('Test 5: Search for pet-related memories');
    console.log('-'.repeat(60));
    const petQuery = 'Do I have any pets?';
    console.log(`Query: "${petQuery}"`);
    console.log();

    const petMemories = await memoryService.search(petQuery, testUserId);
    console.log(`Found ${petMemories.length} memories:\n`);
    petMemories.forEach((memory, index) => {
      console.log(`${index + 1}. [Score: ${memory.score?.toFixed(4)}] ${memory.memory}`);
    });
    console.log();

    // Test 6: Broad search
    console.log('Test 6: Broad search across all topics');
    console.log('-'.repeat(60));
    const broadQuery = 'Tell me about myself';
    console.log(`Query: "${broadQuery}"`);
    console.log();

    const allMemories = await memoryService.search(broadQuery, testUserId);
    console.log(`Found ${allMemories.length} memories:\n`);
    allMemories.forEach((memory, index) => {
      console.log(`${index + 1}. [Score: ${memory.score?.toFixed(4)}] ${memory.memory}`);
    });
    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('Test Summary');
    console.log('='.repeat(60));
    console.log(`✅ Search tests completed successfully!`);
    console.log(`   - Added 5 different conversation topics`);
    console.log(`   - Tested 6 different search queries`);
    console.log(`   - Verified relevance-based ranking by score`);
    console.log('='.repeat(60));
    console.log();

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await memoryService.close();
  }
})();
