"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { signOut, onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import type { Role } from "@/types/roles";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface AuthState {
    user: User | null;
    role: Role | null;
    loading: boolean;
}

const SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

/**
 * Client-side auth state hook with auto-logout and fast local session.
 * Reads role from Firebase ID token custom claims.
 * Does NOT call Firestore — role comes from JWT claims set by Admin SDK.
 *
 * NOTE: Does NOT drive the global loader. Each page handles its own
 * auth loading state inline to avoid counter imbalance from multiple
 * components calling useAuth() simultaneously.
 */
export function useAuth(): AuthState {
    const [state, setState] = useState<AuthState>({
        user: null,
        role: null,
        loading: true,
    });

    useIsomorphicLayoutEffect(() => {
        if (typeof window !== "undefined") {
            const localSession = localStorage.getItem("dts_session");
            const sessionStart = localStorage.getItem("dts_session_start");

            if (localSession && sessionStart) {
                const isExpired = Date.now() - Number(sessionStart) > SESSION_MAX_AGE_MS;
                if (!isExpired) {
                    try {
                        const parsed = JSON.parse(localSession);
                        // Provide a fast initial state to prevent UI flicker
                        if (parsed.user) {
                            setState((prev) =>
                                prev.loading ? { user: parsed.user as User, role: parsed.role, loading: false } : prev
                            );
                        }
                    } catch (e) {
                        // ignore parse errors
                    }
                }
            }
        }
    }, []);

    useEffect(() => {
        // 8s safety timeout: if auth never resolves, force loading=false
        const authTimeoutId = setTimeout(() => {
            setState((prev) => {
                if (prev.loading) {
                    console.error("[DTS] useAuth: Firebase auth timed out after 8s");
                    return { user: null, role: null, loading: false };
                }
                return prev;
            });
        }, 8000);

        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            clearTimeout(authTimeoutId);

            if (!firebaseUser) {
                localStorage.removeItem("dts_session");
                localStorage.removeItem("dts_session_start");
                setState({ user: null, role: null, loading: false });
                return;
            }

            const sessionStart = localStorage.getItem("dts_session_start");
            const isExpired = sessionStart && (Date.now() - Number(sessionStart) > SESSION_MAX_AGE_MS);

            if (isExpired) {
                // Auto logout
                await fetch("/api/auth/session", { method: "DELETE" }).catch(() => { });
                await signOut(auth);
                localStorage.removeItem("dts_session");
                localStorage.removeItem("dts_session_start");
                setState({ user: null, role: null, loading: false });

                // Redirect if not on landing
                if (window.location.pathname !== "/") {
                    window.location.href = "/";
                }
                return;
            }

            // Set session start if newly logged in
            if (!sessionStart) {
                localStorage.setItem("dts_session_start", Date.now().toString());
            }

            // Force-refresh to get latest custom claims
            try {
                const idTokenResult = await firebaseUser.getIdTokenResult(true);
                const role = (idTokenResult.claims.role as Role) ?? "user";

                const newState = { user: firebaseUser, role, loading: false };

                // Save safe minimal user JSON object for fast load on next refresh
                const safeUser = {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                };
                localStorage.setItem("dts_session", JSON.stringify({ user: safeUser, role }));

                setState(newState);
            } catch (error) {
                console.error("[DTS] useAuth: token refresh error:", error);
                // Handle potential network or token refresh errors
                setState({ user: firebaseUser, role: "user", loading: false });
            }
        });

        return () => {
            clearTimeout(authTimeoutId);
            unsub();
        };
    }, []);

    return state;
}
