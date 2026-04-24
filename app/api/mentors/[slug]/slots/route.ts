import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlots, filterByLeadTime } from '@/services/slot-generator'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const dateQuery = new URL(req.url).searchParams.get('date')

    if (!dateQuery) {
      return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 })
    }

    const mentor = await prisma.mentor.findUnique({
      where: { slug, isActive: true },
    })
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 })
    }

    // Parse date → IST day-of-week
    // dateQuery is YYYY-MM-DD. Interpret it in IST so weekday is correct.
    const [year, month, day] = dateQuery.split('-').map(Number)
    const istDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0)) // UTC midnight = IST 05:30 of same day
    istDate.setUTCMinutes(-330) // shift back 5h30 so getUTCDay() gives the IST day
    const dayOfWeek = istDate.getUTCDay()

    // Fetch mentor's availability for this weekday
    const availability = await prisma.availability.findFirst({
      where: { mentorId: mentor.id, dayOfWeek, isActive: true },
    })

    if (!availability) {
      const response = NextResponse.json({ success: true, data: [] })
      response.headers.set('Cache-Control', 'no-store')
      return response
    }

    // Generate raw slots from the availability window
    let slots = generateSlots(availability.startTime, availability.endTime)

    // Enforce 1-hour lead time
    slots = filterByLeadTime(slots, dateQuery)

    if (slots.length === 0) {
      const response = NextResponse.json({ success: true, data: [] })
      response.headers.set('Cache-Control', 'no-store')
      return response
    }

    // Lightweight GC: 10% chance to clean up expired locks on slot reads
    if (Math.random() < 0.1) {
      prisma.slotLock.deleteMany({ where: { expiresAt: { lt: new Date() } } })
        .catch(e => console.error('[SLOTLOCK_GC_ERROR]', e))
    }

    // Fetch booked + locked times for this mentor on this date
    const parsedDate = new Date(`${dateQuery}T00:00:00.000Z`)
    const [locks, bookings] = await Promise.all([
      prisma.slotLock.findMany({
        where: { mentorId: mentor.id, date: parsedDate, expiresAt: { gt: new Date() } },
        select: { startTime: true },
      }),
      prisma.booking.findMany({
        where: { mentorId: mentor.id, date: parsedDate, status: { in: ['pending', 'paid'] } },
        select: { startTime: true },
      }),
    ])

    const blocked = new Set([
      ...locks.map(l => l.startTime),
      ...bookings.map(b => b.startTime).filter(Boolean) as string[],
    ])

    const available = slots.filter(t => !blocked.has(t))

    const response = NextResponse.json({ success: true, data: available })
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Expires', '0')
    return response
  } catch (err) {
    console.error('[STUDENT_SLOTS_GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
