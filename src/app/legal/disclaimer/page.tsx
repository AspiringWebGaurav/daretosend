import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Disclaimer | DareToSend',
    description: 'Liability disclaimer for DareToSend.',
};

export default function DisclaimerPage() {
    return (
        <article>
            <h1>Disclaimer of Liability</h1>
            <p className="text-sm text-white/50 mb-8">Last Updated: March 2026</p>

            <h2>Software Provided &quot;As Is&quot;</h2>
            <p>
                The DareToSend software is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis, without warranties of any kind, either express or implied, including, without limitation, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>

            <h2>Independent Instances</h2>
            <p>
                The original authors and copyright holders of the DareToSend software do not host, monitor, or manage the data on independent, self-hosted instances of this application. Each instance is operated entirely by independent administrators who control their own database and cloud infrastructure.
            </p>

            <h2>Limitation of Liability</h2>
            <p>
                In no event shall the authors, creators, or copyright holders of DareToSend be liable for any special, direct, indirect, consequential, or incidental damages or any damages whatsoever, whether in an action of contract, negligence, or other tort, arising out of or in connection with the use of the Service or the contents of the Service.
            </p>
            <p>
                The authors reserve the right to make additions, deletions, or modification to the contents on the Service at any time without prior notice.
            </p>

            <h2>User Responsibility</h2>
            <p>
                By using this software, users acknowledge that they send and receive messages at their own risk. Although we provide moderation tools for server administrators, we cannot guarantee the behavior or intentions of other users on the platform.
            </p>
        </article>
    );
}
