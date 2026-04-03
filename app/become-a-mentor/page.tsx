import Link from "next/link";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
// Ensure we're using the standard CSS
import "@/app/(mentor)/apply/apply.css"; 

export default function BecomeAMentorInfoPage() {
  return (
    <div className="bam-page">
      <PublicNavbar />

      <main className="bam-section bam-form-section" style={{ minHeight: 'calc(100vh - 150px)', display: 'flex', alignItems: 'center' }}>
        <div className="bam-container" style={{ textAlign: "center" }}>
          
          <div className="bam-card" style={{ padding: "64px 48px", maxWidth: "800px", margin: "0 auto", textAlign: 'left' }}>
            <h1 className="bam-h1" style={{ marginBottom: "24px", fontSize: "40px", lineHeight: '1.2' }}>
              Be the Voice You Wish You Had
            </h1>
            
            <div style={{ fontFamily: "var(--font-manrope, 'Manrope', sans-serif)", fontSize: "18px", color: "#475569", lineHeight: "1.8", display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <p>
                Join a platform where your real college experience helps aspirants make one of the most important decisions of their life.
              </p>
              
              <p>
                As a connector, you'll have simple 1-on-1 conversations with students, sharing what your college, course, and journey actually look like — beyond rankings and cutoffs.
              </p>
              
              <p>
                This is not mentoring or structured guidance. You're not expected to teach, solve doubts, or create study plans. It's simply honest, experience-based conversations that help students understand what a college truly offers and decide whether it's the right fit for them.
              </p>
              
              <p>
                Choose your availability, have meaningful interactions, and earn for your time — all while building your personal brand.
              </p>
            </div>

            <div style={{ marginTop: "48px" }}>
              <Link href="/apply" className="bam-submit-btn" style={{ textDecoration: 'none', display: 'inline-flex' }}>
                Apply as a Mentor
                <svg width="19" height="16" viewBox="0 0 19 16" fill="none" style={{ marginLeft: "8px" }}>
                  <path d="M1 8h17M11 1l7 7-7 7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
