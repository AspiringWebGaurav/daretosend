import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, notFound } from "@/lib/apiResponse";
import { type NextRequest } from "next/server";

/**
 * GET /api/users/check/[username]
 * Checks if a username exists. Public endpoint (no auth required).
 * Used by the public profile page to validate usernames before rendering.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    if (!username) return notFound();

    const snap = await adminDb
        .collection(COLLECTIONS.USERNAMES)
        .doc(username.toLowerCase())
        .get();

    if (!snap.exists) return notFound();

    const uid = snap.data()?.uid;
    let displayName = null;

    if (uid) {
        const userSnap = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
        if (userSnap.exists) {
            displayName = userSnap.data()?.displayName || null;
        }
    }

    return ok({
        exists: true,
        username: username.toLowerCase(),
        displayName,
        uid: uid || null
    });
}
