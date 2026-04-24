'use client'

import { useState, useEffect } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Generate time options: 06:00 → 23:30 in 30-min steps
const TIME_OPTIONS: string[] = []
for (let h = 6; h <= 23; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 23) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}
TIME_OPTIONS.push('23:30')

const END_TIME_MIN = '06:30' // minimum valid end time (at least 1 slot after 06:00 start)

// ── Types ──────────────────────────────────────────────────────────────────

interface DayConfig {
  dayOfWeek: number
  startTime: string
  endTime:   string
  isActive:  boolean
}

// ── Slot preview ──────────────────────────────────────────────────────────

function previewSlots(startTime: string, endTime: string): string[] {
  const toMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
  const toStr  = (n: number) => `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`
  const start = Math.max(toMins(startTime), 6 * 60)
  const end = toMins(endTime)
  const slots: string[] = []
  let cur = start
  while (cur + 30 <= end) { slots.push(toStr(cur)); cur += 30 }
  return slots
}

const DEFAULT_DAYS: DayConfig[] = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  startTime: '09:00',
  endTime:   '13:00',
  isActive:  false,
}))

// ── Component ─────────────────────────────────────────────────────────────

export default function SlotManager() {
  const [days, setDays]           = useState<DayConfig[]>(DEFAULT_DAYS)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [expandedDay, setExpanded] = useState<number | null>(null)
  const [msg, setMsg]             = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Load existing availability from server
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res  = await fetch('/api/mentor/availability')
        const json = await res.json()
        if (!res.ok || !json.data) return

        const serverRows: DayConfig[] = json.data
        setDays(prev => prev.map(d => {
          const match = serverRows.find((r: DayConfig) => r.dayOfWeek === d.dayOfWeek)
          return match
            ? { dayOfWeek: d.dayOfWeek, startTime: match.startTime, endTime: match.endTime, isActive: match.isActive }
            : d
        }))
      } catch { /* keep defaults */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const updateDay = (idx: number, patch: Partial<DayConfig>) => {
    setDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d))
    setMsg(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setMsg(null)
    try {
      const payload = days.filter(d => d.isActive) // only send active days
      // Always send all 7 to upsert (inactive days deactivate existing rows)
      const res = await fetch('/api/mentor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(days),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setMsg({ text: 'Availability saved successfully ✓', type: 'success' })
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const activeDays = days.filter(d => d.isActive)
  const totalSlots = activeDays.reduce((sum, d) => sum + previewSlots(d.startTime, d.endTime).length, 0)

  return (
    <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-6 mb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[13px] font-semibold tracking-[1.5px] uppercase text-[#585f6c]">
            Weekly Availability (IST)
          </h2>
          <p className="text-[#6b7280] text-[13px] mt-1">
            Set recurring hours for each day. Students can book any 30-minute slot within your window.
          </p>
          {!loading && totalSlots > 0 && (
            <p className="text-[12px] text-[#f5820a] font-medium mt-1">
              {activeDays.length} day{activeDays.length !== 1 ? 's' : ''} active · {totalSlots} total slots/week
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="self-start sm:self-auto px-5 py-2.5 bg-[#1a1c1c] text-white text-[13px] font-semibold rounded-full hover:bg-black transition-colors shadow-sm disabled:opacity-50 shrink-0"
        >
          {saving ? 'Saving…' : 'Save Availability'}
        </button>
      </div>

      {msg && (
        <p className={`text-[12px] font-medium mb-4 ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {msg.text}
        </p>
      )}

      {loading ? (
        <div className="flex flex-col gap-3 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {days.map((day, idx) => {
            const slots    = day.isActive ? previewSlots(day.startTime, day.endTime) : []
            const isExpanded = expandedDay === idx

            return (
              <div
                key={day.dayOfWeek}
                className={`rounded-xl border transition-all duration-200 ${
                  day.isActive
                    ? 'border-[#f5820a]/30 bg-[#fff8f3]'
                    : 'border-[rgba(221,193,175,0.25)] bg-white'
                }`}
              >
                {/* Day row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Toggle */}
                  <button
                    onClick={() => updateDay(idx, { isActive: !day.isActive })}
                    className={`relative w-10 h-5.5 rounded-full transition-colors shrink-0 ${
                      day.isActive ? 'bg-[#f5820a]' : 'bg-gray-200'
                    }`}
                    style={{ minWidth: '40px', height: '22px' }}
                    aria-label={`Toggle ${DAY_NAMES[day.dayOfWeek]}`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                        day.isActive ? 'translate-x-[18px]' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Day name */}
                  <span className={`text-[14px] font-semibold w-24 shrink-0 ${day.isActive ? 'text-[#1a1c1c]' : 'text-[#9ca3af]'}`}>
                    <span className="hidden sm:inline">{DAY_NAMES[day.dayOfWeek]}</span>
                    <span className="sm:hidden">{DAY_SHORT[day.dayOfWeek]}</span>
                  </span>

                  {day.isActive ? (
                    <>
                      {/* Start time */}
                      <select
                        value={day.startTime}
                        onChange={e => updateDay(idx, { startTime: e.target.value })}
                        className="text-[13px] border border-[rgba(221,193,175,0.4)] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30 text-[#1a1c1c]"
                      >
                        {TIME_OPTIONS.filter(t => t !== '23:30').map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <span className="text-[#9ca3af] text-[13px] shrink-0">to</span>

                      {/* End time */}
                      <select
                        value={day.endTime}
                        onChange={e => updateDay(idx, { endTime: e.target.value })}
                        className="text-[13px] border border-[rgba(221,193,175,0.4)] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30 text-[#1a1c1c]"
                      >
                        {TIME_OPTIONS.filter(t => t > day.startTime).map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      {/* Slot count pill */}
                      <span className="ml-auto text-[12px] font-semibold text-[#f5820a] bg-[#f5820a]/10 px-2.5 py-1 rounded-full shrink-0">
                        {slots.length} slot{slots.length !== 1 ? 's' : ''}
                      </span>

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : idx)}
                        className="text-[#9ca3af] hover:text-[#f5820a] transition-colors text-[12px] shrink-0"
                        aria-label="Preview slots"
                      >
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </>
                  ) : (
                    <span className="text-[13px] text-[#9ca3af] italic ml-1">Off</span>
                  )}
                </div>

                {/* Slot preview (expanded) */}
                {day.isActive && isExpanded && slots.length > 0 && (
                  <div className="px-4 pb-4 pt-1 border-t border-[rgba(221,193,175,0.2)]">
                    <p className="text-[11px] font-semibold tracking-[1.2px] uppercase text-[#9ca3af] mb-2">
                      Preview — {slots.length} bookable slots
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {slots.map(t => (
                        <span
                          key={t}
                          className="px-2.5 py-1 text-[12px] font-semibold bg-[#f5820a]/10 text-[#934b00] rounded-lg"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {day.isActive && slots.length === 0 && (
                  <p className="px-4 pb-3 text-[12px] text-red-500">
                    ⚠ End time must be at least 30 min after start time
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
