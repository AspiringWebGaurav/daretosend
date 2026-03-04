import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | DareToSend',
    description: 'Terms of Service for DareToSend users.',
};

export default function TermsPage() {
    return (
        <article>
            <h1>Terms of Service</h1>
            <p className="text-sm text-white/50 mb-8">Last Updated: March 2026</p>

            <h2>1. Acceptance of Terms</h2>
            <p>
                By accessing or using DareToSend, you agree to be bound by these Terms of Service and our Acceptable Use Policy. If you do not agree to these terms, please do not use our services.
            </p>

            <h2>2. Description of Service</h2>
            <p>
                DareToSend provides a platform for anonymous messaging. We supply the software and infrastructure to facilitate communication between users.
            </p>

            <h2>3. User Responsibilities</h2>
            <p>You agree not to use the platform to:</p>
            <ul>
                <li>Harass, abuse, or threaten others.</li>
                <li>Send unsolicited promotional material or spam.</li>
                <li>Transmit any material that is unlawful or violates the rights of any third party.</li>
            </ul>

            <h2>4. Account Security</h2>
            <p>
                If you register an account, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.
            </p>

            <h2>5. Termination</h2>
            <p>
                We reserve the right to suspend or terminate your access to the service at any time, with or without cause, including for violations of our Acceptable Use Policy.
            </p>

            <h2>6. Disclaimer of Warranties</h2>
            <p>
                The service is provided &quot;as is&quot; without warranties of any kind. This instance of DareToSend is operated independently by the administrators of this environment. The original authors of the DareToSend software bear no responsibility or liability for the operation of this instance.
            </p>
        </article>
    );
}
