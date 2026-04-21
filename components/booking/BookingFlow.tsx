'use client'

import { useBookingFlow } from '@/hooks/useBookingFlow'

interface BookingFlowProps {
  mentorId:    string
  mentorName:  string
  studentName?:  string | null
  studentEmail?: string | null
}

export function BookingFlow({ mentorId, mentorName }: BookingFlowProps) {
  const { step, setStep, flowError, setFlowError, isProcessing, startBookingFlow } =
    useBookingFlow({ mentorId, mentorName })

  const buttonLabel =
    step === 'creating_booking' ? 'Creating booking…' :
    step === 'booked'           ? 'Booked!' :
    'Book a Session — ₹150'

  return (
    <div className="booking-flow">
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

      <button
        type="button"
        onClick={startBookingFlow}
        disabled={isProcessing}
        className="booking-flow__btn"
        aria-busy={isProcessing}
        aria-label={isProcessing ? buttonLabel : 'Book a session for ₹150'}
      >
        {isProcessing && <span className="booking-flow__spinner" aria-hidden="true" />}
        {buttonLabel}
      </button>

      {isProcessing && (
        <p className="booking-flow__hint">Do not close this tab while processing.</p>
      )}
    </div>
  )
}
