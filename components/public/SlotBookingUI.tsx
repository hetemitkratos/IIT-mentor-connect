'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SlotBookingUIProps {
  mentorId:    string
  mentorName:  string
  calendlyLink: string | null
}

export default function SlotBookingUI({ mentorId, mentorName, calendlyLink }: SlotBookingUIProps) {
  const router = useRouter()
  const [confirmed, setConfirmed] = useState(false)
  const [bookingNote, setBookingNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No Calendly link set
  if (!calendlyLink) {
    return (
      <div className="p-5 rounded-2xl border border-[rgba(221,193,175,0.2)] bg-[#fafafa] text-center">
        <p className="text-[13px] text-[#9ca3af]">
          This mentor hasn&apos;t set up their scheduling link yet. Check back soon.
        </p>
      </div>
    )
  }

  const handleContinue = async () => {
    if (!confirmed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          bookingNote: bookingNote.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to create booking. Please try again.')
        setLoading(false)
        return
      }

      router.push(`/payment/${data.bookingId}`)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Step guide */}
      <div className="px-4 py-3.5 rounded-xl bg-[#fff7ed] border border-[rgba(245,130,10,0.2)]">
        <p className="text-[12px] text-[#934b00] font-semibold mb-2">How booking works</p>
        <ol className="list-none space-y-1.5">
          {[
            'Step 1 — Select a time using the calendar below',
            'Step 2 — Return here and confirm',
            'Step 3 — Complete payment to secure your session',
          ].map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-[#b45309]">
              <span className="w-4 h-4 rounded-full bg-[#f5820a] text-white flex items-center justify-center shrink-0 text-[9px] font-bold mt-px">
                {i + 1}
              </span>
              {s.replace(/^Step \d+ — /, '')}
            </li>
          ))}
        </ol>
      </div>

      {/* Calendly embed */}
      <div className="rounded-2xl overflow-hidden border border-[rgba(221,193,175,0.2)] bg-white">
        <iframe
          src={calendlyLink}
          width="100%"
          height="680"
          frameBorder="0"
          title={`Book a session with ${mentorName}`}
          className="block"
        />
      </div>

      {/* Optional time note */}
      <div>
        <label className="block text-[11px] font-semibold text-[#585f6c] uppercase tracking-wider mb-1.5">
          What time did you book? <span className="text-[#9ca3af] font-normal normal-case tracking-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={bookingNote}
          onChange={e => setBookingNote(e.target.value)}
          placeholder="e.g. Monday 3 PM"
          className="w-full px-4 py-2.5 text-sm border border-[rgba(221,193,175,0.4)] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30 text-[#1a1c1c] placeholder:text-[#9ca3af]"
        />
      </div>

      {/* Warnings */}
      <div className="flex flex-col gap-2">
        <div className="px-3.5 py-2.5 rounded-lg bg-[#fff7ed] border border-[rgba(245,130,10,0.2)] flex items-center gap-2">
          <span className="text-sm shrink-0">⚠️</span>
          <p className="text-[12px] text-[#b45309]">Session confirmed <strong>only after payment</strong></p>
        </div>
        <div className="px-3.5 py-2.5 rounded-lg bg-[#fff7ed] border border-[rgba(245,130,10,0.2)] flex items-center gap-2">
          <span className="text-sm shrink-0">⏱</span>
          <p className="text-[12px] text-[#b45309]">Complete payment within <strong>30 minutes</strong></p>
        </div>
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={e => setConfirmed(e.target.checked)}
            className="sr-only"
          />
          <div
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              confirmed
                ? 'bg-[#f5820a] border-[#f5820a]'
                : 'bg-white border-[rgba(221,193,175,0.6)] group-hover:border-[#f5820a]'
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
          I have scheduled my session with <strong>{mentorName}</strong> using the calendar above
        </span>
      </label>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[#fff1f2] border border-[rgba(186,26,26,0.2)]">
          <p className="text-[13px] text-[#ba1a1a] font-medium">{error}</p>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleContinue}
        disabled={!confirmed || loading}
        className={`w-full py-3.5 text-[15px] font-semibold rounded-full transition-all ${
          !confirmed || loading
            ? 'bg-[rgba(245,130,10,0.2)] text-[#d96e08] cursor-not-allowed'
            : 'bg-[#f5820a] text-white hover:bg-[#e07509] shadow-[0_6px_20px_rgba(245,130,10,0.35)]'
        }`}
      >
        {loading ? 'Creating booking…' : 'Continue to Payment →'}
      </button>

      <p className="text-[11px] text-[#9ca3af] text-center -mt-2">
        Button enabled after checking the box above
      </p>
    </div>
  )
}
