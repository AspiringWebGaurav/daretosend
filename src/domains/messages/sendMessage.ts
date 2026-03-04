import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";
import { runModerationPipeline } from "@/domains/moderation/pipeline";
import { incrementCounter, RateLimitError } from "@/domains/rateLimit/incrementCounter";
import { getSystemConfig } from "@/domains/admin/getSystemConfig";
import type { IdentityMode, MessageDoc, ModerationFailReason } from "@/types/message";

export interface SendMessageParams {
    senderId: string;
    receiverId: string;
    receiverUsername: string;
    content: string;
    identityMode: IdentityMode;
    displayName?: string | null;
}

export type SendMessageResult =
    | { outcome: "delivered"; messageId: string; warning?: string }
    | { outcome: "shadow_dropped" }
    | { outcome: "rejected"; reason: string };

/**
 * Full message send orchestrator.
 * Messages are delivered INSTANTLY (status: approved).
 * Moderation runs pre-delivery for hard blocks (self-send, shadow-ban, rate-limit, maintenance).
 * Keyword/AI checks produce a WARNING but do NOT block delivery.
 */
export async function sendMessage(
    params: SendMessageParams
): Promise<SendMessageResult> {
    const { senderId, receiverId, receiverUsername, content, identityMode, displayName } =
        params;

    const config = await getSystemConfig();

    // Run moderation pipeline
    const modResult = await runModerationPipeline({
        senderId,
        receiverId,
        content,
        config,
    });

    // Shadow-banned: silent drop — sender thinks it succeeded
    if (modResult.shadowBanned) {
        return { outcome: "shadow_dropped" };
    }

    // Hard blocks: self-send, maintenance — these MUST reject
    if (!modResult.passed) {
        const hardBlocks = ["self_send", "maintenance"];
        if (hardBlocks.includes(modResult.failReason ?? "")) {
            return { outcome: "rejected", reason: modResult.failReason ?? "moderation" };
        }
    }

    // Rate limit check
    try {
        await incrementCounter(senderId, config.rateLimitPerDay);
    } catch (e) {
        if (e instanceof RateLimitError) {
            return { outcome: "rejected", reason: "rate_limit" };
        }
        throw e;
    }

    // Determine if moderation produced a soft warning (keyword/AI)
    const warning = (!modResult.passed && modResult.failReason === "keyword")
        ? "Our moderation detected potentially abusive language. Please avoid harmful wording."
        : (!modResult.passed && modResult.failReason === "ai")
            ? "Our moderation flagged this message for review. Please be mindful of your language."
            : undefined;

    const now = FieldValue.serverTimestamp();

    // Write message directly as APPROVED — instant delivery to inbox
    const messageRef = adminDb.collection(COLLECTIONS.MESSAGES).doc();
    const messageId = messageRef.id;

    const messageDoc: Omit<MessageDoc, "id"> = {
        senderId,
        receiverId,
        receiverUsername,
        content,
        identityMode,
        displayName: displayName ?? null,
        status: "approved",
        moderationResult: {
            passed: modResult.passed,
            failReason: modResult.failReason as ModerationFailReason,
            checkedAt: now as unknown as import("firebase-admin/firestore").Timestamp,
        },
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        createdAt: now as unknown as import("firebase-admin/firestore").Timestamp,
        approvedAt: now as unknown as import("firebase-admin/firestore").Timestamp,
        readAt: null,
        thread: {
            receiverReply: null,
            senderReply: null,
            closedAt: null,
        },
    };

    await messageRef.set(messageDoc);

    return { outcome: "delivered", messageId, warning };
}
