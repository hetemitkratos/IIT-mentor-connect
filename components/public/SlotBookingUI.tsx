'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SlotBookingUIProps {
  mentorId: string
  mentorName: string
  calLink: string | null
}

export default function SlotBookingUI({ mentorId, mentorName, calLink }: SlotBookingUIProps) {
  const router = useRouter()

  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  /* ── no Cal.com link ── */
  if (!calLink) {
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

  /* ── booking handler ── */
  const handleContinue = async () => {
    if (!confirmed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mentorId }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to create booking. Please try again.')
        setLoading(false)
        return
      }

      // API returns { success: true, data: { bookingId, sessionToken, paymentRequired } }
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

  return (
    <div className="flex flex-col gap-6">

      {/* ── Session info card ───────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-700">
        <p className="font-medium text-neutral-900 mb-1">Session confirmation</p>
        <p>Your session is confirmed only after payment. You&apos;ll have 30 minutes to complete it.</p>
      </div>

      {/* ── Cal.com embed ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Step 1 — Select a time
          </div>
          {/* Mobile full-screen fallback */}
          <a
            href={calLink}
            target="_blank"
            rel="noopener noreferrer"
            className="sm:hidden text-[11px] text-[#f5820a] font-semibold underline underline-offset-2"
            aria-label="Open Cal.com scheduling page in a new tab"
          >
            Open full screen ↗
          </a>
        </div>
        <iframe
          src={calLink}
          width="100%"
          className="block h-[750px] sm:h-[800px]"
          frameBorder="0"
          title={`Book a session with ${mentorName}`}
          loading="lazy"
        />
      </div>

      {/* ── Sticky confirmation + CTA ────────────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t sm:border sm:rounded-2xl sm:shadow-md p-5 pb-8 sm:pb-5 space-y-4 -mx-7 px-7 sm:mx-0 z-10">

        <label className="flex items-start gap-3 cursor-pointer group select-none">
          <div className="mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                confirmed
                  ? 'bg-[#f5820a] border-[#f5820a] shadow-[0_0_0_3px_rgba(245,130,10,0.15)]'
                  : 'bg-white border-neutral-300 group-hover:border-[#f5820a]/60'
              }`}
            >
              {confirmed && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-neutral-700 leading-snug">
            I have selected a time with <span className="font-medium">{mentorName}</span>
          </span>
        </label>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!confirmed || loading}
          className={`w-full py-3.5 text-[15px] font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
            !confirmed || loading
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-[#f5820a] text-white hover:bg-[#e67a0a] shadow-sm active:scale-[0.98]'
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

        <p className="text-xs text-neutral-500 text-center">Secure checkout • Razorpay</p>

      </div>
    </div>
  )
}
