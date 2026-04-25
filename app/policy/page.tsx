import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | CandidConversations",
  description: "Privacy Policy for CandidConversations",
};

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-white text-[#1a1c1c] py-16 px-6 lg:px-8 max-w-4xl mx-auto selection:bg-[#f5820a] selection:text-white">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">PRIVACY POLICY - CandidConversations</h1>
          <p className="text-[#585f6c] mt-2">Effective Date: April 26, 2026</p>
        </div>

        <hr className="border-[#e5e7eb]" />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">1. INTRODUCTION</h2>
          <p className="text-[#585f6c] leading-relaxed">
            This Privacy Policy describes how CandidConversations ("we," "us," or "our") collects, uses, and discloses your personal information when you use our mentorship booking platform (the "Service").
          </p>
          <p className="text-[#585f6c] leading-relaxed">
            We are committed to protecting your personal information and your right to privacy. When you use our platform, you trust us with your personal information. We take your privacy very seriously and aim to explain clearly what information we collect, how we use it, and what rights you have.
          </p>
          <p className="text-[#585f6c] leading-relaxed">
            This Privacy Policy applies to all information collected through our platform, as well as any related services, sales, marketing, or events.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">2. DEFINITIONS</h2>
          <p className="text-[#585f6c] leading-relaxed">To help explain things clearly:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li><strong>Cookie</strong>: A small file placed on your device to enable certain features and functionality.</li>
            <li><strong>Company</strong>: Refers to CandidConversations.</li>
            <li><strong>Country</strong>: India.</li>
            <li><strong>Customer / User</strong>: Any person who uses the platform.</li>
            <li><strong>Device</strong>: Any internet-connected device used to access the Service.</li>
            <li><strong>Personal Data</strong>: Any information that identifies an individual.</li>
            <li><strong>Service</strong>: The mentorship booking platform provided by CandidConversations.</li>
            <li><strong>Third-party service</strong>: External services used to operate the platform.</li>
            <li><strong>Website</strong>: <a href="https://candidconversations.in" className="text-[#f5820a] hover:underline">https://candidconversations.in</a></li>
            <li><strong>You</strong>: The user of the Service.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">3. INFORMATION WE COLLECT</h2>
          <p className="text-[#585f6c] leading-relaxed">We collect different types of information to provide and improve our Service.</p>
          
          <h3 className="text-xl font-semibold mt-6">3.1 Personal Data</h3>
          <p className="text-[#585f6c] leading-relaxed">We may collect:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Email address</li>
            <li>First name and last name</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">3.2 Booking Data</h3>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Selected mentor</li>
            <li>Session date and time</li>
            <li>Booking status</li>
            <li>Meeting details (including generated meeting links)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">3.3 Payment Data</h3>
          <p className="text-[#585f6c] leading-relaxed">Payments are processed securely via Razorpay. We do <strong>not</strong> store your card or banking details.</p>

          <h3 className="text-xl font-semibold mt-6">3.4 Google Account Data</h3>
          <p className="text-[#585f6c] leading-relaxed">If you sign in using Google, we may access:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Your email address</li>
            <li>Basic profile information</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">If you grant permission, we may use Google Calendar API to:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Create events for scheduled sessions</li>
            <li>Attach meeting links</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">We do <strong>not</strong>:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Read your existing calendar events</li>
            <li>Modify or delete personal calendar data</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">3.5 Usage Data</h3>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Interaction with the platform</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">3.6 Cookies</h3>
          <p className="text-[#585f6c] leading-relaxed">We use cookies to improve functionality and user experience.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">4. HOW WE USE YOUR INFORMATION</h2>
          <p className="text-[#585f6c] leading-relaxed">CandidConversations uses your data to:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Provide and maintain the Service</li>
            <li>Schedule and manage mentorship sessions</li>
            <li>Generate meeting links</li>
            <li>Send booking confirmations and reminders</li>
            <li>Provide customer support</li>
            <li>Monitor and improve platform performance</li>
            <li>Detect and prevent fraud or misuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">4.1 Google User Data</h2>
          <p className="text-[#585f6c] leading-relaxed">If you authenticate using Google, we access limited data strictly for functionality:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>To create calendar events for booked sessions</li>
            <li>To attach meeting links</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">We do <strong>NOT</strong>:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Read your existing calendar events</li>
            <li>Modify or delete personal data outside created events</li>
            <li>Share Google data with third parties</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">Our use of Google user data complies with the Google API Services User Data Policy.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">5. DATA RETENTION</h2>
          <p className="text-[#585f6c] leading-relaxed">We retain your data:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>As long as your account is active</li>
            <li>As necessary for legal, financial, and operational purposes</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">You may request deletion of your data at any time.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">6. TRANSFER OF YOUR PERSONAL DATA</h2>
          <p className="text-[#585f6c] leading-relaxed">Your information may be transferred and processed in India.</p>
          <p className="text-[#585f6c] leading-relaxed">By using our Service, you consent to this transfer.</p>
          <p className="text-[#585f6c] leading-relaxed">We take reasonable steps to ensure your data is handled securely.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">7. DISCLOSURE OF YOUR PERSONAL DATA</h2>
          
          <h3 className="text-xl font-semibold mt-4">Business Transactions</h3>
          <p className="text-[#585f6c] leading-relaxed">If we are involved in a merger or acquisition, your data may be transferred.</p>

          <h3 className="text-xl font-semibold mt-4">Legal Requirements</h3>
          <p className="text-[#585f6c] leading-relaxed">We may disclose data if required to:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Comply with legal obligations</li>
            <li>Protect rights or safety</li>
            <li>Prevent fraud or misuse</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">8. THIRD-PARTY SERVICES</h2>
          <p className="text-[#585f6c] leading-relaxed">We use third-party providers to operate our platform:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li><strong>Razorpay</strong> — payment processing</li>
            <li><strong>Google Calendar API</strong> — event creation</li>
            <li><strong>Resend</strong> — email delivery</li>
            <li><strong>Upstash QStash</strong> — reminder scheduling</li>
            <li><strong>Google Analytics</strong> — usage analytics</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">These services process data only as necessary for their functionality.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">9. SECURITY OF YOUR PERSONAL DATA</h2>
          <p className="text-[#585f6c] leading-relaxed">We use reasonable security measures to protect your data. However, no method of transmission over the Internet is 100% secure.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">10. CHILDREN'S PRIVACY</h2>
          <p className="text-[#585f6c] leading-relaxed">Our Service is not intended for users under the age of 13.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">11. YOUR DATA RIGHTS</h2>
          <p className="text-[#585f6c] leading-relaxed">You may:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Request access to your data</li>
            <li>Request correction or deletion</li>
            <li>Contact us for any privacy concerns</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">We will respond within a reasonable timeframe.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">12. SERVICE PROVIDERS</h2>
          <p className="text-[#585f6c] leading-relaxed">Third-party service providers may access data only to perform tasks on our behalf and are obligated to protect it.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">13. LINKS TO OTHER SITES</h2>
          <p className="text-[#585f6c] leading-relaxed">We are not responsible for third-party websites linked from our platform.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">14. CHANGES TO THIS PRIVACY POLICY</h2>
          <p className="text-[#585f6c] leading-relaxed">We may update this policy periodically. Updates will be posted on this page.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">15. CONTACT US</h2>
          <p className="text-[#585f6c] leading-relaxed">
            If you have any questions:<br />
            📧 <a href="mailto:support@candidconversations.in" className="text-[#f5820a] hover:underline">support@candidconversations.in</a>
          </p>
        </section>
      </div>
    </main>
  );
}
