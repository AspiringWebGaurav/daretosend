import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import type { UserDoc } from "@/types/user";

/**
 * Looks up a user document by their username.
 * Returns null if the username is not claimed.
 */
export async function getUserByUsername(
    username: string
): Promise<UserDoc | null> {
    const normalizedUsername = username.toLowerCase().trim();

    const usernameSnap = await adminDb
        .collection(COLLECTIONS.USERNAMES)
        .doc(normalizedUsername)
        .get();

    if (!usernameSnap.exists) return null;

    const { uid } = usernameSnap.data() as { uid: string };

    const userSnap = await adminDb
        .collection(COLLECTIONS.USERS)
        .doc(uid)
        .get();

    if (!userSnap.exists) return null;
    return { uid, ...userSnap.data() } as UserDoc;
}
