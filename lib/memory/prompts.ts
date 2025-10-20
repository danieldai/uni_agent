/**
 * LLM Prompt Templates for Memory Extraction and Decision Making
 */

/**
 * Prompt for extracting facts from conversations
 *
 * This prompt instructs the LLM to extract important, factual information
 * about the user from their conversation with the assistant.
 */
export const MEMORY_EXTRACTION_PROMPT = `You are a memory extraction system. Your task is to extract important facts about the user from the conversation.

Extract key facts such as:
- User's name, location, job, hobbies
- Preferences (food, music, activities, etc.)
- Important life events or dates
- Relationships and connections
- Goals and aspirations
- Technical skills or expertise
- Health or medical information (if mentioned)
- Travel plans or history

Rules:
1. Extract only factual information explicitly stated by the user
2. Each fact should be concise (1-2 sentences max)
3. Do NOT infer or assume information not directly stated
4. Focus on information that would be useful for personalizing future conversations
5. Ignore temporary context like "I'm using Chrome" or "It's raining today"
6. Do NOT extract facts about the assistant, only about the user
7. Return facts as a JSON array

Conversation:
{conversation}

Extract facts as JSON:
{
  "facts": [
    "fact 1",
    "fact 2",
    ...
  ]
}`;

/**
 * Prompt for deciding what action to take on memories
 *
 * This prompt instructs the LLM to decide whether to ADD, UPDATE, DELETE,
 * or do NONE for each extracted fact based on existing memories.
 */
export const MEMORY_UPDATE_PROMPT = `You are a memory update system. Your task is to decide what action to take for each new fact given existing similar memories.

Actions:
- ADD: Create a new memory (fact is unique and new)
- UPDATE: Update an existing memory (fact provides newer or better information about the same topic)
- DELETE: Remove an existing memory (fact contradicts or invalidates it)
- NONE: Do nothing (fact is already captured or redundant)

Rules:
1. Prefer UPDATE over ADD when information is related to an existing memory
2. Use DELETE only when there's a clear contradiction (e.g., "moved from Boston to NYC" should DELETE "lives in Boston")
3. Use NONE for redundant information that doesn't add value
4. Each memory should have a unique ID
5. For UPDATE, include the old memory text in "old_memory" field
6. Consider semantic similarity, not just exact text matches
7. Be conservative with DELETE - only use when truly contradictory

New Facts:
{facts}

Existing Similar Memories (with IDs and similarity scores):
{existing_memories}

For each fact, decide an action and return as JSON:
{
  "memory": [
    {
      "id": "existing-id-or-new-uuid",
      "text": "the memory text",
      "event": "ADD|UPDATE|DELETE|NONE",
      "old_memory": "text of old memory (only for UPDATE)"
    }
  ]
}`;

/**
 * Build extraction prompt with conversation context
 * @param conversation Formatted conversation string
 * @returns Complete extraction prompt
 */
export function buildExtractionPrompt(conversation: string): string {
  return MEMORY_EXTRACTION_PROMPT.replace('{conversation}', conversation);
}

/**
 * Build update/decision prompt with facts and existing memories
 * @param facts Array of extracted facts
 * @param existingMemories Array of similar memories with IDs and scores
 * @returns Complete update prompt
 */
export function buildUpdatePrompt(
  facts: string[],
  existingMemories: Array<{ id: string; text: string; score: number }>
): string {
  const factsText = facts.map((f, i) => `${i + 1}. ${f}`).join('\n');

  const memoriesText = existingMemories.length > 0
    ? existingMemories.map(m =>
        `- [ID: ${m.id}] ${m.text} (similarity: ${m.score.toFixed(2)})`
      ).join('\n')
    : 'No existing memories found';

  return MEMORY_UPDATE_PROMPT
    .replace('{facts}', factsText)
    .replace('{existing_memories}', memoriesText);
}

/**
 * System prompt for the memory-enhanced chatbot
 * This is used in the chat API to inject memory context
 * @param memories Array of relevant memories
 * @returns System prompt with memory context
 */
export function buildSystemPromptWithMemories(memories: Array<{ memory: string; score?: number }>): string {
  if (memories.length === 0) {
    return 'You are a helpful AI assistant. Be friendly, informative, and conversational.';
  }

  const memoryContext = memories
    .map(m => `- ${m.memory}`)
    .join('\n');

  return `You are a helpful AI assistant. Be friendly, informative, and conversational.

You have the following information about the user from previous conversations:
${memoryContext}

Use this information to provide personalized responses, but don't explicitly mention that you're recalling memories unless it's natural to do so. Act as if you naturally remember these details about the user.`;
}

/**
 * Format memories for display to users
 * @param memories Array of memories with creation dates
 * @returns Formatted string for display
 */
export function formatMemoriesForDisplay(
  memories: Array<{ memory: string; created_at: string; updated_at?: string }>
): string {
  if (memories.length === 0) {
    return 'No memories found.';
  }

  return memories
    .map((m, i) => {
      const date = new Date(m.created_at).toLocaleDateString();
      const updated = m.updated_at ? ` (updated ${new Date(m.updated_at).toLocaleDateString()})` : '';
      return `${i + 1}. ${m.memory} - ${date}${updated}`;
    })
    .join('\n');
}

/**
 * Example conversations for testing and documentation
 */
export const EXAMPLE_CONVERSATIONS = {
  basic: `User: My name is Alice and I work as a software engineer in San Francisco.
Assistant: Nice to meet you, Alice! What kind of software engineering do you do?
User: I mainly work on backend systems using TypeScript and Node.js.`,

  preferences: `User: I love hiking and photography.
Assistant: That sounds wonderful! Do you combine those hobbies?
User: Yes! I especially enjoy landscape photography during sunrise hikes.
Assistant: Beautiful! What's your favorite hiking spot?
User: I really like the trails in Marin Headlands.`,

  update: `User: I got a new job! I'm now a senior software engineer at TechCorp.
Assistant: Congratulations! That's exciting news.
User: Thanks! I'll be leading the backend team now.`,

  contradiction: `User: I moved from San Francisco to Seattle last month.
Assistant: Oh wow, that's a big change! How are you liking Seattle?
User: It's great! The nature here is amazing.`,
};

/**
 * Example outputs for documentation
 */
export const EXAMPLE_OUTPUTS = {
  extraction: {
    facts: [
      "Name is Alice",
      "Works as a software engineer",
      "Located in San Francisco",
      "Specializes in backend systems using TypeScript and Node.js",
      "Enjoys hiking",
      "Enjoys photography, especially landscape photography",
      "Likes to photograph during sunrise",
      "Favorite hiking spot is Marin Headlands"
    ]
  },

  decision: {
    memory: [
      {
        id: "mem_001",
        text: "Works as a senior software engineer at TechCorp",
        event: "UPDATE",
        old_memory: "Works as a software engineer in San Francisco"
      },
      {
        id: "mem_002",
        text: "Leads the backend team at TechCorp",
        event: "ADD"
      },
      {
        id: "mem_003",
        text: "Lives in San Francisco",
        event: "DELETE",
        old_memory: "Lives in San Francisco"
      },
      {
        id: "mem_004",
        text: "Moved to Seattle",
        event: "ADD"
      }
    ]
  }
};
