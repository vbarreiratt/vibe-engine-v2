import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Public pages (Laboratório Bicho platform)
    const isPublicPlatform =
        pathname === '/' ||
        pathname.startsWith('/sobre') ||
        pathname.startsWith('/galeria') ||
        pathname.startsWith('/governanca')

    // Auth pages
    const isAuthPage =
        pathname.startsWith('/login') ||
        pathname.startsWith('/auth') ||
        pathname.startsWith('/ferramentas/vibe-engine/login')

    // API routes
    const isApi = pathname.startsWith('/api') || pathname.startsWith('/ferramentas/vibe-engine/api')

    // Tool hero pages (public landing pages for each tool)
    const isToolHeroPage = pathname === '/ferramentas/vibe-engine' || pathname.match(/^\/ferramentas\/[^/]+$/)

    // Tool-specific pages that require authentication
    const isToolPage = pathname.startsWith('/ferramentas/') && !isAuthPage && !isToolHeroPage

    // Legacy routes (old /dashboard, /onboarding, /login) - redirect to new structure
    if (pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/ferramentas/vibe-engine/login'
        return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/dashboard') && !pathname.startsWith('/ferramentas')) {
        const url = request.nextUrl.clone()
        url.pathname = pathname.replace('/dashboard', '/ferramentas/vibe-engine/dashboard')
        return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/onboarding') && !pathname.startsWith('/ferramentas')) {
        const url = request.nextUrl.clone()
        url.pathname = '/ferramentas/vibe-engine/onboarding'
        return NextResponse.redirect(url)
    }

    // Protect tool pages - redirect to tool-specific login
    if (!user && isToolPage && !isApi) {
        const url = request.nextUrl.clone()
        // Extract tool name from path (e.g., /ferramentas/vibe-engine/... -> vibe-engine)
        const toolMatch = pathname.match(/^\/ferramentas\/([^/]+)/)
        const toolName = toolMatch ? toolMatch[1] : 'vibe-engine'
        url.pathname = `/ferramentas/${toolName}/login`
        return NextResponse.redirect(url)
    }

    // If logged in and on login page, redirect to tool dashboard
    if (user && isAuthPage) {
        const url = request.nextUrl.clone()
        if (pathname.includes('/ferramentas/')) {
            // Extract tool name and redirect to its dashboard
            const toolMatch = pathname.match(/^\/ferramentas\/([^/]+)/)
            const toolName = toolMatch ? toolMatch[1] : 'vibe-engine'
            url.pathname = `/ferramentas/${toolName}/dashboard`
        } else {
            // Legacy /login -> redirect to vibe-engine dashboard
            url.pathname = '/ferramentas/vibe-engine/dashboard'
        }
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
