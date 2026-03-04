# DareToSend Architecture

DareToSend employs a modern Next.js 16 (App Router) architecture with React Server Components, communicating with a serverless backend hosted on Google Firebase/Firestore.

## Tech Stack Overview
- **Framework**: Next.js 16
- **Database**: Google Firestore (NoSQL Document Store)
- **Authentication**: Firebase Authentication
- **Runtime**: Node.js via Vercel Edge / Serverless
- **Styling**: Tailwind CSS / Framer Motion

## Core Principles
1. **Server-Side Rendering (SSR) Default**: We heavily leverage React Server Components to reduce client bundle size and enhance performance.
2. **Edge Security**: All API routes and administrative access paths are protected by middleware acting at the edge to manage rate limiting and initial authentication checks before execution logic.
3. **Database Rules over Client Logic**: The ultimate source of truth for authorization and validation lies within `firestore.rules`, enforcing read/write permissions directly at the database layer.

## Project Structure
- `/src/app/` - The Next.js App Router containing pages, layouts, and API routes.
- `/src/app/api/` - Internal server endpoints handling secure backend logic isolated from the client.
- `/src/app/admin/` - The gated administrative interface.
- `/src/domains/` - Business logic, reusable hooks, and utility classes organized contextually.
- `/src/components/` - Presentational React components designed for reusability across pages.
