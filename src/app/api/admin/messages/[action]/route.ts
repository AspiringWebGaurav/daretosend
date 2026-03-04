import { type NextRequest } from "next/server";
import { getSessionUser } from "@/domains/auth/getSessionUser";
import { hasRole } from "@/domains/auth/requireRole";
import {
    softDeleteMessage,
    restoreMessage,
} from "@/domains/admin/adminActions";
import { ok, err, unauthorized, forbidden } from "@/lib/apiResponse";
import type { Role } from "@/types/roles";

/**
 * POST /api/admin/messages/[action]
 * soft-delete or restore a message. Admin+ only.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ action: string }> }
) {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "admin")) return forbidden();

    const { action } = await params;
    const { messageId } = await req.json();
    if (!messageId) return err("messageId is required", 400);

    const actorRole = (user.role as Role) ?? "admin";

    if (action === "soft-delete") {
        await softDeleteMessage(messageId, user.uid, actorRole);
        return ok({ deleted: true });
    }

    if (action === "restore") {
        await restoreMessage(messageId, user.uid, actorRole);
        return ok({ restored: true });
    }

    return err("Unknown action", 400);
}
