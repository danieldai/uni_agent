import OpenAI from 'openai';

// Create an OpenAI API client (configured with custom base URL if provided)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid request: messages array is required', {
        status: 400
      });
    }

    // Get the model from environment or use default
    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';

    // Ask OpenAI for a streaming chat completion
    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Create a TransformStream to handle the streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
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
