import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";

/**
 * Posts a reply to a message thread.
 * - Receiver can reply once (receiverReply).
 * - Sender can reply once after receiver replies (senderReply).
 * - Thread auto-closes after sender replies.
 */
export async function replyToMessage(params: {
    messageId: string;
    actorUid: string;
    content: string;
    role: "receiver" | "sender";
}): Promise<void> {
    const { messageId, actorUid, content, role } = params;
    const messageRef = adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId);

    await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(messageRef);
        const data = snap.data();

        if (!data) throw new Error("MESSAGE_NOT_FOUND");
        if (data.status !== "approved") throw new Error("MESSAGE_NOT_APPROVED");

        const thread = data.thread ?? {};

        if (role === "receiver") {
            if (data.receiverId !== actorUid) throw new Error("FORBIDDEN");
            if (thread.receiverReply) throw new Error("ALREADY_REPLIED");

            tx.update(messageRef, {
                "thread.receiverReply": content,
            });
        } else {
            if (data.senderId !== actorUid) throw new Error("FORBIDDEN");
            if (!thread.receiverReply) throw new Error("RECEIVER_MUST_REPLY_FIRST");
            if (thread.senderReply) throw new Error("ALREADY_REPLIED");

            tx.update(messageRef, {
                "thread.senderReply": content,
                "thread.closedAt": FieldValue.serverTimestamp(),
            });
        }
    });
}
