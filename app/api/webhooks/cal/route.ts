import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

/**
 * POST /api/webhooks/cal
 *
 * Race-condition-safe Cal.com webhook handler.
 *
 * Flow:
 *  1. Always upsert into CalWebhookBuffer (idempotent store).
 *  2. Attempt to find and link to an existing payment_pending booking.
 *  3. If no booking exists yet, the buffer remains unprocessed.
 *     When the student creates a booking (booking.service.ts), it checks
 *     the buffer and links retroactively.
 *
 * Register in Cal.com → Settings → Webhooks:
 *   URL: https://candidconversations.in/api/webhooks/cal
 *   Events: BOOKING_CREATED, BOOKING_CANCELLED
 */
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const event = body as Record<string, unknown>
  const triggerEvent = event.triggerEvent as string | undefined
  const payload = event.payload as Record<string, unknown> | undefined

  console.log('[CAL_WEBHOOK] Received event:', triggerEvent)

  if (!triggerEvent || !payload) {
    return new Response('Missing triggerEvent or payload', { status: 400 })
  }

  // ── BOOKING_CREATED ──────────────────────────────────────────────────────
  if (triggerEvent === 'BOOKING_CREATED') {
    try {
      const uid = payload.uid as string | undefined
      const attendees = payload.attendees as Array<{ email: string; name: string }> | undefined
      const startTime = payload.startTime as string | undefined

      // Extract meeting URL from multiple possible locations in Cal.com payload
      const meetingUrl = (
        (payload.metadata as Record<string, unknown>)?.videoCallUrl ??
        ((payload.responses as Record<string, unknown>)?.location as Record<string, unknown>)?.value ??
        (payload as Record<string, unknown>).videoCallUrl ??
        null
      ) as string | null

      const attendeeEmail = attendees?.[0]?.email

      if (!attendeeEmail || !startTime || !uid) {
        console.warn('[CAL_WEBHOOK] Missing required fields:', { attendeeEmail, startTime, uid })
        return new Response('ok', { status: 200 })
      }

      console.log('[CAL_WEBHOOK] BOOKING_CREATED for', attendeeEmail, 'at', startTime)

      // ── Step 1: Upsert into buffer (idempotent — handles retries) ──────────
      await prisma.calWebhookBuffer.upsert({
        where: { externalEventId: uid },
        update: {}, // Already stored — don't overwrite
        create: {
          externalEventId: uid,
          attendeeEmail,
          scheduledAt: new Date(startTime),
          meetingUrl,
          processed: false,
        },
      })

      console.log('[CAL_WEBHOOK] Buffered event', uid)

      // ── Step 2: Try to link to an existing booking ─────────────────────────
      const user = await prisma.user.findUnique({
        where: { email: attendeeEmail },
        select: { id: true },
      })

      if (!user) {
        console.warn('[CAL_WEBHOOK] No user found for email:', attendeeEmail, '— buffered for later')
        return new Response('ok', { status: 200 })
      }

      // Most recent payment_pending booking for this student, not yet webhook-linked
      const booking = await prisma.booking.findFirst({
        where: {
          studentId:      user.id,
          status:         BookingStatus.payment_pending,
          scheduledAt:    null, // not yet linked
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!booking) {
        console.warn('[CAL_WEBHOOK] No payment_pending booking found for', attendeeEmail, '— buffered, will link on booking creation')
        return new Response('ok', { status: 200 })
      }

      // ── Step 3: Link to booking + mark buffer processed ────────────────────
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: {
            scheduledAt:     new Date(startTime),
            meetingUrl,
            attendeeEmail,
            externalEventId: uid,
          },
        }),
        prisma.calWebhookBuffer.update({
          where: { externalEventId: uid },
          data: { processed: true },
        }),
      ])

      console.log(`[CAL_WEBHOOK] Linked booking ${booking.id} → scheduledAt ${startTime}`)
    } catch (err) {
      console.error('[CAL_WEBHOOK] Error processing BOOKING_CREATED:', err)
    }
  }

  // ── BOOKING_CANCELLED ────────────────────────────────────────────────────
  if (triggerEvent === 'BOOKING_CANCELLED') {
    try {
      const uid = payload.uid as string | undefined
      if (!uid) return new Response('ok', { status: 200 })

      console.log('[CAL_WEBHOOK] BOOKING_CANCELLED uid:', uid)

      const booking = await prisma.booking.findUnique({
        where: { externalEventId: uid },
      })

      if (booking) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.cancelled },
        })
        console.log(`[CAL_WEBHOOK] Booking ${booking.id} cancelled via webhook`)
      }
    } catch (err) {
      console.error('[CAL_WEBHOOK] Error processing BOOKING_CANCELLED:', err)
    }
  }

  return new Response('ok', { status: 200 })
}
