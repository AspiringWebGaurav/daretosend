import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";
import { setCustomClaims, revokeUserTokens } from "@/domains/auth/setCustomClaims";
import { writeAuditLog } from "@/domains/audit/writeAuditLog";
import type { Role } from "@/types/roles";

async function updateUserStatus(
    targetUid: string,
    status: "active" | "suspended" | "banned",
    actorId: string,
    actorRole: Role,
    action: "suspend_user" | "ban_user" | "unban_user"
): Promise<void> {
    await adminDb.collection(COLLECTIONS.USERS).doc(targetUid).update({
        status,
        updatedAt: FieldValue.serverTimestamp(),
    });
    await revokeUserTokens(targetUid);
    await writeAuditLog({ actorId, actorRole, action, targetType: "user", targetId: targetUid, metadata: { status } });
}

export const suspendUser = (targetUid: string, actorId: string, actorRole: Role) =>
    updateUserStatus(targetUid, "suspended", actorId, actorRole, "suspend_user");

export const banUser = (targetUid: string, actorId: string, actorRole: Role) =>
    updateUserStatus(targetUid, "banned", actorId, actorRole, "ban_user");

export const unbanUser = (targetUid: string, actorId: string, actorRole: Role) =>
    updateUserStatus(targetUid, "active", actorId, actorRole, "unban_user");

export async function resetDailyCounter(
    targetUid: string,
    actorId: string,
    actorRole: Role
): Promise<void> {
    const todayUTC = new Date().toISOString().slice(0, 10);
    await adminDb.collection(COLLECTIONS.USERS).doc(targetUid).update({
        dailySendCount: 0,
        dailyResetDate: todayUTC,
        updatedAt: FieldValue.serverTimestamp(),
    });
    await writeAuditLog({ actorId, actorRole, action: "reset_counter", targetType: "user", targetId: targetUid, metadata: {} });
}

export async function softDeleteMessage(
    messageId: string,
    actorId: string,
    actorRole: Role
): Promise<void> {
    await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
        isDeleted: true,
        deletedAt: FieldValue.serverTimestamp(),
        deletedBy: actorId,
        status: "deleted",
    });
    await writeAuditLog({ actorId, actorRole, action: "soft_delete_message", targetType: "message", targetId: messageId, metadata: {} });
}

export async function restoreMessage(
    messageId: string,
    actorId: string,
    actorRole: Role
): Promise<void> {
    await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        status: "approved",
    });
    await writeAuditLog({ actorId, actorRole, action: "restore_message", targetType: "message", targetId: messageId, metadata: {} });
}

export async function promoteToAdmin(
    targetUid: string,
    actorId: string,
    actorRole: Role
): Promise<void> {
    await setCustomClaims(targetUid, "admin");
    await adminDb.collection(COLLECTIONS.USERS).doc(targetUid).update({
        role: "admin",
        updatedAt: FieldValue.serverTimestamp(),
    });
    await revokeUserTokens(targetUid);
    await writeAuditLog({ actorId, actorRole, action: "set_role", targetType: "role", targetId: targetUid, metadata: { newRole: "admin" } });
}

export async function demoteAdmin(
    targetUid: string,
    actorId: string,
    actorRole: Role
): Promise<void> {
    await setCustomClaims(targetUid, "user");
    await adminDb.collection(COLLECTIONS.USERS).doc(targetUid).update({
        role: "user",
        updatedAt: FieldValue.serverTimestamp(),
    });
    await revokeUserTokens(targetUid);
    await writeAuditLog({ actorId, actorRole, action: "revoke_role", targetType: "role", targetId: targetUid, metadata: { prevRole: "admin" } });
}
