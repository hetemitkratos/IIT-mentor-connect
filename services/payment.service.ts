import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { verifyRazorpayPaymentSignature } from '@/lib/hmac'
import { createHmac } from 'crypto'
import { SESSION_PRICE_PAISE } from '@/constants/pricing'

export async function createRazorpayOrder(bookingId: string, studentId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mentor: true },
  })

  if (!booking || booking.studentId !== studentId) throw new Error('NOT_FOUND')
  // Schedule First → Pay Later: payment order created after Calendly scheduling
  if (booking.status !== 'awaiting_payment') throw new Error('INVALID_BOOKING_STATUS')

  // Fix #4: Idempotency — return existing order if already created for this booking
  const existingPayment = await prisma.payment.findUnique({ where: { bookingId } })
  if (existingPayment) {
    const calUrl = `${booking.mentor.calLink}?utm_source=${booking.sessionToken}`
    return {
      orderId:    existingPayment.razorpayOrderId,
      amount:     existingPayment.amount,
      currency:   existingPayment.currency,
      key:        process.env.RAZORPAY_KEY_ID!,
      calUrl,
    }
  }

  console.log("Creating Razorpay order for booking:", booking.id);
  
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
      status:          'pending', // maintaining ENUM as requested by User
    },
  })

  console.log("PAYMENT SAVED:", {
    bookingId,
    razorpayOrderId: order.id,
  });

  const calUrl = `${booking.mentor.calLink}?utm_source=${booking.sessionToken}`

  return {
    orderId:    order.id,
    amount:     SESSION_PRICE_PAISE,
    currency:   'INR',
    key:        process.env.RAZORPAY_KEY_ID!,
    calUrl,
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

  // Fix #2 (idempotency): payment already verified — return success without re-updating
  if (payment.status === 'successful') return { success: true, alreadyVerified: true }

  // Fix #2 (transactional): payment + booking update must be atomic
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { razorpayOrderId },
      data:  { status: 'successful', razorpayPaymentId },
    })
    await tx.booking.update({
      where: { id: payment.bookingId },
      data:  { status: 'scheduled' },   // Schedule First → Pay Later: payment = final step
    })
  })

  console.log("Payment verified:", payment.id);

  return { success: true }
}
