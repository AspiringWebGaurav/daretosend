import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, notFound } from "@/lib/apiResponse";
import type { UserDoc } from "@/types/user";

/**
 * GET /api/users/[uid]
 * Public profile lookup by UID.
 * Exposes only safe, public fields.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ uid: string }> }
) {
    const { uid } = await params;

    const snap = await adminDb.collection(COLLECTIONS.USERS).doc(uid).get();
    if (!snap.exists) return notFound();

    const data = snap.data() as UserDoc;

    // Return only public fields
    return ok({
        uid: data.uid,
        displayName: data.displayName,
        username: data.username,
        photoURL: data.photoURL,
        createdAt: data.createdAt,
    });
}
