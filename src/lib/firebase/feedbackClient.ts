import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, setPersistence, indexedDBLocalPersistence, type Auth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Singleton pattern — identical to client.ts but using a named app ("FeedbackApp")
// getAuth() is idempotent and safe to call any number of times, unlike initializeAuth()
const feedbackApp: FirebaseApp = getApps().find(a => a.name === "FeedbackApp")
    ?? initializeApp(firebaseConfig, "FeedbackApp");

const feedbackAuth: Auth = getAuth(feedbackApp);

// Set persistence once — this is a no-op if already set, and safe to call repeatedly
setPersistence(feedbackAuth, indexedDBLocalPersistence).catch(() => { });

export { feedbackApp, feedbackAuth };
