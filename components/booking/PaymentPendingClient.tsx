'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import CompletePaymentButton from '@/components/booking/CompletePaymentButton'
import CancelBookingButton from '@/components/booking/CancelBookingButton'

export default function PaymentPendingClient({ booking, dateLabel }: { booking: any, dateLabel: string | null }) {
  const router = useRouter()
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [expired, setExpired] = useState(false)

  // 1. Back navigation protection
  useEffect(() => {
    if (booking.status === 'paid') {
      router.replace(`/booking/success/${booking.id}`)
    }
  }, [booking.status, booking.id, router])

  // 2. Timer Logic + Auto Cancel
  useEffect(() => {
    if (!booking.expiresAt || expired || booking.status !== 'pending') return

    const interval = setInterval(() => {
      const diff = new Date(booking.expiresAt).getTime() - Date.now()
      setTimeLeft(Math.max(0, diff))

      if (diff <= 0) {
        clearInterval(interval)
        setExpired(true)
        
        // Backend cleanup
        fetch('/api/bookings/cancel', {
          method: 'POST',
          body: JSON.stringify({ bookingId: booking.id }),
          headers: { 'Content-Type': 'application/json' }
        }).catch(console.error)
      }
    }, 1000)

    // Initial check
    const diff = new Date(booking.expiresAt).getTime() - Date.now()
    if (diff <= 0) {
      setExpired(true)
    } else {
      setTimeLeft(diff)
    }

    return () => clearInterval(interval)
  }, [booking.expiresAt, booking.id, booking.status, expired])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const amountFormatted = booking.payment?.amount ? booking.payment.amount / 100 : 150

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-3xl p-8 md:p-10 shadow-[0_4px_40px_rgba(0,0,0,0.03)]">
        <h1 className="text-[32px] font-['Newsreader'] italic text-[#1a1c1c] mb-2 text-center">Complete your booking</h1>
        <p className="text-[#585f6c] text-[15px] text-center mb-8 pb-8 border-b border-[rgba(221,193,175,0.2)]">
          Review your session details and complete the payment to secure your slot.
        </p>

        {/* DETAILS FIRST */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex justify-between items-center bg-[#f9f9f9] p-4 rounded-2xl">
            <span className="text-[#9ca3af] text-[13px] font-semibold uppercase tracking-wider">Mentor</span>
            <span className="text-[#1a1c1c] font-semibold">{booking.mentor.user.name}</span>
          </div>
          {dateLabel && (
            <div className="flex justify-between items-center bg-[#f9f9f9] p-4 rounded-2xl">
              <span className="text-[#9ca3af] text-[13px] font-semibold uppercase tracking-wider">Schedule</span>
              <span className="text-[#1a1c1c] font-semibold">{dateLabel}</span>
            </div>
          )}
          <div className="flex justify-between items-center bg-[#f9f9f9] p-4 rounded-2xl">
            <span className="text-[#9ca3af] text-[13px] font-semibold uppercase tracking-wider">Amount</span>
            <span className="text-[#f5820a] font-bold text-lg">₹{amountFormatted}</span>
          </div>
        </div>

        {/* WARNING BLOCK - MERGED */}
        <div className="flex flex-col mb-8 p-3 rounded-lg bg-orange-50 border border-orange-200">
          <p className="text-sm text-[#934b00] font-medium mb-1">
            ⚠️ Your session is confirmed only after payment
          </p>
          <div className="text-sm text-[#934b00] flex items-center justify-between">
            <span>⏳ Complete payment within 10 minutes to hold your slot</span>
            {timeLeft !== null && !expired && (
              <span className="font-bold bg-white px-2 py-0.5 rounded-md border border-orange-200 text-orange-600">
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
        </div>

        {/* EXPIRED vs ACTIVE */}
        {expired ? (
          <div className="flex flex-col items-center mt-2 animate-in fade-in zoom-in duration-300">
            <p className="text-red-500 font-medium mb-4">❌ This slot is no longer available</p>
            <button 
              onClick={() => router.replace(`/mentors/${booking.mentor.slug}`)}
              className="px-6 py-3 bg-white border border-gray-200 text-gray-800 rounded-xl font-semibold text-sm hover:bg-gray-50 transition"
            >
              Choose another slot
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="w-full mb-4">
              <CompletePaymentButton 
                bookingId={booking.id} 
                sessionToken={booking.sessionToken} 
                mentorSlug={booking.mentor.slug} 
                amount={amountFormatted}
              />
            </div>
            <div className="flex justify-center mt-2">
              <CancelBookingButton
                bookingId={booking.id}
                mentorSlug={booking.mentor.slug ?? ''}
              />
            </div>
            <p className="text-center text-[#9ca3af] text-[12px] mt-6">
              Payments are secured by Razorpay
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
