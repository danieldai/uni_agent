import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log('[Middleware] Processing:', request.method, request.nextUrl.pathname);

  // Handle CORS for all API routes
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  if (isApiRoute) {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      console.log('[Middleware] Handling OPTIONS for:', request.nextUrl.pathname);
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Add CORS headers to all API responses
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    console.log('[Middleware] Added CORS headers to:', request.nextUrl.pathname);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/api/:path*/'],
};
