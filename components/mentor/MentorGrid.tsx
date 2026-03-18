import { MentorCard } from './MentorCard'
import { MentorCardSkeleton } from './MentorCardSkeleton'

interface MentorData {
  id:           string
  iit:          string
  branch:       string
  year:         number
  languages:    string[]
  bio:          string
  profileImage: string | null
  user:         { name: string | null; image: string | null }
}

interface MentorGridProps {
  mentors:   MentorData[]
  isLoading: boolean
  isError:   boolean
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number
}

export function MentorGrid({
  mentors,
  isLoading,
  isError,
  skeletonCount = 9,
}: MentorGridProps) {
  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="mentor-grid" aria-busy="true" aria-label="Loading mentors">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MentorCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="mentor-grid__state mentor-grid__state--error" role="alert">
        <p>⚠️ Failed to load mentors. Please try again.</p>
      </div>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (mentors.length === 0) {
    return (
      <div className="mentor-grid__state mentor-grid__state--empty">
        <p>🔍 No mentors found. Try adjusting your filters.</p>
      </div>
    )
  }

  // ── Populated ────────────────────────────────────────────────────────────────
  return (
    <div className="mentor-grid">
      {mentors.map((mentor) => (
        <MentorCard key={mentor.id} mentor={mentor} />
      ))}
    </div>
  )
}
