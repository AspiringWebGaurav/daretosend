import type { SessionUser } from "./getSessionUser";
import type { Role } from "@/types/roles";

const ROLE_HIERARCHY: Record<Role, number> = {
    user: 0,
    admin: 1,
    super_admin: 2,
};

/**
 * Throws an error if the session user does not meet the minimum role.
 * Use after getSessionUser() in API routes and server components.
 */
export function requireRole(user: SessionUser | null, minRole: Role): void {
    if (!user) {
        throw new Error("UNAUTHORIZED");
    }
    const userRole = (user.role as Role) ?? "user";
    if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
        throw new Error("FORBIDDEN");
    }
}

/**
 * Returns true if the user meets the minimum role requirement.
 */
export function hasRole(user: SessionUser | null, minRole: Role): boolean {
    if (!user) return false;
    const userRole = (user.role as Role) ?? "user";
    return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}
