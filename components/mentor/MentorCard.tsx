'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'

interface MentorCardProps {
  mentor: {
    id:           string
    slug:         string | null
    iit:          string
    branch:       string
    year:         number
    languages:    string[]
    bio:          string
    calendlyLink?: string | null
    profileImage: string | null
    user:         { name: string | null; image: string | null }
  }
  onSelect: () => void
}

const YEAR_LABEL: Record<number, string> = {
  1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year',
}

export function MentorCard({ mentor, onSelect }: MentorCardProps) {
  const router      = useRouter()
  const displayName = mentor.user.name ?? 'IIT Mentor'
  const avatarSrc   = mentor.profileImage ?? mentor.user.image
  const bioExcerpt  = mentor.bio.length > 90 ? mentor.bio.slice(0, 87) + '…' : mentor.bio
  const initials    = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  /** Navigate to the full mentor profile page which contains the booking UI */
  const handleBook = (e: React.MouseEvent) => {
    e.stopPropagation()
    const dest = mentor.slug ? `/mentors/${mentor.slug}` : `/mentors/${mentor.id}`
    router.push(dest)
  }

  return (
    <motion.div
      layoutId={`mentor-card-${mentor.id}`}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      onClick={onSelect}
      className="flex flex-col bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden hover:shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1),0px_4px_6px_-4px_rgba(0,0,0,0.1)] transition-all cursor-pointer group hover:border-[#cbd5e1]"
      aria-label={`View profile for ${displayName}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <div className="p-5 flex flex-col h-full">
        {/* Top Header - Avatar & Names */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative w-16 h-16 shrink-0">
            {avatarSrc ? (
              <Image
                src={avatarSrc!}
                alt={displayName}
                fill
                className="rounded-full object-cover shadow-sm bg-gray-50"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xl shadow-sm">
                {initials}
              </div>
            )}

            {/* Tiny IIT Badge overlay */}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center p-[2px] shadow-sm border border-gray-100">
              <div className="w-full h-full rounded-full bg-[#f1f5f9] flex items-center justify-center text-[8px] font-bold text-[#334155]">
                IIT
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h3 className="font-semibold text-lg text-[#0f172a] truncate font-['Inter'] leading-tight">
              {displayName}
            </h3>
            <p className="text-[#64748b] text-[13px] font-medium leading-relaxed font-['Inter'] flex items-center gap-1 mt-1 truncate">
              {mentor.branch}
              <span className="w-[3px] h-[3px] rounded-full bg-[#cbd5e1] inline-block mx-1"></span>
              {YEAR_LABEL[mentor.year] ?? `Year ${mentor.year}`}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-[#eff6ff] text-[#2563eb] text-xs font-semibold px-2.5 py-1 rounded border border-[#bfdbfe]">
            {mentor.iit}
          </span>
          <span className="bg-[#f8fafc] text-[#475569] text-xs font-medium px-2.5 py-1 rounded border border-[#e2e8f0] flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
            {mentor.languages[0] || 'English'}
            {mentor.languages.length > 1 && ` +${mentor.languages.length - 1}`}
          </span>
        </div>

        {/* Bio Excerpt */}
        <div className="mt-auto mb-5 min-h-[44px]">
          <p className="text-[#475569] text-sm leading-relaxed font-['Inter']">
            {bioExcerpt}
          </p>
        </div>

        {/* Footer — rate + CTA */}
        <div className="mt-auto pt-4 border-t border-[#f1f5f9] flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-[#64748b] font-medium uppercase tracking-wider">Session Rate</span>
            <span className="text-[#0f172a] font-bold">₹150 <span className="text-xs font-normal text-[#64748b]">/ 20m</span></span>
          </div>
          <button
            onClick={handleBook}
            className="transition-colors text-white text-sm font-semibold py-2 px-4 rounded-full flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-[#f5820a] hover:bg-[#e07509]"
            aria-label={`Book a session with ${displayName}`}
          >
            Book <ArrowRightIcon />
          </button>
        </div>

      </div>
    </motion.div>
  )
}

function ArrowRightIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
      <path
        d="M3 8h10M9 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
