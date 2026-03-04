import { getSessionUser } from "@/domains/auth/getSessionUser";
import { replyToMessage } from "@/domains/messages/replyToMessage";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, err, unauthorized, forbidden, notFound } from "@/lib/apiResponse";
import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";
import type { MessageDoc } from "@/types/message";

/**
 * GET /api/messages/[messageId]
 * Fetch a single message. Only sender or receiver can access.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { messageId } = await params;
    const snap = await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).get();
    if (!snap.exists) return notFound();

    const data = snap.data() as MessageDoc;

    // Only sender or receiver can view
    if (data.senderId !== user.uid && data.receiverId !== user.uid) {
        return forbidden();
    }

    // Redact senderId from receiver's view if anonymous
    const isSender = data.senderId === user.uid;
    const responseData = isSender
        ? { id: messageId, ...data }
        : {
            id: messageId,
            ...data,
            senderId: data.identityMode === "anonymous" ? "[anonymous]" : data.senderId,
        };

    return ok(responseData);
}

/**
 * POST /api/messages/[messageId]/reply
 * Post a reply to the thread (receiver or sender).
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { messageId } = await params;
    const { content } = await req.json();

    if (!content || typeof content !== "string" || content.trim().length === 0) {
        return err("content is required", 400);
    }

    try {
        const snap = await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).get();
        if (!snap.exists) return notFound();

        const data = snap.data() as MessageDoc;
        const role =
            user.uid === data.receiverId
                ? "receiver"
                : user.uid === data.senderId
                    ? "sender"
                    : null;

        if (!role) return forbidden();

        await replyToMessage({ messageId, actorUid: user.uid, content: content.trim(), role });
        return ok({ replied: true });
    } catch (e) {
        if (e instanceof Error) {
            if (e.message === "ALREADY_REPLIED") return err("You have already replied", 409);
            if (e.message === "RECEIVER_MUST_REPLY_FIRST") return err("Wait for receiver to reply first", 422);
            if (e.message === "MESSAGE_NOT_APPROVED") return err("Message not yet approved", 422);
            if (e.message === "FORBIDDEN") return forbidden();
        }
        return err("Failed to post reply", 500);
    }
}

/**
 * PATCH /api/messages/[messageId]
 * Mark message as read or unread. Only the receiver can modify.
 * Body (optional): { action: "mark_read" | "mark_unread" }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { messageId } = await params;

    // Parse optional body
    let action = "mark_read";
    try {
        const body = await req.json();
        if (body?.action === "mark_unread") {
            action = "mark_unread";
        }
    } catch {
        // No body provided, default to mark_read
    }

    const snap = await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).get();
    if (!snap.exists) return notFound();

    const data = snap.data() as MessageDoc;
    if (data.receiverId !== user.uid) return forbidden();

    if (action === "mark_unread") {
        if (data.readAt !== null) {
            await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
                readAt: null,
            });
        }
    } else {
        // Mark as read
        if (!data.readAt) {
            await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).update({
                readAt: FieldValue.serverTimestamp(),
            });
        }
    }

    return ok({ updated: true, action });
}

/**
 * DELETE /api/messages/[messageId]
 * Hard-delete a message. Only the receiver can delete.
 * Removes from both messages and moderation_queue collections.
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ messageId: string }> }
) {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { messageId } = await params;
    const snap = await adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId).get();
    if (!snap.exists) return notFound();

    const data = snap.data() as MessageDoc;
    if (data.receiverId !== user.uid) return forbidden();

    const batch = adminDb.batch();
    batch.delete(adminDb.collection(COLLECTIONS.MESSAGES).doc(messageId));
    // Also clean up moderation queue entry if it exists
    const queueRef = adminDb.collection(COLLECTIONS.MODERATION_QUEUE).doc(messageId);
    const queueSnap = await queueRef.get();
    if (queueSnap.exists) {
        batch.delete(queueRef);
    }
    await batch.commit();

    return ok({ deleted: true });
}

