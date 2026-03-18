import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { cancelBooking } from '@/services/booking.service'
import { cancelBookingSchema } from '@/lib/validators/booking.validator'
import { success, error } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const body   = await req.json()
  const parsed = cancelBookingSchema.safeParse(body)
  if (!parsed.success) return error(parsed.error.issues[0].message, 400)

  try {
    await cancelBooking(parsed.data.bookingId, user!.id, user!.role)
    return success({ message: 'Booking cancelled successfully' })
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'NOT_FOUND')                  return error('Booking not found', 404)
      if (err.message === 'FORBIDDEN')                  return error('Not your booking', 403)
      if (err.message === 'ALREADY_COMPLETED')          return error('Session is already completed', 409)
      if (err.message === 'ALREADY_CANCELLED')          return error('Booking is already cancelled', 409)
      if (err.message === 'INVALID_STATUS')             return error('Booking cannot be cancelled in its current state', 409)
      if (err.message === 'CANCELLATION_WINDOW_PASSED') return error('Cancellation window has passed', 409)
    }
    return error('Failed to cancel booking', 500)
  }
}


