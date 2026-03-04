import { getSessionUser } from "@/domains/auth/getSessionUser";
import { hasRole } from "@/domains/auth/requireRole";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, unauthorized, forbidden } from "@/lib/apiResponse";

/**
 * GET /api/admin/stats
 * Returns aggregate platform statistics. Admin+ only.
 */
export async function GET() {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "admin")) return forbidden();

    const [usersSnap, messagesSnap, queueSnap, bannedSnap] = await Promise.all([
        adminDb.collection(COLLECTIONS.USERS).count().get(),
        adminDb.collection(COLLECTIONS.MESSAGES).count().get(),
        adminDb
            .collection(COLLECTIONS.MODERATION_QUEUE)
            .where("status", "==", "pending")
            .count()
            .get(),
        adminDb
            .collection(COLLECTIONS.USERS)
            .where("status", "==", "banned")
            .count()
            .get(),
    ]);

    return ok({
        totalUsers: usersSnap.data().count,
        totalMessages: messagesSnap.data().count,
        pendingModeration: queueSnap.data().count,
        bannedUsers: bannedSnap.data().count,
    });
}
