import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/session'
import { getStudentBookings } from '@/services/booking.service'
import { success, error } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  const { user, response } = await requireAuth()
  if (response) return response

  const { searchParams } = req.nextUrl
  const status = searchParams.get('status') ?? undefined
  const page = Number(searchParams.get('page') || 1)
  const limit = Number(searchParams.get('limit') || 10)

  try {
    const data = await getStudentBookings(user!.id, status, page, limit)
    return success(data)
  } catch {
    return error('Failed to fetch bookings', 500)
  }
}

