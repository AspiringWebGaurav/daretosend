export const COLLECTIONS = {
    USERS: "users",
    USERNAMES: "usernames",
    MESSAGES: "messages",
    MODERATION_QUEUE: "moderation_queue",
    SYSTEM_CONFIG: "system_config",
    AUDIT_LOGS: "audit_logs",
} as const;

export const SYSTEM_CONFIG_DOC = "global";

export const RATE_LIMIT_PER_DAY = 20;

export const SESSION_COOKIE_NAME = "__session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 5; // 5 days in seconds

export const ROLES = {
    USER: "user",
    ADMIN: "admin",
    SUPER_ADMIN: "super_admin",
} as const;

export const SEEDED_ROLES: Record<string, string> = {
    "gauravpatil5737@gmail.com": ROLES.ADMIN,
    "gauravpatil9262@gmail.com": ROLES.SUPER_ADMIN,
};
