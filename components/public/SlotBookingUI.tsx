'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SlotBookingUIProps {
  mentorId:   string
  mentorName: string
  mentorSlug: string
}

type Phase =
  | 'loading'     // checking for existing pending booking on mount
  | 'pending'     // user has an existing pending booking — show resume/cancel UI
  | 'pick'        // normal slot selection
  | 'confirm'     // confirmation modal
  | 'creating'    // POST in-flight
  | 'ready'       // booking created, ready to pay
  | 'cancelling'  // cancel in-flight

export default function SlotBookingUI({ mentorId, mentorName, mentorSlug }: SlotBookingUIProps) {
  const router = useRouter()

  const [phase, setPhase]               = useState<Phase>('loading')
  const [date, setDate]                 = useState<string>('')
  const [slots, setSlots]               = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookingId, setBookingId]       = useState<string | null>(null)
  const [pendingTime, setPendingTime]   = useState<string | null>(null)
  const [pendingDate, setPendingDate]   = useState<string | null>(null)
  const [lockCreatedAt, setLockCreatedAt] = useState<Date | null>(null)
  const [countdown, setCountdown]       = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)

  // ── 1. On mount: check for an existing pending booking with this mentor ──
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res  = await fetch(`/api/bookings/my?status=pending&limit=5`)
        const json = await res.json()
        if (!res.ok) { setPhase('pick'); initDate(); return }

        const bookings: any[] = json.data?.bookings ?? []
        const existing = bookings.find((b: any) => b.mentorId === mentorId)

        if (existing) {
          setBookingId(existing.id)
          setPendingTime(existing.startTime ?? null)
          setPendingDate(existing.date ? new Date(existing.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null)
          // Capture booking creation time for countdown — lock expires 10 min after createdAt
          setLockCreatedAt(existing.createdAt ? new Date(existing.createdAt) : null)
          setPhase('pending')
        } else {
          setPhase('pick')
          initDate()
        }
      } catch {
        setPhase('pick')
        initDate()
      }
    }
    checkExisting()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorId])

  const initDate = () => {
    const today     = new Date()
    const istOffset = 5.5 * 60 * 60 * 1000
    const istDate   = new Date(today.getTime() + istOffset)
    setDate(istDate.toISOString().split('T')[0])
  }

  // ── Countdown ticker (for pending + ready phases) ──
  useEffect(() => {
    if (phase !== 'pending' && phase !== 'ready') { setCountdown(null); return }
    const LOCK_TTL_MS = 10 * 60 * 1000 // 10 minutes
    const origin = lockCreatedAt ?? new Date() // fallback: now
    const expiresAt = new Date(origin.getTime() + LOCK_TTL_MS)

    const tick = () => {
      const remaining = expiresAt.getTime() - Date.now()
      if (remaining <= 0) {
        setCountdown('Slot lock expired')
        // Auto-transition: lock gone, bounce back to pick
        setPhase('pick')
        setBookingId(null)
        initDate()
        return
      }
      const m = Math.floor(remaining / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${m}:${s.toString().padStart(2, '0')} remaining`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lockCreatedAt])

  // ── 2. Fetch slots when date changes (only in pick mode) ──
  useEffect(() => {
    if (!date || phase !== 'pick') return
    setSelectedTime(null)
    setError(null)

    const fetchSlots = async () => {
      setLoadingSlots(true)
      try {
        const res  = await fetch(`/api/mentors/${mentorSlug}/slots?date=${date}`)
        const json = await res.json()
        if (res.ok) setSlots(json.data || [])
      } catch { /* ignore */ } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  }, [date, mentorSlug, phase])

  // ── 3. Create booking ──
  const confirmAndLock = async () => {
    if (!date || !selectedTime) return
    setError(null)
    setPhase('creating')

    try {
      const res  = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, date, startTime: selectedTime }),
      })
      const json = await res.json()

      if (!res.ok) {
        // Existing pending booking → redirect to payment
        if (res.status === 409 && json.code === 'EXISTING_PENDING') {
          router.push(`/payment/${json.bookingId}`)
          return
        }
        setError(json.message || json.error || 'Failed to lock slot. Please try again.')
        setPhase('pick')
        setSlots(prev => prev.filter(t => t !== selectedTime))
        setSelectedTime(null)
        return
      }

      setBookingId(json.data.bookingId)
      setLockCreatedAt(new Date()) // start countdown from now
      setPhase('ready')
    } catch (err: any) {
      setError(err.message || 'Network error')
      setPhase('pick')
    }
  }

  // ── 4. Cancel pending booking ──
  const handleCancel = async () => {
    if (!bookingId) return
    setError(null)
    setPhase('cancelling')

    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      })
      if (res.ok) {
        setBookingId(null)
        setPendingTime(null)
        setPendingDate(null)
        setLockCreatedAt(null)
        setCountdown(null)
        // Fix 4: refresh server state + go back to pick with fresh date
        router.refresh()
        setPhase('pick')
        initDate()
      } else {
        const json = await res.json()
        setError(json.error || 'Failed to cancel booking.')
        setPhase('pending')
      }
    } catch {
      setError('Network error while cancelling.')
      setPhase('pending')
    }
  }

  // ── RENDER: loading ──
  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center py-10 gap-3 text-[#9ca3af] text-sm">
        <div className="w-4 h-4 border-2 border-[#f5820a] border-t-transparent rounded-full animate-spin" />
        Checking availability…
      </div>
    )
  }

  // ── RENDER: pending — user has an existing unpaid booking ──
  if (phase === 'pending' || phase === 'cancelling') {
    const isCancelling = phase === 'cancelling'
    return (
      <div className="flex flex-col gap-5">
        <div className="p-5 bg-[#fff7ed] border border-[#f5820a]/30 rounded-2xl flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">⏳</span>
            <div className="flex-1">
              <p className="font-semibold text-[#1a1c1c] text-[15px]">Reserved slot waiting for payment</p>
              {pendingTime && (
                <p className="text-[13px] text-[#585f6c] mt-0.5">
                  {pendingDate && <>{pendingDate}, </>}
                  <strong className="text-[#f5820a]">{pendingTime} IST</strong> with {mentorName}
                </p>
              )}
              <p className="text-[12px] text-[#9ca3af] mt-1">
                Complete your payment to confirm the session, or cancel to pick a different slot.
              </p>
            </div>
          </div>
          {/* Countdown timer */}
          {countdown && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#f5820a]/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-[#f5820a] animate-pulse shrink-0" />
              <span className="text-[13px] font-mono font-semibold text-[#f5820a]">{countdown}</span>
              <span className="text-[12px] text-[#9ca3af] ml-auto">to hold slot</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={isCancelling}
            className="flex-1 py-2.5 text-sm font-semibold text-[#585f6c] border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isCancelling ? 'Cancelling…' : 'Cancel Booking'}
          </button>
          <button
            onClick={() => bookingId && router.push(`/payment/${bookingId}`)}
            disabled={isCancelling}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#f5820a] rounded-full shadow hover:bg-[#e07509] transition-colors disabled:opacity-50"
          >
            Continue to Payment →
          </button>
        </div>
      </div>
    )
  }

  // ── RENDER: ready — booking just created ──
  if (phase === 'ready') {
    return (
      <div className="flex flex-col gap-4 text-center py-6">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#1a1c1c]">Slot Reserved!</h3>
        <p className="text-[#585f6c] text-sm">
          You have <strong>10 minutes</strong> to complete your payment before the slot is released.
        </p>
        {countdown && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#fff7ed] border border-[#f5820a]/20 rounded-xl mx-auto">
            <div className="w-2 h-2 rounded-full bg-[#f5820a] animate-pulse" />
            <span className="text-[14px] font-mono font-semibold text-[#f5820a]">{countdown}</span>
          </div>
        )}
        <button
          onClick={() => bookingId && router.push(`/payment/${bookingId}`)}
          className="mt-2 px-6 py-3 bg-[#f5820a] hover:bg-[#e07509] text-white font-semibold rounded-full shadow-lg transition-transform focus:scale-95"
        >
          Proceed to Payment →
        </button>
      </div>
    )
  }

  // ── RENDER: pick / confirm / creating ──
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
          onChange={e => { setDate(e.target.value); setPhase('pick') }}
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
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
            <div className="h-10 bg-gray-200 rounded-lg" />
          </div>
        ) : slots.length === 0 ? (
          <p className="text-[13px] text-[#9ca3af] py-4">No available slots for this date.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {slots.map(time => (
              <button
                key={time}
                onClick={() => { setSelectedTime(time); setPhase('confirm') }}
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

      {/* Confirmation Modal */}
      {phase === 'confirm' && selectedTime && (
        <div className="mt-4 p-5 border border-[#ddc1af] bg-[#fff7ed] rounded-2xl flex flex-col items-center text-center shadow-lg">
          <h4 className="text-lg font-semibold text-[#1a1c1c] mb-1">Confirm Slot?</h4>
          <p className="text-sm text-[#585f6c] mb-5">
            Locking{' '}<strong className="text-[#f5820a]">{selectedTime}</strong>{' '}on{' '}{date}.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => setPhase('pick')}
              className="flex-1 py-2 text-sm font-semibold text-[#585f6c] border border-gray-300 rounded-full hover:bg-gray-100"
            >
              Go Back
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

      {/* Creating overlay */}
      {phase === 'creating' && (
        <div className="mt-4 p-5 border border-[#ddc1af] bg-white rounded-2xl flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#f5820a] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#585f6c] animate-pulse">Locking slot securely…</p>
        </div>
      )}
    </div>
  )
}
