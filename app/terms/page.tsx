import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | CandidConversations",
  description: "Terms of Service for CandidConversations",
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen bg-white text-[#1a1c1c] py-16 px-6 lg:px-8 max-w-4xl mx-auto selection:bg-[#f5820a] selection:text-white">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">TERMS OF SERVICE — CandidConversations</h1>
          <p className="text-[#585f6c] mt-2">Last Updated: [DATE]</p>
        </div>

        <hr className="border-[#e5e7eb]" />

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">1. Introduction</h2>
          <p className="text-[#585f6c] leading-relaxed">
            These Terms of Service ("Terms") govern your access to and use of the CandidConversations platform ("Service"), available at <a href="https://candidconversations.in" className="text-[#f5820a] hover:underline">https://candidconversations.in</a>.
          </p>
          <p className="text-[#585f6c] leading-relaxed">
            By using our Service, you agree to be bound by these Terms and our Privacy Policy.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">2. Service Overview</h2>
          <p className="text-[#585f6c] leading-relaxed">CandidConversations is a mentorship booking platform that allows users to:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Browse mentors</li>
            <li>Book one-on-one sessions</li>
            <li>Pay for sessions</li>
            <li>Attend scheduled meetings</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">We act as an intermediary connecting users and mentors.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">3. Eligibility</h2>
          <p className="text-[#585f6c] leading-relaxed">To use the Service, you must:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Be at least 18 years old, or</li>
            <li>Use the platform under supervision of a legal guardian</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">4. User Accounts</h2>
          <p className="text-[#585f6c] leading-relaxed">You are responsible for:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Providing accurate information</li>
            <li>Maintaining account security</li>
            <li>All activity under your account</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">We may suspend or terminate accounts for misuse.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">5. Booking and Payments</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>All sessions must be paid in advance</li>
            <li>A session is confirmed only after successful payment</li>
            <li>Payments are processed securely via Razorpay</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">We do not store your card or banking details.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">6. Cancellation and Refunds</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Full refund allowed if cancelled at least <strong>24 hours before the session</strong></li>
            <li>No refunds for:
              <ul className="list-circle pl-5 mt-2 space-y-1">
                <li>Late cancellations</li>
                <li>Missed sessions (no-shows)</li>
              </ul>
            </li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed mt-4">Refunds are processed through the original payment method.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">7. Rescheduling</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Rescheduling is subject to mentor availability</li>
            <li>Users must follow platform rules and time constraints</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">8. Session Responsibility</h2>
          
          <h3 className="text-xl font-semibold mt-4">Users must:</h3>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Join sessions on time</li>
            <li>Maintain respectful behavior</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6">Mentors must:</h3>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Honor scheduled sessions</li>
            <li>Maintain professional conduct</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">9. Platform Role and Disclaimer</h2>
          <p className="text-[#585f6c] leading-relaxed">CandidConversations:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Acts only as a platform connecting users and mentors</li>
            <li>Does not guarantee outcomes from sessions</li>
            <li>Is not responsible for advice given during sessions</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">10. Meeting Links and Scheduling</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Meeting links are generated automatically</li>
            <li>Users are responsible for joining sessions on time</li>
            <li>Technical issues beyond our control may occur</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">11. Acceptable Use</h2>
          <p className="text-[#585f6c] leading-relaxed">You agree NOT to:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Use the platform for illegal purposes</li>
            <li>Harass or abuse other users</li>
            <li>Attempt to disrupt or hack the system</li>
            <li>Misrepresent identity</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">Violation may result in account suspension.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">12. Intellectual Property</h2>
          <p className="text-[#585f6c] leading-relaxed">All platform content (design, branding, code) belongs to CandidConversations.</p>
          <p className="text-[#585f6c] leading-relaxed">You may not copy, distribute, or misuse platform content.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">13. Third-Party Services</h2>
          <p className="text-[#585f6c] leading-relaxed">We rely on third-party services including:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Razorpay (payments)</li>
            <li>Google Calendar / Meet (scheduling)</li>
            <li>Resend (emails)</li>
          </ul>
          <p className="text-[#585f6c] leading-relaxed">We are not responsible for failures or issues caused by these services.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">14. Limitation of Liability</h2>
          <p className="text-[#585f6c] leading-relaxed">To the maximum extent permitted by law, CandidConversations is not liable for:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Indirect or consequential damages</li>
            <li>Losses arising from mentorship advice</li>
            <li>Missed sessions due to user error</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">15. Termination</h2>
          <p className="text-[#585f6c] leading-relaxed">We may suspend or terminate access if:</p>
          <ul className="list-disc pl-5 space-y-2 text-[#585f6c]">
            <li>Terms are violated</li>
            <li>Platform misuse is detected</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">16. Changes to Terms</h2>
          <p className="text-[#585f6c] leading-relaxed">We may update these Terms at any time. Continued use of the platform constitutes acceptance of changes.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">17. Governing Law</h2>
          <p className="text-[#585f6c] leading-relaxed">These Terms are governed by the laws of India.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">18. Contact</h2>
          <p className="text-[#585f6c] leading-relaxed">
            For any questions:<br />
            📧 <a href="mailto:support@candidconversations.in" className="text-[#f5820a] hover:underline">support@candidconversations.in</a>
          </p>
        </section>
      </div>
    </main>
  );
}
