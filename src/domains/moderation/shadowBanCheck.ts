import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import type { ModerationCheckResult } from "@/types/moderation";

/**
 * Checks if the sender is shadow-banned.
 * Shadow-banned users get a silent 200 ACK — message is dropped.
 */
export async function shadowBanCheck(
    senderId: string
): Promise<ModerationCheckResult & { shadowBanned: boolean }> {
    const snap = await adminDb.collection(COLLECTIONS.USERS).doc(senderId).get();
    const data = snap.data();
    const shadowBanned = data?.shadowBanned === true;

    return {
        passed: !shadowBanned,
        failReason: shadowBanned ? "shadow_ban" : null,
        shadowBanned,
    };
}
