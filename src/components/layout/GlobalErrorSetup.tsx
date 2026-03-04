"use client";

import { useEffect } from "react";
import { installGlobalErrorHandlers } from "@/lib/errorHandler";

/**
 * Client component that installs global error handlers once on mount.
 * Renders nothing — purely side-effect.
 */
export function GlobalErrorSetup() {
    useEffect(() => {
        installGlobalErrorHandlers();
    }, []);
    return null;
}
