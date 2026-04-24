import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlots, filterByLeadTime } from '@/services/slot-generator'

/**
 * GET /api/mentors/[slug]/availability/calendar?month=YYYY-MM
 *
 * Returns a map of dates → boolean indicating whether any slots are available.
 * Used by SlotBookingUI to highlight/disable calendar days.
 *
 * Response: { "2026-04-24": true, "2026-04-25": false, ... }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug }  = await params
    const monthQuery = new URL(req.url).searchParams.get('month') // "YYYY-MM"

    if (!monthQuery || !/^\d{4}-\d{2}$/.test(monthQuery)) {
      return NextResponse.json({ error: 'Missing or invalid month parameter (expected YYYY-MM)' }, { status: 400 })
    }

    const mentor = await prisma.mentor.findUnique({
      where: { slug, isActive: true },
    })
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
    }

    // Fetch all active availability for this mentor (at most 7 rows)
    const allAvailability = await prisma.availability.findMany({
      where: { mentorId: mentor.id, isActive: true },
    })

    if (allAvailability.length === 0) {
      return NextResponse.json({ success: true, data: {} })
    }

    // Build a quick lookup: dayOfWeek → availability row
    const availMap = new Map(allAvailability.map(a => [a.dayOfWeek, a]))

    // Determine all days in the month
    const [y, m] = monthQuery.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate() // day 0 of next month = last day of this month

    // Batch-fetch all booked + locked times for this month
    const monthStart = new Date(`${monthQuery}-01T00:00:00.000Z`)
    const monthEnd   = new Date(y, m, 1) // first of next month in local time, treated as UTC midnight

    const [allLocks, allBookings] = await Promise.all([
      prisma.slotLock.findMany({
        where: {
          mentorId: mentor.id,
          date: { gte: monthStart, lt: monthEnd },
          expiresAt: { gt: new Date() },
        },
        select: { date: true, startTime: true },
      }),
      prisma.booking.findMany({
        where: {
          mentorId: mentor.id,
          date: { gte: monthStart, lt: monthEnd },
          status: { in: ['pending', 'paid'] },
        },
        select: { date: true, startTime: true },
      }),
    ])

    // Build blocked-slots lookup: "YYYY-MM-DD" → Set<startTime>
    const blockedByDate = new Map<string, Set<string>>()
    const addBlocked = (date: Date | null, time: string | null) => {
      if (!date || !time) return
      const key = date.toISOString().split('T')[0]
      if (!blockedByDate.has(key)) blockedByDate.set(key, new Set())
      blockedByDate.get(key)!.add(time)
    }
    allLocks.forEach(l    => addBlocked(l.date, l.startTime))
    allBookings.forEach(b => addBlocked(b.date, b.startTime))

    // Build the result map
    const result: Record<string, boolean> = {}

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${monthQuery}-${String(d).padStart(2, '0')}`

      // Get weekday in IST
      const utcDate = new Date(`${dateStr}T00:00:00.000Z`)
      const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000)
      const dayOfWeek = istDate.getUTCDay()

      const avail = availMap.get(dayOfWeek)
      if (!avail) { result[dateStr] = false; continue }

      // Generate slots and subtract disabled ones
      let slots = generateSlots(avail.startTime, avail.endTime)
      if (avail.disabledSlots && avail.disabledSlots.length > 0) {
        const disabledSet = new Set(avail.disabledSlots)
        slots = slots.filter(t => !disabledSet.has(t))
      }
      slots = filterByLeadTime(slots, dateStr)

      if (slots.length === 0) { result[dateStr] = false; continue }

      // Subtract blocked slots
      const blocked = blockedByDate.get(dateStr)
      const available = blocked ? slots.filter(t => !blocked.has(t)) : slots

      result[dateStr] = available.length > 0
    }

    const response = NextResponse.json({ success: true, data: result })
    // Cache for 5 minutes — availability rarely changes mid-session
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60')
    return response
  } catch (err) {
    console.error('[CALENDAR_AVAILABILITY_GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
