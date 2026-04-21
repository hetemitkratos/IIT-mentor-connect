'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export type FlowStep =
  | 'idle'
  | 'creating_booking'
  | 'booked'
  | 'error'

export interface FlowError {
  message: string
  code?: string
}

export interface UseBookingFlowProps {
  mentorId:    string
  mentorName:  string
}

/**
 * Simplified booking flow: create booking → redirect to /payment/[id]
 * Calendly scheduling is handled inline via the SlotBookingUI iframe embed.
 */
export function useBookingFlow({ mentorId }: UseBookingFlowProps) {
  const router = useRouter()
  const { status } = useSession()

  const [step, setStep]           = useState<FlowStep>('idle')
  const [flowError, setFlowError] = useState<FlowError | null>(null)

  const isProcessing = step === 'creating_booking'

  const handleError = useCallback((message: string, code?: string) => {
    setStep('error')
    setFlowError({ message, code })
  }, [])

  const startBookingFlow = useCallback(async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    if (status === 'unauthenticated') {
      router.push(`/signin?callbackUrl=${encodeURIComponent(window.location.href)}`)
      return
    }

    if (isProcessing) return
    setStep('creating_booking')
    setFlowError(null)

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId }),
      })
      const data = await res.json()
      if (!data.success) {
        handleError(data.error ?? 'Failed to create booking')
        return
      }
      setStep('booked')
      router.push(`/payment/${data.data.bookingId}`)
    } catch (err: unknown) {
      handleError(err instanceof Error ? err.message : 'Unexpected error')
    }
  }, [isProcessing, mentorId, handleError, router, status])

  return {
    step,
    setStep,
    flowError,
    setFlowError,
    isProcessing,
    startBookingFlow,
    finalCalUrl: null,
  }
}
