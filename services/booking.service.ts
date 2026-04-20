import { prisma } from '@/lib/prisma'
import { BookingStatus, Booking } from '@prisma/client'

/** Helper to conditionally expire bookings at the time of read */
export async function expireBookingsIfNeeded(bookings: Booking[]) {
  const expiredIds = bookings
    .filter(b => b.status === BookingStatus.payment_pending && b.paymentExpiresAt && new Date() > b.paymentExpiresAt)
    .map(b => b.id)
  
  if (expiredIds.length > 0) {
    await prisma.booking.updateMany({
      where: { id: { in: expiredIds } },
      data: { status: BookingStatus.expired }
    })
    
    // Mutate the local copies to reflect the change immediately
    for (const b of bookings) {
      if (expiredIds.includes(b.id)) {
        b.status = BookingStatus.expired
      }
    }
  }
}


export async function createBooking(
  studentId: string,
  mentorId: string,
  selectedDay?: string,
  selectedSlot?: string
) {
  return prisma.$transaction(async (tx) => {
    // Integrity checks
    const mentor = await tx.mentor.findUnique({ where: { id: mentorId } })
    if (!mentor) throw new Error('MENTOR_NOT_FOUND')
    if (mentor.userId === studentId) throw new Error('INVALID_BOOKING')
    if (!mentor.isActive) throw new Error('MENTOR_INACTIVE')

    // Student anti-spam: one active booking per mentor at a time
    const existing = await tx.booking.findFirst({
      where: {
        studentId,
        mentorId,
        status: { notIn: ['cancelled', 'expired', 'completed'] },
      },
    })

    if (existing) {
      // Clear the stale slot if it just expired
      if (existing.status === 'payment_pending' && existing.paymentExpiresAt && new Date() > existing.paymentExpiresAt) {
        await tx.booking.update({
          where: { id: existing.id },
          data: { status: 'expired' }
        })
      } else {
        throw new Error('DUPLICATE_BOOKING')
      }
    }

    const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const booking = await tx.booking.create({
      data: {
        studentId,
        mentorId,
        selectedDay: selectedDay ?? null,
        selectedSlot: selectedSlot ?? null,
        status: 'payment_pending',
        paymentExpiresAt
      },
    })
    console.log('[BOOKING_CREATED]', { bookingId: booking.id, studentId, mentorId })
    return booking
  })
}

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

  await expireBookingsIfNeeded(bookings as unknown as Booking[])

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
  
  await expireBookingsIfNeeded([booking as unknown as Booking])
  
  return booking
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

  await expireBookingsIfNeeded(bookings as unknown as Booking[])

  return { bookings, total, page, limit }
}

/** Statuses from which a booking can be cancelled */
const CANCELLABLE_STATUSES = ['payment_pending', 'awaiting_payment', 'payment_complete', 'scheduled'] as const

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

  // Enforce time window only when session is already scheduled and time is known
  if (booking.status === 'scheduled') {
    if (!booking.startTime) throw new Error('NO_START_TIME')
    const hoursUntilSession =
      (booking.startTime.getTime() - Date.now()) / (1000 * 60 * 60)
    const requiredHours = isStudent ? 4 : 2
    if (hoursUntilSession < requiredHours) throw new Error('CANCELLATION_WINDOW_PASSED')
  }

  return prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    })
    console.log('[BOOKING_CANCELLED]', { bookingId, cancelledBy: userId, previousStatus: booking.status })

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
