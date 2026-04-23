import { getMentorBySlug } from '@/services/mentor.service'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import SlotBookingUI from '@/components/public/SlotBookingUI'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const mentor = await getMentorBySlug(slug)
  if (!mentor) return { title: 'Mentor not found' }
  return {
    title: `${mentor.user.name} — ${mentor.iit} ${mentor.branch} | CandidConversation`,
    description: mentor.bio?.slice(0, 160),
  }
}

export default async function MentorSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mentor = await getMentorBySlug(slug)
  if (!mentor) return notFound()

  const name = mentor.user.name ?? 'IIT Mentor'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <main className="min-h-screen bg-[#f9f9f9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <link
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10">
        {/* Back */}
        <a
          href="/mentors"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#585f6c] hover:text-[#1a1c1c] transition-colors mb-8 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">←</span> All Mentors
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10">
          {/* ── Left column: Profile ──────────────────── */}
          <div className="flex flex-col gap-8">

            {/* Hero card */}
            <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-7">
              <div className="flex items-start gap-5">
                {mentor.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mentor.user.image}
                    alt={name}
                    className="w-20 h-20 rounded-2xl object-cover border border-[rgba(221,193,175,0.2)] shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-orange-100 to-amber-50 flex items-center justify-center shrink-0 border border-[rgba(221,193,175,0.2)]">
                    <span
                      className="text-2xl font-semibold text-[#934b00]"
                      style={{ fontFamily: "'Newsreader', serif" }}
                    >
                      {initials}
                    </span>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h1
                    className="text-[32px] leading-tight font-normal italic text-[#1a1c1c] mb-1"
                    style={{ fontFamily: "'Newsreader', serif" }}
                  >
                    {name}
                  </h1>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#fff7ed] text-[#934b00] text-[11px] font-semibold tracking-[1px] uppercase rounded-full border border-[rgba(245,130,10,0.2)]">
                      {mentor.iit}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#f3f4f6] text-[#374151] text-[11px] font-semibold tracking-[1px] uppercase rounded-full">
                      {mentor.branch}
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#f3f4f6] text-[#374151] text-[11px] font-semibold rounded-full">
                      Year {mentor.year}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-7">
              <h2 className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#585f6c] mb-3">About</h2>
              <p className="text-[15px] text-[#374151] leading-relaxed whitespace-pre-line">{mentor.bio}</p>
            </div>

            {/* Details */}
            <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-7">
              <h2 className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#585f6c] mb-4">Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-wider mb-1">Languages</p>
                  <p className="text-[14px] text-[#1a1c1c] font-medium">{mentor.languages.join(', ')}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-wider mb-1">Session</p>
                  <p className="text-[14px] text-[#1a1c1c] font-medium">30 minutes · Google Meet</p>
                </div>
                <div>
                  <p className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-wider mb-1">Session Fee</p>
                  <p className="text-[14px] text-[#f5820a] font-semibold">₹150</p>
                </div>
                {mentor.rank && (
                  <div>
                    <p className="text-[11px] text-[#9ca3af] font-medium uppercase tracking-wider mb-1">AIR Rank</p>
                    <p className="text-[14px] text-[#1a1c1c] font-medium">{mentor.rank}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column: Booking ──────────────────── */}
          <div>
            <div className="sticky top-8 bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-7">
              <h2
                className="text-[22px] font-normal italic text-[#1a1c1c] mb-1"
                style={{ fontFamily: "'Newsreader', serif" }}
              >
                Book a Session
              </h2>
              <p className="text-[13px] text-[#9ca3af] mb-6">₹150 · 30 minutes · Google Meet</p>

              <SlotBookingUI
                mentorId={mentor.id}
                mentorName={name}
                mentorSlug={mentor.slug!} // Slug is available
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
