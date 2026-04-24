'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

interface MentorCardProps {
  mentor: {
    id:           string
    slug:         string | null
    iit:          string
    branch:       string
    year:         number
    languages:    string[]
    bio:          string
    profileImage: string | null
    user:         { name: string | null; image: string | null }
  }
  onSelect: () => void
}

const YEAR_LABEL: Record<number, string> = {
  1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year',
}

/** Ensure English is always in the language list */
function normaliseLanguages(langs: string[]): string[] {
  const set = new Set(langs.map(l => l.trim()).filter(Boolean))
  set.add('English')
  return ['English', ...Array.from(set).filter(l => l !== 'English')]
}

export function MentorCard({ mentor, onSelect }: MentorCardProps) {
  const displayName = mentor.user.name ?? 'IIT Mentor'
  const avatarSrc   = mentor.profileImage ?? mentor.user.image
  const initials    = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const languages   = normaliseLanguages(mentor.languages)

  return (
    <motion.div
      layoutId={`mentor-card-${mentor.id}`}
      transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
      onClick={onSelect}
      className="flex flex-col bg-white rounded-2xl border border-[#e8e8e8] overflow-hidden hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-[#f5820a]/30 transition-all duration-200 cursor-pointer group"
      aria-label={`View profile for ${displayName}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
      }}
    >
      <div className="p-5 flex flex-col h-full gap-4">

        {/* ── Avatar + Identity ─────────────────────────── */}
        <div className="flex items-center gap-3.5">
          {/* Avatar */}
          <div className="relative w-14 h-14 shrink-0">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={displayName}
                fill
                className="rounded-full object-cover ring-2 ring-[#f5820a]/10"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#fff3e8] to-[#ffe0c4] flex items-center justify-center text-[#934b00] font-bold text-lg ring-2 ring-[#f5820a]/10">
                {initials}
              </div>
            )}
          </div>

          {/* Name + college + branch */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-[#0f172a] leading-tight truncate">
              {displayName}
            </h3>
            <p className="text-[12px] text-[#64748b] font-medium mt-0.5 truncate">
              {mentor.iit}
            </p>
            <p className="text-[12px] text-[#475569] mt-0.5 leading-snug line-clamp-2">
              {mentor.branch}
              {mentor.year ? (
                <span className="text-[#9ca3af]"> · {YEAR_LABEL[mentor.year] ?? `Year ${mentor.year}`}</span>
              ) : null}
            </p>
          </div>
        </div>

        {/* ── Language badges ───────────────────────────── */}
        <div className="flex flex-wrap gap-1.5">
          {languages.map(lang => (
            <span
              key={lang}
              className="text-xs font-medium px-2 py-1 rounded-md bg-neutral-100 text-neutral-700"
            >
              {lang}
            </span>
          ))}
        </div>

        {/* ── CTA ──────────────────────────────────────── */}
        <div className="mt-auto pt-3 border-t border-[#f1f5f9]">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect() }}
            className="w-full py-2 rounded-full text-[13px] font-semibold text-white bg-[#f5820a] hover:bg-[#e07509] active:scale-[.98] transition-all shadow-sm"
            aria-label={`Book a session with ${displayName}`}
          >
            Book Session →
          </button>
        </div>

      </div>
    </motion.div>
  )
}
