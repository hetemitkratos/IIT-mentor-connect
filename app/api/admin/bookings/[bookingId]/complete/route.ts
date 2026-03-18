import { requireRole } from '@/lib/session'
import { adminCompleteBooking } from '@/services/admin.service'
import { success, error } from '@/lib/api-response'

export async function PATCH(_req: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { bookingId } = await params
  try {
    await adminCompleteBooking(bookingId)
    return success({ message: 'Booking marked as completed' })
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.message === 'NOT_FOUND') return error('Booking not found', 404)
      if (err.message === 'INVALID_STATUS') return error('Booking is not in scheduled state', 409)
    }
    return error('Failed to complete booking', 500)
  }
}
