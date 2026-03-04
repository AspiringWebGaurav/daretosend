import { getSessionUser } from "@/domains/auth/getSessionUser";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, unauthorized } from "@/lib/apiResponse";

/**
 * GET /api/messages/sent
 * Returns messages sent by the authenticated user, ordered by createdAt desc.
 */
export async function GET() {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const snap = await adminDb
        .collection(COLLECTIONS.MESSAGES)
        .where("senderId", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();

    const messages = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    return ok(messages);
}
