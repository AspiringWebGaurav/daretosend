/**
 * Lightweight global crash-prevention layer.
 * Catches unhandled promise rejections and uncaught errors to prevent
 * silent failures and ensure all errors are logged.
 *
 * Inspired by patterns in Stripe/Linear production apps.
 */
export function installGlobalErrorHandlers() {
    if (typeof window === "undefined") return;

    // Prevent duplicate installation
    if ((window as unknown as Record<string, boolean>).__dts_error_handlers_installed) return;
    (window as unknown as Record<string, boolean>).__dts_error_handlers_installed = true;

    window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
        console.error("[DTS] Unhandled promise rejection:", e.reason);
        // Don't suppress — let browser handle naturally, but we've logged it
    });

    const originalOnError = window.onerror;
    window.onerror = (msg, src, line, col, err) => {
        console.error("[DTS] Global error:", { msg, src, line, col, err });
        // Call original handler if it existed
        if (typeof originalOnError === "function") {
            return originalOnError(msg, src, line, col, err);
        }
        return false; // Don't suppress browser default handling
    };
}
