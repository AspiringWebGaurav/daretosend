import type { Timestamp } from "firebase-admin/firestore";
import type { Role } from "./roles";

export type UserStatus = "active" | "suspended" | "banned";

export interface UserDoc {
    uid: string;
    email: string;
    displayName: string;
    username: string | null;
    claimedLink?: string | null; // Added for environment-aware absolute URL
    photoURL: string;
    role: Role;
    status: UserStatus;
    shadowBanned: boolean;
    dailySendCount: number;
    dailyResetDate: string; // "YYYY-MM-DD" UTC
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface UsernameDoc {
    uid: string;
    claimedLink?: string; // Added for environment-aware absolute URL
    createdAt: Timestamp;
}
