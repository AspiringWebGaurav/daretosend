# Administrative Governance

The governance model of DareToSend ensures the platform operates securely, transparently, and aligned with its Acceptable Use Policy. 

## The Admin Dashboard
Governance is enacted exclusively through the secure, gated `/admin` interface. This section of the application bypasses standard user views, directly interfacing with secure server actions. Access is strictly governed by custom Firebase Claims or specific database roles.

## Capabilities
Administrators have the authority to:
- Monitor system health and active usage metrics.
- Moderate the flagged message queue.
- Override user configurations (e.g., locking a profile, resetting abusive profile images).
- Globally configure rate-limiter thresholds.
- Blacklist specific IP hashes to prevent chronic abuse.

## Audit Logging
To ensure accountability among the administrative team, all critical governance actions are recorded in an immutable audit ledger (`audit_logs` collection in Firestore).
- **Action Recorded**: E.g., `DELETE_MESSAGE`, `BAN_USER`.
- **Actor**: The UID of the administrator who performed the action.
- **Timestamp**: High-precision server timestamp.
- **Target**: The ID of the affected resource (User ID or Message ID).

These logs cannot be altered by standard administrators and represent the definitive source of truth for platform governance history.
