import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Dashboard — IIT Mentor Connect',
}

// ── Status badge colours ─────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  payment_pending:  'status--pending',
  payment_complete: 'status--processing',
  scheduled:        'status--scheduled',
  completed:        'status--completed',
  cancelled:        'status--cancelled',
}

const STATUS_LABELS: Record<string, string> = {
  payment_pending:  'Awaiting Payment',
  payment_complete: 'Payment Received',
  scheduled:        'Scheduled',
  completed:        'Completed',
  cancelled:        'Cancelled',
}

function formatDate(date: Date | null): string {
  if (!date) return '—'
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/')

  const bookings = await prisma.booking.findMany({
    where:   { studentId: session.user.id },
    include: {
      mentor: {
        include: {
          user: { select: { name: true, image: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // ── Split into upcoming / past ─────────────────────────────────────────────
  const upcoming = bookings.filter(
    (b) => !['completed', 'cancelled'].includes(b.status)
  )
  const past = bookings.filter(
    (b) => ['completed', 'cancelled'].includes(b.status)
  )

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = [
    { label: 'Total Bookings', value: bookings.length },
    { label: 'Upcoming / Active', value: upcoming.length },
    { label: 'Completed', value: bookings.filter((b) => b.status === 'completed').length },
  ]

  return (
    <main className="dashboard-page">

      {/* Header */}
      <div className="dashboard-page__header">
        <h1 className="dashboard-page__title">My Dashboard</h1>
        <p className="dashboard-page__subtitle">
          Welcome back, {session.user.name ?? 'Student'} 👋
        </p>
      </div>

      {/* Stats row */}
      <div className="dashboard-stats">
        {stats.map((s) => (
          <div key={s.label} className="dashboard-stats__card">
            <span className="dashboard-stats__value">{s.value}</span>
            <span className="dashboard-stats__label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Upcoming / Active bookings */}
      <section className="dashboard-section">
        <h2 className="dashboard-section__title">Upcoming &amp; Active Sessions</h2>

        {upcoming.length === 0 ? (
          <div className="dashboard-empty">
            <p>No active sessions yet.</p>
            <Link href="/mentors" className="dashboard-empty__cta">
              Browse mentors →
            </Link>
          </div>
        ) : (
          <div className="booking-list">
            {upcoming.map((b) => (
              <div key={b.id} className="booking-card">
                <div className="booking-card__left">
                  {b.mentor.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={b.mentor.user.image}
                      alt={b.mentor.user.name ?? 'Mentor'}
                      className="booking-card__avatar"
                      width={48}
                      height={48}
                    />
                  )}
                  <div className="booking-card__info">
                    <p className="booking-card__name">
                      {b.mentor.user.name ?? 'IIT Mentor'}
                    </p>
                    <p className="booking-card__meta">
                      {b.mentor.iit} · {b.mentor.branch} · Year {b.mentor.year}
                    </p>
                    <p className="booking-card__date">
                      Booked on {formatDate(b.createdAt)}
                    </p>
                    {b.startTime && (
                      <p className="booking-card__session-time">
                        📅 Session: {formatDate(b.startTime)}
                      </p>
                    )}
                    {b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="booking-card__join-link"
                      >
                        Join Google Meet →
                      </a>
                    )}
                  </div>
                </div>
                <span className={`booking-card__status ${STATUS_STYLES[b.status] ?? ''}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Past bookings */}
      {past.length > 0 && (
        <section className="dashboard-section">
          <h2 className="dashboard-section__title">Past Sessions</h2>
          <div className="booking-list booking-list--past">
            {past.map((b) => (
              <div key={b.id} className="booking-card booking-card--muted">
                <div className="booking-card__left">
                  <div className="booking-card__info">
                    <p className="booking-card__name">
                      {b.mentor.user.name ?? 'IIT Mentor'}
                    </p>
                    <p className="booking-card__meta">
                      {b.mentor.iit} · {b.mentor.branch}
                    </p>
                    <p className="booking-card__date">
                      {formatDate(b.startTime ?? b.createdAt)}
                    </p>
                  </div>
                </div>
                <span className={`booking-card__status ${STATUS_STYLES[b.status] ?? ''}`}>
                  {STATUS_LABELS[b.status] ?? b.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* First-time empty state (no bookings at all) */}
      {bookings.length === 0 && (
        <div className="dashboard-empty dashboard-empty--center">
          <p className="dashboard-empty__heading">No sessions yet</p>
          <p className="dashboard-empty__body">
            Browse IIT mentors and book your first 1:1 session for ₹150.
          </p>
          <Link href="/mentors" className="dashboard-empty__cta">
            Book your first mentor session →
          </Link>
        </div>
      )}

    </main>
  )
}
