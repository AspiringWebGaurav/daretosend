"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface LoadingContextValue {
    isLoading: boolean;
    /** true once the 300ms delay has elapsed — prevents flicker on fast loads */
    delayedLoading: boolean;
    /** true if loading exceeded MAX_LOADING_MS — show retry UI */
    timedOut: boolean;
    resetTimeout: () => void;
    setLoading: (loading: boolean) => void;
    withLoading: <T>(fn: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

const MIN_DISPLAY_MS = 600;
const SPINNER_DELAY_MS = 300;  // show spinner only after 300ms to avoid flicker
const MAX_LOADING_MS = 8000;   // 8s hard cap — trigger retry UI

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [count, setCount] = useState(0);
    const [visibleLoading, setVisibleLoading] = useState(false);
    const [delayedLoading, setDelayedLoading] = useState(false);
    const [timedOut, setTimedOut] = useState(false);

    const shownAtRef = useRef<number | null>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const delayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (count > 0) {
            // Cancel any pending hide
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            shownAtRef.current = Date.now();
            setVisibleLoading(true);
            setTimedOut(false);

            // Delayed spinner — only show after 300ms
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            delayTimerRef.current = setTimeout(() => setDelayedLoading(true), SPINNER_DELAY_MS);

            // Hard timeout — switch to retry UI after 8s
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            timeoutTimerRef.current = setTimeout(() => {
                setTimedOut(true);
                setDelayedLoading(false);
                setVisibleLoading(false);
                setCount(0);
            }, MAX_LOADING_MS);
        } else {
            // Clear delay + timeout timers
            if (delayTimerRef.current) clearTimeout(delayTimerRef.current);
            if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
            setDelayedLoading(false);

            // Respect minimum display time before hiding
            const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : MIN_DISPLAY_MS;
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
            hideTimerRef.current = setTimeout(() => setVisibleLoading(false), remaining);
        }
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, [count]);

    const setLoading = useCallback((loading: boolean) => {
        setCount((c) => Math.max(0, c + (loading ? 1 : -1)));
    }, []);

    const withLoading = useCallback(async <T,>(fn: () => Promise<T>): Promise<T> => {
        setCount((c) => c + 1);
        try {
            return await fn();
        } finally {
            setCount((c) => Math.max(0, c - 1));
        }
    }, []);

    const resetTimeout = useCallback(() => {
        setTimedOut(false);
        setCount(0);
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading: visibleLoading, delayedLoading, timedOut, resetTimeout, setLoading, withLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading(): LoadingContextValue {
    const ctx = useContext(LoadingContext);
    if (!ctx) throw new Error("useLoading must be used within a LoadingProvider");
    return ctx;
}

