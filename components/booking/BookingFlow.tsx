'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * PAYMENT_ENABLED = false → stops after booking creation, shows confirmation.
 * Flip to true when Razorpay credentials are configured.
 */
import { useBookingFlow, FlowStep, FlowError } from '@/hooks/useBookingFlow'

interface BookingFlowProps {
  mentorId: string
  mentorName: string
  calendlyLink?: string
  studentName?: string | null
  studentEmail?: string | null
}

export function BookingFlow({ mentorId, mentorName, calendlyLink, studentName, studentEmail }: BookingFlowProps) {
  const {
    step,
    setStep,
    flowError,
    setFlowError,
    isProcessing,
    startBookingFlow
  } = useBookingFlow({ mentorId, mentorName, calendlyLink })

  // ── Step label ─────────────────────────────────────────────────────────────
  const stepLabel: Record<FlowStep, string> = {
    idle:             'Book a Session — ₹150',
    creating_booking: 'Creating booking…',
    booked:           'Redirecting to schedule…',
    creating_order:   'Preparing payment…',
    razorpay_open:    'Complete payment in Razorpay…',
    verifying:        'Verifying payment…',
    redirecting:      'Redirecting to Calendly…',
    error:            'Book a Session — ₹150',
  }

  return (
    <div className="booking-flow">

      {/* ── Bypass success state ─────────────────────────────────────────── */}
      {step === 'booked' && (
        <div className="booking-flow__success" role="status">
          <p className="booking-flow__success-msg">
            ✅ Booking created! Redirecting to schedule your session…
          </p>
        </div>
      )}

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

      {/* ── Book / processing button (hidden on success) ──────────────────── */}
      {step !== 'booked' && (
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
      )}

      {/* ── Progress hint ────────────────────────────────────────────────── */}
      {isProcessing && (
        <p className="booking-flow__hint">
          Do not close this tab while processing.
        </p>
      )}

      {/* ── Calendly redirect state ───────────────────────────────────────── */}
      {step === 'redirecting' && (
        <p className="booking-flow__hint">
          ✅ Payment confirmed! Redirecting to Calendly to pick your time slot…
        </p>
      )}
    </div>
  )
}
