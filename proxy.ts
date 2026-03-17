import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth/session'

const protectedRoutes = ['/admin', '/vote']
const publicRoutes = ['/login', '/']

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname
    const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route))
    const isPublicRoute = publicRoutes.includes(path)

    const cookie = req.cookies.get('session_token')?.value
    const session = await decrypt(cookie)

    // 1. Redirect to /login if accessing protected route without session
    if (isProtectedRoute && !session) {
        return NextResponse.redirect(new URL('/login', req.nextUrl))
    }

    // 2. Redirect to /vote or /admin if accessing public route WITH session
    if (isPublicRoute && session?.userId) {
        if (session.role === 'admin') {
            return NextResponse.redirect(new URL('/admin', req.nextUrl))
        }
        return NextResponse.redirect(new URL('/vote', req.nextUrl))
    }

    // 3. Role-based Access Control
    if (isProtectedRoute && session) {
        if (path.startsWith('/admin') && session.role !== 'admin') {
            return NextResponse.redirect(new URL('/vote', req.nextUrl))
        }
        if (path.startsWith('/vote') && session.role !== 'voter') {
            return NextResponse.redirect(new URL('/admin', req.nextUrl))
        }
    }

    return NextResponse.next()
}

// Routes Middleware should not run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
