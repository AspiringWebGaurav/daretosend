import { type NextRequest } from "next/server";
import { getSessionUser } from "@/domains/auth/getSessionUser";
import { hasRole } from "@/domains/auth/requireRole";
import { rejectMessage } from "@/domains/messages/rejectMessage";
import { writeAuditLog } from "@/domains/audit/writeAuditLog";
import { ok, err, unauthorized, forbidden } from "@/lib/apiResponse";
import type { Role } from "@/types/roles";

/**
 * POST /api/moderation/reject
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "admin")) return forbidden();

    const { messageId } = await req.json();
    if (!messageId) return err("messageId is required", 400);

    await rejectMessage(messageId, user.uid);
    await writeAuditLog({
        actorId: user.uid,
        actorRole: (user.role as Role) ?? "admin",
        action: "reject_message",
        targetType: "message",
        targetId: messageId,
        metadata: {},
    });

    return ok({ rejected: true });
}
