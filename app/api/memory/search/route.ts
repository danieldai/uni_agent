/**
 * Memory Search API Endpoint
 *
 * GET /api/memory/search?query=<query>&userId=<userId>&limit=<limit>&maxTokens=<maxTokens>
 *
 * Performs semantic search over user's memories using vector similarity.
 * Returns memories most relevant to the query, filtered by similarity threshold.
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

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '5');
    const maxTokens = searchParams.get('maxTokens')
      ? parseInt(searchParams.get('maxTokens')!)
      : undefined;

    // Validate required parameters
    if (!query || !userId) {
      return Response.json(
        { error: 'query and userId are required parameters' },
        { status: 400 }
      );
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return Response.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Validate maxTokens if provided
    if (maxTokens !== undefined && (isNaN(maxTokens) || maxTokens < 1)) {
      return Response.json(
        { error: 'maxTokens must be a positive number' },
        { status: 400 }
      );
    }

    // Perform search
    const results = await memoryService.search(query, userId, limit, maxTokens);

    return Response.json({
      success: true,
      query,
      results,
      count: results.length,
    }, {
      headers: corsHeaders,
    });

  } catch (error: any) {
    console.error('Memory search API error:', error);

    return Response.json(
      {
        success: false,
        error: error.message || 'An error occurred during memory search'
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
