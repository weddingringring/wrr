import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Prevent search engines from indexing private routes
  // NOTE: /m/ share pages are excluded - social media crawlers (WhatsApp, Facebook)
  // need to read their meta tags for link preview images
  const path = request.nextUrl.pathname
  if (
    path.startsWith('/a/') ||
    path.startsWith('/guest/') ||
    path.startsWith('/customer/') ||
    path.startsWith('/admin/') ||
    path.startsWith('/venue/')
  ) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is logged in, check if password reset is required
  if (session?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('password_reset_required, role')
      .eq('id', session.user.id)
      .single()

    const isPasswordResetPage = request.nextUrl.pathname === '/reset-password'
    const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                       request.nextUrl.pathname.startsWith('/auth')

    // If password reset is required and user is not on reset page
    if (profile?.password_reset_required && !isPasswordResetPage && !isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/reset-password'
      url.searchParams.set('required', 'true')
      return NextResponse.redirect(url)
    }

    // If password reset is NOT required and user IS on reset-password page with required param
    if (!profile?.password_reset_required && isPasswordResetPage && 
        request.nextUrl.searchParams.get('required') === 'true') {
      // Redirect to appropriate dashboard
      const url = request.nextUrl.clone()
      if (profile?.role === 'admin' || profile?.role === 'developer') {
        url.pathname = '/admin'
      } else if (profile?.role === 'venue') {
        url.pathname = '/venue'
      } else if (profile?.role === 'customer') {
        url.pathname = '/customer/dashboard'
      }
      url.searchParams.delete('required')
      return NextResponse.redirect(url)
    }
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
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
