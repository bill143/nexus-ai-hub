import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Any path under /auth/* (login, signup, callback, reset-password, etc.)
// is unconditionally accessible. We never redirect AWAY from an auth page —
// that's the only way to guarantee no loop when the auth session is in a
// half-valid state (e.g., user row exists but profile row doesn't yet,
// or the email-verification handshake left a partial cookie behind).
function isAuthPath(pathname: string): boolean {
  return pathname === '/auth' || pathname.startsWith('/auth/')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Early-return for auth paths — they are always accessible, no session
  // lookup, no redirect logic. This breaks the redirect-loop class of bug
  // regardless of cookie state.
  if (isAuthPath(pathname)) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — DO NOT remove this call (rotates Supabase access token cookie)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Treat any auth error OR missing user as unauthenticated. Never trust
  // a half-valid session token as "authed".
  const authed = !authError && !!user

  // For API routes, do NOT redirect — let the route handler return its own
  // 401 with proper JSON shape (the browser's fetch from useChat() can't
  // follow a 307 to /auth/login anyway and would surface as opaque error).
  // Middleware still ran above to refresh the auth cookie; that's the goal.
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Unauthed user on a protected (non-auth) path → bounce to /auth/login
  if (!authed) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Exclude framework assets and static files for perf, AND /api/auth/* (the
    // Supabase OAuth callback handles its own session). Everything else —
    // including /api/jarvis and other authed API routes — runs through the
    // middleware so the Supabase access token cookie auto-refreshes; without
    // this, server-side getSession() returns null once the token expires.
    '/((?!_next/static|_next/image|_next/data|favicon.ico|public|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)',
  ],
}
