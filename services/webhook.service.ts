import { prisma } from '@/lib/prisma'
import { verifyRazorpayWebhookSignature } from '@/lib/hmac'
import { Prisma } from '@prisma/client'

export async function logWebhookEvent(source: string, eventId: string, payload: object) {
  try {
    return await prisma.webhookEvent.create({
      data: { source, eventId, payload },
    })
  } catch {
    // UNIQUE constraint on eventId — duplicate event already logged, skip processing
    return null
  }
}

export async function markWebhookProcessed(eventId: string, error?: string) {
  return prisma.webhookEvent.update({
    where: { eventId },
    data:  { processed: !error, error: error ?? null },
  })
}

export async function handleRazorpayWebhook(body: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET!
  const isValid = verifyRazorpayWebhookSignature(body, signature, secret)
  if (!isValid) throw new Error('INVALID_SIGNATURE')

  const payload = JSON.parse(body)
  const event   = payload.event
  const orderId = payload?.payload?.payment?.entity?.order_id

  // Primary idempotency via webhook_events table
  const logEntry = await logWebhookEvent('razorpay', orderId, payload)
  if (!logEntry) return { duplicate: true }

  if (event === 'payment.captured') {
    const paymentId = payload?.payload?.payment?.entity?.id

    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } })
    if (!payment) {
      await markWebhookProcessed(orderId, 'Payment row not found')
      return { error: 'payment_not_found' }
    }

    // Idempotency: already processed
    if (payment.status === 'successful') {
      await markWebhookProcessed(orderId)
      return { duplicate: true }
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payment.update({
        where: { razorpayOrderId: orderId },
        data:  { status: 'successful', razorpayPaymentId: paymentId },
      })
      await tx.booking.update({
        where: { id: payment.bookingId },
        data:  { status: 'paid' },
      })
    })

    await markWebhookProcessed(orderId)
  } else if (event === 'payment.failed') {
    const payment = await prisma.payment.findUnique({ where: { razorpayOrderId: orderId } })
    if (!payment) return { error: 'payment_not_found' }
    if (payment.status === 'failed') return { duplicate: true }

    await prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'failed' },
    })
  }

  return { processed: true }
}
