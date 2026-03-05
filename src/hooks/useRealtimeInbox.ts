/* eslint-disable react-compiler/react-compiler */
"use client";

import { useEffect, useRef, useState } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

const INBOX_TIMEOUT_MS = 8000; // 8s max wait for Firestore

/**
 * Real-time inbox hook for the authenticated user.
 * Uses Firestore onSnapshot — scoped to receiverId + status=approved.
 * Exposes messages, loading state, and error.
 * Includes 8s safety timeout and onSnapshot error handler.
 * Unsubscribes automatically on unmount.
 *
 * NOTE: unreadCount is NOT tracked here. Use useUnreadCount instead,
 * which listens to users/{uid}.unreadCount (single-doc, no collection scan).
 */
export function useRealtimeInbox(uid: string | null) {
    const [messages, setMessages] = useState<DocumentData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Track the previous uid to avoid stale subscription handling
    const prevUidRef = useRef<string | null>(null);

    useEffect(() => {
        if (!uid) {
            // uid changed to null — defer state update via scheduler
            const id = setTimeout(() => {
                setMessages([]);
                setLoading(false);
                setError(null);
            }, 0);
            prevUidRef.current = null;
            return () => clearTimeout(id);
        }

        prevUidRef.current = uid;
        setError(null);

        const q = query(
            collection(db, COLLECTIONS.MESSAGES),
            where("receiverId", "==", uid),
            where("status", "==", "approved"),
            orderBy("approvedAt", "desc")
        );

        // 8s safety timeout — if onSnapshot never resolves, stop loading
        const timeoutId = setTimeout(() => {
            console.error("[DTS] useRealtimeInbox: Firestore query timed out after 8s");
            setError("Failed to load messages. Please try again.");
            setLoading(false);
        }, INBOX_TIMEOUT_MS);

        const unsub = onSnapshot(
            q,
            (snap) => {
                clearTimeout(timeoutId);
                const docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
                setMessages(docs);
                setLoading(false);
                setError(null);
            },
            (err) => {
                clearTimeout(timeoutId);
                console.error("[DTS] useRealtimeInbox onSnapshot error:", err);
                setError("Failed to load messages. Please try again.");
                setLoading(false);
            }
        );

        return () => {
            clearTimeout(timeoutId);
            unsub();
        };
    }, [uid]);

    return { messages, loading, error };
}
