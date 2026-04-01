import Link from "next/link";
import Image from "next/image";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { HeroBookButton, CtaBookButton } from "@/components/layout/HeroBookButton";

/* ─────────────── tiny icon SVGs ─────────────── */
function ArrowIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6" stroke="#111" strokeWidth="1.4" />
      <path d="M16 16l3 3" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="#111" strokeWidth="1.4" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function MeetIcon() {
  return (
    <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="6" width="14" height="12" rx="2" stroke="#111" strokeWidth="1.4" />
      <path d="M16 10l6-3v10l-6-3" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon({ half = false }: { half?: boolean }) {
  return (
    <svg className="w-5 h-5" viewBox="0 0 20 20">
      <defs>
        {half && (
          <linearGradient id="half">
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#d1d5db" />
          </linearGradient>
        )}
      </defs>
      <path
        d="M10 1l2.4 6.6H19l-5.5 4 2.1 6.5L10 14.2l-5.6 3.9 2.1-6.5L1 7.6h6.6L10 1z"
        fill={half ? "url(#half)" : "#f59e0b"}
      />
    </svg>
  );
}

/* ─────────────── Mentor card (hero grid) ─────────────── */
function MentorCard({
  name,
  iit,
  rank,
  bg,
  initials,
}: {
  name: string;
  iit: string;
  rank: string;
  bg: string;
  initials: string;
}) {
  return (
    <div className="mentor-card">
      {/* avatar placeholder circle */}
      <div
        className="mentor-card__avatar"
        style={{ background: bg }}
      >
        <span className="mentor-card__initials">{initials}</span>
      </div>
      <div className="mentor-card__body">
        <p className="mentor-card__name">{name}</p>
        <p className="mentor-card__iit">{iit}</p>
        <p className="mentor-card__rank">{rank}</p>
      </div>
    </div>
  );
}

/* ─────────────── Step card (how it works) ─────────────── */
function StepCard({
  num,
  title,
  desc,
  icon,
}: {
  num: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="step-card">
      <span className="step-card__num">{num}</span>
      <div className="step-card__icon">{icon}</div>
      <h3 className="step-card__title">{title}</h3>
      <p className="step-card__desc">{desc}</p>
    </div>
  );
}

/* ─────────────── Testimonial card ─────────────── */
function TestimonialCard({
  name,
  rank,
  quote,
  stars,
  initials,
  bg,
}: {
  name: string;
  rank: string;
  quote: string;
  stars: number;
  initials: string;
  bg: string;
}) {
  return (
    <div className="testimonial-card">
      {/* Stars */}
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon key={i} half={i + 1 > Math.floor(stars) && stars % 1 !== 0} />
        ))}
      </div>
      <p className="testimonial-card__quote">&ldquo;{quote}&rdquo;</p>
      <div className="testimonial-card__footer">
        <div
          className="testimonial-card__avatar"
          style={{ background: bg }}
        >
          <span>{initials}</span>
        </div>
        <div>
          <p className="testimonial-card__name">{name}</p>
          <p className="testimonial-card__rank">{rank}</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const mentors = [
    { name: "Arjun Mehta",   iit: "IIT Bombay",  rank: "AIR 312",  bg: "linear-gradient(135deg,#fde68a,#f59e0b)", initials: "AM" },
    { name: "Priya Sharma",  iit: "IIT Madras",  rank: "AIR 156",  bg: "linear-gradient(135deg,#bfdbfe,#3b82f6)", initials: "PS" },
    { name: "Rohan Gupta",   iit: "IIT Delhi",   rank: "AIR 489",  bg: "linear-gradient(135deg,#bbf7d0,#22c55e)", initials: "RG" },
    { name: "Sneha Patel",   iit: "IIT Kharagpur",rank: "AIR 201", bg: "linear-gradient(135deg,#fecaca,#ef4444)", initials: "SP" },
    { name: "Vikram Nair",   iit: "IIT Roorkee", rank: "AIR 643",  bg: "linear-gradient(135deg,#e9d5ff,#a855f7)", initials: "VN" },
    { name: "Ananya Singh",  iit: "IIT Kanpur",  rank: "AIR 88",   bg: "linear-gradient(135deg,#fed7aa,#f97316)", initials: "AS" },
  ];

  const testimonials = [
    {
      name: "Rahul Krishnan",
      rank: "JEE Advanced 2025 — AIR 847",
      quote: "My mentor helped me fix my Physics strategy in just one session. I jumped from 60 to 95 marks in my next mock. Incredible value for 20 minutes.",
      stars: 4,
      initials: "RK",
      bg: "linear-gradient(135deg,#fde68a,#f59e0b)",
    },
    {
      name: "Simran Kaur",
      rank: "JEE Mains 2025 — 99.2%ile",
      quote: "I was stuck on Organic Chemistry for months. One call with my mentor from IIT Madras completely changed my approach. Cleared JEE Mains in the very next attempt!",
      stars: 5,
      initials: "SK",
      bg: "linear-gradient(135deg,#bfdbfe,#3b82f6)",
    },
    {
      name: "Devansh Tiwari",
      rank: "JEE Advanced 2025 — AIR 412",
      quote: "20 minutes felt like a masterclass. He told me exactly which chapters to prioritize and how to manage time in the exam. Should have booked this earlier.",
      stars: 5,
      initials: "DT",
      bg: "linear-gradient(135deg,#bbf7d0,#22c55e)",
    },
    {
      name: "Akanksha Roy",
      rank: "JEE Advanced 2024 — AIR 1204",
      quote: "My mentor helped me fix my Physics strategy in just one session. I jumped from 60 to 95 marks in my next mock. Incredible value for 20 minutes.",
      stars: 4,
      initials: "AR",
      bg: "linear-gradient(135deg,#fecaca,#ef4444)",
    },
  ];

  const tickerItems = [
    "100 + Mentors",
    "IIT Bombay, Madras & More",
    "20-Min focused calls",
    "TOP IIT Rankers",
    "Google Meet Sessions",
    "Verified IITians",
    "4.9 avg rating",
  ];

  return (
    <div className="landing">

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <PublicNavbar />

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section className="hero">
        {/* Left content */}
        <div className="hero__left">
          <h1 className="hero__headline">
            Talk to{" "}
            <span className="hero__headline--accent">IITians.</span>
            <br />
            Get Real JEE Guidance.
          </h1>
          <p className="hero__sub">
            1-on-1 mentorship. 20 minutes.
            <br />
            Focused, practical advice.
          </p>

          <div className="hero__actions">
            <HeroBookButton />
            <Link href="/mentors" className="hero__cta-secondary">
              Browse Mentors
            </Link>
          </div>

          {/* Stats row */}
          <div className="hero__stats">
            <div className="hero__avatars">
              {["AM","PS","RG","SK","VN"].map((init, i) => (
                <span key={i} className="hero__avatar-chip">{init}</span>
              ))}
            </div>
            <span className="hero__stat">100+ Mentors</span>
            <span className="hero__stat-sep">|</span>
            <span className="hero__stat">1,000+ Sessions</span>
            <span className="hero__stat-sep">|</span>
            <span className="hero__stat">
              ⭐ 4.9 avg rating
            </span>
          </div>
        </div>

        {/* Right: mentor card grid */}
        <div className="hero__right">
          <div className="hero__grid">
            {mentors.map((m) => (
              <MentorCard key={m.name} {...m} />
            ))}
          </div>
          {/* Fade on right edge only */}
          <div className="hero__fade hero__fade--right" />
        </div>
      </section>

      {/* ── TICKER ─────────────────────────────────────────────── */}
      <div className="ticker">
        <div className="ticker__track">
          {[...tickerItems, ...tickerItems].map((item, i) => (
            <span key={i} className="ticker__item">
              {item}
              <span className="ticker__dot" />
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="section">
        <p className="section__eyebrow">Simple Process</p>
        <h2 className="section__heading">How it works?</h2>
        <p className="section__sub">
          Get personalized JEE guidance in three simple steps.
          <br />
          No commitments, no subscriptions.
        </p>

        <div className="steps">
          <StepCard
            num="1"
            title="Choose a Mentor"
            desc="Browse verified IITians filtered by IIT, branch, rank, and specialization."
            icon={<SearchIcon />}
          />
          <StepCard
            num="2"
            title="Book A Slot"
            desc="Pick a convenient time from their availability. Pay securely online."
            icon={<CalendarIcon />}
          />
          <StepCard
            num="3"
            title="Attend Your Session"
            desc="Join a 20-min Google Meet call. Get personalized guidance."
            icon={<MeetIcon />}
          />
        </div>
      </section>

      {/* ── SUCCESS STORIES ────────────────────────────────────── */}
      <section className="section section--stories">
        <p className="section__eyebrow">Success Stories</p>
        <h2 className="section__heading">This is What 20 Minutes Can Do</h2>
        <p className="section__sub">Hear student testimonials about us</p>

        {/* Fades */}
        <div className="stories__fade stories__fade--left" />
        <div className="stories__wrap">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} {...t} />
          ))}
        </div>
        <div className="stories__fade stories__fade--right" />
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="cta-banner__gradient" />
        <div className="cta-banner__body">
          <h2 className="cta-banner__heading">
            Ready to talk to an{" "}
            <em className="cta-banner__heading--italic">IITian?</em>
          </h2>
          <p className="cta-banner__sub">
            Your session is 20 minutes of absolute focus on your career.
            <br />
            No generic motivation, just hard-hitting strategic advice.
          </p>
          <CtaBookButton />
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <PublicFooter />

    </div>
  );
}
