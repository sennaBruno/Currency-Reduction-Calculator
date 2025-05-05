import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value
        },
        set(name, value, options) {
          // This is needed because Supabase Auth needs to set cookies on the
          // response for auth to work.
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name, options) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          })
        },
      },
    }
  )

  // Refresh session if it exists
  await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/history', '/calculation']
  const isProtectedRoute = protectedRoutes.some(
    (route) => request.nextUrl.pathname.startsWith(route)
  )

  // Check if we have a session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect to login if accessing a protected route without a session
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 