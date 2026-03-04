import { getSessionUser } from "@/domains/auth/getSessionUser";
import { hasRole } from "@/domains/auth/requireRole";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, unauthorized, forbidden } from "@/lib/apiResponse";

/**
 * GET /api/admin/users/list
 * Returns all users. Admin+ only.
 */
export async function GET() {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "admin")) return forbidden();

    const snap = await adminDb
        .collection(COLLECTIONS.USERS)
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();

    const users = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));

    return ok(users);
}
