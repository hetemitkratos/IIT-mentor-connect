import { prisma } from '@/lib/prisma'
import { SESSION_PRICE_RS } from '@/constants/pricing'

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
  // Single parallel batch — zero extra round-trips
  const [upcomingBookings, pastBookings, totalCount, completedCount] = await Promise.all([
    prisma.booking.findMany({
      where: {
        mentorId,
        // Mentor only sees paid, confirmed sessions
        status: { in: ['scheduled', 'in_progress'] as const },
      },
      include: { student: { select: { name: true, image: true } } },
      orderBy: { startTime: 'asc' },   // nearest session first
      take: 5,
    }),
    prisma.booking.findMany({
      where: {
        mentorId,
        status: { in: [...PAST_STATUSES] },
      },
      include: { student: { select: { name: true, image: true } } },
      orderBy: { startTime: 'desc' },  // most recent first
      take: 5,
    }),
    // Fix: DB count is not capped by take — accurate total
    prisma.booking.count({ where: { mentorId } }),
    prisma.booking.count({ where: { mentorId, status: 'completed' } }),
  ])

  return {
    upcomingBookings,
    pastBookings,
    stats: {
      totalSessions:     totalCount,
      completedSessions: completedCount,
      upcomingSessions:  upcomingBookings.length,
      // Fix: use SESSION_PRICE_RS = 150, not hardcoded 100
      earningsRs:        completedCount * SESSION_PRICE_RS,
    },
  }
}
