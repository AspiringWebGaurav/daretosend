import { type NextRequest } from "next/server";
import { getSessionUser } from "@/domains/auth/getSessionUser";
import { adminDb } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/constants";
import { ok, err, unauthorized } from "@/lib/apiResponse";

/**
 * GET /api/messages/sent-to/[username]
 * Returns messages sent by the authenticated user to a specific profile owner.
 * Requires x-auth-context: feedback header for isolated session validation.
 * Filters: senderId == currentUser.uid AND receiverId == profile owner uid.
 * Ordered by createdAt DESC, limited to 20.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ username: string }> }
) {
    const { username } = await params;
    if (!username) return err("username is required", 400);

    // Authenticate the sender using the feedback session cookie
    const user = await getSessionUser();
    if (!user) return unauthorized();

    try {
        // Resolve username → uid
        const usernameSnap = await adminDb
            .collection(COLLECTIONS.USERNAMES)
            .doc(username.toLowerCase())
            .get();

        if (!usernameSnap.exists) {
            return ok({ messages: [], receiverDisplayName: null });
        }

        const receiverUid = usernameSnap.data()?.uid;
        if (!receiverUid) {
            return ok({ messages: [], receiverDisplayName: null });
        }

        // Fetch receiver's display name
        let receiverDisplayName: string | null = null;
        const receiverDoc = await adminDb
            .collection(COLLECTIONS.USERS)
            .doc(receiverUid)
            .get();
        if (receiverDoc.exists) {
            receiverDisplayName = receiverDoc.data()?.displayName || null;
        }

        // Query messages: sender == current user, receiver == profile owner
        const messagesSnap = await adminDb
            .collection(COLLECTIONS.MESSAGES)
            .where("senderId", "==", user.uid)
            .where("receiverId", "==", receiverUid)
            .orderBy("createdAt", "desc")
            .limit(20)
            .get();

        const messages = messagesSnap.docs.map(doc => {
            const d = doc.data();
            return {
                id: doc.id,
                content: d.content,
                identityMode: d.identityMode,
                status: d.status,
                createdAt: d.createdAt?.toDate?.()?.toISOString() ?? null,
            };
        });

        return ok({ messages, receiverDisplayName });
    } catch (error) {
        console.error("SENT-TO HISTORY ERROR:", error);
        return err("Failed to fetch message history", 500);
    }
}
