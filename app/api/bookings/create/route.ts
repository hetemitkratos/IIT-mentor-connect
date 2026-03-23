import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { createBooking } from '@/services/booking.service'
import { createBookingSchema } from '@/lib/validators/booking.validator'
import { checkRateLimit } from '@/lib/security'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  // Rate Limiting (10 req / min)
  const rateLimitResponse = checkRateLimit(`create_booking_${user!.id}`)
  if (rateLimitResponse) return rateLimitResponse

  const body = await req.json()
  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  try {
    console.log('[BOOKING_INPUT]', { studentId: user!.id, mentorId: parsed.data.mentorId })
    const booking = await createBooking(user!.id, parsed.data.mentorId)
    return success({ bookingId: booking.id, sessionToken: booking.sessionToken, paymentRequired: true }, 201)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'DUPLICATE_BOOKING')
      return error('You already have an active booking with this mentor', 409)
    if (err instanceof Error && ['INVALID_BOOKING', 'MENTOR_INACTIVE'].includes(err.message))
      return error(err.message, 400)
    console.error('[BOOKING_CREATE_ERROR]', err)
    return error('Failed to create booking', 500)
  }
}

