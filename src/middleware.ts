import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => cookies.forEach(({ name, value, options }) =>
          res.cookies.set(name, value, options)
        ),
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = req.nextUrl

  // Rutas protegidas
  const adminRoutes = ['/admin']
  const scannerRoutes = ['/scanner']
  const authRoutes = ['/login']

  const isAdminRoute = adminRoutes.some(r => pathname.startsWith(r))
  const isScannerRoute = scannerRoutes.some(r => pathname.startsWith(r))
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))

  // Sin sesión → redirigir al login
  if ((isAdminRoute || isScannerRoute) && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Con sesión → redirigir fuera del login
  if (isAuthRoute && session) {
    const role = session.user.user_metadata?.role
    if (role === 'scanner') {
      return NextResponse.redirect(new URL('/scanner', req.url))
    }
    return NextResponse.redirect(new URL('/admin', req.url))
  }

  // Scanner intentando entrar al admin
  if (isAdminRoute && session) {
    const role = session.user.user_metadata?.role
    if (role === 'scanner') {
      return NextResponse.redirect(new URL('/scanner', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/admin/:path*', '/scanner/:path*', '/login'],
}
