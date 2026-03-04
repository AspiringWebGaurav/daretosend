import { cookies, headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import type { DecodedIdToken } from "firebase-admin/auth";

export type SessionUser = DecodedIdToken & {
    role?: string;
};

/**
 * Verifies the session cookie using Firebase Admin SDK.
 * Returns the decoded token (including custom claims) or null if invalid.
 * Used in Server Components and API route handlers as the true security gate.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
    try {
        const headerStore = await headers();
        const authContext = headerStore.get('x-auth-context');
        const targetCookieName = authContext === 'feedback' ? `feedback_${SESSION_COOKIE_NAME}` : SESSION_COOKIE_NAME;

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get(targetCookieName)?.value;
        if (!sessionCookie) return null;

        const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
        return decoded as SessionUser;
    } catch {
        return null;
    }
}
