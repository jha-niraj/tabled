import { NextRequest, NextResponse } from 'next/server'

// Routes that require a session — redirect to /signin if not logged in
const protectedRoutes = [
    '/home',
    '/profile',
]

// Auth-only routes — redirect to /home if ALREADY logged in
// NOTE: /verifyemail is intentionally excluded — a signed-in user who just
// registered must be able to reach this page before their email is verified.
const authOnlyRoutes = [
    '/signin',
    '/signup',
    '/forgotpassword',
    '/resetpassword',
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next/') ||
        pathname.includes('.')
    ) {
        return NextResponse.next()
    }

    const isProtected = protectedRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))
    const isAuthOnly = authOnlyRoutes.some(r => pathname === r || pathname.startsWith(r + '/'))

    const sessionCookie = request.cookies.get('better-auth.session_token')
    const isLoggedIn = !!sessionCookie?.value

    // Not logged in trying to access a protected page
    if (!isLoggedIn && isProtected) {
        const url = new URL('/signin', request.nextUrl.origin)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
    }

    // Already logged in trying to access sign-in/sign-up pages
    if (isLoggedIn && isAuthOnly) {
        return NextResponse.redirect(new URL('/home', request.nextUrl.origin))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
