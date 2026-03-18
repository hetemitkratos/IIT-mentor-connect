import { NextRequest } from 'next/server'
import { requireRole } from '@/lib/session'
import { getAllBookings, adminCompleteBooking } from '@/services/admin.service'
import { success, error } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { response } = await requireRole('admin')
  if (response) return response

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Number(searchParams.get('page') || 1)

  try {
    const data = await getAllBookings(status, page)
    return success(data)
  } catch {
    return error('Failed to fetch bookings', 500)
  }
}

