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
import { corsHeaders } from '@/lib/cors';

export const runtime = 'nodejs';

const memoryService = new MemoryService();

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

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
        { 
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    // Retrieve history
    const history = await memoryService.history(memoryId);

    return Response.json({
      success: true,
      memoryId,
      history,
      count: history.length,
    }, {
      headers: corsHeaders,
    });

  } catch (error: any) {
    console.error('Memory history API error:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'An error occurred while retrieving memory history'
      },
      { 
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
