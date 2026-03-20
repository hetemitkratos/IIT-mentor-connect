import { prisma } from '@/lib/prisma'
import { verifyRazorpayWebhookSignature } from '@/lib/hmac'
import { createHmac } from 'crypto'
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

  // Fix #6: Primary idempotency via webhook_events table
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
        data:  { status: 'payment_complete' },
      })
    })

    await markWebhookProcessed(orderId)
  }

  return { processed: true }
}

/**
 * Verify Calendly HMAC signature.
 * Calendly signs with HMAC-SHA256 over the raw request body.
 */
export function verifyCalendlySignature(body: string, signatureHeader: string): boolean {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET

  // Dev mode: if secret not configured, skip verification and log a warning.
  // Set CALENDLY_WEBHOOK_SECRET in .env.local before going to production.
  if (!secret) {
    console.warn('[CALENDLY_WEBHOOK] CALENDLY_WEBHOOK_SECRET not set — skipping signature verification (dev only)')
    return true
  }

  // Header format: "t=<timestamp>,v1=<hmac>"
  const parts  = Object.fromEntries(signatureHeader.split(',').map((p) => p.split('=')))
  const t      = parts['t']
  const v1     = parts['v1']
  if (!t || !v1) return false

  const expected = createHmac('sha256', secret)
    .update(`${t}.${body}`)
    .digest('hex')

  return expected === v1
}

export async function handleCalendlyWebhook(payload: Record<string, unknown>) {
  const event = payload.event as string
  if (event !== 'invitee.created') return { skipped: true }

  const calendlyPayload = payload.payload as Record<string, unknown>
  const tracking        = calendlyPayload?.tracking as Record<string, unknown>
  const sessionToken    = tracking?.utm_source as string
  const eventData       = calendlyPayload?.event as Record<string, unknown>
  const eventUuid       = eventData?.uuid as string

  // Fix #6 + webhook idempotency: primary guard via webhook_events table
  const logEntry = await logWebhookEvent('calendly', eventUuid, payload)
  if (!logEntry) return { duplicate: true }

  if (!sessionToken) {
    await markWebhookProcessed(eventUuid, 'Missing utm_source — cannot link booking')
    return { error: 'missing_utm_source' }
  }

  const booking = await prisma.booking.findFirst({
    where: { sessionToken },
  })

  // Fix #3: Prevent invalid state transition — only update if payment_complete
  if (!booking) {
    await markWebhookProcessed(eventUuid, 'No booking found for session token')
    return { error: 'booking_not_found' }
  }

  // Fix #6: Second idempotency guard — booking already scheduled
  if (booking.status === 'scheduled') {
    await markWebhookProcessed(eventUuid)
    return { duplicate: true }
  }

  // During dev/testing (PAYMENT_ENABLED=false), booking stays at payment_pending
  // because the payment step is bypassed. Accept both valid pre-scheduling statuses.
  const validPreSchedulingStatuses = ['payment_complete', 'payment_pending']

  // Fix #3 + #8: Only allow valid status transitions
  if (!validPreSchedulingStatuses.includes(booking.status)) {
    // Fix #4: Log out-of-order or invalid-state webhook for observability
    console.warn('[CALENDLY_WEBHOOK_IGNORED] Invalid booking status', {
      bookingId:      booking.id,
      currentStatus:  booking.status,
      expectedStatus: validPreSchedulingStatuses,
      sessionToken,
      eventUuid,
    })
    await markWebhookProcessed(
      eventUuid,
      `Invalid booking status: ${booking.status} — expected ${validPreSchedulingStatuses.join(' or ')}`
    )
    return { error: 'invalid_booking_status' }
  }

  const location = (eventData?.location as Record<string, unknown>)

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status:         'scheduled',
      calendlyEventId: eventUuid,
      meetingLink:    (location?.join_url as string) ?? null,
      startTime:      eventData?.start_time ? new Date(eventData.start_time as string) : null,
      endTime:        eventData?.end_time   ? new Date(eventData.end_time   as string) : null,
    },
  })

  await markWebhookProcessed(eventUuid)
  return { processed: true }
}
