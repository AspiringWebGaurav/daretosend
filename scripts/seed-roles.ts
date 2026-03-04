/**
 * scripts/seed-roles.ts
 * One-time script to assign admin and super_admin custom claims.
 * Run once after Firebase project setup:
 *   npx tsx scripts/seed-roles.ts
 *
 * Requires FIREBASE_* env vars to be set in .env.local.
 */

// Load env vars from .env.local
import { config } from "node:process";
// Use dotenv if available, or set env vars manually before running
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config({ path: ".env.local" });
} catch {
    // dotenv not installed — ensure env vars are set in shell
}

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

void config;

const SEEDED_ROLES: Record<string, string> = {
    "gauravpatil5737@gmail.com": "admin",
    "gauravpatil9262@gmail.com": "super_admin",
};

async function main() {
    if (getApps().length === 0) {
        initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
            }),
        });
    }

    const adminAuth = getAuth();
    const adminDb = getFirestore();

    for (const [email, role] of Object.entries(SEEDED_ROLES)) {
        try {
            // Look up user by email
            const userRecord = await adminAuth.getUserByEmail(email);
            const uid = userRecord.uid;

            // Set custom claims
            await adminAuth.setCustomUserClaims(uid, { role });

            // Update Firestore user doc
            await adminDb.collection("users").doc(uid).set(
                {
                    role,
                    updatedAt: FieldValue.serverTimestamp(),
                },
                { merge: true }
            );

            // Revoke tokens so next login picks up new claims
            await adminAuth.revokeRefreshTokens(uid);

            console.log(`✅ Set role="${role}" for ${email} (uid: ${uid})`);
        } catch (err) {
            if ((err as NodeJS.ErrnoException).code === "auth/user-not-found") {
                console.warn(`⚠️  User not found: ${email} — skipped (must sign in first)`);
            } else {
                console.error(`❌ Failed for ${email}:`, err);
            }
        }
    }

    console.log("\nDone. Users must sign out and sign in again for new claims to take effect.");
    process.exit(0);
}

main();
