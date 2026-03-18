import { requireAuth } from '@/lib/session'
import { getBookingById } from '@/services/booking.service'
import { success, error } from '@/lib/api-response'

export async function GET(_req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { user, response } = await requireAuth()
  if (response) return response

  const { bookingId } = await params
  const booking = await getBookingById(bookingId, user!.id)
  if (!booking) return error('Booking not found', 404)
  return success(booking)
}
