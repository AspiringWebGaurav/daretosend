import type { Timestamp } from "firebase-admin/firestore";
import type { Role } from "./roles";

export type AuditTargetType = "user" | "message" | "system_config" | "role";

export type AuditAction =
    | "ban_user"
    | "unban_user"
    | "suspend_user"
    | "reset_counter"
    | "soft_delete_message"
    | "restore_message"
    | "approve_message"
    | "reject_message"
    | "override_moderation"
    | "set_role"
    | "revoke_role"
    | "update_system_config";

export interface AuditLog {
    id?: string;
    actorId: string;
    actorRole: Role;
    action: AuditAction;
    targetType: AuditTargetType;
    targetId: string;
    metadata: Record<string, unknown>;
    createdAt: Timestamp;
}
