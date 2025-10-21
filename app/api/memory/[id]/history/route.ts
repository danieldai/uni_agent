/**
 * Memory History API Endpoint
 *
 * GET /api/memory/[id]/history
 *
 * Retrieves the complete audit trail for a specific memory,
 * showing all changes (ADD, UPDATE, DELETE events) over time.
 */

import { NextRequest } from 'next/server';
import { MemoryService } from '@/lib/memory/MemoryService';

export const runtime = 'nodejs';

const memoryService = new MemoryService();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: memoryId } = await params;

    // Validate memory ID
    if (!memoryId) {
      return Response.json(
        { error: 'memoryId is required' },
        { status: 400 }
      );
    }

    // Retrieve history
    const history = await memoryService.history(memoryId);

    return Response.json({
      success: true,
      memoryId,
      history,
      count: history.length,
    });

  } catch (error: any) {
    console.error('Memory history API error:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'An error occurred while retrieving memory history'
      },
      { status: 500 }
    );
  }
}
