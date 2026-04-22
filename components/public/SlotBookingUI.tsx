'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/** Maximum time to wait for Cal.com webhook before falling back to manual proceed */
const POLL_TIMEOUT_MS = 3 * 60 * 1000 // 3 minutes

interface SlotBookingUIProps {
  mentorId:   string
  mentorName: string
  calLink:    string | null
}

/**
 * SlotBookingUI — webhook-driven booking flow.
 *
 * Phase 1 (Embed): Student uses the Cal.com iframe to pick a time.
 * Phase 2 (Ready to pay): Student clicks "I've selected my time" → booking is created
 *           immediately AND we start polling /api/bookings/[id] every 3 s.
 *           Once webhook fires and scheduledAt is set, the CTA promotes to full orange.
 * Phase 3 (Navigate): Student clicks pay → goes to /payment/[bookingId].
 *
 * The checkbox is now a single-click "I'm done scheduling" trigger — not manual
 * confirmation of *truth*, just a signal to start the flow.
 */
export default function SlotBookingUI({ mentorId, mentorName, calLink }: SlotBookingUIProps) {
  const router = useRouter()

  const [phase, setPhase] = useState<'embed' | 'creating' | 'waiting' | 'confirmed' | 'timeout'>('embed')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [scheduledAt, setScheduledAt] = useState<string | null>(null)
  const [meetingUrl, setMeetingUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStartRef  = useRef<number>(0)

  // ── Poll for webhook data ─────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'waiting' || !bookingId) return

    pollStartRef.current = Date.now()

    intervalRef.current = setInterval(async () => {
      // ── Timeout guard ──────────────────────────────────────────────────────
      // If Cal.com webhook hasn't arrived after 3 minutes, stop spinning and
      // let the user proceed manually. The webhook will still attach data
      // asynchronously — it just may not be reflected live.
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        setPhase('timeout')
        if (intervalRef.current) clearInterval(intervalRef.current)
        console.warn('[POLL] Timeout waiting for Cal.com webhook — enabling manual proceed')
        return
      }

      try {
        const res = await fetch(`/api/bookings/${bookingId}`)
        if (!res.ok) return

        const json = await res.json()
        const data = json?.data

        if (data?.scheduledAt) {
          setScheduledAt(data.scheduledAt)
          setMeetingUrl(data.meetingUrl ?? null)
          setPhase('confirmed')
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        // silent — keep polling until timeout
      }
    }, 3000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [phase, bookingId])

  // ── no Cal.com link ───────────────────────────────────────────────────────
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

  // ── PHASE 1 handler: create booking immediately on CTA click ─────────────
  const handleScheduled = async () => {
    setError(null)
    setPhase('creating')

    try {
      const res = await fetch('/api/bookings/create', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ mentorId }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to create booking. Please try again.')
        setPhase('embed')
        return
      }

      const bid = json?.data?.bookingId
      const token = json?.data?.sessionToken

      if (!bid) {
        setError('Booking created but ID was not returned. Please contact support.')
        setPhase('embed')
        return
      }

      setBookingId(bid)
      setSessionToken(token)
      setPhase('waiting')
    } catch {
      setError('Network error. Please try again.')
      setPhase('embed')
    }
  }

  // ── Navigate to payment ───────────────────────────────────────────────────
  const handlePay = () => {
    if (bookingId) router.push(`/payment/${bookingId}`)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">

      {/* ── Info card ─────────────────────────────────────────────── */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-sm text-neutral-700">
        <p className="font-medium text-neutral-900 mb-1">How it works</p>
        <ol className="space-y-1 list-decimal list-inside text-neutral-600">
          <li>Select a time in the calendar below</li>
          <li>Click &ldquo;I&apos;ve selected my time&rdquo; to reserve your spot</li>
          <li>Complete payment to confirm your session</li>
        </ol>
        <p className="mt-2 text-xs text-neutral-500">
          Use the <strong>same email</strong> for scheduling and your account — this links your booking automatically.
        </p>
      </div>

      {/* ── Cal.com embed ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm bg-white">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2 text-sm font-medium text-neutral-600">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Step 1 — Select a time
          </div>
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

      {/* ── CTA area ──────────────────────────────────────────────── */}
      <div className="sticky bottom-0 bg-white border-t sm:border sm:rounded-2xl sm:shadow-md p-5 pb-8 sm:pb-5 space-y-4 -mx-7 px-7 sm:mx-0 z-10">

        {/* PHASE: embed — show primary CTA */}
        {phase === 'embed' && (
          <button
            onClick={handleScheduled}
            className="w-full py-3.5 text-[15px] font-medium rounded-xl bg-[#f5820a] text-white hover:bg-[#e67a0a] shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            I&apos;ve selected my time — Reserve spot
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        )}

        {/* PHASE: creating — spinner */}
        {phase === 'creating' && (
          <button
            disabled
            className="w-full py-3.5 text-[15px] font-medium rounded-xl bg-neutral-100 text-neutral-400 cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
            Reserving your spot…
          </button>
        )}

        {/* PHASE: waiting — polling for webhook */}
        {phase === 'waiting' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4">
              <div className="flex items-center gap-3 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <p className="text-sm font-medium text-neutral-800">Waiting for booking confirmation…</p>
              </div>
              <p className="text-xs text-neutral-500 pl-5">
                Cal.com is confirming your slot. This usually takes a few seconds.
              </p>
            </div>
            <button
              onClick={handlePay}
              className="w-full py-3.5 text-[15px] font-medium rounded-xl bg-neutral-200 text-neutral-500 cursor-not-allowed flex items-center justify-center gap-2"
              disabled
            >
              Secure your session — Pay ₹150
            </button>
            <p className="text-xs text-neutral-400 text-center">Payment will unlock once your time is confirmed</p>
          </div>
        )}

        {/* PHASE: confirmed — webhook received */}
        {phase === 'confirmed' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-800">Time confirmed!</p>
                  {scheduledAt && (
                    <p className="text-xs text-green-700 mt-0.5">
                      {new Date(scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handlePay}
              className="w-full py-3.5 text-[15px] font-semibold rounded-xl bg-[#f5820a] text-white hover:bg-[#e67a0a] shadow-[0_4px_16px_rgba(245,130,10,0.35)] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              Secure your session — Pay ₹150
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <p className="text-xs text-neutral-500 text-center">Secure checkout • Razorpay</p>
          </div>
        )}

        {/* PHASE: timeout — webhook didn't arrive in time, unlock manual proceed */}
        {phase === 'timeout' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-semibold text-amber-800 mb-1">Booking confirmation is taking longer than expected</p>
              <p className="text-xs text-amber-700">
                Your Cal.com slot has been saved. You can proceed to payment now — the schedule time will appear once Cal.com confirms.
              </p>
            </div>
            <button
              onClick={handlePay}
              className="w-full py-3.5 text-[15px] font-medium rounded-xl bg-[#f5820a] text-white hover:bg-[#e67a0a] shadow-sm active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
            >
              Continue to Payment
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <p className="text-xs text-neutral-500 text-center">Secure checkout • Razorpay</p>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

      </div>
    </div>
  )
}
