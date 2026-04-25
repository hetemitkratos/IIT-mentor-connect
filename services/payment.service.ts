import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { verifyRazorpayPaymentSignature } from '@/lib/hmac'
import { createHmac } from 'crypto'
import { SESSION_PRICE_PAISE } from '@/constants/pricing'
import { createMeetLink } from './meeting.service'
import { sendBookingEmail } from './email.service'
import { scheduleReminder } from './reminder.service'

export async function createRazorpayOrder(bookingId: string, studentId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mentor: true },
  })

  if (!booking || booking.studentId !== studentId) throw new Error('NOT_FOUND')
  if (booking.status === 'paid') {
    return { success: true, alreadyPaid: true }
  }

  if (booking.status !== 'pending') throw new Error('INVALID_BOOKING_STATUS')
  
  // Strict consistency bound ensuring user isn't bypassing their own 10 minute slot lock
  const lock = await prisma.slotLock.findFirst({
    where: { bookingId: booking.id }
  })

  if (!lock) throw new Error('Slot lock missing')
  // Support up to 2 seconds of network/validation latency drift
  const nowTolerance = new Date(Date.now() - 2000)
  if (lock.expiresAt < nowTolerance) {
    throw new Error('Slot lock expired')
  }

  // Multi-tab duplicate guard — prevent duplicate payments for the same mentor
  const existingActive = await prisma.booking.findFirst({
    where: {
      studentId,
      mentorId: booking.mentorId,
      status: {
        in: ['pending', 'paid'],
      },
    },
  })

  if (existingActive && existingActive.id !== bookingId) {
    throw new Error('ACTIVE_BOOKING_EXISTS')
  }

  // Idempotency — return existing order if already created for this booking
  const existingPayment = await prisma.payment.findUnique({ where: { bookingId } })
  if (existingPayment) {
    return {
      orderId:  existingPayment.razorpayOrderId,
      amount:   existingPayment.amount,
      currency: existingPayment.currency,
      key:      process.env.RAZORPAY_KEY_ID!,
    }
  }

  console.log('Creating Razorpay order for booking:', booking.id)

  const order = await razorpay.orders.create({
    amount:   SESSION_PRICE_PAISE,
    currency: 'INR',
    receipt:  bookingId,
  })

  await prisma.payment.create({
    data: {
      bookingId,
      razorpayOrderId: order.id,
      amount:          SESSION_PRICE_PAISE,
      platformFee:     5000,
      mentorAmount:    10000,
      currency:        'INR',
      status:          'pending',
    },
  })

  console.log('PAYMENT SAVED:', { bookingId, razorpayOrderId: order.id })

  return {
    orderId:  order.id,
    amount:   SESSION_PRICE_PAISE,
    currency: 'INR',
    key:      process.env.RAZORPAY_KEY_ID!,
  }
}

export async function verifyPayment(
  razorpayOrderId:  string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
// Step 1: HMAC-SHA256 signature verification — temporarily bypassed for debug
  const secret = process.env.RAZORPAY_KEY_SECRET!
  const expectedSignature = createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  console.log("EXPECTED SIGNATURE:", expectedSignature)
  console.log("RECEIVED SIGNATURE:", razorpaySignature)

  const isValid = expectedSignature === razorpaySignature
  if (!isValid) throw new Error('INVALID_SIGNATURE')

  console.log("LOOKING FOR ORDER:", razorpayOrderId);

  const payment = await prisma.payment.findFirst({
    where: { razorpayOrderId },
    include: { booking: true },
  })

  console.log("FOUND PAYMENT:", payment);

  if (!payment) {
    console.error("PAYMENT NOT FOUND FOR:", razorpayOrderId);
    throw new Error('PAYMENT_NOT_FOUND')
  }

  // Fix #2 (idempotency): payment already verified or booking marked paid — return success without re-updating
  if (payment.status === 'successful' || payment.booking.status === 'paid') return { success: true, alreadyVerified: true }

  // Fix: Cancel-race guard — if booking was cancelled between payment initiation and verification, reject
  if (payment.booking.status !== 'pending') {
    console.error(JSON.stringify({
      event: 'PAYMENT_VERIFY_REJECTED',
      reason: 'booking_not_pending',
      bookingStatus: payment.booking.status,
      bookingId: payment.bookingId,
      razorpayOrderId,
      timestamp: new Date().toISOString(),
    }))
    throw new Error('BOOKING_NOT_PENDING')
  }

  // Fix #2 (transactional): payment + booking update must be atomic
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { razorpayOrderId },
      data:  { status: 'successful', razorpayPaymentId },
    })
    await tx.booking.update({
      where: { id: payment.bookingId },
      // meetingLink is strictly set to null so the UI picks up the generic message
      data:  { status: 'paid', meetingLink: null },
    })
    await tx.slotLock.deleteMany({
      where: { bookingId: payment.bookingId },
    })
  })

  // Idempotency: skip meeting creation if already exists
  if (payment.booking.meetingUrl) {
    return { success: true }
  }

  // Refetch full mentor context required for OAuth operations
  const mentorData = await prisma.mentor.findUnique({
    where: { id: payment.booking.mentorId },
    include: { user: true }
  })

  const studentData = await prisma.user.findUnique({
    where: { id: payment.booking.studentId }
  })

  if (mentorData && studentData && payment.booking.date && payment.booking.startTime) {
    try {
      // Re-hydrate the ISO datetimes across IST context properly out of strings
      const isoDate = payment.booking.date.toISOString().split('T')[0]
      const meetLink = await createMeetLink({
        mentor: mentorData.user,
        startTime: `${isoDate}T${payment.booking.startTime}:00+05:30`,
        endTime: `${isoDate}T${payment.booking.endTime ?? '00:00'}:00+05:30`,
        studentEmail: studentData.email
      });

      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          meetingUrl: meetLink,
          meetingLink: meetLink,
          meetingStatus: "created"
        }
      });

      // Await independent processes securely using Promise.allSettled so one failing doesn't block the other
      const tasks = [];
      
      tasks.push(
        sendBookingEmail({
          to: studentData.email,
          studentName: studentData.name || 'Student',
          mentorName: mentorData.user.name || 'Mentor',
          date: payment.booking.date!.toDateString(),
          time: payment.booking.startTime!,
          meetLink: meetLink
        })
      );

      if (payment.booking.startDateTime) {
        tasks.push(
          scheduleReminder({
            bookingId: payment.booking.id,
            startDateTime: payment.booking.startDateTime
          })
        );
      }

      // 🛡️ CRITICAL: Await all network requests before the function returns!
      await Promise.allSettled(tasks);

    } catch (err) {
      console.error("Meet link generation failed", err)
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { meetingStatus: "pending" }
      });

      // 🛡️ CRITICAL: Await the fallback email before returning!
      await sendBookingEmail({
        to: studentData.email,
        studentName: studentData.name || 'Student',
        mentorName: mentorData.user.name || 'Mentor',
        date: payment.booking.date!.toDateString(),
        time: payment.booking.startTime!,
        meetLink: null
      }).catch(e => console.error("Fallback email failed", e));
      
      if (payment.booking.startDateTime) {
        await scheduleReminder({
          bookingId: payment.booking.id,
          startDateTime: payment.booking.startDateTime
        }).catch(e => console.error("Fallback reminder failed", e));
      }
    }
  }

  console.log(JSON.stringify({
    event: "PAYMENT_SUCCESS",
    bookingId: payment.bookingId,
    razorpayOrderId,
    timestamp: new Date().toISOString()
  }));

  return { success: true }
}
