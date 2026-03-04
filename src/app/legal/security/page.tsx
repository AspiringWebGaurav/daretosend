import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Security | DareToSend',
    description: 'Security practices and responsible disclosure for DareToSend.',
};

export default function SecurityPage() {
    return (
        <article>
            <h1>Security Overview</h1>
            <p className="text-sm text-white/50 mb-8">Last Updated: March 2026</p>

            <p>
                Security is a core organizational principle of DareToSend. The architecture is designed to minimize risk and protect both user data and platform stability.
            </p>

            <h2>Architectural Defenses</h2>
            <ul>
                <li><strong>Edge Protection:</strong> Next.js Middleware acts as a first line of defense, validating requests and enforcing rate limits before they hit application logic.</li>
                <li><strong>Database Rules:</strong> All data access is governed by strict Firestore Security Rules, ensuring clients can only read or write data they are explicitly authorized for.</li>
                <li><strong>Server Actions:</strong> Sensitive operations, including all administrative functions and database mutations, are executed securely on the server via Next.js Server Actions or internal API routes.</li>
            </ul>

            <h2>Reporting Vulnerabilities</h2>
            <p>
                If you discover a security vulnerability in the platform, we ask that you practice responsible disclosure. Please do not publish details of the vulnerability publicly. Instead, contact the administrators of this instance directly to arrange for a secure report and remediation.
            </p>
        </article>
    );
}
