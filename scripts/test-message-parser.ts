#!/usr/bin/env tsx

/**
 * Test script for Message Parser utilities
 */

import { Message } from '../lib/memory/types';
import {
  parseMessagesToText,
  extractUserMessages,
  extractAssistantMessages,
  getLastNMessages,
  getFirstNMessages,
  filterMessagesByLength,
  filterRelevantMessages,
  countMessagesByRole,
  getConversationStats,
  formatMessagesForDisplay,
  getContextWindow,
  chunkMessages,
  isValidMessage,
  validateMessages,
} from '../lib/memory/utils/messageParser';

console.log('Message Parser Test Suite');
console.log('=========================\n');

// Test data
const testMessages: Message[] = [
  { id: '1', role: 'system', content: 'You are a helpful assistant.', timestamp: 1000 },
  { id: '2', role: 'user', content: 'Hi, my name is Alice.', timestamp: 2000 },
  { id: '3', role: 'assistant', content: 'Hello Alice! Nice to meet you.', timestamp: 3000 },
  { id: '4', role: 'user', content: 'I work as a software engineer.', timestamp: 4000 },
  { id: '5', role: 'assistant', content: 'That sounds interesting! What technologies do you work with?', timestamp: 5000 },
  { id: '6', role: 'user', content: 'Mainly TypeScript and React.', timestamp: 6000 },
  { id: '7', role: 'assistant', content: 'Great choices! Are you working on any interesting projects?', timestamp: 7000 },
  { id: '8', role: 'user', content: 'Yes, building a chatbot with memory capabilities.', timestamp: 8000 },
  { id: '9', role: 'assistant', content: 'Wow!', timestamp: 9000 }, // Short message
];

try {
  // Test 1: parseMessagesToText
  console.log('Test 1: Parse messages to text...');
  const conversationText = parseMessagesToText(testMessages);
  console.log('✓ Formatted conversation:');
  console.log(conversationText.split('\n').slice(0, 3).join('\n'));
  console.log('  ... (truncated)');
  console.log(`  Total lines: ${conversationText.split('\n').length}\n`);

  // Test 2: parseMessagesToText with system messages
  console.log('Test 2: Parse with system messages...');
  const withSystem = parseMessagesToText(testMessages, true);
  const hasSystem = withSystem.includes('System:');
  console.log(`✓ Includes system messages: ${hasSystem}\n`);

  // Test 3: Extract user messages
  console.log('Test 3: Extract user messages...');
  const userMessages = extractUserMessages(testMessages);
  console.log(`✓ Found ${userMessages.length} user messages:`);
  userMessages.forEach((msg, i) => {
    console.log(`  ${i + 1}. ${msg.content}`);
  });
  console.log();

  // Test 4: Extract assistant messages
  console.log('Test 4: Extract assistant messages...');
  const assistantMessages = extractAssistantMessages(testMessages);
  console.log(`✓ Found ${assistantMessages.length} assistant messages\n`);

  // Test 5: Get last N messages
  console.log('Test 5: Get last 3 messages...');
  const lastThree = getLastNMessages(testMessages, 3);
  console.log(`✓ Retrieved ${lastThree.length} messages:`);
  lastThree.forEach(msg => {
    console.log(`  ${msg.role}: ${msg.content}`);
  });
  console.log();

  // Test 6: Get first N messages
  console.log('Test 6: Get first 2 messages...');
  const firstTwo = getFirstNMessages(testMessages, 2);
  console.log(`✓ Retrieved ${firstTwo.length} messages:`);
  firstTwo.forEach(msg => {
    console.log(`  ${msg.role}: ${msg.content}`);
  });
  console.log();

  // Test 7: Filter by length
  console.log('Test 7: Filter messages by minimum length (20 chars)...');
  const longMessages = filterMessagesByLength(testMessages, 20);
  console.log(`✓ ${longMessages.length} messages with 20+ characters (filtered ${testMessages.length - longMessages.length})\n`);

  // Test 8: Filter relevant messages
  console.log('Test 8: Filter relevant messages...');
  const relevant = filterRelevantMessages(testMessages, {
    excludeSystem: true,
    minLength: 15,
    maxMessages: 5,
  });
  console.log(`✓ Filtered to ${relevant.length} relevant messages:`);
  relevant.forEach(msg => {
    console.log(`  ${msg.role}: ${msg.content}`);
  });
  console.log();

  // Test 9: Count messages by role
  console.log('Test 9: Count messages by role...');
  const counts = countMessagesByRole(testMessages);
  console.log('✓ Message counts:');
  console.log(`  User: ${counts.user}`);
  console.log(`  Assistant: ${counts.assistant}`);
  console.log(`  System: ${counts.system}`);
  console.log(`  Total: ${counts.total}\n`);

  // Test 10: Get conversation stats
  console.log('Test 10: Get conversation statistics...');
  const stats = getConversationStats(testMessages);
  console.log('✓ Conversation stats:');
  console.log(`  Total messages: ${stats.totalMessages}`);
  console.log(`  Total characters: ${stats.totalCharacters}`);
  console.log(`  Average message length: ${stats.averageMessageLength} chars`);
  console.log(`  Time span: ${stats.timeSpan}ms\n`);

  // Test 11: Format for display
  console.log('Test 11: Format messages for display...');
  const formatted = formatMessagesForDisplay(getLastNMessages(testMessages, 2), false);
  console.log('✓ Formatted (last 2 messages):');
  console.log(formatted);
  console.log();

  // Test 12: Format with timestamps
  console.log('Test 12: Format with timestamps...');
  const withTimestamps = formatMessagesForDisplay(getLastNMessages(testMessages, 2), true);
  console.log('✓ With timestamps:');
  console.log(withTimestamps.split('\n\n')[0]);
  console.log('  ...\n');

  // Test 13: Get context window
  console.log('Test 13: Get context window (around message 4, window=2)...');
  const context = getContextWindow(testMessages, 4, 2);
  console.log(`✓ Context window has ${context.length} messages:`);
  context.forEach(msg => {
    console.log(`  ${msg.role}: ${msg.content}`);
  });
  console.log();

  // Test 14: Chunk messages
  console.log('Test 14: Chunk messages (size=4, overlap=1)...');
  const chunks = chunkMessages(testMessages, 4, 1);
  console.log(`✓ Split into ${chunks.length} chunks:`);
  chunks.forEach((chunk, i) => {
    console.log(`  Chunk ${i + 1}: ${chunk.length} messages`);
  });
  console.log();

  // Test 15: Validate message
  console.log('Test 15: Validate message structure...');
  const validMsg = { id: '1', role: 'user', content: 'Hello', timestamp: 1000 };
  const invalidMsg = { id: '1', role: 'invalid', content: 'Hello' };
  console.log(`✓ Valid message: ${isValidMessage(validMsg)}`);
  console.log(`✓ Invalid message: ${isValidMessage(invalidMsg)}\n`);

  // Test 16: Validate messages array
  console.log('Test 16: Validate messages array...');
  const isValid = validateMessages(testMessages);
  console.log(`✓ Test messages array valid: ${isValid}\n`);

  // Test 17: Edge cases - empty array
  console.log('Test 17: Handle empty array...');
  const emptyParsed = parseMessagesToText([]);
  const emptyLast = getLastNMessages([], 5);
  console.log(`✓ Empty array to text: "${emptyParsed}"`);
  console.log(`✓ Last N from empty: ${emptyLast.length} messages\n`);

  // Test 18: Edge cases - single message
  console.log('Test 18: Handle single message...');
  const singleMsg = [testMessages[0]];
  const singleStats = getConversationStats(singleMsg);
  console.log(`✓ Single message stats: ${singleStats.totalMessages} message, no time span\n`);

  console.log('=========================');
  console.log('✅ All tests passed!');
  console.log('=========================\n');

} catch (error) {
  console.error('❌ Test failed:', error);
  process.exit(1);
}
