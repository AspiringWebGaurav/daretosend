import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, RATE_LIMIT_PER_DAY } from "@/lib/constants";

class RateLimitError extends Error {
    constructor() {
        super("RATE_LIMIT_EXCEEDED");
        this.name = "RateLimitError";
    }
}

/**
 * Atomically increments the user's daily send counter.
 * Lazily resets the counter if it's a new UTC day.
 * Throws RateLimitError if the limit is reached.
 *
 * @param senderId - Firebase UID of the sender
 * @param limitOverride - Optional override (from system_config)
 */
export async function incrementCounter(
    senderId: string,
    limitOverride?: number
): Promise<void> {
    if (senderId === "anonymous_visitor") {
        return; // Skip rate limiting for anonymous visitors to avoid USER_NOT_FOUND error
    }

    const limit = limitOverride ?? RATE_LIMIT_PER_DAY;
    const todayUTC = new Date().toISOString().slice(0, 10);
    const userRef = adminDb.collection(COLLECTIONS.USERS).doc(senderId);

    await adminDb.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const data = snap.data();

        if (!data) throw new Error("USER_NOT_FOUND");

        const isSameDay = data.dailyResetDate === todayUTC;
        const currentCount: number = isSameDay ? (data.dailySendCount ?? 0) : 0;

        if (currentCount >= limit) throw new RateLimitError();

        tx.update(userRef, {
            dailySendCount: currentCount + 1,
            dailyResetDate: todayUTC,
            updatedAt: FieldValue.serverTimestamp(),
        });
    });
}

export { RateLimitError };
