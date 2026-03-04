"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";

/**
 * Detects Next.js App Router navigation and briefly shows the global loader.
 * Mount this once inside the LoadingProvider (e.g. root layout body).
 */
export function NavigationLoader() {
    const pathname = usePathname();
    const { setLoading } = useLoading();
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        // New pathname = navigation just completed; loader was shown on click via Link/router.push
        setLoading(false);
    }, [pathname, setLoading]);

    return null;
}
