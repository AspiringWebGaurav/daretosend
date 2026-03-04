import { type NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

/**
 * Next.js 16 proxy.ts — replaces middleware.ts from older versions.
 *
 * SECURITY MODEL:
 * This proxy performs an OPTIMISTIC check — it only checks whether the
 * session cookie EXISTS (not whether it's valid). This is intentional:
 * the Admin SDK cannot run in the Edge Runtime.
 *
 * The REAL security gate is in each protected layout and API route via
 * getSessionUser() → adminAuth.verifySessionCookie() (full validation).
 *
 * This layer provides fast redirects for obviously unauthenticated requests,
 * improving UX without being the security boundary.
 */

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];

export function proxy(request: NextRequest): NextResponse {
    const { pathname } = request.nextUrl;

    const isProtected = PROTECTED_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix)
    );

    if (isProtected) {
        const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
        if (!sessionCookie?.value) {
            const url = request.nextUrl.clone();
            url.pathname = "/";
            url.searchParams.set("auth", "required");
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - /api/* (API routes handle their own auth)
         * - Public pages
         */
        "/((?!_next/static|_next/image|favicon.ico|api/).*)",
    ],
};
