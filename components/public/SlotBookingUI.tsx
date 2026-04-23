'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SlotBookingUIProps {
  mentorId:   string
  mentorName: string
  mentorSlug: string
}

export default function SlotBookingUI({ mentorId, mentorName, mentorSlug }: SlotBookingUIProps) {
  const router = useRouter()

  const [date, setDate] = useState<string>('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  // Phase state: 'pick' (choosing date/time) -> 'confirm' (modal) -> 'creating' (post req) -> 'ready' (can pay)
  const [phase, setPhase] = useState<'pick' | 'confirm' | 'creating' | 'ready'>('pick')
  const [bookingId, setBookingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Initialize date strictly to today IST logically
  useEffect(() => {
    const today = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(today.getTime() + istOffset);
    setDate(istDate.toISOString().split('T')[0]);
  }, [])

  useEffect(() => {
    if (!date) return;
    
    // reset selection if date changes
    setSelectedTime(null);
    setPhase('pick');
    setBookingId(null);
    setError(null);

    const fetchSlots = async () => {
      setLoadingSlots(true)
      try {
        const res = await fetch(`/api/mentors/${mentorSlug}/slots?date=${date}`)
        const json = await res.json()
        if (res.ok) {
          setSlots(json.data || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingSlots(false)
      }
    }
    
    fetchSlots()
  }, [date, mentorSlug])

  const handleSlotClick = (time: string) => {
    setSelectedTime(time)
    setPhase('confirm') // Trigger confirmation modal logically
  }

  const confirmAndLock = async () => {
    if (!date || !selectedTime) return
    setError(null)
    setPhase('creating')
    
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mentorId,
          date,
          startTime: selectedTime,
        }),
      })
      
      const json = await res.json()
      
      if (!res.ok) {
        if (res.status === 401) {
          setError('Please login to book a session.')
        } else if (res.status === 409) {
          setError('That slot was just taken. Please select another.')
        } else {
          setError(json.error || 'Failed to lock slot.')
        }
        setPhase('pick')
        // Re-fetch slots to clear the taken one
        setSlots(prev => prev.filter(t => t !== selectedTime))
        setSelectedTime(null)
        return
      }

      setBookingId(json.data.bookingId)
      setPhase('ready')
      
    } catch (err: any) {
      setError(err.message || 'Network error')
      setPhase('pick')
    }
  }

  const navigateToPayment = () => {
    if (bookingId) {
      router.push(`/payment/${bookingId}`)
    }
  }

  if (phase === 'ready') {
    return (
      <div className="flex flex-col gap-4 text-center py-6">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#1a1c1c]">Slot Locked Locally!</h3>
        <p className="text-[#585f6c] text-sm">
          You have <strong>10 minutes</strong> to complete your payment before the slot is released.
        </p>

        <button
          onClick={navigateToPayment}
          className="mt-4 px-6 py-3 bg-[#f5820a] hover:bg-[#e07509] text-white font-semibold rounded-full shadow-lg transition-transform focus:scale-95"
        >
          Proceed to Payment →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* Date Picker */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#585f6c]">
          Select Date
        </label>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().split('T')[0]}
          onChange={e => setDate(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-[rgba(221,193,175,0.4)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30"
        />
      </div>

      {/* Slots Grid */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#585f6c]">
          Available Times (IST)
        </label>

        {loadingSlots ? (
          <div className="grid grid-cols-3 gap-2 animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
            <div className="h-10 bg-gray-200 rounded-lg"></div>
          </div>
        ) : slots.length === 0 ? (
          <p className="text-[13px] text-[#9ca3af] py-4">No available slots for this date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {slots.map(time => (
              <button
                key={time}
                onClick={() => handleSlotClick(time)}
                className="py-2.5 px-1 rounded-xl text-[14px] font-semibold transition-all duration-200 bg-white border border-[rgba(221,193,175,0.5)] text-[#1a1c1c] hover:border-[#f5820a] hover:text-[#f5820a]"
              >
                {time}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Confirmation Modal Logic */}
      {phase === 'confirm' && selectedTime && (
        <div className="mt-4 p-5 border border-[#ddc1af] bg-[#fff7ed] rounded-2xl flex flex-col items-center text-center shadow-lg transition-all">
          <h4 className="text-lg font-semibold text-[#1a1c1c] mb-1">Confirm Slot?</h4>
          <p className="text-sm text-[#585f6c] mb-5">
            Locking {" "} <strong className="text-[#f5820a]">{selectedTime}</strong> {" "} on {" "} {date}.
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setPhase('pick')}
              className="flex-1 py-2 text-sm font-semibold text-[#585f6c] border border-gray-300 rounded-full hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              onClick={confirmAndLock}
              className="flex-1 py-2 text-sm font-semibold text-white bg-[#1a1c1c] rounded-full shadow-md hover:bg-black"
            >
              Confirm & Lock
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {phase === 'creating' && (
        <div className="mt-4 p-5 border border-[#ddc1af] bg-white rounded-2xl flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#f5820a] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-[#585f6c] animate-pulse">Locking slot securely...</p>
        </div>
      )}
    </div>
  )
}
