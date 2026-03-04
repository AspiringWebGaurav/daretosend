import { selfSendCheck } from "./selfSendCheck";
import { shadowBanCheck } from "./shadowBanCheck";
import { keywordFilter } from "./keywordFilter";
import { aiHook } from "./aiHook";
import type { ModerationCheckResult } from "@/types/moderation";
import type { SystemConfig } from "@/types/systemConfig";

export interface PipelineResult {
    passed: boolean;
    failReason: string | null;
    shadowBanned: boolean;
}

/**
 * Moderation pipeline orchestrator.
 * Runs checks in fail-fast order: cheapest first.
 *
 * Order:
 *  1. self-send (free, synchronous)
 *  2. shadow-ban (1 DB read)
 *  3. maintenance mode
 *  4. keyword filter (synchronous)
 *  5. AI hook (disabled by default)
 *
 * Rate limit is checked separately in incrementCounter() within a transaction.
 */
export async function runModerationPipeline(params: {
    senderId: string;
    receiverId: string;
    content: string;
    config: SystemConfig;
}): Promise<PipelineResult> {
    const { senderId, receiverId, content, config } = params;

    // 1. Self-send check
    const selfCheck: ModerationCheckResult = selfSendCheck(senderId, receiverId);
    if (!selfCheck.passed) {
        return { passed: false, failReason: selfCheck.failReason, shadowBanned: false };
    }

    // 2. Shadow-ban check
    const shadowCheck = await shadowBanCheck(senderId);
    if (shadowCheck.shadowBanned) {
        // Silent drop — caller returns 200 to sender
        return { passed: false, failReason: "shadow_ban", shadowBanned: true };
    }

    // 3. Maintenance mode
    if (config.maintenanceMode) {
        return { passed: false, failReason: "maintenance", shadowBanned: false };
    }

    // 4. Moderation enabled gate
    if (!config.moderationEnabled) {
        return { passed: true, failReason: null, shadowBanned: false };
    }

    // 5. Keyword filter
    const kwCheck = keywordFilter(content, config.keywordBlocklist);
    if (!kwCheck.passed) {
        return { passed: false, failReason: kwCheck.failReason, shadowBanned: false };
    }

    // 6. AI hook (disabled unless aiModerationEnabled)
    if (config.aiModerationEnabled) {
        const aiCheck = await aiHook(content);
        if (!aiCheck.passed) {
            return { passed: false, failReason: aiCheck.failReason, shadowBanned: false };
        }
    }

    return { passed: true, failReason: null, shadowBanned: false };
}
