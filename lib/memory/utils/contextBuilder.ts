import { Memory } from '../types';

/**
 * Builds a system prompt that includes user memories for LLM context
 * @param memories - Array of Memory objects to include in the prompt
 * @returns Formatted system prompt string
 */
export function buildSystemPromptWithMemories(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'You are a helpful AI assistant. Be friendly and informative.';
  }

  const memoryContext = memories
    .map(m => `- ${m.memory}`)
    .join('\n');

  return `You are a helpful AI assistant. Be friendly and informative.

You have the following information about the user from previous conversations:
${memoryContext}

Use this information to provide personalized responses, but don't explicitly mention that you're recalling memories unless relevant.`;
}

/**
 * Formats memories for user-facing display
 * @param memories - Array of Memory objects to format
 * @returns Formatted string for display
 */
export function formatMemoriesForDisplay(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'No memories found.';
  }

  return memories
    .map((m, i) => {
      const date = new Date(m.created_at).toLocaleDateString();
      const score = m.score ? ` (relevance: ${(m.score * 100).toFixed(0)}%)` : '';
      return `${i + 1}. ${m.memory} (${date})${score}`;
    })
    .join('\n');
}

/**
 * Formats memories as a concise summary for context injection
 * @param memories - Array of Memory objects to summarize
 * @returns Concise summary string
 */
export function buildMemorySummary(memories: Memory[]): string {
  if (memories.length === 0) {
    return '';
  }

  return memories.map(m => m.memory).join('; ');
}

/**
 * Groups memories by category/type based on content
 * @param memories - Array of Memory objects to group
 * @returns Object with categorized memories
 */
export function categorizeMemories(memories: Memory[]): Record<string, Memory[]> {
  const categories: Record<string, Memory[]> = {
    personal: [],
    preferences: [],
    professional: [],
    other: [],
  };

  memories.forEach(memory => {
    const text = memory.memory.toLowerCase();

    if (text.includes('name is') || text.includes('live in') || text.includes('born')) {
      categories.personal.push(memory);
    } else if (text.includes('love') || text.includes('like') || text.includes('prefer') || text.includes('favorite')) {
      categories.preferences.push(memory);
    } else if (text.includes('work') || text.includes('job') || text.includes('career') || text.includes('company')) {
      categories.professional.push(memory);
    } else {
      categories.other.push(memory);
    }
  });

  return categories;
}

/**
 * Builds a detailed system prompt with categorized memories
 * @param memories - Array of Memory objects to include
 * @returns Formatted system prompt with categorized information
 */
export function buildCategorizedSystemPrompt(memories: Memory[]): string {
  if (memories.length === 0) {
    return 'You are a helpful AI assistant. Be friendly and informative.';
  }

  const categorized = categorizeMemories(memories);
  const sections: string[] = [];

  if (categorized.personal.length > 0) {
    sections.push('Personal Information:\n' + categorized.personal.map(m => `- ${m.memory}`).join('\n'));
  }

  if (categorized.preferences.length > 0) {
    sections.push('Preferences:\n' + categorized.preferences.map(m => `- ${m.memory}`).join('\n'));
  }

  if (categorized.professional.length > 0) {
    sections.push('Professional:\n' + categorized.professional.map(m => `- ${m.memory}`).join('\n'));
  }

  if (categorized.other.length > 0) {
    sections.push('Other:\n' + categorized.other.map(m => `- ${m.memory}`).join('\n'));
  }

  return `You are a helpful AI assistant. Be friendly and informative.

You have the following information about the user from previous conversations:

${sections.join('\n\n')}

Use this information to provide personalized responses, but don't explicitly mention that you're recalling memories unless relevant.`;
}
