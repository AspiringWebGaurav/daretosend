"use client";

import * as React from "react";

/**
 * Custom hook to track real-time CSS media query matching.
 * SSR-safe: returns false on server, updates on first client render.
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = React.useState(false);

    React.useEffect(() => {
        const matchMedia = window.matchMedia(query);
        // Trigger initial value on mount
        setMatches(matchMedia.matches);

        const handleChange = (e: MediaQueryListEvent) => {
            setMatches(e.matches);
        };

        matchMedia.addEventListener("change", handleChange);
        return () => matchMedia.removeEventListener("change", handleChange);
    }, [query]);

    return matches;
}
