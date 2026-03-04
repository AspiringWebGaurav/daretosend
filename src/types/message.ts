import type { Timestamp } from "firebase-admin/firestore";

export type IdentityMode = "anonymous" | "username" | "custom";
export type MessageStatus = "pending" | "approved" | "rejected" | "deleted";
export type ModerationFailReason =
    | "keyword"
    | "rate_limit"
    | "self_send"
    | "shadow_ban"
    | "ai"
    | null;

export interface ModerationResult {
    passed: boolean;
    failReason: ModerationFailReason;
    checkedAt: Timestamp;
}

export interface MessageThread {
    receiverReply: string | null;
    senderReply: string | null;
    closedAt: Timestamp | null;
}

export interface MessageDoc {
    id?: string;
    senderId: string;
    receiverId: string;
    receiverUsername: string;
    content: string;
    identityMode: IdentityMode;
    displayName: string | null;
    status: MessageStatus;
    moderationResult: ModerationResult;
    isDeleted: boolean;
    deletedAt: Timestamp | null;
    deletedBy: string | null;
    createdAt: Timestamp;
    approvedAt: Timestamp | null;
    readAt: Timestamp | null;
    thread: MessageThread;
}

export interface ModerationQueueDoc {
    messageId: string;
    senderId: string;
    receiverId: string;
    content: string;
    identityMode: IdentityMode;
    displayName: string | null;
    moderationResult: ModerationResult;
    status: "pending" | "approved" | "rejected";
    queuedAt: Timestamp;
    reviewedAt: Timestamp | null;
    reviewedBy: string | null;
}
