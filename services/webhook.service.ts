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
        data:  { status: 'scheduled' },   // Schedule First → Pay Later: Razorpay confirms final step
      })
    })

    console.log("Webhook captured payment:", payment.id);
    await markWebhookProcessed(orderId)
  } else if (event === "payment.failed") {
    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });

    if (!payment) return { error: "payment_not_found" };

    if (payment.status === "failed") return { duplicate: true };

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "failed",
      },
    });

    console.log("Payment failed:", payment.id);
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

export async function handleCalendlyWebhook(payload: any) {
  const eventType = payload.event as string
  if (eventType !== 'invitee.created') return { skipped: true }

  // Step 3 — Extract sessionToken Correctly
  const sessionToken = payload.payload?.tracking?.utm_source as string

  // Step 4 — Validate sessionToken
  if (!sessionToken) {
    console.error("Missing sessionToken in webhook");
    return { error: 'missing_session_token' };
  }

  // Step 5 — Find Booking
  const booking = await prisma.booking.findUnique({
    where: { sessionToken }
  });

  // Step 6 — Validate Booking Exists
  if (!booking) {
    console.error("Booking not found for sessionToken:", sessionToken);
    return { error: 'booking_not_found' };
  }

  // Step 7 — Extract Event Data
  const event = payload.payload.scheduled_event;
  const startTime = event.start_time;
  const endTime = event.end_time;
  const meetingLink = event.location?.join_url || null;
  const calEventId = event.uri ? event.uri.split('/').pop() : null;

  // Step 9 — Handle Idempotency: only skip if already fully scheduled
  if (booking.status === 'scheduled' || booking.status === 'cancelled') {
    console.log('[CALENDLY_WEBHOOK] Already processed, status:', booking.status)
    return { duplicate: true }
  }

  // Accept both initial states: payment_pending (with Razorpay) and awaiting_payment (payment-free flow)
  const validPreSchedulingStatuses = ['payment_pending', 'awaiting_payment']
  if (!validPreSchedulingStatuses.includes(booking.status)) {
    console.warn('[CALENDLY_WEBHOOK_IGNORED] Invalid booking status', {
      bookingId:      booking.id,
      currentStatus:  booking.status,
      expectedStatus: validPreSchedulingStatuses,
      sessionToken,
    })
    return { error: 'invalid_booking_status' }
  }

  try {
    // Step 8 — Update Booking with schedule details
    // Keep awaiting_payment if payment not yet done; bump to scheduled if Razorpay flow already completed
    const nextStatus = booking.status === 'payment_pending' ? 'awaiting_payment' : 'scheduled'
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        meetingLink,
        calEventId,
        status: nextStatus,
      }
    })
    console.log(`[CALENDLY_WEBHOOK] Booking ${booking.id} updated → status: ${nextStatus}`)
  } catch (err) {
    console.error("Failed to update booking in webhook:", err);
    throw err;
  }

  return { processed: true }
}
