import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";

/**
 * Rejects a message from the moderation queue.
 */
export async function rejectMessage(
    messageId: string,
    reviewerUid: string
): Promise<void> {
    const now = FieldValue.serverTimestamp();

    const batch = adminDb.batch();

    batch.update(adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId), {
        status: "rejected",
    });

    batch.update(
        adminDb.collection(COLLECTIONS.MODERATION_QUEUE).doc(messageId),
        {
            status: "rejected",
            reviewedAt: now,
            reviewedBy: reviewerUid,
        }
    );

    await batch.commit();
}
