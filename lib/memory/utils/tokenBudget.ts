import { Memory } from '../types';

/**
 * Estimate the number of tokens for a given text
 * Uses a rough estimate of ~4 characters per token
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Allocate memories within a token budget
 * @param totalBudget - Total token budget available
 * @param conversationTokens - Tokens already used by conversation
 * @param memories - Memories to select from
 * @param responseReserve - Tokens to reserve for response generation
 * @returns Memories that fit within the budget
 */
export function allocateTokenBudget(
  totalBudget: number,
  conversationTokens: number,
  memories: Memory[],
  responseReserve = 500
): Memory[] {
  const memoryBudget = totalBudget - conversationTokens - responseReserve;

  if (memoryBudget <= 0) {
    return [];
  }

  let currentTokens = 0;
  const selected: Memory[] = [];

  for (const memory of memories) {
    const memoryTokens = estimateTokens(memory.memory);

    if (currentTokens + memoryTokens > memoryBudget) {
      break;
    }

    selected.push(memory);
    currentTokens += memoryTokens;
  }

  return selected;
}

/**
 * Get memories that fit within a maximum token limit
 * @param memories - Memories to filter
 * @param maxTokens - Maximum number of tokens allowed
 * @returns Memories that fit within the token limit
 */
export function getMemoriesWithinBudget(
  memories: Memory[],
  maxTokens: number
): Memory[] {
  return allocateTokenBudget(maxTokens, 0, memories, 0);
}
