/**
 * CORS Wrapper for API Routes
 *
 * Wraps API route handlers to automatically add CORS headers to all responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from './cors';

type RouteHandler = (req: NextRequest, context?: any) => Promise<Response>;

/**
 * Wraps an API route handler with CORS support
 */
export function withCors(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context?: any) => {
    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Call the actual handler
    const response = await handler(req, context);

    // Add CORS headers to response
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
