/**
 * Memory Management API Endpoint
 *
 * GET /api/memory?userId=<userId>
 * Retrieves all memories for a user
 *
 * DELETE /api/memory
 * Deletes a specific memory by ID
 */

import { NextRequest } from 'next/server';
import { MemoryService } from '@/lib/memory/MemoryService';

export const runtime = 'nodejs';

const memoryService = new MemoryService();

/**
 * GET - Retrieve all memories for a user
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    // Validate required parameter
    if (!userId) {
      return Response.json(
        { error: 'userId is required parameter' },
        { status: 400 }
      );
    }

    // Retrieve all memories
    const results = await memoryService.getAll(userId);

    return Response.json({
      success: true,
      results,
      count: results.length,
    });

  } catch (error: any) {
    console.error('Memory getAll API error:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'An error occurred while retrieving memories'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a specific memory
 */
export async function DELETE(req: NextRequest) {
  try {
    const { memoryId } = await req.json();

    // Validate required parameter
    if (!memoryId) {
      return Response.json(
        { error: 'memoryId is required in request body' },
        { status: 400 }
      );
    }

    // Delete the memory
    await memoryService.delete(memoryId);

    return Response.json({
      success: true,
      message: 'Memory deleted successfully',
      memoryId,
    });

  } catch (error: any) {
    console.error('Memory delete API error:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'An error occurred while deleting memory'
      },
      { status: 500 }
    );
  }
}
