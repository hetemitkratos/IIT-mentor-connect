'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * PAYMENT_ENABLED = false → stops after booking creation, shows confirmation.
 * Flip to true when Razorpay credentials are configured.
 */
const PAYMENT_ENABLED = false

interface BookingFlowProps {
  mentorId:     string
  mentorName:   string
  calendlyLink: string   // mentor's Calendly scheduling URL
  studentName?: string | null
  studentEmail?: string | null
}

type FlowStep =
  | 'idle'
  | 'creating_booking'
  | 'booked'            // payment bypass success state
  | 'creating_order'
  | 'razorpay_open'
  | 'verifying'
  | 'redirecting'
  | 'error'


interface FlowError {
  message: string
  code?: string
}

// ── Razorpay window type ────────────────────────────────────────────────────
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key:         string
  amount:      number
  currency:    string
  order_id:    string
  name:        string
  description: string
  handler:     (response: RazorpayResponse) => void
  modal:       { ondismiss: () => void }
  prefill?:    { name?: string; email?: string }
  theme?:      { color?: string }
}

interface RazorpayResponse {
  razorpay_order_id:   string
  razorpay_payment_id: string
  razorpay_signature:  string
}

interface RazorpayInstance {
  open: () => void
}

// ── Razorpay SDK loader ─────────────────────────────────────────────────────
function loadRazorpaySDK(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script    = document.createElement('script')
    script.src      = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload   = () => resolve()
    script.onerror  = () => reject(new Error('Failed to load Razorpay SDK'))
    document.head.appendChild(script)
  })
}

export function BookingFlow({ mentorId, mentorName, calendlyLink, studentName, studentEmail }: BookingFlowProps) {
  const router = useRouter()

  const [step, setStep]               = useState<FlowStep>('idle')
  const [flowError, setFlowError]     = useState<FlowError | null>(null)
  const [calendlyUrl, setCalendlyUrl] = useState<string>('')
  // Fix #6: Retain bookingId across retries — avoids creating duplicate bookings on payment cancel
  const [savedBookingId, setSavedBookingId] = useState<string | null>(null)
  // sessionToken returned from /api/bookings/create — used as utm_source for Calendly webhook linking
  const [sessionToken, setSessionToken]     = useState<string | null>(null)

  const isProcessing = step === 'creating_booking' || step === 'creating_order' || step === 'razorpay_open' || step === 'verifying' || step === 'redirecting'

  const handleError = useCallback((message: string, code?: string) => {
    setStep('error')
    setFlowError({ message, code })
  }, [])

  const startBookingFlow = useCallback(async () => {
    // Fix #7: Loading lock — prevent double clicks
    if (isProcessing) return

    setStep('creating_booking')
    setFlowError(null)

    try {
      let bookingId = savedBookingId
      let currentToken = sessionToken

      // ── Step 1: Create booking (skipped on retry if bookingId already exists) ─
      if (!bookingId) {
        setStep('creating_booking')
        const bookingRes = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mentorId }),
        })
        const bookingJson = await bookingRes.json()
        if (!bookingJson.success) {
          handleError(bookingJson.error ?? 'Failed to create booking')
          return
        }
        bookingId    = bookingJson.data.bookingId    as string
        currentToken = bookingJson.data.sessionToken as string
        setSavedBookingId(bookingId)
        setSessionToken(currentToken)
      }

      // ── PAYMENT BYPASS ───────────────────────────────────────────────────
      // Remove this block (or flip PAYMENT_ENABLED to true) when Razorpay
      // credentials are configured in .env.local.
      if (!PAYMENT_ENABLED) {
        setStep('booked')

        // sessionToken is in React state — set by setSessionToken() when the booking was first created.
        // On retry paths, the if(!bookingId) block is skipped but sessionToken state is already populated.
        console.log('[BOOKING_REDIRECT] calendlyLink:', calendlyLink)
        console.log('[BOOKING_REDIRECT] sessionToken:', sessionToken)

        setTimeout(() => {
          if (!calendlyLink) {
            console.warn('[BOOKING_REDIRECT] No calendlyLink — falling back to /dashboard')
            router.push('/dashboard')
            return
          }
          // Append prefill data and utm_source so the Calendly webhook can link back to this booking
          const separator = calendlyLink.includes('?') ? '&' : '?'
          const nameParam = studentName ? `&name=${encodeURIComponent(studentName)}` : ''
          const emailParam = studentEmail ? `&email=${encodeURIComponent(studentEmail)}` : ''
          window.location.href = `${calendlyLink}${separator}utm_source=${currentToken ?? ''}${nameParam}${emailParam}`
        }, 1500)
        return
      }
      // ────────────────────────────────────────────────────────────────────

      // ── Step 2: Create Razorpay order ────────────────────────────────────
      setStep('creating_order')
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      const orderJson = await orderRes.json()
      if (!orderJson.success) {
        handleError(orderJson.error ?? 'Failed to create payment order')
        return
      }
      const { orderId, amount, currency, keyId, calendlyUrl: cUrl } = orderJson.data
      setCalendlyUrl(cUrl)

      // ── Step 3: Load Razorpay SDK + open checkout ────────────────────────
      setStep('razorpay_open')
      await loadRazorpaySDK()

      await new Promise<void>((resolve, reject) => {
        const rz = new window.Razorpay({
          key:         keyId,
          amount,
          currency,
          order_id:    orderId,
          name:        'IIT Mentor Connect',
          description: `20-min session with ${mentorName}`,
          handler: async (response: RazorpayResponse) => {
            // ── Step 4: Verify payment ─────────────────────────────────────
            setStep('verifying')
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyJson = await verifyRes.json()
            if (!verifyJson.success) {
              reject(new Error(verifyJson.error ?? 'Payment verification failed'))
              return
            }

            // ── Step 5: Redirect to Calendly (utm_source=sessionToken) ─────
            setStep('redirecting')
            const separator = cUrl.includes('?') ? '&' : '?'
            const nameParam = studentName ? `&name=${encodeURIComponent(studentName)}` : ''
            const emailParam = studentEmail ? `&email=${encodeURIComponent(studentEmail)}` : ''
            window.location.href = `${cUrl}${separator}utm_source=${currentToken ?? ''}${nameParam}${emailParam}`
            resolve()
          },
          modal: {
            // Fix #8: Handle modal closed — user dismissed Razorpay without paying
            ondismiss: () => {
              reject(new Error('PAYMENT_CANCELLED'))
            },
          },
          theme: { color: '#6366f1' },
        })
        rz.open()
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error'

      // Fix #8: Distinguish failure types
      if (message === 'PAYMENT_CANCELLED') {
        handleError('Payment was cancelled. You can try again when you\'re ready.')
      } else {
        handleError(message)
      }
    }
  }, [isProcessing, mentorId, mentorName, handleError])

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
