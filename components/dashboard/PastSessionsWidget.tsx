import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  completed: '✅ Completed',
  cancelled: '❌ Cancelled',
}

interface PastBooking {
  id:           string
  status:       string
  startTime:    string | null
  mentorName?:  string | null
  mentorIit?:   string | null
  studentName?: string | null
}

interface PastSessionsWidgetProps {
  bookings:  PastBooking[]
  isLoading: boolean
  isError:   boolean
  view: 'student' | 'mentor'
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

export function PastSessionsWidget({ bookings, isLoading, isError, view }: PastSessionsWidgetProps) {
  if (isLoading) {
    return (
      <section className="dashboard-widget" aria-busy="true">
        <h2 className="dashboard-widget__title">Past Sessions</h2>
        {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
      </section>
    )
  }

  if (isError) {
    return (
      <section className="dashboard-widget">
        <h2 className="dashboard-widget__title">Past Sessions</h2>
        <p className="dashboard-widget__error" role="alert">Failed to load sessions.</p>
      </section>
    )
  }

  return (
    <section className="dashboard-widget">
      <h2 className="dashboard-widget__title">Past Sessions</h2>

      {bookings.length === 0 ? (
        <div className="dashboard-widget__empty">
          {/* Fix 5: Contextual empty states */}
          {view === 'student' ? (
            <>
              <p>No past sessions yet.</p>
              <Link href="/mentors" className="dashboard-widget__cta">
                Book your first mentor session! →
              </Link>
            </>
          ) : (
            <p>No completed sessions yet.</p>
          )}
        </div>
      ) : (
        <>
          <ul className="session-list">
            {bookings.map((b) => {
              const person = view === 'student'
                ? b.mentorName ?? 'Mentor'
                : b.studentName ?? 'Student'

              const when = b.startTime
                ? new Date(b.startTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })
                : 'N/A'

              return (
                <li key={b.id} className="session-row session-row--past">
                  <span className="session-row__person">{person}</span>
                  <span className="session-row__time">{when}</span>
                  {/* Fix 4: Status badge */}
                  <span className={`session-row__badge session-row__badge--${b.status}`}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </li>
              )
            })}
          </ul>

          {/* Fix 3: View All CTA */}
          <div className="dashboard-widget__footer">
            <Link
              href={view === 'student' ? '/bookings' : '/mentor/bookings'}
              className="dashboard-widget__view-all"
            >
              View all sessions →
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
