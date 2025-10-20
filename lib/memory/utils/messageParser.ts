/**
 * Message Parser Utilities
 *
 * Functions for parsing and formatting chat messages for memory extraction.
 */

import { Message } from '../types';

/**
 * Parse messages array to formatted text for LLM consumption
 * @param messages Array of chat messages
 * @param includeSystem Whether to include system messages (default: false)
 * @returns Formatted conversation string
 */
export function parseMessagesToText(messages: Message[], includeSystem = false): string {
  return messages
    .filter(msg => includeSystem || msg.role !== 'system')
    .map(msg => {
      const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
      return `${role}: ${msg.content}`;
    })
    .join('\n');
}

/**
 * Extract only user messages from conversation
 * @param messages Array of chat messages
 * @returns Array of user messages only
 */
export function extractUserMessages(messages: Message[]): Message[] {
  return messages.filter(msg => msg.role === 'user');
}

/**
 * Extract only assistant messages from conversation
 * @param messages Array of chat messages
 * @returns Array of assistant messages only
 */
export function extractAssistantMessages(messages: Message[]): Message[] {
  return messages.filter(msg => msg.role === 'assistant');
}

/**
 * Get the last N messages from conversation
 * @param messages Array of chat messages
 * @param n Number of messages to retrieve
 * @returns Last N messages
 */
export function getLastNMessages(messages: Message[], n: number): Message[] {
  if (n <= 0) return [];
  if (n >= messages.length) return messages;
  return messages.slice(-n);
}

/**
 * Get the first N messages from conversation
 * @param messages Array of chat messages
 * @param n Number of messages to retrieve
 * @returns First N messages
 */
export function getFirstNMessages(messages: Message[], n: number): Message[] {
  if (n <= 0) return [];
  if (n >= messages.length) return messages;
  return messages.slice(0, n);
}

/**
 * Filter messages by minimum length to remove short/trivial messages
 * @param messages Array of chat messages
 * @param minLength Minimum character count (default: 10)
 * @returns Filtered messages
 */
export function filterMessagesByLength(messages: Message[], minLength = 10): Message[] {
  return messages.filter(msg => msg.content.trim().length >= minLength);
}

/**
 * Filter relevant messages for memory extraction
 * Removes system messages and very short messages
 * @param messages Array of chat messages
 * @param options Filter options
 * @returns Filtered messages
 */
export function filterRelevantMessages(
  messages: Message[],
  options: {
    excludeSystem?: boolean;
    minLength?: number;
    maxMessages?: number;
  } = {}
): Message[] {
  const {
    excludeSystem = true,
    minLength = 10,
    maxMessages,
  } = options;

  let filtered = messages;

  // Remove system messages if requested
  if (excludeSystem) {
    filtered = filtered.filter(msg => msg.role !== 'system');
  }

  // Filter by minimum length
  if (minLength > 0) {
    filtered = filterMessagesByLength(filtered, minLength);
  }

  // Limit to max messages (take most recent)
  if (maxMessages && maxMessages > 0) {
    filtered = getLastNMessages(filtered, maxMessages);
  }

  return filtered;
}

/**
 * Count messages by role
 * @param messages Array of chat messages
 * @returns Object with counts by role
 */
export function countMessagesByRole(messages: Message[]): {
  user: number;
  assistant: number;
  system: number;
  total: number;
} {
  const counts = {
    user: 0,
    assistant: 0,
    system: 0,
    total: messages.length,
  };

  messages.forEach(msg => {
    counts[msg.role]++;
  });

  return counts;
}

/**
 * Get conversation summary statistics
 * @param messages Array of chat messages
 * @returns Statistics object
 */
export function getConversationStats(messages: Message[]): {
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  systemMessages: number;
  totalCharacters: number;
  averageMessageLength: number;
  timeSpan?: number; // milliseconds
} {
  const counts = countMessagesByRole(messages);
  const totalCharacters = messages.reduce((sum, msg) => sum + msg.content.length, 0);

  let timeSpan: number | undefined;
  if (messages.length > 1) {
    const timestamps = messages.map(m => m.timestamp).filter(Boolean);
    if (timestamps.length > 1) {
      timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    }
  }

  return {
    totalMessages: counts.total,
    userMessages: counts.user,
    assistantMessages: counts.assistant,
    systemMessages: counts.system,
    totalCharacters,
    averageMessageLength: counts.total > 0 ? Math.round(totalCharacters / counts.total) : 0,
    timeSpan,
  };
}

/**
 * Format messages for display with timestamps
 * @param messages Array of chat messages
 * @param showTimestamps Whether to include timestamps (default: false)
 * @returns Formatted string
 */
export function formatMessagesForDisplay(messages: Message[], showTimestamps = false): string {
  return messages.map(msg => {
    const role = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
    const timestamp = showTimestamps && msg.timestamp
      ? ` [${new Date(msg.timestamp).toLocaleString()}]`
      : '';
    return `${role}${timestamp}: ${msg.content}`;
  }).join('\n\n');
}

/**
 * Extract context window of messages around a specific message
 * @param messages Array of chat messages
 * @param index Index of the target message
 * @param windowSize Number of messages before and after (default: 2)
 * @returns Array of messages in the context window
 */
export function getContextWindow(
  messages: Message[],
  index: number,
  windowSize = 2
): Message[] {
  const start = Math.max(0, index - windowSize);
  const end = Math.min(messages.length, index + windowSize + 1);
  return messages.slice(start, end);
}

/**
 * Split long conversation into chunks for processing
 * @param messages Array of chat messages
 * @param chunkSize Maximum messages per chunk
 * @param overlap Number of overlapping messages between chunks
 * @returns Array of message chunks
 */
export function chunkMessages(
  messages: Message[],
  chunkSize: number,
  overlap = 0
): Message[][] {
  if (chunkSize <= 0) {
    throw new Error('Chunk size must be positive');
  }

  if (overlap >= chunkSize) {
    throw new Error('Overlap must be less than chunk size');
  }

  const chunks: Message[][] = [];
  const step = chunkSize - overlap;

  for (let i = 0; i < messages.length; i += step) {
    const chunk = messages.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Stop if we've included the last message
    if (i + chunkSize >= messages.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Validate message structure
 * @param message Object to validate
 * @returns True if valid message
 */
export function isValidMessage(message: any): message is Message {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof message.id === 'string' &&
    typeof message.content === 'string' &&
    ['user', 'assistant', 'system'].includes(message.role) &&
    (message.timestamp === undefined || typeof message.timestamp === 'number')
  );
}

/**
 * Validate array of messages
 * @param messages Array to validate
 * @returns True if all are valid messages
 */
export function validateMessages(messages: any[]): messages is Message[] {
  return Array.isArray(messages) && messages.every(isValidMessage);
}
