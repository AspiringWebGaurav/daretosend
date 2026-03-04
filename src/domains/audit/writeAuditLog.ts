import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { AuditLog, AuditAction, AuditTargetType } from "@/types/audit";
import type { Role } from "@/types/roles";

/**
 * Appends an immutable audit log entry.
 * Server-side only — Admin SDK bypasses security rules.
 * Collection is configured as write-only from client (allow write: if false).
 */
export async function writeAuditLog(params: {
    actorId: string;
    actorRole: Role;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    metadata?: Record<string, unknown>;
}): Promise<void> {
    const { actorId, actorRole, action, targetType, targetId, metadata = {} } =
        params;

    const logData: Omit<AuditLog, "id"> = {
        actorId,
        actorRole,
        action,
        targetType,
        targetId,
        metadata,
        createdAt: FieldValue.serverTimestamp() as unknown as import("firebase-admin/firestore").Timestamp,
    };

    await adminDb.collection(COLLECTIONS.AUDIT_LOGS).add(logData);
}
