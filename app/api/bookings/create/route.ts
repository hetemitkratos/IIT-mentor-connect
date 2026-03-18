import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { createBooking } from '@/services/booking.service'
import { createBookingSchema } from '@/lib/validators/booking.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const body = await req.json()
  const parsed = createBookingSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  try {
    const booking = await createBooking(user!.id, parsed.data.mentorId)
    return success({ bookingId: booking.id, sessionToken: booking.sessionToken, paymentRequired: true }, 201)
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'DUPLICATE_BOOKING')
      return error('You already have an active booking with this mentor', 409)
    return error('Failed to create booking', 500)
  }
}

