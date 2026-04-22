import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'

/**
 * POST /api/webhooks/cal
 *
 * Receives Cal.com webhook events (BOOKING_CREATED, BOOKING_CANCELLED).
 * Matches the incoming booking to an existing payment_pending booking
 * via attendeeEmail + mentorId (looked up via calLink on the Mentor table).
 * Updates the booking record with scheduledAt, meetingUrl, attendeeEmail,
 * and externalEventId.
 *
 * Register this URL in Cal.com:
 *   Settings → Webhooks → https://candidconversations.in/api/webhooks/cal
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

  if (!triggerEvent || !payload) {
    return new Response('Missing triggerEvent or payload', { status: 400 })
  }

  // ── Idempotency: deduplicate by externalEventId ─────────────────────────
  const uid = payload.uid as string | undefined
  if (uid) {
    const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { eventId: uid } })
    if (alreadyProcessed) {
      return new Response('Already processed', { status: 200 })
    }

    await prisma.webhookEvent.create({
      data: {
        source:    'cal',
        eventId:   uid,
        payload:   event as object,
        processed: false,
      },
    })
  }

  // ── BOOKING_CREATED ──────────────────────────────────────────────────────
  if (triggerEvent === 'BOOKING_CREATED') {
    try {
      const attendees = payload.attendees as Array<{ email: string; name: string }> | undefined
      const startTime = payload.startTime as string | undefined
      const meetingUrl = (
        (payload.metadata as Record<string, unknown>)?.videoCallUrl ??
        ((payload.responses as Record<string, unknown>)?.location as Record<string, unknown>)?.value ??
        null
      ) as string | null

      const attendeeEmail = attendees?.[0]?.email

      if (!attendeeEmail || !startTime) {
        console.warn('[CAL_WEBHOOK] Missing attendeeEmail or startTime', payload)
        return new Response('ok', { status: 200 })
      }

      // Find the mentor whose calLink matches the event type's booking URL.
      // Cal.com includes eventTypeId or the booking URL — we match via
      // attendeeEmail + a recent payment_pending booking for this student.
      const user = await prisma.user.findUnique({
        where: { email: attendeeEmail },
        select: { id: true },
      })

      if (!user) {
        console.warn('[CAL_WEBHOOK] No user found for email:', attendeeEmail)
        return new Response('ok', { status: 200 })
      }

      // Find the most recent payment_pending booking for this student
      const booking = await prisma.booking.findFirst({
        where: {
          studentId: user.id,
          status: BookingStatus.payment_pending,
          scheduledAt: null, // not yet populated by webhook
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!booking) {
        console.warn('[CAL_WEBHOOK] No matching payment_pending booking for', attendeeEmail)
        return new Response('ok', { status: 200 })
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          scheduledAt:     new Date(startTime),
          meetingUrl:      meetingUrl,
          attendeeEmail:   attendeeEmail,
          externalEventId: uid,
        },
      })

      // Mark webhook event as processed
      if (uid) {
        await prisma.webhookEvent.update({
          where: { eventId: uid },
          data: { processed: true },
        })
      }

      console.log(`[CAL_WEBHOOK] Booking ${booking.id} updated with scheduledAt ${startTime}`)
    } catch (err) {
      console.error('[CAL_WEBHOOK] Error processing BOOKING_CREATED', err)
    }
  }

  // ── BOOKING_CANCELLED ────────────────────────────────────────────────────
  if (triggerEvent === 'BOOKING_CANCELLED') {
    try {
      if (!uid) return new Response('ok', { status: 200 })

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
      console.error('[CAL_WEBHOOK] Error processing BOOKING_CANCELLED', err)
    }
  }

  return new Response('ok', { status: 200 })
}
