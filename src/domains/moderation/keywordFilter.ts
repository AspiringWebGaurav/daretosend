import type { ModerationCheckResult } from "@/types/moderation";

/**
 * Checks message content against a keyword blocklist.
 * Case-insensitive match.
 */
export function keywordFilter(
    content: string,
    blocklist: string[]
): ModerationCheckResult {
    if (!blocklist.length) return { passed: true, failReason: null };

    const lower = content.toLowerCase();
    const hit = blocklist.find((kw) => lower.includes(kw.toLowerCase()));

    if (hit) {
        return { passed: false, failReason: "keyword" };
    }
    return { passed: true, failReason: null };
}
