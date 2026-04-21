'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface SlotBookingUIProps {
  mentorId:     string
  mentorName:   string
  calendlyLink: string | null
}

/* ─────────────────────────────────────────────────────────────────
   STEP BADGE  — serif-card header helper
───────────────────────────────────────────────────────────────── */
function StepBadge({ n, label, active }: { n: number; label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all ${
          active
            ? 'bg-[#f5820a] text-white shadow-[0_2px_8px_rgba(245,130,10,0.35)]'
            : 'bg-[rgba(245,130,10,0.12)] text-[#f5820a]'
        }`}
      >
        {n}
      </div>
      <span
        className={`text-[13px] leading-snug transition-all ${
          active ? 'text-[#1a1c1c] font-semibold' : 'text-[#585f6c] font-medium'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────── */
export default function SlotBookingUI({ mentorId, mentorName, calendlyLink }: SlotBookingUIProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const [confirmed, setConfirmed]     = useState(false)
  const [bookingNote, setBookingNote] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  /* ── no Calendly link ── */
  if (!calendlyLink) {
    return (
      <div className="p-6 rounded-2xl border border-[rgba(221,193,175,0.2)] bg-[#fafafa] text-center">
        <div className="w-10 h-10 rounded-full bg-[rgba(245,130,10,0.1)] flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-[#f5820a]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-[13px] font-semibold text-[#374151]">Scheduling not available yet</p>
        <p className="text-[12px] text-[#9ca3af] mt-1">
          This mentor hasn&apos;t set up their scheduling link yet. Check back soon.
        </p>
      </div>
    )
  }

  /* ── TASK 1: Build Calendly URL with name/email prefill ── */
  const userName  = session?.user?.name  ?? ''
  const userEmail = session?.user?.email ?? ''
  const calendlyUrl = userEmail
    ? `${calendlyLink}?prefill[name]=${encodeURIComponent(userName)}&prefill[email]=${encodeURIComponent(userEmail)}`
    : calendlyLink

  /* ── TASK 2: Fix payment redirect — API returns { success, data: { bookingId } } ── */
  const handleContinue = async () => {
    if (!confirmed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          mentorId,
          bookingNote: bookingNote.trim() || undefined,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to create booking. Please try again.')
        setLoading(false)
        return
      }

      // API returns: { success: true, data: { bookingId, sessionToken, paymentRequired } }
      const bookingId = json?.data?.bookingId
      if (!bookingId) {
        setError('Booking created but ID was not returned. Please contact support.')
        setLoading(false)
        return
      }

      router.push(`/payment/${bookingId}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  /* ─────────────────────────────────────────────────────────────── */

  return (
    <div className="flex flex-col gap-0">

      {/* ── TASK 4: Warning — MOVED TO TOP ──────────────────────────── */}
      <div className="rounded-2xl bg-[#fff7ed] border border-[#f5820a]/25 p-4 mb-5">
        <div className="flex items-start gap-3">
          <span className="text-[18px] shrink-0 mt-px" aria-hidden="true">⚠️</span>
          <div>
            <p className="text-[13px] font-bold text-[#92400e] leading-snug">
              Your session is NOT confirmed until payment is completed
            </p>
            <p className="text-[12px] text-[#b45309] mt-1 leading-relaxed">
              You have <strong>30 minutes</strong> after selecting a time to complete your payment.
            </p>
          </div>
        </div>
      </div>

      {/* ── TASK 6: How to book (Steps) ─────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-[rgba(221,193,175,0.2)] shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 mb-5">
        <h2
          className="text-[17px] font-normal italic text-[#1a1c1c] mb-4 leading-snug"
          style={{ fontFamily: "'Newsreader', serif" }}
        >
          How to book your session
        </h2>
        <div className="flex flex-col gap-3">
          <StepBadge n={1} label="Select a time using the calendar below" active={true} />
          <div className="ml-3.5 w-px h-3 bg-[rgba(245,130,10,0.2)]" aria-hidden="true" />
          <StepBadge n={2} label="Return here and confirm your booking" active={false} />
          <div className="ml-3.5 w-px h-3 bg-[rgba(245,130,10,0.2)]" aria-hidden="true" />
          <StepBadge n={3} label="Complete payment to secure your session" active={false} />
        </div>
      </div>

      {/* ── TASK 10: Calendly embed (clean, no clip) ────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-[rgba(221,193,175,0.2)] bg-white mb-3">
        {/* TASK 3: Updated label copy */}
        <div className="px-4 py-3 border-b border-[rgba(221,193,175,0.15)] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span className="text-[12px] font-semibold text-[#585f6c] tracking-wide uppercase">
              Step 1 — Select a time
            </span>
          </div>
          {/* Mobile full-screen fallback */}
          <a
            href={calendlyLink}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden text-[11px] text-[#f5820a] font-semibold underline underline-offset-2"
            aria-label="Open Calendly scheduling page in a new tab"
          >
            Open full screen ↗
          </a>
        </div>
        {/* TASK 1: src uses prefilled URL; TASK 8: Mobile-friendly height */}
        <iframe
          src={calendlyUrl}
          width="100%"
          className="block h-[700px] sm:h-[760px]"
          frameBorder="0"
          title={`Book a session with ${mentorName}`}
          loading="lazy"
        />
      </div>

      {/* ── TASK 12: Post-embed guidance nudge ──────────────────────── */}
      <div className="flex items-center gap-2 px-1 mb-5">
        <span className="text-base" aria-hidden="true">👇</span>
        <p className="text-[13px] text-[#585f6c] leading-relaxed">
          After selecting your time above, scroll down and confirm to continue to payment.
        </p>
      </div>

      {/* ── TASK 9: Sticky confirmation + CTA card ──────────────────── */}
      <div className="sticky bottom-0 z-10">
        {/* Gradient fade so the sticky card doesn't hard-cut scrolling content */}
        <div
          className="h-6 -mb-1 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #f9f9f9)' }}
          aria-hidden="true"
        />

        <div className="bg-white border border-[rgba(221,193,175,0.3)] rounded-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] p-5 flex flex-col gap-4">

          {/* TASK 7: Updated confirmation checkbox copy */}
          <label
            className="flex items-start gap-3 cursor-pointer group select-none"
            id="confirm-checkbox-label"
          >
            <div className="mt-0.5 shrink-0">
              <input
                type="checkbox"
                id="confirm-scheduled"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                className="sr-only"
                aria-labelledby="confirm-checkbox-label"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                  confirmed
                    ? 'bg-[#f5820a] border-[#f5820a] shadow-[0_0_0_3px_rgba(245,130,10,0.15)]'
                    : 'bg-white border-[rgba(221,193,175,0.7)] group-hover:border-[#f5820a]/60'
                }`}
              >
                {confirmed && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-[13px] text-[#374151] leading-snug">
              ✅ I have selected a time in the calendar above with{' '}
              <strong className="text-[#1a1c1c]">{mentorName}</strong>
            </span>
          </label>

          {/* Optional booking note */}
          <div>
            <label
              htmlFor="booking-note"
              className="block text-[11px] font-semibold text-[#585f6c] uppercase tracking-wider mb-1.5"
            >
              What time did you book?{' '}
              <span className="text-[#9ca3af] font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="booking-note"
              type="text"
              value={bookingNote}
              onChange={e => setBookingNote(e.target.value)}
              placeholder="e.g. Monday 3 PM"
              className="w-full px-4 py-2.5 text-sm border border-[rgba(221,193,175,0.4)] rounded-xl bg-[#fafafa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30 text-[#1a1c1c] placeholder:text-[#9ca3af] transition-colors"
            />
          </div>

          {/* Error banner */}
          {error && (
            <div className="px-4 py-3 rounded-xl bg-[#fff1f2] border border-[rgba(186,26,26,0.2)]">
              <p className="text-[13px] text-[#ba1a1a] font-medium">{error}</p>
            </div>
          )}

          {/* TASK 8: CTA button — disabled until confirmed, hover scale */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleContinue}
              disabled={!confirmed || loading}
              aria-label={loading ? 'Creating your booking…' : 'Secure your session — Pay ₹150'}
              className={`w-full py-4 text-[15px] font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 ${
                !confirmed || loading
                  ? 'bg-[rgba(245,130,10,0.15)] text-[#d96e08] cursor-not-allowed'
                  : 'bg-[#f5820a] text-white hover:bg-[#e07509] hover:scale-[1.01] active:scale-[0.98] shadow-[0_8px_24px_rgba(245,130,10,0.40)]'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                  Creating booking…
                </>
              ) : (
                <>
                  Secure your session — Pay ₹150
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>

            {/* Dynamic microcopy */}
            <p className="text-[11px] text-[#9ca3af] text-center leading-relaxed">
              {confirmed
                ? '🔒 Secure checkout · Razorpay encrypted payment'
                : 'Check the box above to enable payment'}
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}
