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
  "IIT Kharagpur", "IIT Bombay", "IIT Madras", "IIT Kanpur", "IIT Delhi", "IIT Guwahati", "IIT Roorkee", "IIT Bhubaneswar", "IIT Gandhinagar", "IIT Hyderabad", "IIT Jodhpur", "IIT Patna", "IIT Ropar", "IIT Indore", "IIT Mandi", "IIT (BHU) Varanasi", "IIT Palakkad", "IIT Tirupati", "IIT Dhanbad", "IIT Bhilai", "IIT Goa", "IIT Jammu", "IIT Dharwad", "NIT Trichy", "NIT Surathkal", "NIT Warangal", "NIT Calicut", "NIT Rourkela", "VNIT Nagpur", "NIT Durgapur", "NIT Silchar", "NIT Hamirpur", "NIT Jamshedpur", "NIT Kurukshetra", "NIT Allahabad", "NIT Bhopal", "NIT Jaipur", "NIT Raipur", "NIT Agartala", "NIT Srinagar", "NIT Patna", "NIT Delhi", "NIT Goa", "NIT Puducherry", "NIT Arunachal Pradesh", "NIT Sikkim", "NIT Meghalaya", "NIT Mizoram", "NIT Manipur", "NIT Nagaland", "NIT Uttarakhand", "NIT Andhra Pradesh", "NIT Jalandhar"
];
const COURSES = [
  "Aerospace Engineering", "Agricultural Engineering", "Agricultural and Food Engineering", "Artificial Intelligence", "Artificial Intelligence and Data Science", "Biological Engineering", "Biotechnology", "Ceramic Engineering", "Chemical Engineering", "Chemistry (Engineering Chemistry)", "Civil Engineering", "Computer Science and Engineering", "Data Science and Engineering", "Electrical and Electronics Engineering", "Electrical Engineering", "Electrical Engineering (Power and Automation)", "Electronics and Communication Engineering", "Electronics and Instrumentation Engineering", "Electronics and VLSI Engineering", "Engineering Physics", "Engineering Science", "Environmental Engineering", "Environmental Science and Engineering", "Food Engineering and Technology", "Geological Technology", "Geophysical Technology", "Industrial and Production Engineering", "Industrial Engineering", "Information Technology", "Instrumentation Engineering", "Instrumentation and Control Engineering", "Manufacturing Engineering", "Manufacturing Science and Engineering", "Materials Science and Engineering", "Mathematics and Computing", "Mechanical Engineering", "Metallurgical Engineering", "Metallurgical and Materials Engineering", "Mining Engineering", "Mineral Engineering", "Naval Architecture and Ocean Engineering", "Ocean Engineering", "Petroleum Engineering", "Production Engineering", "Production and Industrial Engineering", "Textile Engineering", "Textile Technology"
];
const ACADEMIC_YEARS = ["1st", "2nd", "3rd", "4th", "5th"];
const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi (NCT of Delhi)", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];
const VERNACULAR_LANGUAGES = [
  "Assamese", "Bengali", "Bodo", "Dogri", "Gujarati", "Hindi", "Kannada", "Kashmiri", "Konkani", "Maithili", "Malayalam", "Manipuri (Meitei)", "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu"
];
const JEE_YEARS = Array.from({ length: 12 }, (_, i) => String(new Date().getFullYear() + 1 - i));

/* ════ COMPONENT ════════════════════════════════════════════ */
export default function BecomeAMentorPage() {
  const { data: session } = useSession();

  const [fullName, setFullName] = useState("");
  const [iit, setIit]           = useState("IIT Kharagpur");
  const [branch, setBranch]     = useState("Computer Science and Engineering");
  const [academicYear, setAcademicYear] = useState("1st");
  const [jeeYear, setJeeYear]   = useState(JEE_YEARS[0]);
  const [rank, setRank]         = useState("");
  const [state, setState]       = useState("Maharashtra");
  const [bio, setBio]           = useState("");
  const [calendly, setCalendly] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [langs, setLangs]       = useState<string[]>([]);
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

  const toggleLang = (l: string) => {
    setLangs(prev => 
      prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]
    );
  };

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
          year: `${academicYear} Year, JEE ${jeeYear}`,
          rank: rank.trim(),
          state: state.trim(),
          languages: langs.join(", "),
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
                Thanks! We&rsquo;ll verify your credentials and get back to you within 24 hours.
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

                {/* Row: IIT + Course */}
                <div className="bam-grid-2">
                  <div className="bam-field">
                    <label className="bam-label">College</label>
                    <div className="bam-select-wrap">
                      <select
                        className="bam-select"
                        value={iit}
                        onChange={e => setIit(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select College</option>
                        {IITS.map(i => <option key={i} value={i}>{i}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                  <div className="bam-field">
                    <label className="bam-label">Course</label>
                    <div className="bam-select-wrap">
                      <select
                        className="bam-select"
                        value={branch}
                        onChange={e => setBranch(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select Course</option>
                        {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                </div>

                {/* Row: Academic Year + JEE Year + AIR Rank */}
                <div className="bam-grid-2">
                  <div className="bam-field">
                    <label className="bam-label">Academic Year</label>
                    <div className="bam-select-wrap">
                      <select
                        className="bam-select"
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select Year</option>
                        {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                  <div className="bam-field">
                    <label className="bam-label">JEE Attempt Year</label>
                    <div className="bam-select-wrap">
                      <select
                        className="bam-select"
                        value={jeeYear}
                        onChange={e => setJeeYear(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select Year</option>
                        {JEE_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                </div>

                {/* Row: AIR Rank + Native State */}
                <div className="bam-grid-2">
                  <div className="bam-field">
                    <label className="bam-label">AIR Rank</label>
                    <input
                      className="bam-input"
                      placeholder="Enter Rank"
                      value={rank}
                      onChange={e => setRank(e.target.value)}
                    />
                  </div>
                  <div className="bam-field">
                    <label className="bam-label">Native State / UT</label>
                    <div className="bam-select-wrap">
                      <select
                        className="bam-select"
                        value={state}
                        onChange={e => setState(e.target.value)}
                        required
                      >
                        <option value="" disabled>Select State / UT</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown />
                    </div>
                  </div>
                </div>

                {/* Languages */}
                <div className="bam-field">
                  <label className="bam-label">Vernacular Language</label>
                  <div className="bam-lang-row">
                    {VERNACULAR_LANGUAGES.map(l => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleLang(l)}
                        className={`bam-lang-pill ${langs.includes(l) ? 'bam-lang-pill--active' : ''}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
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


    </div>
  );
}
