'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SlotBookingUIProps {
  mentorId: string
  mentorName: string
  availableSlots: Record<string, string[]>
}

export default function SlotBookingUI({ mentorId, mentorName, availableSlots }: SlotBookingUIProps) {
  const router = useRouter()
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableDays = Object.keys(availableSlots)

  const handleDaySelect = (day: string) => {
    setSelectedDay(day)
    setSelectedSlot(null) // reset slot on day change
    setError(null)
  }

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot)
    setError(null)
  }

  const handleBook = async () => {
    if (!selectedDay || !selectedSlot) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, selectedDay, selectedSlot }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Failed to create booking. Please try again.')
        return
      }

      router.push(`/payment/${data.bookingId}`)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (availableDays.length === 0) {
    return (
      <div className="p-5 rounded-2xl border border-[rgba(221,193,175,0.2)] bg-[#fafafa] text-center">
        <p className="text-[13px] text-[#9ca3af]">This mentor hasn&apos;t configured their availability yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: Choose Day */}
      <div>
        <p className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#585f6c] mb-3">
          Step 1 — Choose a Day
        </p>
        <div className="flex flex-wrap gap-2">
          {availableDays.map(day => (
            <button
              key={day}
              onClick={() => handleDaySelect(day)}
              className={`px-5 py-2 text-sm font-semibold rounded-full border transition-all ${
                selectedDay === day
                  ? 'bg-[#f5820a] text-white border-[#f5820a] shadow-[0_4px_14px_rgba(245,130,10,0.3)]'
                  : 'bg-white text-[#585f6c] border-[rgba(221,193,175,0.4)] hover:border-[#f5820a] hover:text-[#f5820a]'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Choose Slot */}
      {selectedDay && (
        <div>
          <p className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#585f6c] mb-3">
            Step 2 — Choose a Time Slot{' '}
            <span className="text-[#f5820a] normal-case tracking-normal font-normal">({selectedDay})</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {availableSlots[selectedDay].map(slot => (
              <button
                key={slot}
                onClick={() => handleSlotSelect(slot)}
                className={`px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${
                  selectedSlot === slot
                    ? 'bg-[#191c1d] text-white border-[#191c1d]'
                    : 'bg-white text-[#585f6c] border-[rgba(221,193,175,0.4)] hover:border-[#585f6c]'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected summary */}
      {selectedDay && selectedSlot && (
        <div className="px-4 py-3 rounded-xl bg-[#fff7ed] border border-[rgba(245,130,10,0.2)]">
          <p className="text-[13px] text-[#934b00] font-medium">
            📅 {selectedDay} at {selectedSlot} — 30-minute session with {mentorName}
          </p>
          <p className="text-[11px] text-[#b45309] mt-0.5">Session fee: ₹150 &nbsp;·&nbsp; Google Meet</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-[#fff1f2] border border-[rgba(186,26,26,0.2)]">
          <p className="text-[13px] text-[#ba1a1a] font-medium">{error}</p>
        </div>
      )}

      {/* Book CTA */}
      <button
        onClick={handleBook}
        disabled={!selectedDay || !selectedSlot || loading}
        className={`w-full py-3.5 text-[15px] font-semibold rounded-full transition-all ${
          !selectedDay || !selectedSlot || loading
            ? 'bg-[rgba(245,130,10,0.3)] text-[#d96e08] cursor-not-allowed'
            : 'bg-[#f5820a] text-white hover:bg-[#e07509] shadow-[0_6px_20px_rgba(245,130,10,0.35)]'
        }`}
      >
        {loading ? 'Booking…' : 'Book Session — ₹150'}
      </button>
      <p className="text-[11px] text-[#9ca3af] text-center -mt-3">
        You&apos;ll be redirected to complete payment. Slot held for 30 minutes.
      </p>
    </div>
  )
}
