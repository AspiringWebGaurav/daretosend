import type { ModerationCheckResult } from "@/types/moderation";

/**
 * Prevents a user from sending a message to themselves.
 */
export function selfSendCheck(
    senderId: string,
    receiverId: string
): ModerationCheckResult {
    if (senderId === receiverId) {
        return { passed: false, failReason: "self_send" };
    }
    return { passed: true, failReason: null };
}
