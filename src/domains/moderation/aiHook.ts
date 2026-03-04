import type { ModerationCheckResult } from "@/types/moderation";

/**
 * Pluggable AI moderation hook.
 * Disabled by default (aiModerationEnabled: false in system_config).
 * When enabled, call an external AI moderation API here.
 */
export async function aiHook(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _content: string
): Promise<ModerationCheckResult> {
    // Hook point: replace this stub with your AI API call when ready.
    // Example: OpenAI Moderation API, Perspective API, etc.
    return { passed: true, failReason: null };
}
