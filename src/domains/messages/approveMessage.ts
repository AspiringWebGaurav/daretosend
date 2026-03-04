import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";

/**
 * Approves a message: updates messages/{id} status to "approved",
 * removes from moderation_queue, sets approvedAt.
 */
export async function approveMessage(
    messageId: string,
    reviewerUid: string
): Promise<void> {
    const now = FieldValue.serverTimestamp();

    const batch = adminDb.batch();

    batch.update(adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId), {
        status: "approved",
        approvedAt: now,
    });

    batch.update(
        adminDb.collection(COLLECTIONS.MODERATION_QUEUE).doc(messageId),
        {
            status: "approved",
            reviewedAt: now,
            reviewedBy: reviewerUid,
        }
    );

    await batch.commit();
}
