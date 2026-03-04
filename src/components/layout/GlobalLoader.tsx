"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLoading } from "@/context/LoadingContext";
import { AlertCircle, RefreshCw } from "lucide-react";

/** Individual radial tick — same pattern as the native browser/Google spinner */
function Tick({ index, total }: { index: number; total: number }) {
    const angle = (360 / total) * index;
    const delay = -((total - index) / total);
    return (
        <div
            className="absolute left-1/2 top-1/2 origin-bottom"
            style={{
                transform: `rotate(${angle}deg) translateY(-140%)`,
                width: 4,
                height: 11,
                marginLeft: -2,
                borderRadius: 999,
                animation: `dts-tick 1s ${delay}s linear infinite`,
            }}
        />
    );
}

/**
 * Content-scoped loader. Renders as absolute overlay within the nearest
 * positioned parent (DashboardLayout main area) — never blocks sidebar/nav.
 * Shows only after 300ms delay to avoid flicker. After 8s timeout shows retry UI.
 */
export function GlobalLoader() {
    const { delayedLoading, timedOut, resetTimeout } = useLoading();
    const TICKS = 12;

    return (
        <>
            {/* Keyframes injected once */}
            <style>{`
        @keyframes dts-tick {
          0%   { background-color: hsl(var(--foreground) / 0.9); }
          100% { background-color: hsl(var(--foreground) / 0.08); }
        }
      `}</style>

            <AnimatePresence>
                {timedOut && (
                    <motion.div
                        key="global-timeout"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    >
                        <div className="flex flex-col items-center gap-4 text-center p-8 max-w-sm">
                            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertCircle className="h-7 w-7 text-destructive" />
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
                                <p className="text-sm text-muted-foreground">
                                    The request took too long to complete. Please try again.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    resetTimeout();
                                    window.location.reload();
                                }}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Retry
                            </button>
                        </div>
                    </motion.div>
                )}

                {delayedLoading && !timedOut && (
                    <motion.div
                        key="global-loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="absolute inset-0 z-[100] flex items-center justify-center"
                        style={{ backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", backgroundColor: "hsl(var(--background) / 0.6)" }}
                    >
                        {/* Spinner */}
                        <div className="relative h-16 w-16">
                            {Array.from({ length: TICKS }).map((_, i) => (
                                <Tick key={i} index={i} total={TICKS} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
