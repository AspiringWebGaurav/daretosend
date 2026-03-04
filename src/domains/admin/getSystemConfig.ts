import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, SYSTEM_CONFIG_DOC } from "@/lib/constants";
import { DEFAULT_SYSTEM_CONFIG } from "@/types/systemConfig";
import { writeAuditLog } from "@/domains/audit/writeAuditLog";
import type { SystemConfig } from "@/types/systemConfig";
import type { Role } from "@/types/roles";

/**
 * Loads system config from Firestore.
 * Falls back to defaults if document doesn't exist yet.
 */
export async function getSystemConfig(): Promise<SystemConfig> {
    const snap = await adminDb
        .collection(COLLECTIONS.SYSTEM_CONFIG)
        .doc(SYSTEM_CONFIG_DOC)
        .get();

    if (!snap.exists) {
        return {
            ...DEFAULT_SYSTEM_CONFIG,
            updatedAt: FieldValue.serverTimestamp() as unknown as import("firebase-admin/firestore").Timestamp,
            updatedBy: "system",
        };
    }

    return snap.data() as SystemConfig;
}

/**
 * Updates system config fields. Super_admin only.
 * Every update is logged to audit_logs.
 */
export async function updateSystemConfig(
    updates: Partial<Omit<SystemConfig, "updatedAt" | "updatedBy">>,
    actorId: string,
    actorRole: Role
): Promise<void> {
    const ref = adminDb
        .collection(COLLECTIONS.SYSTEM_CONFIG)
        .doc(SYSTEM_CONFIG_DOC);

    await ref.set(
        {
            ...updates,
            updatedAt: FieldValue.serverTimestamp(),
            updatedBy: actorId,
        },
        { merge: true }
    );

    await writeAuditLog({
        actorId,
        actorRole,
        action: "update_system_config",
        targetType: "system_config",
        targetId: SYSTEM_CONFIG_DOC,
        metadata: updates as Record<string, unknown>,
    });
}
