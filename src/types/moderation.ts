export type ModerationStatus = "pending" | "approved" | "rejected";

export interface ModerationCheckResult {
    passed: boolean;
    failReason: string | null;
}
