import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Moderation Policy | DareToSend',
    description: 'Details on how content is moderated on DareToSend.',
};

export default function ModerationPolicyPage() {
    return (
        <article>
            <h1>Moderation Policy</h1>
            <p className="text-sm text-white/50 mb-8">Last Updated: March 2026</p>

            <p>
                To maintain a safe environment, DareToSend utilizes a multi-layered approach to content moderation, combining automated safeguards with human oversight.
            </p>

            <h2>Automated Safeguards</h2>
            <ul>
                <li><strong>Rate Limiting:</strong> Severe rate limits are enforced at the network edge to prevent bots from flooding the system with messages.</li>
                <li><strong>Keyword Processing:</strong> Submissions are evaluated against predefined lists of restricted terminology, preventing the most severe forms of abuse from reaching user inboxes.</li>
            </ul>

            <h2>User-Led Moderation</h2>
            <p>
                Registered users are empowered to manage their own experience:
            </p>
            <ul>
                <li>Users can quickly flag or delete any message they deem inappropriate.</li>
                <li>Flagging a message removes it from the user&apos;s view and escalates it to the administrative moderation queue.</li>
            </ul>

            <h2>Administrative Review</h2>
            <p>
                Platform administrators have access to a secure suite of moderation tools:
            </p>
            <ul>
                <li>They review flagged messages alongside metadata such as hashed IP addresses and timestamps.</li>
                <li>Administrators can permanently ban bad actors based on this metadata, preventing further abuse across the entire platform.</li>
                <li>All administrative actions are logged in a secure, immutable audit trail to ensure accountability.</li>
            </ul>
        </article>
    );
}
