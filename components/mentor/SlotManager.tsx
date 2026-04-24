'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [initialDays, setInitialDays] = useState<DayConfig[]>(DEFAULT_DAYS)
  const [days, setDays]               = useState<DayConfig[]>(DEFAULT_DAYS)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Load existing availability from server
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res  = await fetch('/api/mentor/availability')
        const json = await res.json()
        if (!res.ok || !json.data) return

        const serverRows: DayConfig[] = json.data
        const loaded = DEFAULT_DAYS.map(d => {
          const match = serverRows.find((r: DayConfig) => r.dayOfWeek === d.dayOfWeek)
          return match
            ? { dayOfWeek: d.dayOfWeek, startTime: match.startTime, endTime: match.endTime, isActive: match.isActive }
            : d
        })
        setInitialDays(loaded)
        setDays(loaded)
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

  const isDirty = JSON.stringify(days) !== JSON.stringify(initialDays)

  const handleSave = async () => {
    if (!isDirty) return;
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
      setInitialDays(days)
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const activeDays = days.filter(d => d.isActive)
  const totalSlots = activeDays.reduce((sum, d) => sum + previewSlots(d.startTime, d.endTime).length, 0)

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-3xl p-6 sm:p-8 mb-10 shadow-sm flex flex-col relative pb-32">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-[28px] font-normal italic text-[#0f172a] mb-2" style={{ fontFamily: "'Newsreader', serif" }}>
          Weekly Availability
        </h2>
        <p className="text-[#64748b] text-[15px] max-w-2xl leading-relaxed font-['Inter']">
          Set your recurring hours. Toggle a day to instantly see your bookable slots. Students can book any 30-minute slot within these times. Timezone is IST (+05:30).
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col gap-5 animate-pulse">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[88px] bg-slate-50 border border-slate-100 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {days.map((day, idx) => {
            const slots = day.isActive ? previewSlots(day.startTime, day.endTime) : []
            
            return (
              <div
                key={day.dayOfWeek}
                className={`flex flex-col rounded-2xl transition-all duration-300 overflow-hidden ${
                  day.isActive
                    ? 'bg-[#fffaf5] border border-[#fed7aa] shadow-sm'
                    : 'bg-white border border-[#f1f5f9] opacity-70 hover:opacity-100 hover:bg-slate-50/50'
                }`}
              >
                {/* Day Row Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateDay(idx, { isActive: !day.isActive })}
                      className={`relative w-12 h-6.5 rounded-full transition-colors shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#f5820a] focus-visible:ring-offset-1 ${
                        day.isActive ? 'bg-[#f5820a]' : 'bg-slate-200'
                      }`}
                      style={{ height: '26px' }}
                      aria-label={`Toggle ${DAY_NAMES[day.dayOfWeek]}`}
                    >
                      <motion.span
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-[2px] left-[2px] bottom-[2px] w-[22px] bg-white rounded-full shadow-sm"
                        style={{ x: day.isActive ? 22 : 0 }}
                      />
                    </button>
                    
                    <span className={`text-[17px] font-semibold tracking-tight w-28 shrink-0 ${
                      day.isActive ? 'text-[#0f172a]' : 'text-[#94a3b8]'
                    }`}>
                      <span className="hidden sm:inline">{DAY_NAMES[day.dayOfWeek]}</span>
                      <span className="sm:hidden">{DAY_SHORT[day.dayOfWeek]}</span>
                    </span>

                    {!day.isActive && (
                      <span className="text-[#94a3b8] text-[15px] italic font-medium ml-2">Not available</span>
                    )}
                  </div>

                  {day.isActive && (
                    <div className="flex items-center flex-wrap gap-3">
                      <div className="relative">
                        <select
                          value={day.startTime}
                          onChange={e => updateDay(idx, { startTime: e.target.value })}
                          className="text-[15px] font-semibold border border-[#fed7aa] rounded-xl pl-4 pr-10 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/50 text-[#c2410c] shadow-sm transition-shadow appearance-none cursor-pointer hover:border-[#fdbdb]"
                          style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23c2410c' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.2em 1.2em" }}
                        >
                          {TIME_OPTIONS.filter(t => t !== '23:30').map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <span className="text-[#fdba74] text-[14px] font-bold mx-1">→</span>

                      <div className="relative">
                        <select
                          value={day.endTime}
                          onChange={e => updateDay(idx, { endTime: e.target.value })}
                          className="text-[15px] font-semibold border border-[#fed7aa] rounded-xl pl-4 pr-10 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/50 text-[#c2410c] shadow-sm transition-shadow appearance-none cursor-pointer hover:border-[#fdbdb]"
                          style={{ backgroundImage: "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23c2410c' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")", backgroundPosition: "right 0.75rem center", backgroundRepeat: "no-repeat", backgroundSize: "1.2em 1.2em" }}
                        >
                          {TIME_OPTIONS.filter(t => t > day.startTime).map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Instant Slot Preview Grid */}
                <AnimatePresence initial={false}>
                  {day.isActive && (
                    <motion.div
                      key={`slots-${day.dayOfWeek}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="origin-top"
                    >
                      <div className="px-5 pb-5 pt-3">
                        <div className="flex items-center justify-between mb-4 border-t border-[#fed7aa]/50 pt-4">
                          <span className="text-[11px] font-bold tracking-[1.5px] uppercase text-[#ea580c] flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]" /> Bookable Slots
                          </span>
                          <motion.span 
                            key={slots.length}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[14px] font-semibold text-[#c2410c]"
                          >
                            {slots.length} {slots.length === 1 ? 'slot' : 'slots'} available
                          </motion.span>
                        </div>
                        
                        {slots.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {slots.map((t, i) => (
                              <motion.div
                                key={`${t}-${i}`}
                                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                                className="px-5 py-3 text-[16px] font-semibold rounded-xl bg-[#ffedd5] text-[#9a3412] active:scale-95 hover:bg-[#fed7aa] select-none transition-all cursor-pointer border border-[#fed7aa]/40 hover:border-[#fb923c] shadow-sm hover:shadow"
                              >
                                {t}
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-[14px] font-medium flex items-center gap-3 shadow-sm"
                          >
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            End time must be at least 30 minutes after start time.
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}

      {/* Sticky Save Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#e2e8f0] p-5 sm:px-8 sm:py-6 rounded-b-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.04)] z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto overflow-hidden">
          <div className="flex flex-col min-w-0">
            <span className="text-[15px] font-semibold text-[#0f172a] truncate">
              Total Capacity
            </span>
            <span className="text-[14px] text-[#64748b] truncate">
              {!loading ? `${activeDays.length} active day${activeDays.length !== 1 ? 's' : ''}, ${totalSlots} slot${totalSlots !== 1 ? 's' : ''}/week` : '...'}
            </span>
          </div>
          {isDirty && (
            <span className="bg-amber-100 text-amber-800 text-[11px] font-bold tracking-[1px] uppercase px-2.5 py-1 rounded-md shrink-0 border border-amber-200/50">
              Unsaved
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto">
          {msg && (
            <span className={`text-[14px] font-medium hidden sm:inline-block ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {msg.text}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || loading || !isDirty}
            className={`w-full sm:w-auto px-8 py-3.5 text-[15px] font-semibold rounded-full shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f5820a] flex items-center justify-center gap-2 ${
              saving || loading || !isDirty
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-[#f5820a] hover:bg-[#e07509] text-white active:scale-[0.98] shadow-md hover:shadow-lg'
            }`}
          >
            {saving ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" /> Saving...</>
            ) : (
              'Save Availability'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
