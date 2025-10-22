/**
 * CORS Headers Utility
 *
 * Provides CORS headers for API routes to allow mobile app access
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

export function addCorsHeaders(headers: Headers): Headers {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return headers;
}

export function corsResponse(body: any, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  addCorsHeaders(headers);

  return new Response(body, {
    ...init,
    headers,
  });
}
