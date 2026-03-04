# Content Moderation

DareToSend relies on a combination of automated filters and manual administrative oversight. The platform's objective is to foster a safe, respectful environment without compromising user privacy. 

## Automated Pre-Screening
Incoming messages undergo automated screening:
- **Rate-Limiting**: Prevents automated spam and brute-force message submissions at the middleware level (e.g., returning HTTP 429).
- **Keyword Filtering**: Optionally configurable filters to catch egregious profanity or explicitly banned terminology before it reaches the intended recipient.

## Manual Moderation Workflow
When automated screening flags content or a registered user manually reports an abusive message, the item enters the Moderation Queue.
1. **Reporting**: End-users can flag a message from their inbox. The message is instantly removed from their view and designated as `flagged` in the Firestore database.
2. **Review**: Administrators monitor the `/admin/moderation` dashboard, viewing context surrounding the flagged item (sender IP hash, timestamp, recipient ID).
3. **Action**: Administrators can permanently delete the message, ban the sender's IP/Hash, or dismiss the report if unfounded.

## Appeals Process
Users whose accounts or IP addresses have been restricted may appeal via the designated channels outlined in the `/legal/acceptable-use` policy.
