import { type NextRequest } from "next/server";
import { getSessionUser } from "@/domains/auth/getSessionUser";
import { sendMessage } from "@/domains/messages/sendMessage";
import { ok, err, tooManyRequests, serviceUnavailable } from "@/lib/apiResponse";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import type { IdentityMode } from "@/types/message";

/**
 * POST /api/messages/send
 * Full send pipeline: moderation → rate limit → queue.
 * Anonymous visitors can send messages without authentication.
 * Authenticated users get their UID tracked as senderId.
 */
export async function POST(req: NextRequest) {
    const user = await getSessionUser();
    const senderId = user?.uid ?? "anonymous_visitor";

    try {
        const body = await req.json();
        const { receiverUsername, content, identityMode, displayName } = body;
        let { receiverId } = body;

        // Resolve receiverId from receiverUsername if not provided
        if (!receiverId && receiverUsername) {
            const usernameSnap = await adminDb
                .collection(COLLECTIONS.USERNAMES)
                .doc(receiverUsername)
                .get();
            if (usernameSnap.exists) {
                receiverId = usernameSnap.data()?.uid;
            }
        }

        if (!receiverId || !content || !identityMode) {
            return err("receiverId, content, and identityMode are required", 400);
        }

        if (!["anonymous", "username", "custom"].includes(identityMode)) {
            return err("Invalid identityMode", 400);
        }

        if (typeof content !== "string" || content.trim().length === 0) {
            return err("content cannot be empty", 400);
        }

        if (content.length > 1000) {
            return err("Message too long (max 1000 chars)", 400);
        }

        const result = await sendMessage({
            senderId,
            receiverId,
            receiverUsername: receiverUsername ?? "",
            content: content.trim(),
            identityMode: identityMode as IdentityMode,
            displayName: displayName ?? null,
        });

        if (result.outcome === "shadow_dropped") {
            // Silent 200 — sender thinks it succeeded
            return ok({ delivered: true });
        }

        if (result.outcome === "rejected") {
            if (result.reason === "rate_limit") return tooManyRequests();
            if (result.reason === "maintenance") return serviceUnavailable();
            return err(`Message rejected: ${result.reason}`, 422);
        }

        return ok({ delivered: true, messageId: result.messageId, warning: result.warning ?? null }, 201);
    } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);
        return err("Failed to send message", 500);
    }
}
