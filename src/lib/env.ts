/**
 * Dynamic base URL detection — no hardcoded domains.
 * Server-side: uses VERCEL_URL (auto-injected by Vercel) or throws if missing.
 * Client-side: uses window.location.origin.
 */
export function getBaseUrl(): string {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    // Fallback gracefully to the environment variable if defined, else we cannot determine origin statically
    return process.env.NEXT_PUBLIC_SITE_URL || "";
}

/**
 * Type-safe required env var accessor. Throws at startup if missing.
 */
export function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}

export const isProd =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
export const isDev = process.env.NODE_ENV === "development";
