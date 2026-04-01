"use client";

import "./apply.css";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

/* ─── tiny SVG helpers ─────────────────────────────────── */
function ArrowIcon() {
  return (
    <svg width="19" height="16" viewBox="0 0 19 16" fill="none">
      <path d="M1 8h17M11 1l7 7-7 7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 6l4 4 4-4" stroke="#191c1d" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* Step icons */
function SubmitIcon() {
  return (
    <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
      <rect x="1" y="1" width="14" height="18" rx="2" stroke="#f5820a" strokeWidth="1.4" />
      <path d="M4 6h8M4 10h8M4 14h5" stroke="#f5820a" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function VerifyIcon() {
  return (
    <svg width="22" height="21" viewBox="0 0 22 21" fill="none">
      <path d="M11 1l2.4 6.6H20l-5.5 4 2.1 6.5L11 14.2l-5.6 3.9 2.1-6.5L2 7.6h6.6L11 1z" fill="#f5820a" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg width="20" height="21" viewBox="0 0 20 21" fill="none">
      <path d="M10 1C10 1 15 4 15 10c0 3-1.5 5.5-5 7-3.5-1.5-5-4-5-7 0-6 5-9 5-9z" stroke="#f5820a" strokeWidth="1.4" />
      <circle cx="10" cy="9" r="2" stroke="#f5820a" strokeWidth="1.4" />
      <path d="M7 16l-2 3M13 16l2 3" stroke="#f5820a" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/* Benefit icons */
function ClockIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 25 25" fill="none">
      <circle cx="12.5" cy="12.5" r="10" stroke="#f5820a" strokeWidth="1.5" />
      <path d="M12.5 7v6l4 2" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HandIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 3v10M9 7l4-4 4 4" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13c0-2 1.5-3.5 3.5-3.5S12 11 12 13v6a5 5 0 0010 0v-4" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="20" height="25" viewBox="0 0 20 25" fill="none">
      <path d="M11 1L1 14h9l-1 10 10-13h-9l1-10z" stroke="#f5820a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ════ CONSTANTS ════════════════════════════════════════════ */
const IITS = [
  "IIT Bombay","IIT Delhi","IIT Madras","IIT Kanpur","IIT Kharagpur",
  "IIT Roorkee","IIT Guwahati","IIT Hyderabad","IIT BHU","IIT Indore",
  "IIT Jodhpur","IIT Mandi","IIT Patna","IIT Tirupati",
];

/* ════ COMPONENT ════════════════════════════════════════════ */
export default function BecomeAMentorPage() {
  const { data: session } = useSession();

  const [fullName, setFullName] = useState("");
  const [iit, setIit]           = useState("IIT Bombay");
  const [branch, setBranch]     = useState("");
  const [year, setYear]         = useState("");
  const [rank, setRank]         = useState("");
  const [state, setState]       = useState("");
  const [bio, setBio]           = useState("");
  const [calendly, setCalendly] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [langs, setLangs]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  
  const [scrollingDown, setScrollingDown] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (session?.user?.name && !fullName) {
      setFullName(session.user.name);
    }
  }, [session, fullName]);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 100) {
        setScrollingDown(true);
      } else if (window.scrollY < lastScrollY) {
        setScrollingDown(false);
      }
      lastScrollY = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch('/api/mentors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          iit: iit.trim(),
          branch: branch.trim(),
          year: year.trim(),
          rank: rank.trim(),
          state: state.trim(),
          languages: langs.trim(),
          bio: bio.trim(),
          calendlyLink: calendly.trim(),
          collegeIdUrl: collegeId.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Something went wrong');
        setSubmitting(false);
        return;
      }

      setSubmitting(false);
      setSubmitted(true);
    } catch {
      setErrorMsg('Network error. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="bam-page">

      {/* ── NAVBAR (same as landing) ─────────────────────── */}
      <header className="navbar" style={{ transform: scrollingDown ? "translateY(-100%)" : "translateY(0)", transition: "transform 0.3s ease", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="navbar__inner">
          <Link href="/" className="navbar__logo">MentorJEE</Link>
          <nav className="navbar__links">
            <Link href="/mentors"         className="navbar__link">Find Mentors</Link>
            <Link href="/#how-it-works"   className="navbar__link">How It Works</Link>
            <Link href="/apply" className="navbar__link navbar__link--active">Become a Mentor</Link>
          </nav>
          <Link href="/signin" className="btn-primary">
            Book a Session
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </header>

      {/* ── APPLICATION FORM ────────────────────────────── */}
      <section className="bam-section bam-form-section">
        <div className="bam-container">
          <div className="bam-form-heading" style={{ textAlign: "center", margin: "0 auto" }}>
            <h1 className="bam-h1">Apply to Become a Mentor</h1>
          </div>

          {submitted ? (
            <div className="bam-card bam-success">
              <div className="bam-success__icon">✓</div>
              <h2 className="bam-success__title">Application Submitted!</h2>
              <p className="bam-success__body">
                Thanks! We&rsquo;ll verify your IIT credentials and get back to you within 24 hours.
              </p>
              <Link href="/" className="bam-submit-btn" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 0 }}>
                Back to Home
              </Link>
            </div>
          ) : (
            <div className="bam-card">
              <form className="bam-form" onSubmit={handleSubmit} noValidate>

                {errorMsg && (
                  <div className="bam-card" style={{ padding: "16px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: "8px", marginBottom: "24px", textAlign: "center" }}>
                    {errorMsg}
                  </div>
                )}

                {/* Full Name */}
                <div className="bam-field">
                  <label className="bam-label">Full Name</label>
                  <input
                    className="bam-input"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>

                {/* Row: IIT + Branch */}
                <div className="bam-grid-2">
                  <div className="bam-field">
                    <label className="bam-label">IIT</label>
                    <div className="bam-select-wrap">
                      <select
                        className="bam-select"
                        value={iit}
                        onChange={e => setIit(e.target.value)}
                        required
                      >
                        {IITS.map(i => <option key={i}>{i}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                  <div className="bam-field">
                    <label className="bam-label">Branch</label>
                    <input
                      className="bam-input"
                      placeholder="e.g. CSE"
                      value={branch}
                      onChange={e => setBranch(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Row: Year + AIR Rank */}
                <div className="bam-grid-2">
                  <div className="bam-field">
                    <label className="bam-label">Year</label>
                    <input
                      className="bam-input"
                      placeholder="JEE Year"
                      value={year}
                      onChange={e => setYear(e.target.value)}
                      required
                    />
                  </div>
                  <div className="bam-field">
                    <label className="bam-label">AIR Rank</label>
                    <input
                      className="bam-input"
                      placeholder="Enter Rank"
                      value={rank}
                      onChange={e => setRank(e.target.value)}
                    />
                  </div>
                </div>

                {/* Native State */}
                <div className="bam-field">
                  <label className="bam-label">Native State</label>
                  <input
                    className="bam-input"
                    placeholder="Your home state"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    required
                  />
                </div>

                {/* Languages */}
                <div className="bam-field">
                  <label className="bam-label">Languages</label>
                  <input
                    className="bam-input"
                    placeholder="e.g. English, Hindi, Telugu (comma-separated)"
                    value={langs}
                    onChange={e => setLangs(e.target.value)}
                    required
                  />
                </div>

                {/* Bio */}
                <div className="bam-field">
                  <label className="bam-label">Bio</label>
                  <textarea
                    className="bam-textarea"
                    placeholder="Tell us about your journey and how you can help..."
                    rows={4}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    required
                  />
                </div>

                {/* Calendly Link */}
                <div className="bam-field">
                  <label className="bam-label">Calendly Link</label>
                  <input
                    className="bam-input"
                    placeholder="calendly.com/your-profile"
                    value={calendly}
                    onChange={e => setCalendly(e.target.value)}
                    required
                  />
                </div>

                {/* College ID URL */}
                <div className="bam-field">
                  <label className="bam-label">College ID URL</label>
                  <input
                    className="bam-input"
                    placeholder="Link to ID card image (Drive/Link)"
                    value={collegeId}
                    onChange={e => setCollegeId(e.target.value)}
                    required
                  />
                </div>

                {/* Submit */}
                <div className="bam-submit-wrap">
                  <button
                    type="submit"
                    className="bam-submit-btn"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting…" : "Submit Application"}
                    <ArrowIcon />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* ── WHAT HAPPENS NEXT ───────────────────────────── */}
      <section className="bam-section bam-next-section">
        <h2 className="bam-h2">What Happens Next</h2>

        <div className="bam-timeline-wrap">
          {/* Horizontal connector line */}
          <div className="bam-timeline-line" />

          <div className="bam-timeline">
            {[
              { icon: <SubmitIcon />, title: "You submit",  desc: "Fill the application form with your IIT credentials and bio." },
              { icon: <VerifyIcon />, title: "We verify",   desc: "Our team validates your IIT ID and rank within 24 hours." },
              { icon: <RocketIcon />, title: "Go live",     desc: "Start receiving booking requests directly to your inbox." },
            ].map(step => (
              <div key={step.title} className="bam-step">
                <div className="bam-step__icon-wrap">
                  <div className="bam-step__circle">{step.icon}</div>
                </div>
                <p className="bam-step__title">{step.title}</p>
                <p className="bam-step__desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFIT CARDS ───────────────────────────────── */}
      <section className="bam-section bam-benefits-section">
        <div className="bam-benefits">
          {[
            {
              icon: <ClockIcon />,
              title: "Earn on Your Schedule",
              desc: "You decide when you're available. Block dates for exams or holidays in one click.",
            },
            {
              icon: <HandIcon />,
              title: "Give Back",
              desc: "Help juniors avoid the mistakes you made. Be the guide you wish you had during prep.",
            },
            {
              icon: <BoltIcon />,
              title: "Quick Setup",
              desc: "Apply in 5 minutes. Get verified within 24 hours and start hosting your first sessions.",
            },
          ].map(card => (
            <div key={card.title} className="bam-benefit-card">
              <div className="bam-benefit-card__icon">{card.icon}</div>
              <h3 className="bam-benefit-card__title">{card.title}</h3>
              <p className="bam-benefit-card__desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER (same as landing) ─────────────────────── */}
      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <p className="footer__logo">MentorJEE</p>
            <p className="footer__tagline">
              1-on-1 mentorship from IITians.<br />
              20 minutes of focused, practical guidance to help you crack JEE.
            </p>
          </div>
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
          <p>© 2026 MentorJEE. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
