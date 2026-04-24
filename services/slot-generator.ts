/**
 * Slot generator — core scheduling logic.
 * Generates 30-minute IST time slots within an availability window.
 */

const MIN_START_MINUTES = 6 * 60 // 06:00 IST — enforced minimum

/** Convert "HH:MM" → total minutes since midnight */
export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Convert total minutes since midnight → "HH:MM" */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * Generate all 30-minute slot start times between startTime and endTime.
 *
 * Rules:
 * - Minimum start is 06:00 IST (enforced hard floor)
 * - Slot at X means the session occupies X → X+30min
 * - So the last valid slot start must be < endTime - 30min
 *
 * @example generateSlots("09:00", "11:00") → ["09:00", "09:30", "10:00", "10:30"]
 */
export function generateSlots(startTime: string, endTime: string): string[] {
  let current = Math.max(parseTimeToMinutes(startTime), MIN_START_MINUTES)
  const end   = parseTimeToMinutes(endTime)
  const slots: string[] = []

  while (current + 30 <= end) {
    slots.push(formatMinutesToTime(current))
    current += 30
  }

  return slots
}

/**
 * Filter slots that are too close to now (lead-time enforcement).
 * Returns only slots that start at least `leadTimeMinutes` from now.
 *
 * @param slots     Array of "HH:MM" strings
 * @param dateStr   Target date "YYYY-MM-DD"
 * @param leadTimeMinutes  Minimum minutes from now (default: 60)
 */
export function filterByLeadTime(
  slots: string[],
  dateStr: string,
  leadTimeMinutes = 60
): string[] {
  const threshold = new Date(Date.now() + leadTimeMinutes * 60_000)

  return slots.filter(time => {
    const slotIST = new Date(`${dateStr}T${time}:00+05:30`)
    return slotIST >= threshold
  })
}
