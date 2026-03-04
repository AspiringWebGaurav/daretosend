import { type NextRequest } from "next/server";
import { getSessionUser } from "@/domains/auth/getSessionUser";
import { hasRole } from "@/domains/auth/requireRole";
import {
    suspendUser,
    banUser,
    unbanUser,
    resetDailyCounter,
} from "@/domains/admin/adminActions";
import { ok, err, unauthorized, forbidden } from "@/lib/apiResponse";
import type { Role } from "@/types/roles";

type AdminUserAction = "suspend" | "ban" | "unban" | "reset-counter";

/**
 * POST /api/admin/users/[action]
 * Handles suspend, ban, unban, reset-counter — all require admin+.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "admin")) return forbidden();

    const { action } = await params;
    const { targetUid } = await req.json();
    if (!targetUid) return err("targetUid is required", 400);

    const actorRole = (user.role as Role) ?? "admin";

    switch (action as AdminUserAction) {
        case "suspend":
            await suspendUser(targetUid, user.uid, actorRole);
            return ok({ suspended: true });
        case "ban":
            await banUser(targetUid, user.uid, actorRole);
            return ok({ banned: true });
        case "unban":
            await unbanUser(targetUid, user.uid, actorRole);
            return ok({ unbanned: true });
        case "reset-counter":
            await resetDailyCounter(targetUid, user.uid, actorRole);
            return ok({ reset: true });
        default:
            return err("Unknown action", 400);
    }
}
