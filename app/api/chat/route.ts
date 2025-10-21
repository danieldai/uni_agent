import OpenAI from 'openai';
import { MemoryService } from '@/lib/memory/MemoryService';
import { buildSystemPromptWithMemories } from '@/lib/memory/utils/contextBuilder';
import { memoryConfig } from '@/lib/memory/config';

// Create an OpenAI API client (configured with custom base URL if provided)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

// Use nodejs runtime for memory service compatibility
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array is required', {
        status: 400
      });
    }

    // Validate userId
    if (!userId) {
      return new Response('Invalid request: userId is required', {
        status: 400
      });
    }

    let memories: any[] = [];
    let memoriesRetrieved = 0;

    // Retrieve memories if enabled
    if (memoryConfig.enabled) {
      try {
        const memoryService = new MemoryService();
        const lastUserMessage = messages[messages.length - 1]?.content || '';
        memories = await memoryService.search(lastUserMessage, userId, 5);
        memoriesRetrieved = memories.length;
        console.log(`Retrieved ${memoriesRetrieved} memories for user ${userId}`);
      } catch (error) {
        console.error('Memory retrieval error:', error);
        // Continue without memories
      }
    }

    // Build system prompt with memories
    const systemPrompt = buildSystemPromptWithMemories(memories);

    // Prepare messages with memory context
    const contextMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    // Get the model from environment or use default
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    // Ask OpenAI for a streaming chat completion
    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages: contextMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Stream response and collect full text for memory extraction
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();

          // Extract and store memories in background (non-blocking)
          if (memoryConfig.enabled && userId && messages.length > 0) {
            const conversationForMemory = [
              messages[messages.length - 1],
              { role: 'assistant', content: fullResponse }
            ];

            // Fire and forget - don't await
            const memoryService = new MemoryService();
            memoryService.add(conversationForMemory, userId)
              .then(() => console.log('Memory extraction completed'))
              .catch(err => console.error('Memory extraction error:', err));
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Respond with the stream
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Memories-Retrieved': memoriesRetrieved.toString(),
      },
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);

    return new Response(
      JSON.stringify({
        error: error?.message || 'An error occurred during the chat request'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
