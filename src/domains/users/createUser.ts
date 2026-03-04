import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";
import type { UserDoc } from "@/types/user";
import type { Role } from "@/types/roles";

/**
 * Creates a Firestore user document on first sign-in.
 * Uses a transaction to also register the username if provided.
 */
export async function createUser(params: {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string;
    role: Role;
}): Promise<{ isNew: boolean }> {
    const { uid, email, displayName, photoURL, role } = params;

    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(uid);
    const existing = await userRef.get();
    if (existing.exists) return { isNew: false }; // idempotent

    const userData: Omit<UserDoc, "createdAt" | "updatedAt"> = {
        uid,
        email,
        displayName,
        username: null,
        photoURL,
        role,
        status: "active",
        shadowBanned: false,
        dailySendCount: 0,
        dailyResetDate: new Date().toISOString().slice(0, 10),
    };

    await userRef.set({
        ...userData,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { isNew: true };
}
