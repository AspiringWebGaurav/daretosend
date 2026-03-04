# Security Model

DareToSend adopts a defense-in-depth approach to application security, relying on architectural boundaries to protect sensitive user data.

## Server-Side Verification
Client-side tokens or values are never trusted implicitly. All authenticated routes and administrative actions verify the Firebase authentication token server-side via `firebase-admin` before fulfilling a request. 

## Firestore Rules
Access control runs directly on the database. The `firestore.rules` document defines who can read and write specific documents. Examples include:
- Only authenticated users can update their profile.
- Only users with an assigned `admin` role in their user document can access or delete records globally.
- Anonymous users can create messages but cannot read entire collections or modify existing records.

## Middleware Rate Limiting
To prevent abuse, Next.js middleware acts as an edge defense, tracking IP addresses or session identifiers and intercepting excessive requests (e.g., brute-forcing login, spamming the message creation endpoint). 

## Sensitive Variables
All sensitive tokens (e.g., `FIREBASE_ADMIN_PRIVATE_KEY`) are stored in secure Vercel Environment Variables and are strictly limited to execution within secure Server Components or API routes. They are never exposed to the client bundle (`NEXT_PUBLIC_` prefixes are avoided for sensitive keys).
