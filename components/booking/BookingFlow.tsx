'use client'

import { useRouter } from 'next/navigation'
import { useBookingFlow, FlowStep, FlowError } from '@/hooks/useBookingFlow'

interface BookingFlowProps {
  mentorId: string
  mentorName: string
  calLink?: string
  studentName?: string | null
  studentEmail?: string | null
}

export function BookingFlow({ mentorId, mentorName, calLink }: BookingFlowProps) {
  const router = useRouter()

  const {
    step,
    setStep,
    flowError,
    setFlowError,
    isProcessing,
    startBookingFlow,
    finalCalUrl,
  } = useBookingFlow({ mentorId, mentorName, calLink })

  // ── Step label ─────────────────────────────────────────────────────────────
  const stepLabel: Record<FlowStep, string> = {
    idle:             'Book a Session — ₹150',
    creating_booking: 'Creating booking…',
    booked:           'Booking confirmed!',
    creating_order:   'Preparing payment…',
    razorpay_open:    'Complete payment in Razorpay…',
    verifying:        'Verifying payment…',
    redirecting:      'Redirecting to Cal.com…',
    error:            'Book a Session — ₹150',
  }

  // ── Confirmed: show schedule prompt ────────────────────────────────────────
  if (step === 'booked' && finalCalUrl) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          ✅ Booking confirmed!
        </p>
        <p style={{ color: '#6b7280', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          Click below to pick your time slot on Cal.com.
        </p>

        <button
          type="button"
          onClick={() => window.location.assign(finalCalUrl)}
          style={{
            display: 'block',
            width: '100%',
            padding: '0.75rem 1.5rem',
            background: 'var(--color-primary, #6366f1)',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '0.75rem',
          }}
        >
          📅 Open Cal.com to Schedule
        </button>

        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: '0.85rem',
            textDecoration: 'underline',
            padding: 0,
          }}
        >
          Skip for now → Dashboard
        </button>
      </div>
    )
  }

  // ── Normal booking UI ─────────────────────────────────────────────────────
  return (
    <div className="booking-flow">

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      {step === 'error' && flowError && (
        <div className="booking-flow__error" role="alert">
          <p>{flowError.message}</p>
          <button
            type="button"
            onClick={() => { setStep('idle'); setFlowError(null) }}
            className="booking-flow__retry-btn"
          >
            Try again
          </button>
        </div>
      )}

      {/* ── Book / processing button ──────────────────────────────────────── */}
      <button
        type="button"
        onClick={startBookingFlow}
        disabled={isProcessing}
        className="booking-flow__btn"
        aria-busy={isProcessing}
        aria-label={isProcessing ? stepLabel[step] : 'Book a session for ₹150'}
      >
        {isProcessing && (
          <span className="booking-flow__spinner" aria-hidden="true" />
        )}
        {stepLabel[step]}
      </button>

      {/* ── Progress hint ────────────────────────────────────────────────── */}
      {isProcessing && (
        <p className="booking-flow__hint">
          Do not close this tab while processing.
        </p>
      )}
    </div>
  )
}
