'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface SlotBookingUIProps {
  mentorId:   string
  mentorName: string
  mentorSlug: string
}

type Phase =
  | 'loading'     // checking for existing pending booking on mount
  | 'pending'     // user has an existing pending booking — show resume/cancel UI
  | 'calendar'    // monthly calendar picker
  | 'slots'       // time slot grid for selected date
  | 'confirm'     // confirmation modal
  | 'creating'    // POST in-flight
  | 'ready'       // booking created, ready to pay
  | 'cancelling'  // cancel in-flight

// ── Calendar helpers ───────────────────────────────────────────────────────

function getISTDateString(d: Date): string {
  // Format a JS Date as YYYY-MM-DD in IST
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000)
  return ist.toISOString().split('T')[0]
}

function todayIST(): string {
  return getISTDateString(new Date())
}

function getMonthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number): number {
  // 0=Sun 1=Mon …
  return new Date(year, month, 1).getDay()
}

const WEEKDAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── Component ──────────────────────────────────────────────────────────────

export default function SlotBookingUI({ mentorId, mentorName, mentorSlug }: SlotBookingUIProps) {
  const router = useRouter()

  // ── State ──
  const [phase, setPhase]               = useState<Phase>('loading')
  const [slots, setSlots]               = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [bookingId, setBookingId]       = useState<string | null>(null)
  const [pendingTime, setPendingTime]   = useState<string | null>(null)
  const [pendingDate, setPendingDate]   = useState<string | null>(null)
  const [lockCreatedAt, setLockCreatedAt] = useState<Date | null>(null)
  const [countdown, setCountdown]       = useState<string | null>(null)
  const [error, setError]               = useState<string | null>(null)

  // Calendar state
  const now = new Date()
  const [calYear, setCalYear]     = useState(now.getFullYear())
  const [calMonth, setCalMonth]   = useState(now.getMonth())
  const [availability, setAvailability] = useState<Record<string, boolean>>({})
  const [loadingCal, setLoadingCal]     = useState(false)

  // ── 1. On mount: check for existing pending booking ──
  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res  = await fetch(`/api/bookings/my?status=pending&limit=5`)
        const json = await res.json()
        if (!res.ok) { setPhase('calendar'); fetchCalendar(calYear, calMonth); return }

        const bookings: any[] = json.data?.bookings ?? []
        const existing = bookings.find((b: any) => b.mentorId === mentorId)

        if (existing) {
          setBookingId(existing.id)
          setPendingTime(existing.startTime ?? null)
          setPendingDate(existing.date
            ? new Date(existing.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
            : null
          )
          setLockCreatedAt(existing.createdAt ? new Date(existing.createdAt) : null)
          setPhase('pending')
        } else {
          setPhase('calendar')
          fetchCalendar(calYear, calMonth)
        }
      } catch {
        setPhase('calendar')
        fetchCalendar(calYear, calMonth)
      }
    }
    checkExisting()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorId])

  // ── Calendar availability fetch ──
  const fetchCalendar = useCallback(async (year: number, month: number) => {
    setLoadingCal(true)
    try {
      const monthKey = getMonthKey(year, month)
      const res  = await fetch(`/api/mentors/${mentorSlug}/availability/calendar?month=${monthKey}`)
      const json = await res.json()
      if (res.ok) setAvailability(json.data || {})
    } catch { /* keep stale */ } finally {
      setLoadingCal(false)
    }
  }, [mentorSlug])

  // Refetch calendar when month changes
  useEffect(() => {
    if (phase === 'calendar' || phase === 'slots') {
      fetchCalendar(calYear, calMonth)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calYear, calMonth])

  // ── Fetch slots for selected date ──
  useEffect(() => {
    if (!selectedDate || phase !== 'slots') return
    setSlots([])
    setSelectedTime(null)
    setError(null)

    const fetchSlots = async () => {
      setLoadingSlots(true)
      try {
        const res  = await fetch(`/api/mentors/${mentorSlug}/slots?date=${selectedDate}`)
        const json = await res.json()
        if (res.ok) setSlots(json.data || [])
      } catch { /* ignore */ } finally {
        setLoadingSlots(false)
      }
    }
    fetchSlots()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, mentorSlug, phase])

  // ── Countdown ticker ──
  useEffect(() => {
    if (phase !== 'pending' && phase !== 'ready') { setCountdown(null); return }
    const LOCK_TTL_MS = 10 * 60 * 1000
    const origin    = lockCreatedAt ?? new Date()
    const expiresAt = new Date(origin.getTime() + LOCK_TTL_MS)

    const tick = () => {
      const remaining = expiresAt.getTime() - Date.now()
      if (remaining <= 0) {
        setCountdown('Slot lock expired')
        setPhase('calendar')
        setBookingId(null)
        fetchCalendar(calYear, calMonth)
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

  // ── 3. Create booking ──
  const confirmAndLock = async () => {
    if (!selectedDate || !selectedTime) return
    setError(null)
    setPhase('creating')

    try {
      const res  = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, date: selectedDate, startTime: selectedTime }),
      })
      const json = await res.json()

      if (!res.ok) {
        if (res.status === 409 && json.code === 'EXISTING_PENDING') {
          router.push(`/payment/${json.bookingId}`)
          return
        }
        setError(json.message || json.error || 'Failed to lock slot. Please try again.')
        setPhase('slots')
        setSlots(prev => prev.filter(t => t !== selectedTime))
        setSelectedTime(null)
        return
      }

      setBookingId(json.data.bookingId)
      setLockCreatedAt(new Date())
      setPhase('ready')
    } catch (e: any) {
      setError(e.message || 'Network error')
      setPhase('slots')
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
        setBookingId(null); setPendingTime(null); setPendingDate(null)
        setLockCreatedAt(null); setCountdown(null)
        router.refresh()
        setPhase('calendar')
        fetchCalendar(calYear, calMonth)
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

  // ── Calendar navigation ──
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  const handleDayClick = (dateStr: string) => {
    if (!availability[dateStr]) return // not available
    if (dateStr < todayIST()) return    // past
    setSelectedDate(dateStr)
    setPhase('slots')
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

  // ── RENDER: pending ──
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
                Complete payment to confirm, or cancel to pick a different slot.
              </p>
            </div>
          </div>
          {countdown && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#f5820a]/20 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-[#f5820a] animate-pulse shrink-0" />
              <span className="text-[13px] font-mono font-semibold text-[#f5820a]">{countdown}</span>
              <span className="text-[12px] text-[#9ca3af] ml-auto">to hold slot</span>
            </div>
          )}
        </div>
        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>}
        <div className="flex gap-3">
          <button onClick={handleCancel} disabled={isCancelling}
            className="flex-1 py-2.5 text-sm font-semibold text-[#585f6c] border border-gray-300 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50">
            {isCancelling ? 'Cancelling…' : 'Cancel Booking'}
          </button>
          <button onClick={() => bookingId && router.push(`/payment/${bookingId}`)} disabled={isCancelling}
            className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#f5820a] rounded-full shadow hover:bg-[#e07509] transition-colors disabled:opacity-50">
            Continue to Payment →
          </button>
        </div>
      </div>
    )
  }

  // ── RENDER: ready ──
  if (phase === 'ready') {
    return (
      <div className="flex flex-col gap-4 text-center py-6">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
          <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#1a1c1c]">Slot Reserved!</h3>
        <p className="text-[#585f6c] text-sm">You have <strong>10 minutes</strong> to complete payment before the slot is released.</p>
        {countdown && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-[#fff7ed] border border-[#f5820a]/20 rounded-xl mx-auto">
            <div className="w-2 h-2 rounded-full bg-[#f5820a] animate-pulse" />
            <span className="text-[14px] font-mono font-semibold text-[#f5820a]">{countdown}</span>
          </div>
        )}
        <button onClick={() => bookingId && router.push(`/payment/${bookingId}`)}
          className="mt-2 px-6 py-3 bg-[#f5820a] hover:bg-[#e07509] text-white font-semibold rounded-full shadow-lg focus:scale-95 transition-transform">
          Proceed to Payment →
        </button>
      </div>
    )
  }

  // ── RENDER: calendar + slots ──
  const today         = todayIST()
  const totalDays     = daysInMonth(calYear, calMonth)
  const firstWeekday  = firstDayOfMonth(calYear, calMonth)
  const monthKey      = getMonthKey(calYear, calMonth)

  // Prevent navigating to past months
  const nowDate = new Date()
  const isPrevDisabled = calYear < nowDate.getFullYear() ||
    (calYear === nowDate.getFullYear() && calMonth <= nowDate.getMonth())

  return (
    <div className="flex flex-col gap-6">

      {/* ── CALENDAR ── */}
      <div className="flex flex-col gap-3">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className="p-1.5 w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#f3f4f6] disabled:opacity-30 text-[#585f6c] transition-colors"
          >
            ‹
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[18px] font-semibold text-[#1a1c1c]">
              {MONTH_NAMES[calMonth]} {calYear}
            </span>
            {loadingCal && <div className="w-3 h-3 border border-[#f5820a] border-t-transparent rounded-full animate-spin" />}
          </div>
          <button
            onClick={nextMonth}
            className="p-1.5 w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#f3f4f6] text-[#585f6c] transition-colors"
          >
            ›
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-[14px] justify-items-center">
          {WEEKDAY_HEADERS.map(h => (
            <div key={h} className="text-center text-[13px] font-medium text-[#6b7280] pb-2.5">
              {h}
            </div>
          ))}

          {/* Empty cells before month start */}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const d       = i + 1
            const dateStr = `${monthKey}-${String(d).padStart(2, '0')}`
            const isPast  = dateStr < today
            const isAvail = availability[dateStr] === true
            const isSel   = dateStr === selectedDate
            const isToday = dateStr === today

            let cellClass = 'w-[40px] h-[40px] flex items-center justify-center rounded-[10px] text-[15px] font-medium transition-all duration-200 border '

            if (isPast || !isAvail) {
              cellClass += 'text-[#d1d5db] border-[#e5e7eb] cursor-not-allowed'
            } else if (isSel) {
              cellClass += 'bg-[#f5820a] text-white border-[#f5820a] shadow-[0_2px_8px_rgba(245,130,10,0.25)] cursor-pointer'
            } else if (isAvail) {
              cellClass += 'bg-white border-[#fcd9b6] text-[#1f2937] hover:bg-[#fff7ed] hover:-translate-y-[1px] cursor-pointer'
              if (isToday) cellClass += ' font-bold'
            }

            return (
              <button
                key={dateStr}
                onClick={() => handleDayClick(dateStr)}
                disabled={isPast || !isAvail}
                className={cellClass}
                title={isAvail ? `Book on ${dateStr}` : undefined}
              >
                {d}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-[13px] text-[#6b7280] justify-center w-full">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-[#fcd9b6] bg-white" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#f5820a]" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-[#e5e7eb] bg-transparent" />
            <span>Unavailable</span>
          </div>
        </div>
      </div>

      {/* ── SLOTS GRID (shown when a date is selected) ── */}
      {phase === 'slots' && selectedDate && (
        <div className="flex flex-col gap-3 border-t border-[rgba(221,193,175,0.25)] pt-5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-semibold tracking-[1.5px] uppercase text-[#585f6c]">
              Available Times — {new Date(selectedDate + 'T00:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} (IST)
            </label>
            <button
              onClick={() => { setPhase('calendar'); setSelectedDate(''); setSelectedTime(null) }}
              className="text-[12px] text-[#9ca3af] hover:text-[#f5820a] transition-colors"
            >
              ← Change date
            </button>
          </div>

          {loadingSlots ? (
            <div className="grid grid-cols-3 gap-2 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl" />)}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-[13px] text-[#9ca3af] py-4">No available slots for this date.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
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
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {phase === 'confirm' && selectedTime && (
        <div className="p-5 border border-[#ddc1af] bg-[#fff7ed] rounded-2xl flex flex-col items-center text-center shadow-lg">
          <h4 className="text-lg font-semibold text-[#1a1c1c] mb-1">Confirm Slot?</h4>
          <p className="text-sm text-[#585f6c] mb-5">
            Locking{' '}<strong className="text-[#f5820a]">{selectedTime} IST</strong>{' '}on{' '}
            {new Date(selectedDate + 'T00:00:00+05:30').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
          </p>
          <div className="flex gap-3 w-full">
            <button onClick={() => setPhase('slots')}
              className="flex-1 py-2 text-sm font-semibold text-[#585f6c] border border-gray-300 rounded-full hover:bg-gray-100">
              Go Back
            </button>
            <button onClick={confirmAndLock}
              className="flex-1 py-2 text-sm font-semibold text-white bg-[#1a1c1c] rounded-full shadow-md hover:bg-black">
              Confirm & Lock
            </button>
          </div>
        </div>
      )}

      {/* ── CREATING OVERLAY ── */}
      {phase === 'creating' && (
        <div className="p-5 border border-[#ddc1af] bg-white rounded-2xl flex flex-col items-center justify-center">
          <div className="w-6 h-6 border-2 border-[#f5820a] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#585f6c] animate-pulse">Locking slot securely…</p>
        </div>
      )}
    </div>
  )
}
