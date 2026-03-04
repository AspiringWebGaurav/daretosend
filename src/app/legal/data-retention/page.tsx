import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data Retention Policy | DareToSend',
    description: 'Information regarding data storage and retention durations.',
};

export default function DataRetentionPage() {
    return (
        <article>
            <h1>Data Retention Policy</h1>
            <p className="text-sm text-white/50 mb-8">Last Updated: March 2026</p>

            <p>
                We aim to keep data only as long as necessary to provide our service and ensure platform security.
            </p>

            <h2>Messages</h2>
            <ul>
                <li><strong>Active Messages:</strong> Retained until the recipient deletes them or deletes their account.</li>
                <li><strong>Deleted Messages:</strong> When a user deletes a message from their inbox, it is permanently removed from the live database.</li>
                <li><strong>Flagged Messages:</strong> Retained securely in a moderation queue for administrative review. Once processed, they are permanently removed.</li>
            </ul>

            <h2>User Accounts</h2>
            <p>
                User account data (authentication tokens, profile settings) is retained indefinitely while the account is active. If a user chooses to delete their account, all associated data, including their inbox, is purged from the database.
            </p>

            <h2>Security and Audit Logs</h2>
            <ul>
                <li><strong>Rate Limit Data:</strong> IP hashes and request counts used for rate limiting are volatile and expire quickly (typically within minutes or hours, depending on the specific limiter configuration).</li>
                <li><strong>Audit Logs:</strong> Records of administrative actions are retained permanently as an immutable ledger to ensure platform governance integrity.</li>
            </ul>
        </article>
    );
}
