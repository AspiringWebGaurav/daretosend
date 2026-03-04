import type { Timestamp } from "firebase-admin/firestore";

export interface SystemConfig {
    rateLimitPerDay: number;
    moderationEnabled: boolean;
    aiModerationEnabled: boolean;
    keywordBlocklist: string[];
    maintenanceMode: boolean;
    updatedAt: Timestamp;
    updatedBy: string;
}

export const DEFAULT_SYSTEM_CONFIG: Omit<
    SystemConfig,
    "updatedAt" | "updatedBy"
> = {
    rateLimitPerDay: 20,
    moderationEnabled: true,
    aiModerationEnabled: false,
    keywordBlocklist: [],
    maintenanceMode: false,
};
