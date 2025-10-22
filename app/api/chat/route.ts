import OpenAI from 'openai';
import { MemoryService } from '@/lib/memory/MemoryService';
import { buildSystemPromptWithMemories } from '@/lib/memory/utils/contextBuilder';
import { memoryConfig } from '@/lib/memory/config';
import { corsHeaders } from '@/lib/cors';
import { Message, OpenAIMessage, OpenAIMessageContent } from '@/app/types/chat';

// Create an OpenAI API client (configured with custom base URL if provided)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

// Use nodejs runtime for memory service compatibility
export const runtime = 'nodejs';

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

/**
 * Convert Message with images to OpenAI compatible format
 */
function convertToOpenAIMessage(message: Message): OpenAIMessage {
  // If message has no images, return simple string content
  if (!message.images || message.images.length === 0) {
    return {
      role: message.role,
      content: message.content
    };
  }

  // Build multimodal content array
  const content: OpenAIMessageContent = [];

  // Add text content if present
  if (message.content.trim()) {
    content.push({
      type: 'text',
      text: message.content
    });
  }

  // Add images
  message.images.forEach(image => {
    const imageUrl = image.type === 'base64'
      ? `data:${image.mimeType || 'image/jpeg'};base64,${image.data}`
      : image.data;

    content.push({
      type: 'image_url',
      image_url: {
        url: imageUrl,
        detail: 'auto'
      }
    });
  });

  return {
    role: message.role,
    content
  };
}

/**
 * Get text content from message for memory extraction
 */
function getTextContent(message: Message): string {
  return message.content;
}

export async function POST(req: Request) {
  try {
    const { messages, userId } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array is required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Validate userId
    if (!userId) {
      return new Response('Invalid request: userId is required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Type cast messages to our Message interface
    const typedMessages: Message[] = messages;

    let memories: any[] = [];
    let memoriesRetrieved = 0;

    // Retrieve memories if enabled
    if (memoryConfig.enabled) {
      try {
        const memoryService = new MemoryService();
        const lastUserMessage = getTextContent(typedMessages[typedMessages.length - 1]) || '';
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

    // Convert messages to OpenAI format (handles images)
    const openAIMessages = typedMessages.map(convertToOpenAIMessage);

    // Prepare messages with memory context
    const contextMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...openAIMessages
    ];

    // Check if any message contains images - use vision model if so
    const hasImages = typedMessages.some(msg => msg.images && msg.images.length > 0);
    const defaultModel = hasImages ? 'gpt-4o' : 'gpt-3.5-turbo';
    const model = process.env.OPENAI_MODEL || defaultModel;

    console.log(`Using model: ${model}, hasImages: ${hasImages}`);

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
          if (memoryConfig.enabled && userId && typedMessages.length > 0) {
            // Only store text content in memories (exclude images for now)
            const lastMessage = typedMessages[typedMessages.length - 1];
            const conversationForMemory = [
              { role: lastMessage.role, content: getTextContent(lastMessage) },
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
        ...corsHeaders,
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
