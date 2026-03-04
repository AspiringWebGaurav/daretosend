import { getSessionUser } from "@/domains/auth/getSessionUser";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, unauthorized, notFound } from "@/lib/apiResponse";
import type { UserDoc } from "@/types/user";

/**
 * GET /api/users/me
 * Returns the authenticated user's profile from Firestore.
 * Used by dashboard, sidebar, and onboarding to check username claim status.
 */
export async function GET() {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const snap = await adminDb.collection(COLLECTIONS.USERS).doc(user.uid).get();
    if (!snap.exists) return notFound();

    const data = snap.data() as UserDoc;

    return ok({
        uid: data.uid,
        email: data.email,
        displayName: data.displayName,
        username: data.username,
        claimedLink: data.claimedLink || null, // Exposure of immutable absolute URL
        photoURL: data.photoURL,
        role: data.role,
        status: data.status,
    });
}
