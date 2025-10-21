/**
 * Manual Memory Addition API Endpoint
 *
 * POST /api/memory/add
 *
 * Manually add memories from conversation messages.
 * This extracts facts from provided messages and stores them as memories.
 *
 * Request body:
 * {
 *   "messages": Array<{role: string, content: string}>,
 *   "userId": string
 * }
 */

import { NextRequest } from 'next/server';
import { MemoryService } from '@/lib/memory/MemoryService';
import { Message } from '@/lib/memory/types';

export const runtime = 'nodejs';

const memoryService = new MemoryService();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, userId } = body;

    // Validate required parameters
    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'messages array is required in request body' },
        { status: 400 }
      );
    }

    if (!userId) {
      return Response.json(
        { error: 'userId is required in request body' },
        { status: 400 }
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return Response.json(
          { error: 'Each message must have role and content properties' },
          { status: 400 }
        );
      }

      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        return Response.json(
          { error: 'Message role must be user, assistant, or system' },
          { status: 400 }
        );
      }
    }

    // Convert to Message format with IDs and timestamps if not present
    const formattedMessages: Message[] = messages.map((msg, index) => ({
      id: msg.id || `msg_${Date.now()}_${index}`,
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp || Date.now(),
    }));

    // Add memories
    const result = await memoryService.add(formattedMessages, userId);

    return Response.json({
      success: true,
      result,
      message: `Processed ${formattedMessages.length} messages, extracted ${result.results.length} memory actions`,
    });

  } catch (error: any) {
    console.error('Memory add API error:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'An error occurred while adding memories'
      },
      { status: 500 }
    );
  }
}
