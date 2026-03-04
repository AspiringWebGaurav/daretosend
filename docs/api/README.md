# Internal API Reference

DareToSend primarily utilizes Next.js Server Actions and internal API routes (`/api/*`) for data mutations, securing operations behind the server environment.

## API Architecture
- **Location**: Next.js API endpoints are located in `/src/app/api/`.
- **Purpose**: These routes handle operations that cannot be safely exposed to the client SDK, such as verifying complex payloads, interacting with external services, handling webhooks, or processing heavy administrative tasks.
- **Response Format**: Standard JSON responses with appropriate HTTP status codes (e.g., `200 OK`, `400 Bad Request`, `401 Unauthorized`, `429 Too Many Requests`).

## Rate Limiting
All API endpoints pass through the global edge middleware which tracks incoming IPs to enforce rate limits. When a limit is breached, the API immediately halts execution and returns a `429 Too Many Requests` status, protecting backend resources from exhaustion.

## Authentication
API routes requiring an authenticated user demand a valid Firebase ID token sent in the `Authorization: Bearer <token>` header. The server verifies this token using the `firebase-admin` SDK before executing any logic.
