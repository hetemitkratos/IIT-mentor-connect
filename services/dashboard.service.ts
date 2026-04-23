import { prisma } from '@/lib/prisma'
import { MENTOR_PAYOUT_RS } from '@/constants/pricing'
import { Booking } from '@prisma/client'

// Statuses that represent an active/upcoming session mapped perfectly to Phase 3 enums
const UPCOMING_STATUSES = ['pending', 'paid'] as const
// Statuses that represent a concluded session
const PAST_STATUSES = ['completed', 'cancelled'] as const

export async function getStudentDashboard(studentId: string) {
  // Single parallel batch — zero extra round-trips
  const [upcomingBookings, pastBookings, totalCount, completedCount] = await Promise.all([
    prisma.booking.findMany({
      where: {
        studentId,
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
    prisma.booking.count({ where: { studentId } }),
    prisma.booking.count({ where: { studentId, status: 'completed' } }),
  ])
  
  const finalPast = [...pastBookings].sort(
    (a, b) => {
      const aTime = a.date ? new Date(`${a.date.toISOString().split('T')[0]}T${a.startTime || '00:00'}:00+05:30`).getTime() : 0;
      const bTime = b.date ? new Date(`${b.date.toISOString().split('T')[0]}T${b.startTime || '00:00'}:00+05:30`).getTime() : 0;
      return bTime - aTime;
    }
  ).slice(0, 5)

  return {
    upcomingBookings,
    pastBookings: finalPast,
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

  // Segment bookings by status natively supporting old legacy overlaps
  const now = Date.now()

  const ongoingBookings = allBookings.filter(b => {
    // If it's a paid booking starting within 5 minutes or currently active
    if (b.status === 'paid' && b.startTime && b.endTime && b.date) {
      // Show as ongoing from 5 mins before start until end time
      const dateStr = b.date.toISOString().split('T')[0];
      const start = new Date(`${dateStr}T${b.startTime}:00+05:30`).getTime() - 5 * 60 * 1000
      const end = new Date(`${dateStr}T${b.endTime}:00+05:30`).getTime()
      if (now >= start && now <= end) return true
    }
    return false
  })

  // Pending bookings wait for payment, paid bookings are scheduled
  const upcomingBookings = allBookings.filter(b => 
    (b.status === 'paid' || b.status === 'pending') && !ongoingBookings.includes(b)
  )

  const completedBookings = allBookings.filter(b => b.status === 'completed')
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
  const cancelledBookings = allBookings.filter(b => b.status === 'cancelled')
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))

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
    expiredBookings: [], // Maintain empty array for backwards compatibility
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
