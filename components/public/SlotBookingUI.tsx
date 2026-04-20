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
  const [step, setStep] = useState<'book' | 'confirm' | 'loading'>('book')
  const [error, setError] = useState<string | null>(null)

  const handleOpenCal = () => {
    if (!calLink) return
    window.open(calLink, '_blank', 'noopener,noreferrer')
    // Move to confirmation step after opening
    setStep('confirm')
  }

  const handleConfirm = async () => {
    setStep('loading')
    setError(null)

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to create booking. Please try again.')
        setStep('confirm')
        return
      }

      router.push(`/payment/${data.bookingId}`)
    } catch {
      setError('Network error. Please try again.')
      setStep('confirm')
    }
  }

  const handleBack = () => {
    setStep('book')
    setError(null)
  }

  // No Cal link set
  if (!calLink) {
    return (
      <div className="p-5 rounded-2xl border border-[rgba(221,193,175,0.2)] bg-[#fafafa] text-center">
        <p className="text-[13px] text-[#9ca3af]">
          This mentor hasn&apos;t set up their scheduling link yet. Check back soon.
        </p>
      </div>
    )
  }

  // Step 1: Prompt to open Cal.com
  if (step === 'book') {
    return (
      <div className="flex flex-col gap-5">
        {/* Info banner */}
        <div className="px-4 py-3.5 rounded-xl bg-[#fff7ed] border border-[rgba(245,130,10,0.2)]">
          <p className="text-[13px] text-[#934b00] font-semibold mb-0.5">How it works</p>
          <ol className="list-decimal list-inside text-[12px] text-[#b45309] space-y-1 mt-1">
            <li>Open {mentorName}&apos;s booking page on Cal.com</li>
            <li>Pick a time that works for you</li>
            <li>Return here and complete payment to confirm</li>
          </ol>
        </div>

        {/* Warning */}
        <div className="px-4 py-3 rounded-xl bg-[#f9fafb] border border-[rgba(221,193,175,0.2)] flex items-start gap-2.5">
          <span className="text-base shrink-0 mt-px">⚠️</span>
          <p className="text-[12px] text-[#585f6c] leading-relaxed">
            Your session is <strong>only confirmed after payment</strong>. Please complete payment within 30 minutes.
          </p>
        </div>

        <button
          onClick={handleOpenCal}
          className="w-full py-3.5 text-[15px] font-semibold rounded-full bg-[#f5820a] text-white hover:bg-[#e07509] shadow-[0_6px_20px_rgba(245,130,10,0.35)] transition-all"
        >
          Book on Cal.com →
        </button>
        <p className="text-[11px] text-[#9ca3af] text-center -mt-2">
          Opens Cal.com in a new tab · ₹150 session fee
        </p>
      </div>
    )
  }

  // Step 2: Confirmation after returning
  if (step === 'confirm' || step === 'loading') {
    return (
      <div className="flex flex-col gap-5">
        {/* Success-ish indicator */}
        <div className="px-4 py-3.5 rounded-xl bg-[#f0fdf4] border border-[rgba(22,163,74,0.2)]">
          <p className="text-[13px] text-[#15803d] font-semibold mb-0.5">Did you schedule your session?</p>
          <p className="text-[12px] text-[#16a34a] leading-relaxed mt-1">
            Once you&apos;ve picked a slot on Cal.com, complete payment below to confirm your booking.
          </p>
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

        {error && (
          <div className="px-4 py-3 rounded-xl bg-[#fff1f2] border border-[rgba(186,26,26,0.2)]">
            <p className="text-[13px] text-[#ba1a1a] font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={step === 'loading'}
          className={`w-full py-3.5 text-[15px] font-semibold rounded-full transition-all ${
            step === 'loading'
              ? 'bg-[rgba(245,130,10,0.3)] text-[#d96e08] cursor-not-allowed'
              : 'bg-[#f5820a] text-white hover:bg-[#e07509] shadow-[0_6px_20px_rgba(245,130,10,0.35)]'
          }`}
        >
          {step === 'loading' ? 'Creating booking…' : 'Yes, I\'ve scheduled — Continue to Payment →'}
        </button>

        <button
          onClick={handleOpenCal}
          className="text-[12px] text-[#9ca3af] hover:text-[#585f6c] transition-colors text-center underline"
        >
          Open Cal.com again
        </button>

        <button
          onClick={handleBack}
          className="text-[12px] text-[#9ca3af] hover:text-[#585f6c] transition-colors text-center"
        >
          ← Go back
        </button>
      </div>
    )
  }

  return null
}
