import { motion, LayoutGroup } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MentorCard } from './MentorCard'
import { MentorCardSkeleton } from './MentorCardSkeleton'

interface MentorData {
  id:           string
  slug:         string | null
  iit:          string
  branch:       string
  year:         number
  languages:    string[]
  bio:          string
  profileImage: string | null
  user:         { name: string | null; image: string | null }
  bookings?:    { review: string | null; rating: number | null; updatedAt: Date; student: { name: string | null } }[]
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
  const router = useRouter()

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true" aria-label="Loading mentors">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <MentorCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" role="alert">
        <p className="text-[#ef4444] font-medium text-lg">⚠️ Failed to load mentors. Please try again.</p>
      </div>
    )
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (mentors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-[#f1f5f9] rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <h3 className="text-xl font-semibold text-[#0f172a] mb-2 font-['Inter']">No mentors found</h3>
        <p className="text-[#64748b] text-base font-['Inter'] max-w-sm">
          We couldn't find any mentors matching your current filters. Try adjusting them or clear all filters.
        </p>
      </div>
    )
  }

  // ── Populated ────────────────────────────────────────────────────────────────
  return (
    <LayoutGroup id="mentor-profile-group">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {mentors.map((mentor) => (
          <MentorCard 
            key={mentor.id} 
            mentor={mentor} 
            onSelect={() => {
              router.push(`/mentors/${mentor.slug ?? mentor.id}`)
            }} 
          />
        ))}
      </div>
    </LayoutGroup>
  )
}
