import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | DareToSend',
    description: 'Privacy Policy outlining data handling for DareToSend.',
};

export default function PrivacyPage() {
    return (
        <article>
            <h1>Privacy Policy</h1>
            <p className="text-sm text-white/50 mb-8">Last Updated: March 2026</p>

            <h2>1. Information We Collect</h2>
            <p>
                We collect information necessary to provide the DareToSend service. This includes:
            </p>
            <ul>
                <li><strong>Account Information:</strong> If you register, we collect authentication data provided by our identity providers (e.g., Google or Email).</li>
                <li><strong>Message Content:</strong> Messages sent through the platform. By design, sender identity is not attached to anonymous messages.</li>
                <li><strong>Technical Data:</strong> IP addresses and browser fingerprints are collected strictly for security purposes, rate limiting, and spam prevention.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
                We use the collected information exclusively to:
            </p>
            <ul>
                <li>Deliver messages to the intended recipient.</li>
                <li>Enforce our Acceptable Use Policy and prevent abuse.</li>
                <li>Maintain and improve the security of the platform.</li>
            </ul>
            <p><strong>We do not sell your personal data or message content to third parties.</strong></p>

            <h2>3. Data Retention</h2>
            <p>
                Messages and user data are retained according to our Data Retention Policy. Specifically, logs used for security and rate limiting are hashed and periodically expunged to preserve user privacy while maintaining platform security.
            </p>

            <h2>4. Your Rights</h2>
            <p>
                Depending on your jurisdiction, you may have rights regarding your personal data, including the right to access, correct, or delete your account information. Registered users can manage their account data via the dashboard settings.
            </p>

            <h2>5. Security</h2>
            <p>
                We implement robust security measures, including database-level access rules and edge-level rate limiters, to protect your information.
            </p>
        </article>
    );
}
