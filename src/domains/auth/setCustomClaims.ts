import { adminAuth } from "@/lib/firebase/admin";
import type { Role } from "@/types/roles";

/**
 * Sets Firebase custom claims for a user.
 * Called once by seed-roles.ts and when admin promotes/demotes.
 */
export async function setCustomClaims(
    uid: string,
    role: Role
): Promise<void> {
    await adminAuth.setCustomUserClaims(uid, { role });
}

/**
 * Revokes all refresh tokens for a user, forcing re-login.
 * Should be called whenever role or status changes.
 */
export async function revokeUserTokens(uid: string): Promise<void> {
    await adminAuth.revokeRefreshTokens(uid);
}
