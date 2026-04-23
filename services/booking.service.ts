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
  mentorId:  string,
) {
  // Get student email for webhook buffer lookup
  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { email: true },
  })

  return prisma.$transaction(async (tx) => {
    // Integrity checks
    const mentor = await tx.mentor.findUnique({ where: { id: mentorId } })
    if (!mentor) throw new Error('MENTOR_NOT_FOUND')
    if (mentor.userId === studentId) throw new Error('INVALID_BOOKING')
    if (!mentor.isActive) throw new Error('MENTOR_INACTIVE')

    // Anti-spam: block real active bookings, clean up expired ones
    const existing = await tx.booking.findFirst({
      where: {
        mentorId,
        studentId,
        status: { in: [BookingStatus.payment_pending, BookingStatus.scheduled] },
      },
    })

    if (existing) {
      const isExpired =
        existing.status === BookingStatus.payment_pending &&
        existing.paymentExpiresAt !== null &&
        new Date(existing.paymentExpiresAt) < new Date()

      if (!isExpired) {
        throw new Error('DUPLICATE_BOOKING')
      }

      // Expired payment window — clean it up so the student can rebook
      await tx.booking.update({
        where: { id: existing.id },
        data:  { status: 'expired' },
      })
    }

    const paymentExpiresAt = new Date(Date.now() + 30 * 60 * 1000)

    const booking = await tx.booking.create({
      data: {
        studentId,
        mentorId,
        status:           'payment_pending',
        externalScheduled: true,
        paymentExpiresAt,
      },
    })

    // ── Retroactive webhook attach ─────────────────────────────────────────
    // If webhook arrived BEFORE booking was created, link the buffered data now.
    // Scope by BOTH attendeeEmail AND mentorId — prevents cross-mentor mismatch
    // when a student has pending bookings with multiple mentors simultaneously.
    if (student?.email) {
      const buffered = await tx.calWebhookBuffer.findFirst({
        where: {
          attendeeEmail: student.email,
          mentorId,        // ← critical: scope to the specific mentor being booked
          processed:     false,
        },
        orderBy: { createdAt: 'desc' },
      })

      if (buffered) {
        await tx.booking.update({
          where: { id: booking.id },
          data: {
            scheduledAt:     buffered.scheduledAt,
            meetingUrl:      buffered.meetingUrl,
            attendeeEmail:   buffered.attendeeEmail,
            externalEventId: buffered.externalEventId,
          },
        })
        await tx.calWebhookBuffer.update({
          where: { id: buffered.id },
          data: { processed: true },
        })
        console.log(`[BOOKING_CREATED] Retroactively linked webhook buffer ${buffered.id} → booking ${booking.id}`)
      }
    }

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
