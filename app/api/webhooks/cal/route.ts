import { prisma } from '@/lib/prisma'
import { BookingStatus } from '@prisma/client'
import crypto from 'crypto'

/**
 * POST /api/webhooks/cal
 *
 * Race-condition-safe, mentor-scoped Cal.com webhook handler.
 *
 * Matching strategy:
 *  - Attendee email  → student User record → studentId
 *  - Organizer email → mentor User record  → mentorId
 *  - Booking lookup  → studentId + mentorId (scoped, not just email)
 *
 * Race condition handling:
 *  1. Always upsert CalWebhookBuffer first (idempotent).
 *  2. Attempt immediate link. If booking doesn't exist yet, it will be
 *     linked retroactively inside createBooking() in booking.service.ts.
 *
 * Register in Cal.com → Settings → Webhooks:
 *   URL: https://candidconversations.in/api/webhooks/cal
 *   Events: BOOKING_CREATED, BOOKING_CANCELLED
 */
function verifySignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.CAL_WEBHOOK_SECRET) return false
  
  try {
    const expected = crypto
      .createHmac('sha256', process.env.CAL_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex')

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch (err) {
    console.error('[CAL_WEBHOOK] Signature validation runtime error:', err)
    return false
  }
}

export async function POST(req: Request) {
  let rawBody: string
  
  try {
    rawBody = await req.text()
  } catch {
    return new Response('Unable to read body', { status: 400 })
  }

  const signature = req.headers.get('cal-signature')

  if (!verifySignature(rawBody, signature)) {
    console.error('[CAL_WEBHOOK] ❌ Invalid signature')
    return new Response('Invalid signature', { status: 401 })
  }

  let body: unknown
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const event    = body as Record<string, unknown>
  const triggerEvent = event.triggerEvent as string | undefined
  const payload  = event.payload   as Record<string, unknown> | undefined

  console.log("✅ Webhook hit")
  console.log("Event:", triggerEvent)
  console.log("Payload:", JSON.stringify(body, null, 2))

  if (!triggerEvent || !payload) {
    return new Response('Missing triggerEvent or payload', { status: 400 })
  }

  // ── BOOKING_CREATED ──────────────────────────────────────────────────────
  if (triggerEvent === 'BOOKING_CREATED') {
    try {
      const uid       = payload.uid       as string | undefined
      const attendees = payload.attendees as Array<{ email: string; name: string }> | undefined
      const startTime = payload.startTime as string | undefined

      // Extract organizer (the mentor who owns the Cal.com event)
      const organizer      = payload.organizer as { email?: string } | undefined
      const organizerEmail = organizer?.email

      // Extract meeting URL from multiple possible Cal.com payload locations
      const meetingUrl = (
        (payload.metadata  as Record<string, unknown>)?.videoCallUrl     ??
        ((payload.responses as Record<string, unknown>)?.location as Record<string, unknown>)?.value ??
        (payload            as Record<string, unknown>).videoCallUrl     ??
        null
      ) as string | null

      const attendeeEmail = attendees?.[0]?.email

      if (!attendeeEmail || !startTime || !uid) {
        console.warn('[CAL_WEBHOOK] Missing required fields:', { attendeeEmail, startTime, uid })
        return new Response('ok', { status: 200 })
      }

      console.log('[CAL_WEBHOOK] BOOKING_CREATED — attendee:', attendeeEmail, '| organizer:', organizerEmail ?? 'unknown')

      // ── Resolve mentorId from organizer email ──────────────────────────────
      let mentorId: string | null = null
      if (organizerEmail) {
        const mentorUser = await prisma.user.findUnique({
          where:  { email: organizerEmail },
          select: { mentor: { select: { id: true } } },
        })
        mentorId = mentorUser?.mentor?.id ?? null
      }

      if (!mentorId) {
        console.warn('[CAL_WEBHOOK] Could not resolve mentorId from organizer email:', organizerEmail)
        // Still continue — partial data is better than nothing
      }

      // ── Step 1: Upsert into buffer (idempotent — handles Cal.com retries) ──
      await prisma.calWebhookBuffer.upsert({
        where:  { externalEventId: uid },
        update: {},   // Already stored on a prior retry — don't overwrite
        create: {
          externalEventId: uid,
          attendeeEmail,
          mentorId,         // may be null if organizer email unresolved
          scheduledAt: new Date(startTime),
          meetingUrl,
          processed: false,
        },
      })

      console.log('[CAL_WEBHOOK] Buffered event', uid, '| mentorId:', mentorId)

      // ── Step 2: Resolve student ────────────────────────────────────────────
      const user = await prisma.user.findUnique({
        where:  { email: attendeeEmail },
        select: { id: true },
      })

      if (!user) {
        console.warn('[CAL_WEBHOOK] No user for attendee email:', attendeeEmail, '— will link on booking creation')
        return new Response('ok', { status: 200 })
      }

      // ── Step 3: Find matching booking — scoped by studentId + mentorId ─────
      // mentorId scoping prevents a user who books two mentors from getting
      // webhook data attached to the wrong booking.
      const booking = await prisma.booking.findFirst({
        where: {
          studentId:   user.id,
          ...(mentorId ? { mentorId } : {}),
          status: { in: ['pending', 'paid'] },
          scheduledAt: null,   // not yet webhook-linked
          createdAt: {
            gte: new Date(Date.now() - 30 * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' },
      })

      if (!booking) {
        console.warn('[CAL_WEBHOOK] No matching payment_pending booking — buffered for retroactive attach')
        return new Response('ok', { status: 200 })
      }

      if (booking.externalEventId) {
        console.warn('[CAL_WEBHOOK] Booking already linked — skipping overwrite')
        return new Response('ok', { status: 200 })
      }

      // ── Step 4: Link + mark buffer processed (atomic) ─────────────────────
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
          data:  { processed: true },
        }),
      ])

      console.log(`[CAL_WEBHOOK] ✓ Linked booking ${booking.id} (mentor: ${mentorId}) → scheduledAt ${startTime}`)
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
          data:  { status: BookingStatus.cancelled },
        })
        console.log(`[CAL_WEBHOOK] Booking ${booking.id} cancelled via webhook`)
      }
    } catch (err) {
      console.error('[CAL_WEBHOOK] Error processing BOOKING_CANCELLED:', err)
    }
  }

  return new Response('ok', { status: 200 })
}
