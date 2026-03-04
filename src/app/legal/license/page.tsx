import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'License | DareToSend',
    description: 'License agreement for DareToSend software.',
};

export default function LicensePage() {
    return (
        <article>
            <h1>DareToSend Community License v1.0</h1>
            <p className="text-sm text-white/50 mb-8">Source-Available Commercial License</p>

            <p>Copyright (c) 2026 DareToSend. All commercial rights reserved.</p>

            <h2>1. PERMITTED USES</h2>
            <p>Subject to the terms and conditions of this License, the Licensor grants you a non-exclusive, non-transferable, revocable license to:</p>
            <ul>
                <li>Create public forks of the Software.</li>
                <li>Modify the Software.</li>
                <li>Self-host the Software for personal or internal use only.</li>
            </ul>

            <h2>2. PROHIBITED USES</h2>
            <p>You are strictly prohibited from:</p>
            <ul>
                <li>Reselling the Software or any part thereof.</li>
                <li>Offering the Software as a Software-as-a-Service (SaaS) or otherwise using the Software to provide services to third parties.</li>
                <li>Commercial monetization of the Software in any form.</li>
                <li>White-labeling the Software.</li>
                <li>Removing, obscuring, or altering any branding, logos, copyright notices, or other proprietary rights notices from the Software.</li>
            </ul>

            <h2>3. CONDITIONS</h2>
            <p>As a condition of using this Software, you must comply with the following:</p>
            <ul>
                <li><strong>Independent Infrastructure:</strong> You must deploy and run the Software on your own independent Firebase project and associated infrastructure.</li>
                <li><strong>Cost Responsibility:</strong> The Licensor is not responsible for any cloud costs, billing, or expenses incurred by your deployment, hosting, or use of the Software.</li>
                <li><strong>Branding Retention:</strong> All DareToSend branding must be retained and clearly visible in the application interface.</li>
                <li><strong>License Retention:</strong> A copy of this License must be included in all copies, modifications, or forks of the Software.</li>
            </ul>

            <h2>4. DISCLAIMER OF LIABILITY</h2>
            <p>
                THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>

            <p>By using this Software, you acknowledge that you have read, understood, and agree to be bound by the terms of this DareToSend Community License v1.0.</p>
        </article>
    );
}
