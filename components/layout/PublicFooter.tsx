import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        {/* Brand */}
        <div className="footer__brand">
          <p className="footer__logo">CandidConversation</p>
          <p className="footer__tagline">
            1-on-1 mentorship from IITians.
            <br />
            20 minutes of focused, practical guidance to help you crack JEE.
          </p>
        </div>

        {/* Links */}
        <div className="footer__col">
          <p className="footer__col-title">Platform</p>
          <ul className="footer__links">
            <li><Link href="/mentors">Find Mentors</Link></li>
            <li><Link href="/#how-it-works">How It Works</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <p className="footer__col-title">Company</p>
          <ul className="footer__links">
            <li><Link href="/about">About</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/careers">Careers</Link></li>
          </ul>
        </div>

        <div className="footer__col">
          <p className="footer__col-title">Legal</p>
          <ul className="footer__links">
            <li><Link href="/privacy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms of Service</Link></li>
            <li><Link href="/refunds">Refund Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer__copy">
        <p>© 2026 CandidConversation. All rights reserved.</p>
      </div>
    </footer>
  );
}
