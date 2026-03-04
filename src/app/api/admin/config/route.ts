import { type NextRequest } from "next/server";
import { getSessionUser } from "@/domains/auth/getSessionUser";
import { hasRole } from "@/domains/auth/requireRole";
import { getSystemConfig, updateSystemConfig } from "@/domains/admin/getSystemConfig";
import { ok, err, unauthorized, forbidden } from "@/lib/apiResponse";
import type { Role } from "@/types/roles";
import type { SystemConfig } from "@/types/systemConfig";

/**
 * GET /api/admin/config — super_admin only.
 */
export async function GET() {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "super_admin")) return forbidden();

    const config = await getSystemConfig();
    return ok(config);
}

/**
 * PATCH /api/admin/config — super_admin only.
 */
export async function PATCH(req: NextRequest) {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!hasRole(user, "super_admin")) return forbidden();

    try {
        const updates = (await req.json()) as Partial<
            Omit<SystemConfig, "updatedAt" | "updatedBy">
        >;

        if (!updates || typeof updates !== "object") {
            return err("Invalid updates payload", 400);
        }

        await updateSystemConfig(updates, user.uid, (user.role as Role) ?? "super_admin");
        return ok({ updated: true });
    } catch {
        return err("Failed to update config", 500);
    }
}
