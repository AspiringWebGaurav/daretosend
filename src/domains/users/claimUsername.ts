import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS } from "@/lib/constants";

/**
 * Atomically claims a username for a user.
 * Uses a Firestore transaction to ensure uniqueness.
 * Usernames and the generated claimed link are immutable once set.
 *
 * @throws Error("USERNAME_TAKEN") if username is already claimed.
 * @throws Error("USERNAME_ALREADY_SET") if user already has a username.
 * 
 * @returns The full generated claimed URL
 */
export async function claimUsername(
    uid: string,
    username: string,
    origin: string
): Promise<string> {
    const normalizedUsername = username.toLowerCase().trim();
    // Generate the full URL using the active environment origin, treating exactly as created
    const claimedLink = `${origin}/${normalizedUsername}`;

    await adminDb.runTransaction(async (tx) => {
        const usernameRef = adminDb
            .collection(COLLECTIONS.USERNAMES)
            .doc(normalizedUsername);
        const userRef = adminDb.collection(COLLECTIONS.USERS).doc(uid);

        const [usernameSnap, userSnap] = await Promise.all([
            tx.get(usernameRef),
            tx.get(userRef),
        ]);

        if (usernameSnap.exists) {
            throw new Error("USERNAME_TAKEN");
        }

        const userData = userSnap.data();
        if (userData?.username) {
            throw new Error("USERNAME_ALREADY_SET");
        }

        tx.set(usernameRef, {
            uid,
            claimedLink,
            createdAt: FieldValue.serverTimestamp(),
        });

        tx.update(userRef, {
            username: normalizedUsername,
            claimedLink,
            updatedAt: FieldValue.serverTimestamp(),
        });
    });

    return claimedLink;
}
