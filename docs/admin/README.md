# Admin Documentation

The `/admin` routes are secured sections of the DareToSend application designed explicitly for managing platform health, user behavior, and content moderation.

## Authentication and Authorization
Unlike public-facing routes, attempting to access any child route of `/admin` invokes strict server-side checks. Only users whose Firestore documents contain a specific administrative flag, or whose Firebase Authentication token contains a custom `admin` claim, can successfully view these pages.

## Secure Server Actions
To ensure security, administrative interactions with the database do *not* occur via the client SDK. All actions (e.g., confirming a deletion, updating a system parameter) trigger Next.js Server Actions or dedicated API routes. These routes utilize the `firebase-admin` SDK, ensuring the operation occurs within a trusted server environment with elevated privileges.

## Rate Limiting Overrides
By default, the global middleware rate limits apply to all users. Administrators operate under a distinct rate-limiting profile to prevent their accounts from being locked out during bulk operations or heavy moderation sessions.

## Key Interfaces
- **`/admin`**: The main overview dashboard showcasing high-level statistics (total users, message counts, active alerts).
- **`/admin/moderation`**: The interface tailored around reviewing flagged messages and managing the appeal queue.
- **`/admin/users`**: An interface for viewing user metrics and performing account-level actions (e.g., locking an account).
