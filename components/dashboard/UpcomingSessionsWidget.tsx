import Link from 'next/link'

// Status badge config
const STATUS_LABEL: Record<string, string> = {
  scheduled:        '📅 Scheduled',
  payment_complete: '💳 Paid — Awaiting Slot',
  payment_pending:  '⏳ Payment Pending',
  completed:        '✅ Completed',
  cancelled:        '❌ Cancelled',
}

interface SessionBooking {
  id:          string
  status:      string
  startTime:   string | null
  meetingLink: string | null
  /** Mentor name — for student widget */
  mentorName?: string | null
  mentorIit?:  string | null
  /** Student name — for mentor widget */
  studentName?: string | null
}

interface UpcomingSessionsWidgetProps {
  bookings:  SessionBooking[]
  isLoading: boolean
  isError:   boolean
  /** 'student' shows mentor info; 'mentor' shows student info */
  view: 'student' | 'mentor'
  /** Calendly URL base for mentor view to share */
  calendlyBase?: string
}

function SkeletonRow() {
  return (
    <div className="session-row session-row--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--text" style={{ width: '40%', height: 14 }} />
      <div className="skeleton skeleton--text" style={{ width: '25%', height: 14 }} />
      <div className="skeleton skeleton--text" style={{ width: '20%', height: 20 }} />
    </div>
  )
}

export function UpcomingSessionsWidget({
  bookings, isLoading, isError, view,
}: UpcomingSessionsWidgetProps) {
  if (isLoading) {
    return (
      <section className="dashboard-widget" aria-busy="true">
        <h2 className="dashboard-widget__title">Upcoming Sessions</h2>
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </section>
    )
  }

  if (isError) {
    return (
      <section className="dashboard-widget">
        <h2 className="dashboard-widget__title">Upcoming Sessions</h2>
        <p className="dashboard-widget__error" role="alert">Failed to load sessions.</p>
      </section>
    )
  }

  return (
    <section className="dashboard-widget">
      <h2 className="dashboard-widget__title">Upcoming Sessions</h2>

      {bookings.length === 0 ? (
        <div className="dashboard-widget__empty">
          <p>No upcoming sessions yet.</p>
          {view === 'student' && (
            <Link href="/mentors" className="dashboard-widget__cta">
              Book your first mentor session! →
            </Link>
          )}
          {view === 'mentor' && (
            <p className="dashboard-widget__hint">Students will appear here once they book a session.</p>
          )}
        </div>
      ) : (
        <ul className="session-list">
          {bookings.map((b) => {
            const person = view === 'student'
              ? b.mentorName ?? 'Mentor'
              : b.studentName ?? 'Student'

            const when = b.startTime
              ? new Date(b.startTime).toLocaleString('en-IN', {
                  dateStyle: 'medium', timeStyle: 'short',
                })
              : 'Time TBD'

            return (
              <li key={b.id} className="session-row">
                <span className="session-row__person">{person}</span>
                <span className="session-row__time">{when}</span>
                <span className={`session-row__badge session-row__badge--${b.status}`}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
                {b.meetingLink && (
                  <a
                    href={b.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="session-row__join"
                    aria-label={`Join session with ${person}`}
                  >
                    Join →
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Fix 3: View All CTA — only shown when there are results */}
      {bookings.length > 0 && (
        <div className="dashboard-widget__footer">
          <Link
            href={view === 'student' ? '/bookings' : '/mentor/bookings'}
            className="dashboard-widget__view-all"
          >
            View all sessions →
          </Link>
        </div>
      )}
    </section>
  )
}
