/**
 * Pulse-skeleton placeholder for a MentorCard while data is loading.
 * Matches the MentorCard layout structure so the grid doesn't shift on paint.
 */
export function MentorCardSkeleton() {
  return (
    <div className="mentor-card mentor-card--skeleton" aria-hidden="true">
      {/* Avatar placeholder */}
      <div className="mentor-card__avatar-wrap">
        <div className="skeleton skeleton--circle" style={{ width: 64, height: 64 }} />
      </div>

      {/* Body placeholders */}
      <div className="mentor-card__body">
        <div className="skeleton skeleton--text" style={{ width: '55%', height: 16, marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div className="skeleton skeleton--text" style={{ width: 90,  height: 20 }} />
          <div className="skeleton skeleton--text" style={{ width: 70,  height: 20 }} />
          <div className="skeleton skeleton--text" style={{ width: 60,  height: 20 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div className="skeleton skeleton--text" style={{ width: 50, height: 18 }} />
          <div className="skeleton skeleton--text" style={{ width: 50, height: 18 }} />
        </div>
        <div className="skeleton skeleton--text" style={{ width: '100%', height: 12, marginBottom: 6 }} />
        <div className="skeleton skeleton--text" style={{ width: '80%',  height: 12 }} />
      </div>
    </div>
  )
}
