import { prisma } from '@/lib/prisma'
import { razorpay } from '@/lib/razorpay'
import { verifyRazorpayPaymentSignature } from '@/lib/hmac'
import { SESSION_PRICE_PAISE } from '@/constants/pricing'

export async function createRazorpayOrder(bookingId: string, studentId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { mentor: true },
  })

  if (!booking || booking.studentId !== studentId) throw new Error('NOT_FOUND')
  if (booking.status !== 'payment_pending') throw new Error('INVALID_BOOKING_STATUS')

  // Fix #4: Idempotency — return existing order if already created for this booking
  const existingPayment = await prisma.payment.findUnique({ where: { bookingId } })
  if (existingPayment) {
    const calendlyUrl = `${booking.mentor.calendlyLink}?utm_source=${booking.sessionToken}`
    return {
      orderId:    existingPayment.razorpayOrderId,
      amount:     existingPayment.amount,
      currency:   existingPayment.currency,
      keyId:      process.env.RAZORPAY_KEY_ID!,
      calendlyUrl,
    }
  }

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
      currency:        'INR',
      status:          'pending',
    },
  })

  const calendlyUrl = `${booking.mentor.calendlyLink}?utm_source=${booking.sessionToken}`

  return {
    orderId:    order.id,
    amount:     SESSION_PRICE_PAISE,
    currency:   'INR',
    keyId:      process.env.RAZORPAY_KEY_ID!,
    calendlyUrl,
  }
}

export async function verifyPayment(
  razorpayOrderId:  string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  // Step 1: HMAC-SHA256 signature verification — always first
  const isValid = verifyRazorpayPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  )
  if (!isValid) throw new Error('INVALID_SIGNATURE')

  const payment = await prisma.payment.findUnique({ where: { razorpayOrderId } })
  if (!payment) throw new Error('PAYMENT_NOT_FOUND')

  // Fix #2 (idempotency): payment already verified — return success without re-updating
  if (payment.status === 'successful') return { success: true, alreadyVerified: true }

  // Fix #2 (transactional): payment + booking update must be atomic
  await prisma.$transaction(async (tx: typeof prisma) => {
    await tx.payment.update({
      where: { razorpayOrderId },
      data:  { status: 'successful', razorpayPaymentId },
    })
    await tx.booking.update({
      where: { id: payment.bookingId },
      data:  { status: 'payment_complete' },
    })
  })

  return { success: true }
}
