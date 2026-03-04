# Core User Flows

Understanding the primary user journeys within DareToSend outlines how interactions map to underlying architectural components. 

## 1. Anonymous Message Submission
1. An anonymous user visits a public profile (`/[username]`).
2. They enter a message in the submission form.
3. The frontend passes the payload to an internal API route or Server Action.
4. The backend verifies the payload, checks global rate limits, and validates the target user ID.
5. If successful, the server writes the message document to Firestore and returns a success state.
6. The UI provides feedback (e.g., a "Sent" animation).

## 2. User Authentication
1. A user clicks "Sign In" and authenticates via Firebase Auth (e.g., Google OAuth).
2. The client receives a Firebase token.
3. The client triggers an authentication sync with the server. If this is a new user, a corresponding Firestore user document is securely created.
4. The user is redirected to their `/dashboard`.

## 3. Reviewing the Inbox
1. An authenticated user accesses `/dashboard`.
2. A React Server Component securely fetches the user's unread messages from Firestore using their verified UID.
3. The messages are rendered on the server and sent to the client.
4. The user can interact with messages (mark as read, flag, delete), which trigger Server Actions to update the Firestore records securely.
