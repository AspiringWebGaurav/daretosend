import { type NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { createUser } from "@/domains/users/createUser";
import { ok, err, unauthorized } from "@/lib/apiResponse";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE, SEEDED_ROLES } from "@/lib/constants";
import type { Role } from "@/types/roles";

/**
 * POST /api/auth/session
 * Exchange Firebase ID token → httpOnly session cookie.
 * Creates user doc on first sign-in, sets seeded roles.
 */
export async function POST(req: NextRequest) {
    try {
        const { idToken, authContext } = await req.json();
        if (!idToken) return err("idToken is required", 400);

        const targetCookieName = authContext === 'feedback' ? `feedback_${SESSION_COOKIE_NAME}` : SESSION_COOKIE_NAME;

        // Verify the ID token
        const decoded = await adminAuth.verifyIdToken(idToken);

        // Determine role: check seeded emails, else default "user"
        const role: Role = (SEEDED_ROLES[decoded.email ?? ""] as Role) ?? "user";

        // Create user on first sign-in (idempotent)
        const { isNew } = await createUser({
            uid: decoded.uid,
            email: decoded.email ?? "",
            displayName: decoded.name ?? "",
            photoURL: decoded.picture ?? "",
            role,
        });

        // Create session cookie (5 day expiry)
        const expiresIn = SESSION_COOKIE_MAX_AGE * 1000; // ms
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        const response = ok({
            uid: decoded.uid,
            role,
            isNew,
            displayName: decoded.name ?? "",
        });
        response.cookies.set(targetCookieName, sessionCookie, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: SESSION_COOKIE_MAX_AGE,
            path: "/",
        });

        return response;
    } catch {
        return unauthorized();
    }
}

/**
 * DELETE /api/auth/session
 * Clear session cookie (logout).
 */
export async function DELETE(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const authContext = searchParams.get('authContext');
    const targetCookieName = authContext === 'feedback' ? `feedback_${SESSION_COOKIE_NAME}` : SESSION_COOKIE_NAME;

    const response = NextResponse.json({ success: true, data: null });
    response.cookies.set(targetCookieName, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
    });
    return response;
}
