import { prisma } from '@/lib/prisma'
import { MENTOR_PAYOUT_RS } from '@/constants/pricing'

// Statuses that represent an active/upcoming session
// Student sees: scheduled (confirmed) + awaiting_payment (Calendly done, needs payment) + payment_pending (just created)
// Mentor sees: only scheduled (via getMentorDashboard overriding this default)
const UPCOMING_STATUSES = ['scheduled', 'in_progress', 'awaiting_payment', 'payment_pending'] as const
// Statuses that represent a concluded session
const PAST_STATUSES = ['completed', 'cancelled'] as const

export async function getStudentDashboard(studentId: string) {
  // Single parallel batch — zero extra round-trips
  const [upcomingBookings, pastBookings, totalCount, completedCount] = await Promise.all([
    prisma.booking.findMany({
      where: {
        studentId,
        // Fix: include 'payment_complete' — student paid but hasn't booked a time slot yet
        status: { in: [...UPCOMING_STATUSES] },
      },
      include: {
        mentor: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
      orderBy: { startTime: 'asc' },   // nearest session first
      take: 5,
    }),
    prisma.booking.findMany({
      where: {
        studentId,
        status: { in: [...PAST_STATUSES] },
      },
      include: {
        mentor: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
      orderBy: { startTime: 'desc' },  // most recent first
      take: 5,
    }),
    // Fix: use DB count, not in-memory length (unaffected by take limit)
    prisma.booking.count({ where: { studentId } }),
    prisma.booking.count({ where: { studentId, status: 'completed' } }),
  ])

  return {
    upcomingBookings,
    pastBookings,
    stats: {
      totalBookings:      totalCount,
      completedSessions:  completedCount,
      upcomingSessions:   upcomingBookings.length,
    },
  }
}

export async function getMentorDashboard(mentorId: string) {
  const [allBookings, completedCount, totalCount] = await Promise.all([
    prisma.booking.findMany({
      where: { mentorId },
      include: { student: { select: { name: true, image: true } } },
      orderBy: { startTime: 'asc' },
    }),
    prisma.booking.count({ where: { mentorId, status: 'completed' } }),
    prisma.booking.count({ where: { mentorId } }),
  ])

  // Segment bookings by status
  const now = Date.now()

  const ongoingBookings = allBookings.filter(b => {
    if (b.status === 'in_progress') return true
    if (b.status === 'scheduled' && b.startTime && b.endTime) {
      // Show as ongoing from 5 mins before start until end time
      const start = b.startTime.getTime() - 5 * 60 * 1000
      const end = b.endTime.getTime() // Or maybe add a buffer after end time?
      if (now >= start && now <= end) return true
    }
    return false
  })

  const upcomingBookings = allBookings.filter(b => 
    b.status === 'scheduled' && !ongoingBookings.includes(b)
  )

  const completedBookings = allBookings.filter(b => b.status === 'completed')
    .sort((a, b) => (b.startTime?.getTime() ?? 0) - (a.startTime?.getTime() ?? 0))
  const cancelledBookings = allBookings.filter(b => b.status === 'cancelled')
    .sort((a, b) => (b.startTime?.getTime() ?? 0) - (a.startTime?.getTime() ?? 0))

  // Average rating from rated completed bookings
  const ratedBookings = completedBookings.filter(b => b.rating != null)
  const avgRating = ratedBookings.length > 0
    ? ratedBookings.reduce((acc, b) => acc + (b.rating ?? 0), 0) / ratedBookings.length
    : null

  return {
    upcomingBookings,
    ongoingBookings,
    completedBookings,
    cancelledBookings,
    // Legacy field for backward compat
    pastBookings: [...completedBookings, ...cancelledBookings],
    stats: {
      totalSessions:     totalCount,
      completedSessions: completedCount,
      upcomingSessions:  upcomingBookings.length,
      ongoingSessions:   ongoingBookings.length,
      earningsRs:        completedCount * MENTOR_PAYOUT_RS,
      rating:            avgRating,
    },
  }
}

