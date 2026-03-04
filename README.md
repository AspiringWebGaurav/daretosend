# DareToSend

DareToSend is a modern, anonymous messaging platform designed for secure, moderated, and scalable communication.

## System Overview
DareToSend is built on a robust architecture prioritizing security, performance, and a premium user experience. The application leverages Next.js 16 (App Router) for the frontend, React Server Components for performance, and Firebase/Firestore for real-time databasing and authentication. The architecture strictly separates public client logic from secure server operations, ensuring data integrity and user privacy.

## Role Model
The platform operates on a hierarchical Role-Based Access Control (RBAC) model:
- **Anonymous Users**: Can send messages and view public profiles.
- **Registered Users**: Can receive messages, manage their inbox, configure their profile, and report abusive content.
- **Administrators**: Have access to the secure admin dashboard to moderate content, manage users, configure system settings, and oversee platform health.

## Moderation Philosophy
DareToSend employs a proactive, multi-layered moderation philosophy to maintain a safe environment. We utilize automated scanning combined with human oversight to review flagged messages. Our moderation tools are built directly into the administrative suite, empowering community managers to act swiftly on violations of our Acceptable Use Policy without compromising the overall platform performance.

## Rate Limit Model
To ensure platform stability and prevent abuse, a comprehensive rate limiting model is enforced at the edge/middleware layer across all critical API endpoints.
- Message Submission: Strictly limited per IP/Session to prevent spam.
- Authentication Attempts: Throttled to mitigate brute-force attacks.
- Search API: Protected against excessive queries.
All rate limits return standard HTTP 429 Too Many Requests responses with appropriate headers.

## Admin Governance
The administrative features are strictly gated and monitored. Every administrative action (e.g., deleting a message, banning a user, modifying system settings) is recorded in immutable, server-side audit logs. Admin access is verified continuously via secure, HTTP-only session cookies and robust server-side role validation.

## Deployment Guide

### Firebase Setup
1. Create a new independent project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable Firestore Database with production rules (refer to `/firestore.rules`).
3. Set up Firebase Authentication (Google, Email/Password, or Anonymous).
4. For the Admin SDK, navigate to Project Settings > Service Accounts and generate a new private key.

### Vercel Setup
1. Fork this repository or connect your GitHub account to Vercel.
2. Import the project into Vercel.
3. Configure the following Environment Variables in the Vercel project settings (refer to `.env.local.example` if applicable):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `FIREBASE_ADMIN_PRIVATE_KEY` (Important: Keep this secure!)
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
4. Deploy the application.

## License Summary
DareToSend is released under the **DareToSend Community License v1.0**.

This is a Source-Available Commercial License.
You are permitted to self-host the software for personal or internal use, and create public forks.
You are strictly prohibited from reselling the software, offering it as a SaaS to third parties, removing branding, or commercial monetization.
The licensor is not responsible for your infrastructure or cloud costs. A full liability disclaimer applies.

For complete terms, please refer to the `LICENSE` file in this repository.
