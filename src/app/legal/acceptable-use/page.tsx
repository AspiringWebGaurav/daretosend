import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Acceptable Use Policy | DareToSend',
    description: 'Acceptable Use Policy for DareToSend users.',
};

export default function AcceptableUsePage() {
    return (
        <article>
            <h1>Acceptable Use Policy</h1>
            <p className="text-sm text-white/50 mb-8">Last Updated: March 2026</p>

            <h2>Core Principle</h2>
            <p>
                DareToSend is designed to be a safe, fun, and constructive environment. While anonymity is a feature of the platform, it is not a shield for abusive behavior.
            </p>

            <h2>Prohibited Content</h2>
            <p>You may not use DareToSend to transmit any content that:</p>
            <ul>
                <li><strong>Is Abusive or Harassing:</strong> Contains severe insults, threats, or sustained intimidation targeted at any individual.</li>
                <li><strong>Contains Hate Speech:</strong> Attacks a person or group based on race, ethnicity, religion, disability, gender, age, or sexual orientation.</li>
                <li><strong>Is Explicit or Obscene:</strong> Contains unsolicited sexual content or graphic violence.</li>
                <li><strong>Is Illegal:</strong> Promotes or facilitates illegal activities, including the distribution of illicit substances or pirated material.</li>
                <li><strong>Is Spam:</strong> Consists of bulk, automated, or commercially motivated solicitations.</li>
            </ul>

            <h2>Enforcement</h2>
            <p>
                Violations of this policy will result in immediate action, which may include:
            </p>
            <ul>
                <li>Removal of the offending messages.</li>
                <li>Permanent banning of the sender&apos;s IP address or device fingerprint.</li>
                <li>Suspension or termination of the recipient&apos;s account if they are found to be soliciting abusive content.</li>
            </ul>
            <p>
                Administrators review flagged content and system logs to enforce these policies strictly.
            </p>
        </article>
    );
}
