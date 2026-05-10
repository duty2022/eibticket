import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // BYPASS TOTAL PARA EMERGENCIA
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/scanner/:path*', '/login'],
}
