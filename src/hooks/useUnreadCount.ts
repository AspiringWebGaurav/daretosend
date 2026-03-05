"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/constants";

/**
 * Lightweight realtime unread-count listener.
 *
 * Subscribes ONLY to `users/{uid}` — never the messages collection.
 * Provides Stripe-style optimistic methods for instant UI feedback:
 *   - optimisticDecrement(): call when user reads a message
 *   - optimisticIncrement(): call when user marks a message unread
 *   - optimisticReset(): call to force-zero (bulk read-all)
 *
 * Firebase snapshot reconciles the optimistic value on next server update.
 */
export function useUnreadCount(uid: string | null) {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    // Track the server value separately so optimistic updates don't fight snapshots
    const serverCountRef = useRef(0);
    const optimisticDeltaRef = useRef(0);

    useEffect(() => {
        if (!uid) {
            setCount(0);
            setLoading(false);
            serverCountRef.current = 0;
            optimisticDeltaRef.current = 0;
            return;
        }

        setLoading(true);
        optimisticDeltaRef.current = 0;

        const unsub = onSnapshot(
            doc(db, COLLECTIONS.USERS, uid),
            (snap) => {
                const data = snap.data();
                const serverVal = Math.max(0, (data?.unreadCount as number) ?? 0);
                serverCountRef.current = serverVal;
                // Reset optimistic delta on every server snapshot
                optimisticDeltaRef.current = 0;
                setCount(serverVal);
                setLoading(false);
            },
            (err) => {
                console.error("[DTS] useUnreadCount onSnapshot error:", err);
                setLoading(false);
            }
        );

        return () => unsub();
    }, [uid]);

    const optimisticDecrement = useCallback(() => {
        optimisticDeltaRef.current -= 1;
        setCount((prev) => Math.max(0, prev - 1));
    }, []);

    const optimisticIncrement = useCallback(() => {
        optimisticDeltaRef.current += 1;
        setCount((prev) => prev + 1);
    }, []);

    const optimisticReset = useCallback(() => {
        optimisticDeltaRef.current = -serverCountRef.current;
        setCount(0);
    }, []);

    return { unreadCount: count, loading, optimisticDecrement, optimisticIncrement, optimisticReset };
}
