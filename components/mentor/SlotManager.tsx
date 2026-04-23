'use client'
import { useState, useEffect } from 'react'

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30'
];

export default function SlotManager() {
  // Use local ISO format cleanly mapped to IST logical boundaries
  const today = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(today.getTime() + istOffset);
  const initialDateStr = istDate.toISOString().split('T')[0];

  const [date, setDate] = useState(initialDateStr)
  const [slots, setSlots] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)

  useEffect(() => {
    fetchSlots()
  }, [date])

  const fetchSlots = async () => {
    setLoading(true)
    setMessage(null)
    try {
      // We can fetch from the public mentor endpoints. It returns JUST the available times
      // However the mentor needs to see ALL their configured slots, not just available ones.
      // Wait, `/api/mentors/[slug]/slots` excludes booked/locked slots...
      // Let's create an admin endpoint for mentors if we need, OR just use the public one and mentor accepts logic.
      // Actually, a mentor needs to see ALL ACTIVE slots they created, even if currently locked, so they can toggle. 
      // We'll use a direct fetch to a new endpoint `/api/mentor/slots?date=${date}`
      const res = await fetch(`/api/mentor/slots?date=${date}`)
      const data = await res.json()
      if (res.ok) {
        setSlots(data.slots || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleSlot = (time: string) => {
    setMessage(null)
    setSlots(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time])
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/mentor/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slots }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setMessage({ text: 'Slots saved successfully', type: 'success' })
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white border border-[rgba(221,193,175,0.2)] rounded-2xl p-6 mb-10">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-[13px] font-semibold tracking-[1.5px] uppercase text-[#585f6c]">Availability Setup (IST)</h2>
          <p className="text-[#6b7280] text-[13px] leading-relaxed mt-1 max-w-lg">
            Select a date and click the 30-minute intervals you are available to mentor.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-4 py-2 text-sm border border-[rgba(221,193,175,0.4)] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#f5820a]/30 text-[#1a1c1c]"
          />
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="px-5 py-2.5 bg-[#1a1c1c] text-white text-[13px] font-semibold rounded-full hover:bg-black transition-colors shadow-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Slots'}
          </button>
        </div>

        {message && (
          <p className={`text-[12px] font-medium ${message.type === 'success' ? 'text-[#16a34a]' : 'text-[#ba1a1a]'}`}>
            {message.text}
          </p>
        )}

        {loading ? (
          <div className="animate-pulse flex gap-2"><div className="w-16 h-8 bg-gray-200 rounded-lg"></div></div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {TIME_SLOTS.map(time => {
              const selected = slots.includes(time)
              return (
                <button
                  key={time}
                  onClick={() => toggleSlot(time)}
                  className={`py-2 px-1 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
                    selected
                      ? 'bg-[#f5820a] text-white shadow-md border-transparent scale-105'
                      : 'bg-white border border-[rgba(221,193,175,0.3)] text-[#585f6c] hover:border-[#f5820a]/50 hover:text-[#1a1c1c]'
                  }`}
                >
                  {time}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
