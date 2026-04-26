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
  disabledSlots: string[]
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
  disabledSlots: [],
  isActive:  false,
}))

// ── Component ─────────────────────────────────────────────────────────────

export default function SlotManager() {
  const [initialDays, setInitialDays] = useState<DayConfig[]>(DEFAULT_DAYS)
  const [days, setDays]               = useState<DayConfig[]>(DEFAULT_DAYS)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [toastMsg, setToastMsg]       = useState<string | null>(null)

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
          const match = serverRows.find((r: any) => r.dayOfWeek === d.dayOfWeek)
          return match
            ? { dayOfWeek: d.dayOfWeek, startTime: match.startTime, endTime: match.endTime, disabledSlots: match.disabledSlots ?? [], isActive: match.isActive }
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

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        handleCancel()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDrawerOpen])

  const updateDay = (idx: number, patch: Partial<DayConfig>) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== idx) return d
      return { ...d, ...patch }
    }))
    setMsg(null)
  }

  const toggleSlot = (idx: number, slotTime: string) => {
    setDays(prev => prev.map((d, i) => {
      if (i !== idx) return d
      const disabled = d.disabledSlots.includes(slotTime)
        ? d.disabledSlots.filter(t => t !== slotTime)
        : [...d.disabledSlots, slotTime]
      return { ...d, disabledSlots: disabled }
    }))
    setMsg(null)
  }

  const isDirty = JSON.stringify(days) !== JSON.stringify(initialDays)

  const handleCancel = () => {
    setDays(initialDays)
    setIsDrawerOpen(false)
    setMsg(null)
  }

  const handleSave = async () => {
    if (!isDirty) {
      setIsDrawerOpen(false)
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const payload = days.filter(d => d.isActive)
      const res = await fetch('/api/mentor/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(days),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      
      setInitialDays(days)
      setIsDrawerOpen(false)
      
      setToastMsg('Availability updated ✅')
      setTimeout(() => setToastMsg(null), 3000)
    } catch (e: any) {
      setMsg({ text: e.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const activeDays = days.filter(d => d.isActive)
  const totalSlots = activeDays.reduce((sum, d) => {
    const rawSlots = previewSlots(d.startTime, d.endTime)
    const validCount = rawSlots.filter(t => !d.disabledSlots.includes(t)).length
    return sum + validCount
  }, 0)

  const getSummary = () => {
    if (activeDays.length === 0) return "No availability set"
    
    // Group by same start/end times
    const groups: { [key: string]: string[] } = {}
    activeDays.forEach(d => {
      const timeRange = `${d.startTime} - ${d.endTime}`
      if (!groups[timeRange]) groups[timeRange] = []
      groups[timeRange].push(DAY_SHORT[d.dayOfWeek])
    })

    const parts = Object.entries(groups).map(([time, dayNames]) => {
      // e.g. "Mon, Tue: 09:00 - 13:00"
      return `${dayNames.join(', ')}: ${time}`
    })

    const summary = parts.join(' | ')
    if (summary.length > 55) return `${activeDays.length} active day${activeDays.length !== 1 ? 's' : ''} set (${totalSlots} slots/week)`
    return summary
  }

  return (
    <>
      {/* Compact Dashboard Section */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl p-5 sm:p-6 mb-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-normal italic text-[#0f172a] mb-1" style={{ fontFamily: "'Newsreader', serif" }}>
            Weekly Availability
          </h2>
          <p className="text-[#64748b] text-[15px] font-medium">
            {loading ? "Loading schedule..." : getSummary()}
          </p>
        </div>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="px-6 py-2.5 text-[15px] font-semibold bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-slate-200 shrink-0"
        >
          Edit Availability
        </button>
      </div>

      {/* Slide Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancel}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              aria-hidden="true"
            />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="drawer-title"
            >
              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                {/* Header */}
                <div className="mb-8 pr-12">
                  <h2 id="drawer-title" className="text-[28px] font-normal italic text-[#0f172a] mb-2" style={{ fontFamily: "'Newsreader', serif" }}>
                    Edit Weekly Availability
                  </h2>
                  <p className="text-[#64748b] text-[15px] leading-relaxed font-['Inter']">
                    Set your recurring hours. Toggle a day to instantly see your bookable slots. Students can book any 30-minute slot within these times. Timezone is IST (+05:30).
                  </p>
                </div>
                
                {/* Close Button */}
                <button 
                  onClick={handleCancel}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                  aria-label="Close drawer"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Day Rows */}
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
                                      key={slots.length - day.disabledSlots.length}
                                      initial={{ opacity: 0, y: -4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="text-[14px] font-semibold text-[#c2410c]"
                                    >
                                      {slots.length - day.disabledSlots.length} {(slots.length - day.disabledSlots.length) === 1 ? 'slot' : 'slots'} available
                                    </motion.span>
                                  </div>
                                  
                                  {slots.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                      {slots.map((t, i) => {
                                        const isDisabled = day.disabledSlots.includes(t)
                                        return (
                                          <motion.div
                                            key={`${t}-${i}`}
                                            initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                                            onClick={() => toggleSlot(idx, t)}
                                            className={`px-5 py-3 text-[16px] font-semibold rounded-xl select-none transition-all cursor-pointer shadow-sm active:scale-95 border ${
                                              isDisabled
                                                ? 'bg-slate-100/70 text-slate-400 border-slate-200 line-through decoration-slate-300 hover:bg-slate-200/50'
                                                : 'bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]/40 hover:bg-[#fed7aa] hover:border-[#fb923c] hover:shadow'
                                            }`}
                                          >
                                            {t}
                                          </motion.div>
                                        )
                                      })}
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
              </div>

              {/* Drawer Footer Actions */}
              <div className="bg-slate-50 border-t border-slate-200 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
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
                    <span className={`text-[14px] font-medium hidden lg:inline-block ${msg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                      {msg.text}
                    </span>
                  )}
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="w-full sm:w-auto px-6 py-3 text-[15px] font-semibold text-slate-600 hover:text-slate-900 transition-colors focus:outline-none rounded-full hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || loading || !isDirty}
                    className={`w-full sm:w-auto px-8 py-3 text-[15px] font-semibold rounded-full shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f5820a] flex items-center justify-center gap-2 ${
                      saving || loading || !isDirty
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-[#f5820a] hover:bg-[#e07509] text-white active:scale-[0.98] shadow-md hover:shadow-lg'
                    }`}
                  >
                    {saving ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" /> Saving...</>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-3.5 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-50 font-medium flex items-center gap-3"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
