'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

const PAYMENT_ENABLED = false

export type FlowStep =
  | 'idle'
  | 'creating_booking'
  | 'booked'
  | 'creating_order'
  | 'razorpay_open'
  | 'verifying'
  | 'redirecting'
  | 'error'

export interface FlowError {
  message: string
  code?: string
}

declare global {
  interface Window {
    Razorpay: new (options: any) => any
  }
}

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

export interface UseBookingFlowProps {
  mentorId: string
  mentorName: string
  calendlyLink?: string
}

export function useBookingFlow({ mentorId, mentorName, calendlyLink }: UseBookingFlowProps) {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [step, setStep]               = useState<FlowStep>('idle')
  const [flowError, setFlowError]     = useState<FlowError | null>(null)
  const [calendlyUrl, setCalendlyUrl] = useState<string>('')
  const [savedBookingId, setSavedBookingId] = useState<string | null>(null)
  const [sessionToken, setSessionToken]     = useState<string | null>(null)

  const isProcessing = step === 'creating_booking' || step === 'creating_order' || step === 'razorpay_open' || step === 'verifying' || step === 'redirecting'

  const handleError = useCallback((message: string, code?: string) => {
    setStep('error')
    setFlowError({ message, code })
  }, [])

  const startBookingFlow = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    
    // Redirect to login if user is not authenticated
    if (status === 'unauthenticated') {
      router.push(`/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }

    if (isProcessing) return

    setStep('creating_booking')
    setFlowError(null)

    try {
      let bookingId = savedBookingId
      let currentToken = sessionToken

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

      if (!PAYMENT_ENABLED) {
        setStep('booked')
        setTimeout(() => {
          if (!calendlyLink) {
            router.push('/dashboard')
            return
          }
          const separator = calendlyLink.includes('?') ? '&' : '?'
          const studentName = session?.user?.name
          const studentEmail = session?.user?.email
          const nameParam = studentName ? `&name=${encodeURIComponent(studentName)}` : ''
          const emailParam = studentEmail ? `&email=${encodeURIComponent(studentEmail)}` : ''
          window.location.href = `${calendlyLink}${separator}utm_source=${currentToken ?? ''}${nameParam}${emailParam}`
        }, 1500)
        return
      }

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
          handler: async (response: any) => {
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

            setStep('redirecting')
            const separator = cUrl.includes('?') ? '&' : '?'
            const studentName = session?.user?.name
            const studentEmail = session?.user?.email
            const nameParam = studentName ? `&name=${encodeURIComponent(studentName)}` : ''
            const emailParam = studentEmail ? `&email=${encodeURIComponent(studentEmail)}` : ''
            window.location.href = `${cUrl}${separator}utm_source=${currentToken ?? ''}${nameParam}${emailParam}`
            resolve()
          },
          modal: {
            ondismiss: () => reject(new Error('PAYMENT_CANCELLED')),
          },
          theme: { color: '#6366f1' },
        })
        rz.open()
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error'
      if (message === 'PAYMENT_CANCELLED') {
        handleError('Payment was cancelled. You can try again when you\'re ready.')
      } else {
        handleError(message)
      }
    }
  }, [isProcessing, mentorId, mentorName, calendlyLink, sessionToken, savedBookingId, handleError, router, status, session])

  return {
    step,
    setStep,
    flowError,
    setFlowError,
    isProcessing,
    startBookingFlow
  }
}
