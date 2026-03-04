# Deployment Guide

DareToSend is optimized for deployment on Vercel, utilizing Google Firebase as the backend. 

## Prerequisites
- A Google Cloud Platform (GCP) or Firebase account.
- A Vercel account.
- Node.js environment for local testing.

## Step 1: Firebase Configuration
1. Create a new Firebase project.
2. Enable **Firestore Database** in test mode, then immediately apply the production rules found in `/firestore.rules`.
3. Enable **Authentication** (Google Auth, Email/Password, or Anonymous).
4. Navigate to Project Settings > Service Accounts and securely download the **Firebase Admin SDK Private Key**.

## Step 2: Environment Variables
Prepare your environment variables (e.g., `.env.local` for local development). These values must be added to your Vercel project settings:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Server-side only variables
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYourKeyHere\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
```
*Note: Ensure the private key is properly formatted with newlines when entered into Vercel or your local environment.*

## Step 3: Vercel Deployment
1. Import the DareToSend repository into Vercel.
2. Select the `Next.js` framework preset.
3. Add the environment variables gathered in Step 2.
4. Click **Deploy**.

The Vercel Edge Network will automatically globally distribute the static assets and configure the Serverless Functions for your API routes.
