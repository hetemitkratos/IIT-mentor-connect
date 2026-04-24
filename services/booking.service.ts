import { prisma } from '@/lib/prisma'
import { BookingStatus, Booking } from '@prisma/client'


export async function getStudentBookings(
  studentId: string,
  status?: string,
  page = 1,
  limit = 10
) {
  const where = {
    studentId,
    ...(status && { status: status as never }),
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        mentor: { include: { user: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ])



  return { bookings, total, page, limit }
}

export async function getBookingById(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      mentor: { include: { user: { select: { name: true } } } },
      payment: true,
    },
  })

  if (!booking || booking.studentId !== userId) return null
  
  const slotLock = await prisma.slotLock.findFirst({ where: { bookingId } })

  return { ...booking, expiresAt: slotLock?.expiresAt || null }
}

export async function getMentorBookings(
  mentorId: string,
  status?: string,
  page = 1,
  limit = 10
) {
  const where = {
    mentorId,
    ...(status && { status: status as never }),
  }

  const [total, bookings] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: { student: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
  ])



  return { bookings, total, page, limit }
}

/** Statuses from which a booking can be cancelled */
const CANCELLABLE_STATUSES = ['pending', 'paid'] as const

export async function cancelBooking(bookingId: string, userId: string, role: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mentor: true, payment: true },
  })

  if (!booking) throw new Error('NOT_FOUND')

  const isStudent = booking.studentId === userId
  const isMentor  = booking.mentor.userId === userId
  if (!isStudent && !isMentor) throw new Error('FORBIDDEN')

  if (booking.status === 'completed')  throw new Error('ALREADY_COMPLETED')
  if (booking.status === 'cancelled')  throw new Error('ALREADY_CANCELLED')
  if (!(CANCELLABLE_STATUSES as readonly string[]).includes(booking.status)) {
    throw new Error('INVALID_STATUS')
  }

  // Strictly enforce 24-hour time window when session is formally paid/scheduled
  if (booking.status === 'paid') {
    if (!booking.date || !booking.startTime) throw new Error('NO_START_TIME')
    
    // Parse the IST absolute boundary
    const [hours, mins] = booking.startTime.split(':').map(Number);
    const sessionTime = new Date(booking.date);
    // Assumes date parsed maps closely to midnight UTC, applying the logical hour delta
    sessionTime.setUTCHours(hours - 5, mins - 30, 0, 0); // Convert from IST to UTC correctly for delta diff

    const hoursUntilSession = (sessionTime.getTime() - Date.now()) / (1000 * 60 * 60)
    
    // The user explicitly requested > 24 hours requirement
    if (hoursUntilSession < 24) throw new Error('CANCELLATION_WINDOW_PASSED')
  }

  return prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    })
    console.log('[BOOKING_CANCELLED]', { bookingId, cancelledBy: userId, previousStatus: booking.status })

    // Release the slot lock so it becomes bookable again
    if (booking.date && booking.startTime) {
      await tx.slotLock.deleteMany({
        where: {
          mentorId: booking.mentorId,
          date:     booking.date,
          startTime: booking.startTime,
        },
      })
    }

    // Fix #5: Only mark refunded if payment was actually captured — avoid refunding unpaid bookings
    if (booking.payment && booking.payment.status === 'successful') {
      // TODO: Call razorpay.payments.refund(booking.payment.razorpayPaymentId) when credentials available
      await tx.payment.update({
        where: { bookingId },
        data: { status: 'refunded' },
      })
    }
  })
}
