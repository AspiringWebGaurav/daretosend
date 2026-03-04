import { getSessionUser } from "@/domains/auth/getSessionUser";
import { hasRole } from "@/domains/auth/requireRole";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, unauthorized, forbidden } from "@/lib/apiResponse";

/**
 * GET /api/moderation/queue
 * Returns all pending moderation queue items. Admin+ only.
 * Real-time view is via Firestore onSnapshot on client — this is REST fallback.
 */
export async function GET() {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "admin")) return forbidden();

    const snap = await adminDb
        .collection(COLLECTIONS.MODERATION_QUEUE)
        .where("status", "==", "pending")
        .orderBy("queuedAt", "asc")
        .get();

    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return ok(items);
}
