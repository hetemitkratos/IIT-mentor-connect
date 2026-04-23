'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import SlotManager from './SlotManager'

/* ─────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────── */
export interface BookingRow {
  id: string
  status: string
  startTime: Date | null
  endTime: Date | null
  meetingLink: string | null
  otpVerified: boolean
  createdAt: Date
  student: { name: string | null; image: string | null }
}

interface Props {
  mentorName:        string
  mentorIit:         string
  upcomingBookings:  BookingRow[]
  ongoingBookings:   BookingRow[]
  completedBookings: BookingRow[]
  cancelledBookings: BookingRow[]
  stats: {
    totalSessions:     number
    completedSessions: number
    upcomingSessions:  number
    ongoingSessions:   number
    earningsRs:        number
    rating:            number | null
  }
  bio: string
}

/* ─────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────── */
function fmt(date: Date | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function initials(name: string | null) {
  if (!name) return 'S'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function isWithin7Days(date: Date | null) {
  if (!date) return false
  const diff = new Date(date).getTime() - Date.now()
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000
}

/* ─────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────────────────────────── */
function Avatar({ name, image, size = 'md' }: { name: string | null; image: string | null; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-14 h-14 text-lg' : 'w-10 h-10 text-sm'
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name ?? 'Student'} className={`${cls} rounded-full object-cover border border-[rgba(221,193,175,0.2)]`} />
    )
  }
  return (
    <div className={`${cls} rounded-full bg-gradient-to-tr from-orange-100 to-amber-50 flex items-center justify-center font-semibold text-[#934b00] border border-[rgba(221,193,175,0.2)]`}>
      {initials(name)}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-7 flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[2px] uppercase text-[#585f6c]">{label}</span>
      <span className="text-[36px] leading-10 font-normal italic text-[#1a1c1c]" style={{ fontFamily: "'Newsreader', serif" }}>
        {value}
      </span>
      {sub && <span className="text-xs text-[#9ca3af]">{sub}</span>}
    </div>
  )
}

function FilterPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold tracking-[1.2px] uppercase px-3 py-1.5 rounded-full transition-all ${
        active ? 'bg-[#f5820a] text-white shadow-sm' : 'text-[#585f6c] hover:text-[#1a1c1c]'
      }`}
    >
      {children}
    </button>
  )
}

function SectionHeader({ title, filter, onFilter }: {
  title: string
  filter: 'all' | '7days'
  onFilter: (f: 'all' | '7days') => void
}) {
  return (
    <div className="flex items-baseline justify-between mb-6">
      <h2 className="text-2xl font-normal italic text-[#1a1c1c]" style={{ fontFamily: "'Newsreader', serif" }}>
        {title}
      </h2>
      <div className="flex items-center gap-1">
        <FilterPill active={filter === '7days'} onClick={() => onFilter('7days')}>Next 7 Days</FilterPill>
        <FilterPill active={filter === 'all'} onClick={() => onFilter('all')}>All</FilterPill>
      </div>
    </div>
  )
}

function CompletedHeader({ filter, onFilter }: { filter: 'all' | 'recent'; onFilter: (f: 'all' | 'recent') => void }) {
  return (
    <div className="flex items-baseline justify-between mb-6">
      <h2 className="text-2xl font-normal italic text-[#1a1c1c]" style={{ fontFamily: "'Newsreader', serif" }}>
        Completed Sessions
      </h2>
      <div className="flex items-center gap-1">
        <FilterPill active={filter === 'recent'} onClick={() => onFilter('recent')}>Last 30 Days</FilterPill>
        <FilterPill active={filter === 'all'} onClick={() => onFilter('all')}>All</FilterPill>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    scheduled:   { bg: 'bg-[#f0fdf4]', text: 'text-[#16a34a]', label: 'Confirmed' },
    in_progress: { bg: 'bg-[#fff7ed]', text: 'text-[#d96e08]', label: 'In Progress' },
    completed:   { bg: 'bg-[#fdf6dc]', text: 'text-[#B8962E]', label: 'Completed' },
    cancelled:   { bg: 'bg-[#f9fafb]', text: 'text-[#9ca3af]', label: 'Cancelled' },
  }
  const s = map[status] ?? { bg: 'bg-[#f9fafb]', text: 'text-[#9ca3af]', label: status }
  return (
    <span className={`${s.bg} ${s.text} text-[10px] font-semibold tracking-[-0.5px] uppercase px-2 py-0.5 rounded-full`}>
      {s.label}
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-[rgba(221,193,175,0.4)] rounded-2xl p-8 text-center text-[#9ca3af] text-sm">
      {message}
    </div>
  )
}

function UpcomingCard({ b }: { b: BookingRow }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[rgba(221,193,175,0.15)] last:border-0">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Avatar name={b.student.name} image={b.student.image} />
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#22c55e] border-2 border-[#f9f9f9]" />
        </div>
        <div>
          <p className="font-semibold text-[#1a1c1c] tracking-[-0.45px] text-[17px]">{b.student.name ?? 'Student'}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[11px] text-[#9ca3af] font-medium">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {fmt(b.startTime)}
            </span>
            <StatusBadge status={b.status} />
          </div>
        </div>
      </div>
      {b.meetingLink ? (
        <a
          href={b.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-2 bg-[rgba(22,163,74,0.1)] text-[#15803d] text-[13px] font-medium rounded-full hover:bg-[rgba(22,163,74,0.18)] transition-colors flex items-center gap-1.5"
        >
          Join Meet →
        </a>
      ) : (
        <span className="px-4 py-2 text-[#9ca3af] text-[13px] font-medium rounded-full bg-[#f9fafb]">
          Awaiting slot
        </span>
      )}
    </div>
  )
}

function OngoingCard({ b }: { b: BookingRow }) {
  const router = useRouter()
  const [otp, setOtp] = useState('')
  const [otpErr, setOtpErr] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(b.otpVerified || b.status === 'in_progress')
  const [completing, setCompleting] = useState(false)
  const [, startTransition] = useTransition()

  const handleVerify = async () => {
    if (otp.length !== 4) { setOtpErr('Enter 4-digit OTP'); return }
    setVerifying(true); setOtpErr(null)
    try {
      const res = await fetch('/api/bookings/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: b.id, otp }),
      })
      const json = await res.json()
      if (json.success) {
        setVerified(true)
        startTransition(() => router.refresh())
      } else {
        setOtpErr(json.error ?? 'Verification failed')
      }
    } catch { setOtpErr('Network error') }
    finally { setVerifying(false) }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try {
      const res = await fetch('/api/bookings/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: b.id }),
      })
      if (res.ok) startTransition(() => router.refresh())
    } finally { setCompleting(false) }
  }

  return (
    <div className="bg-[#fff7ed] border border-[rgba(245,130,10,0.15)] rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar name={b.student.name} image={b.student.image} />
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#f5820a] border-2 border-[#fff7ed] animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-[#1a1c1c] tracking-[-0.45px] text-[17px]">{b.student.name ?? 'Student'}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-[11px] text-[#9ca3af] font-medium">
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {fmt(b.startTime)}
              </span>
              <StatusBadge status={b.status} />
            </div>
          </div>
        </div>
        {b.meetingLink ? (
          <a
            href={b.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-[#f5820a] text-white text-[13px] font-semibold rounded-full hover:bg-[#e07509] transition-colors shadow-[0px_4px_12px_rgba(245,130,10,0.25)] flex items-center gap-1.5"
          >
            Join Meet →
          </a>
        ) : (
          <span className="px-4 py-2 text-[#9ca3af] text-[13px] font-medium rounded-full bg-white">
            Awaiting link
          </span>
        )}
      </div>

      <div className="border-t border-[rgba(245,130,10,0.15)] pt-4">
        {verified ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#16a34a] text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Session verified — in progress
            </div>
            {b.status === 'in_progress' && (
              <button
                onClick={handleComplete}
                disabled={completing}
                className="px-5 py-2 bg-[#191c1d] text-white text-[13px] font-semibold rounded-full hover:bg-black transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {completing ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Completing...</>
                ) : (
                  <>✓ Mark as Completed</>
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-[12px] text-[#d96e08] font-medium">
              Ask the student for their secure session OTP to verify attendance
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="4-digit OTP"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-32 text-center px-3 py-2 text-sm border border-[rgba(245,130,10,0.3)] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30 font-mono tracking-widest"
              />
              <button
                onClick={handleVerify}
                disabled={verifying || otp.length !== 4}
                className={`px-5 py-2 text-sm font-semibold rounded-full transition-colors ${
                  verifying || otp.length !== 4
                    ? 'bg-[rgba(245,130,10,0.3)] text-[#d96e08] cursor-not-allowed'
                    : 'bg-[#f5820a] text-white hover:bg-[#e07509] shadow-[0px_4px_12px_rgba(245,130,10,0.25)]'
                }`}
              >
                {verifying ? 'Verifying…' : 'Verify OTP'}
              </button>
            </div>
            {otpErr && <p className="text-[11px] text-[#ba1a1a]">{otpErr}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function CompletedRow({ b }: { b: BookingRow }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-[rgba(221,193,175,0.15)] last:border-0">
      <div className="flex items-center gap-4">
        <Avatar name={b.student.name} image={b.student.image} size="sm" />
        <div>
          <p className="font-medium text-[#1a1c1c] text-[15px]">{b.student.name ?? 'Student'}</p>
          <p className="text-[11px] text-[#9ca3af] mt-0.5">{fmt(b.startTime ?? b.createdAt)}</p>
        </div>
      </div>
      <StatusBadge status={b.status} />
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   CAL.COM LINK SETTINGS CARD
───────────────────────────────────────────────────────────────── */
function CalLinkSettings({ initialLink }: { initialLink: string | null }) {
  const router = useRouter()
  const [link, setLink] = useState(initialLink ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const isValid = link.includes('cal.com')

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/mentor/update-cal-link', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calLink: link }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to save link')
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError('Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-6 mb-10">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-[13px] font-semibold tracking-[1.5px] uppercase text-[#585f6c]">Cal.com Booking Link</h2>
          <p className="text-[#6b7280] text-[13px] leading-relaxed mt-1 max-w-lg">
            Paste your Cal.com booking link. Students will schedule their session using the embedded calendar on your profile page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
          <input
            type="url"
            value={link}
            onChange={e => { setLink(e.target.value); setSaved(false) }}
            placeholder="https://cal.com/your-name/30min"
            className="flex-1 px-4 py-2.5 text-sm border border-[rgba(221,193,175,0.4)] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30 text-[#1a1c1c] placeholder:text-[#9ca3af]"
          />
          <button
            onClick={handleSave}
            disabled={saving || !link.trim() || !isValid}
            className="px-5 py-2.5 bg-[#f5820a] text-white text-[13px] font-semibold rounded-full hover:bg-[#e07509] transition-colors shadow-sm disabled:opacity-50 shrink-0"
          >
            {saving ? 'Saving…' : 'Save Link'}
          </button>
        </div>

        {!isValid && link.trim() && (
          <p className="text-[12px] text-[#b45309]">Must be a cal.com link (e.g. https://cal.com/your-name/30min)</p>
        )}
        {error && <p className="text-[12px] text-[#ba1a1a]">{error}</p>}
        {saved && (
          <p className="text-[12px] text-[#16a34a] flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Link saved successfully
          </p>
        )}

        {link && isValid && (
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#22c55e] shrink-0" />
            <span className="text-[12px] text-[#16a34a] font-medium">Scheduling link active</span>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] text-[#9ca3af] hover:text-[#585f6c] underline transition-colors ml-1"
            >
              Preview →
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAIN DASHBOARD
───────────────────────────────────────────────────────────────── */
export default function MentorDashboardContent({
  mentorName, mentorIit,
  upcomingBookings, ongoingBookings,
  completedBookings, cancelledBookings,
  stats, bio,
}: Props) {
  const [upcomingFilter, setUpcomingFilter] = useState<'all' | '7days'>('7days')
  const [completedFilter, setCompletedFilter] = useState<'all' | 'recent'>('recent')

  const filteredUpcoming = upcomingFilter === '7days'
    ? upcomingBookings.filter(b => isWithin7Days(b.startTime))
    : upcomingBookings

  const filteredCompleted = completedFilter === 'recent'
    ? completedBookings.filter(b => {
        const t = b.startTime ?? b.createdAt
        const diff = Date.now() - new Date(t).getTime()
        return diff <= 30 * 24 * 60 * 60 * 1000
      })
    : completedBookings

  const earned = stats.earningsRs >= 1000
    ? `₹${(stats.earningsRs / 1000).toFixed(0)}k`
    : `₹${stats.earningsRs}`

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-[1376px] mx-auto px-8 pt-10 pb-20">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-2 mb-12">
          <h1 className="text-[56px] leading-[60px] font-normal italic text-[#1a1c1c]"
              style={{ fontFamily: "'Newsreader', serif" }}>
            {greeting()}, {mentorName.split(' ')[0]}
          </h1>
          <div className="backdrop-blur-sm bg-white/80 border border-[rgba(221,193,175,0.2)] inline-flex items-center gap-2 px-4 py-1.5 rounded-full self-start">
            <span className="text-[#934b00] text-[11px] font-semibold tracking-[1.2px] uppercase">{mentorIit}</span>
            <span className="w-1 h-1 rounded-full bg-[#f5820a]" />
            <span className="text-[#934b00] text-[11px] font-semibold tracking-[1.2px] uppercase">Verified Mentor</span>
          </div>
        </div>

        {/* ── Stats Row ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-10">
          <StatCard label="Completed" value={stats.completedSessions} />
          <StatCard label="Upcoming" value={stats.upcomingSessions} />
          <StatCard label="Earned" value={earned} />
          <StatCard label="Rating" value={stats.rating ? stats.rating.toFixed(1) : '—'} sub="avg. from students" />
        </div>

        {/* ── Slot Configuration ──────────────────────────────────── */}
        <SlotManager />

        {/* ── ONGOING SESSIONS ────────────────────────────────────── */}
        {ongoingBookings.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-normal italic text-[#1a1c1c]"
                  style={{ fontFamily: "'Newsreader', serif" }}>
                Ongoing Sessions
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#f5820a] text-white text-[10px] font-bold animate-pulse">
                LIVE
              </span>
            </div>
            <div className="flex flex-col gap-4">
              {ongoingBookings.map(b => <OngoingCard key={b.id} b={b} />)}
            </div>
          </section>
        )}

        {/* ── UPCOMING SESSIONS ───────────────────────────────────── */}
        <section className="mb-12">
          <SectionHeader
            title="Upcoming Sessions"
            filter={upcomingFilter}
            onFilter={setUpcomingFilter}
          />
          {filteredUpcoming.length === 0 ? (
            <EmptyState message={
              upcomingFilter === '7days'
                ? 'No sessions in the next 7 days. Try switching to "All".'
                : 'No upcoming sessions scheduled yet.'
            } />
          ) : (
            <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl px-5 divide-y divide-[rgba(221,193,175,0.1)]">
              {filteredUpcoming.map(b => <UpcomingCard key={b.id} b={b} />)}
            </div>
          )}
        </section>

        {/* ── COMPLETED SESSIONS ──────────────────────────────────── */}
        <section className="mb-12">
          <CompletedHeader filter={completedFilter} onFilter={setCompletedFilter} />
          {filteredCompleted.length === 0 ? (
            <EmptyState message={
              completedFilter === 'recent'
                ? 'No completed sessions in the last 30 days.'
                : 'No completed sessions yet.'
            } />
          ) : (
            <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl px-5">
              {filteredCompleted.map(b => <CompletedRow key={b.id} b={b} />)}
            </div>
          )}
        </section>

        {/* ── CANCELLED SESSIONS ──────────────────────────────────── */}
        {cancelledBookings.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-normal italic text-[#1a1c1c] mb-6"
                style={{ fontFamily: "'Newsreader', serif" }}>
              Cancelled Sessions
            </h2>
            <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl px-5 opacity-70">
              {cancelledBookings.map(b => <CompletedRow key={b.id} b={b} />)}
            </div>
          </section>
        )}

        {/* ── PUBLIC PROFILE PREVIEW ──────────────────────────────── */}
        <section>
          <div className="bg-[#f3f3f3] border border-[rgba(221,193,175,0.1)] rounded-3xl p-10">
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
              <div className="shrink-0 w-52 h-64 bg-white rounded-2xl shadow-[0px_8px_24px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center gap-3 -rotate-1 select-none">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-100 to-amber-50 flex items-center justify-center text-2xl font-bold text-[#934b00]">
                  {initials(mentorName)}
                </div>
                <div className="text-center px-4">
                  <p className="font-semibold text-[#1a1c1c] text-sm">{mentorName}</p>
                  <p className="text-[11px] text-[#585f6c] mt-0.5">{mentorIit}</p>
                </div>
                <div className="px-4 py-1.5 bg-[#f5820a] text-white text-[11px] font-semibold rounded-full">
                  ₹150 / session
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-normal italic text-[#1a1c1c] mb-3"
                    style={{ fontFamily: "'Newsreader', serif" }}>
                  Public Profile Preview
                </h2>
                <p className="text-[#585f6c] text-[15px] leading-relaxed mb-6 max-w-lg">
                  {bio || 'Your public bio will appear here. Edit it to attract more students.'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="/mentor/profile"
                    className="border border-[#ddc1af] text-[#1a1c1c] text-[13px] font-medium px-5 py-2 rounded-full hover:bg-white transition-colors"
                  >
                    Edit bio
                  </a>
                  <a
                    href="/mentors"
                    className="bg-[#f5820a] text-[#301400] text-[13px] font-medium px-5 py-2 rounded-full hover:bg-[#e07509] transition-colors"
                  >
                    View Public Profile
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
