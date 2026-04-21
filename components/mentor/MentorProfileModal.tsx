'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const YEAR_LABEL: Record<number, string> = {
  1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year',
}

interface MentorData {
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
  bookings?:    { review: string | null; rating: number | null; updatedAt: Date; student: { name: string | null } }[]
}

interface MentorProfileModalProps {
  mentor: MentorData | null
  onClose: () => void
}

export function MentorProfileModal({ mentor, onClose }: MentorProfileModalProps) {
  const router = useRouter()

  // Lock body scroll when open
  useEffect(() => {
    if (mentor) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [mentor])

  if (!mentor) return null

  const displayName = mentor.user.name ?? 'IIT Mentor'
  const avatarSrc   = mentor.profileImage ?? mentor.user.image
  const initials    = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()

  // Mock data as per Figma design (we don't have reviews schema yet)
  const stats = { rank: 'AIR 847', sessions: 24 }

  const goToProfile = () => {
    const dest = mentor.slug ? `/mentors/${mentor.slug}` : `/mentors/${mentor.id}`
    onClose()
    router.push(dest)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 pointer-events-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#0f172a]/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal Card */}
      <motion.div
        layoutId={`mentor-card-${mentor.id}`}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="bg-[#f8f9fa] w-full max-w-[860px] max-h-[90vh] rounded-3xl shadow-[0px_25px_50px_0px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col pointer-events-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.05, duration: 0.2 } }}
          exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.1 } }}
          className="flex flex-col w-full h-full overflow-hidden relative"
        >
          {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 bg-white hover:bg-gray-50 transition-colors rounded-full flex items-center justify-center text-[#564335] shadow-sm border border-[#e2e8f0]/50"
          aria-label="Close profile"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto w-full p-4 sm:p-8 flex-1 custom-scrollbar">
          
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Left Column: Details */}
            <div className="flex-1 flex flex-col gap-8">
              
              {/* Header Info */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center flex-wrap gap-3">
                  <h1 className="text-[28px] font-extrabold text-[#191c1d] leading-none font-['Epilogue'] tracking-tight">
                    {displayName}
                  </h1>
                  <span className="bg-[#f0fdf4] border border-[#dcfce7] text-[#15803d] text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 font-['Manrope']">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path fillRule="evenodd" d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                  <span className="bg-[#ffedd5] text-[#934b00] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider font-['Manrope']">
                    {stats.rank}
                  </span>
                </div>

                <div className="flex items-center flex-wrap gap-2 text-sm font-medium text-[#564335] font-['Manrope']">
                  <span className="bg-[#e1e3e4] px-3 py-1.5 rounded-full">{mentor.iit}</span>
                  <span className="bg-[#e1e3e4] px-3 py-1.5 rounded-full">{mentor.branch}</span>
                  <span className="bg-[#e1e3e4] px-3 py-1.5 rounded-full">{YEAR_LABEL[mentor.year] ?? `Year ${mentor.year}`}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <div className="flex text-[#facc15]">
                    {[...Array(4)].map((_, i) => (
                      <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    ))}
                    <svg className="w-5 h-5 text-[#cbd5e1]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <span className="text-[#564335] text-sm font-semibold font-['Manrope']">({stats.sessions} sessions completed)</span>
                </div>
              </div>

              <div className="h-px w-full bg-[#ddc1af]/20" />

              {/* About Section */}
              <div className="flex flex-col gap-3">
                <h2 className="text-[20px] font-bold text-[#191c1d] tracking-tight font-['Epilogue']">About Me</h2>
                <div className="text-[15px] leading-relaxed text-[#564335] font-['Manrope'] whitespace-pre-wrap">
                  {mentor.bio}
                </div>
              </div>

              {/* Session Structure */}
              <div className="bg-white p-6 rounded-[32px] shadow-sm border border-[#e2e8f0]/50 flex flex-col gap-4">
                <h3 className="font-bold text-[#191c1d] text-base font-['Manrope']">How the session works</h3>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-[#564335] font-medium text-sm font-['Manrope']">
                    <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    20 minutes via Google Meet
                  </div>
                  <div className="flex items-center gap-4 text-[#564335] font-medium text-sm font-['Manrope']">
                    <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    Pick time on Calendly
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="flex flex-col gap-6 pt-4">
                <h2 className="text-[20px] font-bold text-[#191c1d] tracking-tight font-['Epilogue']">Student Reviews</h2>
                
                {(!mentor.bookings || mentor.bookings.length === 0) ? (
                  <div className="bg-[#f3f4f5] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                    <p className="text-[#564335] text-[15px] font-['Manrope']">No Reviews yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {mentor.bookings.map((booking, idx) => (
                      <div key={idx} className="bg-[#f3f4f5] p-6 rounded-2xl flex flex-col gap-3">
                        <div className="flex justify-between items-start w-full">
                          <div className="flex text-[#facc15]">
                            {[...Array(booking.rating || 5)].map((_, i) => (
                              <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            ))}
                          </div>
                          <span className="text-[#564335] text-xs font-medium font-['Manrope']">
                            {new Date(booking.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-[#564335] text-[14px] leading-relaxed font-['Manrope']">
                          "{booking.review}"
                        </p>
                        <p className="text-[#191c1d] text-xs font-bold font-['Manrope'] mt-1">
                          — {booking.student.name || 'Anonymous Student'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Sticky Booking Card */}
            <div className="w-full lg:w-[320px] shrink-0">
              <div className="bg-white border border-[#e2e8f0]/50 rounded-[32px] p-6 shadow-sm sticky top-0 flex flex-col gap-6">
                
                {/* Profile Avatar / Info */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full border-2 border-[#f5820a]/20 p-1.5">
                    {avatarSrc ? (
                      <div className="relative w-full h-full rounded-full overflow-hidden">
                        <Image src={avatarSrc} alt={displayName} fill className="object-cover bg-gray-50" />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-3xl">
                        {initials}
                      </div>
                    )}
                  </div>
                  <h3 className="mt-4 font-bold text-lg text-[#191c1d] font-['Epilogue']">{displayName}</h3>
                  <p className="text-[#564335] text-sm font-['Manrope']">{mentor.iit} &bull; {mentor.branch}</p>
                </div>

                <div className="h-px w-full bg-[#ddc1af]/10" />

                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="font-bold text-[28px] text-[#191c1d] font-['Manrope'] tracking-tight">₹150</span>
                    <span className="font-medium text-[14px] text-[#564335] font-['Manrope']">/session</span>
                  </div>
                  <span className="bg-[#e7e8e9] text-[#564335] text-xs font-bold px-3 py-1.5 rounded-full font-['Manrope']">
                    20 min
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={goToProfile}
                    className="w-full bg-[#f5820a] hover:bg-[#e07509] text-white transition-colors font-bold h-[52px] rounded-full shadow-[0px_10px_15px_-3px_rgba(249,115,22,0.2)] flex items-center justify-center gap-2 font-['Manrope'] active:scale-95"
                  >
                    Book a Session
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                  <p className="text-center text-[#564335] text-[11px] font-['Manrope'] leading-tight px-4 mt-2">
                    Schedule via Calendly, then pay to confirm. All sessions are recorded for safety.
                  </p>
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fff7ed] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#ea580c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <span className="font-bold text-[12px] text-[#191c1d] font-['Manrope']">Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#fff7ed] flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-[#ea580c]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
                    </div>
                    <span className="font-bold text-[12px] text-[#191c1d] font-['Manrope']">Verified IIT Student</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </motion.div>

    </div>
  )
}
