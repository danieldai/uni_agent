import { NextResponse } from 'next/server';

export function middleware() {
  // Let API routes handle their own CORS
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
